(function () {
  const DATABASE_NAME = 'fruit-storefront-review';
  const DATABASE_VERSION = 1;
  const SNAPSHOT_STORE = 'sqlite-snapshots';
  const SNAPSHOT_KEY = 'review';

  let database;
  let sqlRuntime;
  let indexedDb;
  let persistenceAvailable = true;
  let snapshotRevision = 0;
  let writeQueue = Promise.resolve();

  function createId() {
    return crypto.randomUUID();
  }

  function openIndexedDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(SNAPSHOT_STORE, { keyPath: 'key' });
        store.createIndex('revision', 'revision');
      };
      request.onerror = () => reject(request.error || new Error('Unable to open local storage.'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  function readSnapshot() {
    return new Promise((resolve, reject) => {
      const transaction = indexedDb.transaction(SNAPSHOT_STORE, 'readonly');
      const request = transaction.objectStore(SNAPSHOT_STORE).get(SNAPSHOT_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Unable to read saved data.'));
      transaction.onabort = () => reject(transaction.error || new Error('Unable to read saved data.'));
    });
  }

  function saveSnapshot(bytes, expectedRevision) {
    return new Promise((resolve, reject) => {
      const transaction = indexedDb.transaction(SNAPSHOT_STORE, 'readwrite');
      const store = transaction.objectStore(SNAPSHOT_STORE);
      const request = store.get(SNAPSHOT_KEY);

      request.onsuccess = () => {
        const record = request.result || null;
        const currentRevision = record?.revision || 0;
        if (currentRevision !== expectedRevision) {
          transaction.abort();
          reject(new Error('Review data changed in another tab. Reload this page before saving.'));
          return;
        }
        try {
          store.put({
            key: SNAPSHOT_KEY,
            revision: currentRevision + 1,
            schemaVersion: DATABASE_VERSION,
            bytes
          });
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      };
      request.onerror = () => {
        transaction.abort();
        reject(request.error || new Error('Unable to check the saved database version.'));
      };
      transaction.oncomplete = () => resolve(expectedRevision + 1);
      transaction.onerror = () => reject(transaction.error || new Error('Unable to save review data.'));
      transaction.onabort = () => reject(transaction.error || new Error('Review data was not saved.'));
    });
  }

  function execute(sql, params = []) {
    const statement = database.prepare(sql);
    try {
      statement.bind(params);
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  }

  function run(sql, params = []) {
    database.run(sql, params);
  }

  function createSchema(db) {
    db.run(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS feed_subscriptions (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        last_fetched_at TEXT,
        last_fetch_status TEXT NOT NULL DEFAULT 'never',
        last_fetch_error TEXT
      );
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY,
        feed_id TEXT NOT NULL REFERENCES feed_subscriptions(id) ON DELETE CASCADE,
        entry_key TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT,
        published_at TEXT,
        content_html TEXT,
        content_text TEXT,
        first_seen_order INTEGER NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
        UNIQUE (feed_id, entry_key)
      );
      CREATE INDEX IF NOT EXISTS articles_order
        ON articles (published_at DESC, first_seen_order ASC);
      CREATE TABLE IF NOT EXISTS price_follows (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        condition_type TEXT NOT NULL
          CHECK (condition_type IN ('absolute_max', 'percent_increase', 'percent_decrease')),
        threshold REAL NOT NULL CHECK (threshold >= 0),
        currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
        UNIQUE (product_id, condition_type, threshold)
      );
      CREATE TABLE IF NOT EXISTS price_observations (
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        price_minor_units INTEGER NOT NULL CHECK (price_minor_units > 0),
        currency TEXT NOT NULL CHECK (currency = 'USD'),
        PRIMARY KEY (article_id, product_id)
      );
      PRAGMA user_version = ${DATABASE_VERSION};
    `);
  }

  function getProductIds() {
    return new Set((window.StorefrontProducts || []).map((product) => product.id));
  }

  async function initSql() {
    return window.initSqlJs({
      locateFile: (file) => `vendor/sql.js/${file}`
    });
  }

  async function open() {
    if (database) return status();

    let SQL;
    try {
      SQL = await initSql();
      sqlRuntime = SQL;
      window.SQL = SQL;
    } catch (error) {
      throw new Error(`SQLite could not be initialized: ${error.message}`);
    }

    let record = null;
    try {
      indexedDb = await openIndexedDb();
      record = await readSnapshot();
      snapshotRevision = record?.revision || 0;
    } catch (error) {
      persistenceAvailable = false;
      indexedDb?.close();
      indexedDb = null;
      console.error('Local review persistence is unavailable.', error);
    }

    const originalBytes = record?.bytes;
    database = originalBytes ? new SQL.Database(new Uint8Array(originalBytes)) : new SQL.Database();
    database.run('PRAGMA foreign_keys = ON;');

    const version = Number(execute('PRAGMA user_version')[0].user_version);
    if (version > DATABASE_VERSION) {
      database.close();
      database = null;
      throw new Error('Saved review data was created by a newer version of this app.');
    }

    if (version < DATABASE_VERSION) {
      const backup = originalBytes ? new Uint8Array(originalBytes) : null;
      try {
        database.run('BEGIN');
        createSchema(database);
        database.run('COMMIT');
        if (record && persistenceAvailable) {
          snapshotRevision = await saveSnapshot(database.export(), snapshotRevision);
        }
      } catch (error) {
        database.close();
        database = backup ? new SQL.Database(backup) : null;
        database?.run('PRAGMA foreign_keys = ON;');
        if (!database) throw new Error(`The local review database could not be created: ${error.message}`);
        throw new Error(`Saved review data could not be migrated and was preserved: ${error.message}`);
      }
    }

    return status();
  }

  function status() {
    return {
      persistent: persistenceAvailable,
      message: persistenceAvailable
        ? ''
        : 'Local storage is unavailable. Changes will not be retained after you leave this page.'
    };
  }

  function write(operation) {
    const next = writeQueue.then(async () => {
      if (!database) throw new Error('Review data is not initialized.');
      const backup = database.export();
      database.run('BEGIN IMMEDIATE');
      try {
        const result = operation();
        database.run('COMMIT');
        if (persistenceAvailable) {
          snapshotRevision = await saveSnapshot(database.export(), snapshotRevision);
        }
        return result;
      } catch (error) {
        try {
          database.close();
          database = new sqlRuntime.Database(backup);
          database.run('PRAGMA foreign_keys = ON;');
        } catch (restoreError) {
          persistenceAvailable = false;
          console.error('Unable to restore in-memory review database after a failed write.', restoreError);
          throw new Error(`Review data could not be saved or restored: ${error.message}`);
        }
        throw error;
      }
    });
    writeQueue = next.catch(() => {});
    return next;
  }

  function listFeeds() {
    return execute('SELECT * FROM feed_subscriptions ORDER BY rowid');
  }

  function listFollows() {
    return execute('SELECT * FROM price_follows ORDER BY rowid');
  }

  function listArticles(unreadOnly = false) {
    const where = unreadOnly ? 'WHERE a.is_read = 0' : '';
    return execute(`
      SELECT a.*, f.title AS feed_title
      FROM articles a JOIN feed_subscriptions f ON f.id = a.feed_id
      ${where}
      ORDER BY a.published_at IS NULL ASC, a.published_at DESC, a.first_seen_order ASC
    `);
  }

  async function addFeed(url) {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
      throw new Error('Feed URLs must use HTTP or HTTPS and cannot contain credentials.');
    }
    const canonicalUrl = parsedUrl.href;
    const existing = execute('SELECT id FROM feed_subscriptions WHERE url = ?', [canonicalUrl])[0];
    if (existing) throw new Error('This feed is already subscribed to.');
    const id = createId();
    await write(() => run(
      `INSERT INTO feed_subscriptions (id, url, title, last_fetch_status)
       VALUES (?, ?, ?, 'loading')`,
      [id, canonicalUrl, canonicalUrl]
    ));
    return listFeeds().find((feed) => feed.id === id);
  }

  async function removeFeed(feedId) {
    return write(() => run('DELETE FROM feed_subscriptions WHERE id = ?', [feedId]));
  }

  async function setFeedStatus(feedId, statusValue, errorMessage = null) {
    return write(() => run(
      'UPDATE feed_subscriptions SET last_fetch_status = ?, last_fetch_error = ? WHERE id = ?',
      [statusValue, errorMessage, feedId]
    ));
  }

  async function addFollow(productId, conditionType, threshold) {
    if (!getProductIds().has(productId)) throw new Error('Choose a product from the storefront catalog.');
    if (!['absolute_max', 'percent_increase', 'percent_decrease'].includes(conditionType)) {
      throw new Error('Choose a supported price condition.');
    }
    const numericThreshold = Number(threshold);
    if (!Number.isFinite(numericThreshold) || numericThreshold < 0) {
      throw new Error('Enter a valid non-negative threshold.');
    }
    const existing = execute(
      `SELECT id FROM price_follows WHERE product_id = ? AND condition_type = ? AND threshold = ?`,
      [productId, conditionType, numericThreshold]
    )[0];
    if (existing) throw new Error('That price follow already exists.');
    const id = createId();
    await write(() => run(
      `INSERT INTO price_follows (id, product_id, condition_type, threshold)
       VALUES (?, ?, ?, ?)`,
      [id, productId, conditionType, numericThreshold]
    ));
    return listFollows().find((follow) => follow.id === id);
  }

  async function removeFollow(followId) {
    return write(() => run('DELETE FROM price_follows WHERE id = ?', [followId]));
  }

  function normalizeEntry(entry) {
    let priceMinorUnits = null;
    if (entry.productId && typeof entry.price === 'string' &&
        /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(entry.price) && entry.currency === 'USD') {
      const price = Number(entry.price);
      if (Number.isFinite(price) && price > 0 && Math.round(price * 100) > 0) {
        priceMinorUnits = Math.round(price * 100);
      }
    }
    return { ...entry, priceMinorUnits };
  }

  async function saveRefresh(feedId, title, entries) {
    const normalizedEntries = entries.map(normalizeEntry);
    await write(() => {
      run(
        `UPDATE feed_subscriptions
         SET title = ?, last_fetched_at = ?, last_fetch_status = 'success', last_fetch_error = NULL
         WHERE id = ?`,
        [title, new Date().toISOString(), feedId]
      );

      for (const entry of normalizedEntries) {
        const existing = execute(
          'SELECT id, first_seen_order FROM articles WHERE feed_id = ? AND entry_key = ?',
          [feedId, entry.entryKey]
        )[0];
        let articleId;
        if (existing) {
          articleId = existing.id;
          run(
            `UPDATE articles SET title = ?, url = ?, published_at = ?, content_html = ?, content_text = ?
             WHERE id = ?`,
            [entry.title, entry.url, entry.publishedAt, entry.contentHtml, entry.contentText, articleId]
          );
          run('DELETE FROM price_observations WHERE article_id = ?', [articleId]);
        } else {
          run(
            `INSERT INTO articles
             (feed_id, entry_key, title, url, published_at, content_html, content_text, first_seen_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(first_seen_order), 0) + 1 FROM articles))`,
            [feedId, entry.entryKey, entry.title, entry.url, entry.publishedAt,
              entry.contentHtml, entry.contentText]
          );
          articleId = execute('SELECT last_insert_rowid() AS id')[0].id;
        }
        if (entry.productId && getProductIds().has(entry.productId) && entry.priceMinorUnits) {
          run(
            `INSERT INTO price_observations (article_id, product_id, price_minor_units, currency)
             VALUES (?, ?, ?, 'USD')`,
            [articleId, entry.productId, entry.priceMinorUnits]
          );
        }
      }
    });
  }

  async function setRead(articleId, isRead) {
    return write(() => run('UPDATE articles SET is_read = ? WHERE id = ?', [isRead ? 1 : 0, articleId]));
  }

  function getObservations(feedId, productId) {
    return execute(`
      SELECT o.article_id, o.product_id, o.price_minor_units, a.published_at, a.first_seen_order, a.entry_key
      FROM price_observations o JOIN articles a ON a.id = o.article_id
      WHERE a.feed_id = ? AND o.product_id = ?
      ORDER BY a.published_at IS NULL ASC, a.published_at ASC, a.first_seen_order ASC
    `, [feedId, productId]);
  }

  window.ReviewStore = {
    open,
    status,
    listFeeds,
    listFollows,
    listArticles,
    addFeed,
    removeFeed,
    setFeedStatus,
    addFollow,
    removeFollow,
    saveRefresh,
    setRead,
    getObservations
  };
})();
