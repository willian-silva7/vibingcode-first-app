const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const feedFixtures = path.join(__dirname, 'fixtures', 'feeds');
const rss = fs.readFileSync(path.join(feedFixtures, 'prices-rss.xml'), 'utf8');
const atom = fs.readFileSync(path.join(feedFixtures, 'prices-atom.xml'), 'utf8');
const hostile = fs.readFileSync(path.join(feedFixtures, 'hostile-rss.xml'), 'utf8');
const feedUrl = 'https://feeds.example.test/fruit.xml';

async function mockFeed(page, body = rss, url = feedUrl) {
  await page.route(url, (route) => route.fulfill({
    status: 200,
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'access-control-allow-origin': '*'
    },
    body
  }));
}

async function openReview(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
}

async function addFeed(page, url = feedUrl) {
  await page.getByLabel('RSS or Atom feed URL').fill(url);
  await page.getByRole('button', { name: 'Add feed' }).click();
}

test('Review opens with an empty state and adds RSS feeds', async ({ page }) => {
  await mockFeed(page);
  await openReview(page);

  await expect(page.getByText('No feeds yet.', { exact: false })).toBeVisible();
  await addFeed(page);

  await expect(page.getByText('Fruit Price Watch', { exact: true })).toBeVisible();
  const titles = page.locator('.review-article h3');
  await expect(titles).toHaveText([
    'Apple invalid precision',
    'Apple price changed',
    'Banana article without product price',
    'Apple price before change',
    'Apple baseline price'
  ]);
});

test('Review rejects duplicate and unsafe feed URLs', async ({ page }) => {
  await mockFeed(page);
  await openReview(page);
  await addFeed(page);
  await expect(page.getByText('Fruit Price Watch', { exact: true })).toBeVisible();

  await addFeed(page);
  await expect(page.getByRole('alert')).toContainText('already subscribed');
  await expect(page.locator('.review-feed')).toHaveCount(1);

  await page.getByLabel('RSS or Atom feed URL').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Add feed' }).click();
  await expect(page.getByRole('alert')).toContainText('HTTP or HTTPS');
  await expect(page.locator('.review-feed')).toHaveCount(1);

  await page.locator('.review-feed').getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('.review-feed')).toHaveCount(0);
  await expect(page.locator('.review-article')).toHaveCount(0);
});

test('Review reports malformed feeds without replacing cached articles', async ({ page }) => {
  await mockFeed(page);
  await openReview(page);
  await addFeed(page);
  await expect(page.locator('.review-article')).toHaveCount(5);

  await page.route('https://feeds.example.test/broken.xml', (route) => route.fulfill({
    status: 200,
    headers: {
      'content-type': 'application/rss+xml',
      'access-control-allow-origin': '*'
    },
    body: '<html><body>Not an RSS feed</body></html>'
  }));
  await addFeed(page, 'https://feeds.example.test/broken.xml');
  await expect(page.getByRole('alert')).toContainText('did not return an RSS 2.0 or Atom 1.0 feed');
  await expect(page.locator('.review-article')).toHaveCount(5);
  await expect(page.locator('.review-feed')).toHaveCount(2);

  await page.route('https://feeds.example.test/malformed.xml', (route) => route.fulfill({
    status: 200,
    headers: {
      'content-type': 'application/rss+xml',
      'access-control-allow-origin': '*'
    },
    body: '<rss><channel><item>'
  }));
  await addFeed(page, 'https://feeds.example.test/malformed.xml');
  await expect(page.getByRole('alert')).toContainText('malformed XML');
  await expect(page.locator('.review-article')).toHaveCount(5);
});

test('Review sorts at least 20 dated articles newest first', async ({ page }) => {
  const expected = Array.from({ length: 20 }, (_, index) => `Story ${19 - index}`);
  const items = Array.from({ length: 20 }, (_, index) => `
    <item>
      <guid>story-${index}</guid>
      <title>Story ${index}</title>
      <pubDate>${new Date(Date.UTC(2026, 9, 1 + index)).toUTCString()}</pubDate>
    </item>`).join('');
  const largeFeed = `<?xml version="1.0"?><rss version="2.0"><channel>
    <title>Twenty Articles</title>${items}</channel></rss>`;
  await mockFeed(page, largeFeed);
  await openReview(page);
  await addFeed(page);
  await expect(page.locator('.review-article h3')).toHaveText(expected);
});

test('Review keeps equal-date and undated article order stable', async ({ page }) => {
  const fixture = `<?xml version="1.0"?><rss version="2.0"><channel>
    <title>Stable Order</title>
    <item><guid>tie-one</guid><title>Tie one</title><pubDate>Tue, 06 Oct 2026 08:00:00 GMT</pubDate></item>
    <item><guid>tie-two</guid><title>Tie two</title><pubDate>Tue, 06 Oct 2026 08:00:00 GMT</pubDate></item>
    <item><guid>undated-one</guid><title>Undated one</title></item>
    <item><guid>undated-two</guid><title>Undated two</title></item>
  </channel></rss>`;
  await mockFeed(page, fixture);
  await openReview(page);
  await addFeed(page);
  const titles = page.locator('.review-article h3');
  const expected = ['Tie one', 'Tie two', 'Undated one', 'Undated two'];
  await expect(titles).toHaveText(expected);

  await page.locator('.review-feed').getByRole('button', { name: 'Refresh' }).click();
  await expect(titles).toHaveText(expected);
});

test('failed refresh keeps the cached articles', async ({ page }) => {
  let requests = 0;
  await page.route(feedUrl, (route) => {
    requests += 1;
    if (requests === 1) {
      return route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/rss+xml; charset=utf-8',
          'access-control-allow-origin': '*'
        },
        body: rss
      });
    }
    return route.abort();
  });
  await openReview(page);
  await addFeed(page);
  await expect(page.locator('.review-article')).toHaveCount(5);

  await page.locator('.review-feed').getByRole('button', { name: 'Refresh' }).click();
  await expect(page.getByRole('alert')).toContainText('Existing articles were kept');
  await expect(page.locator('.review-article')).toHaveCount(5);
});

test('Review reports when local storage cannot be opened', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: {
        open() {
          const request = {};
          setTimeout(() => {
            request.error = new DOMException('Storage blocked', 'SecurityError');
            request.onerror();
          }, 0);
          return request;
        }
      }
    });
  });
  await openReview(page);
  await expect(page.getByRole('alert')).toContainText('Changes will not be retained');
});

test('SQLite snapshot migration preserves the previous database data', async ({ page }) => {
  await openReview(page);
  await page.evaluate(async () => {
    const database = new window.SQL.Database();
    database.run('CREATE TABLE migration_sentinel (value TEXT)');
    database.run('INSERT INTO migration_sentinel VALUES (?)', ['keep-me']);
    const bytes = database.export();
    database.close();

    const idb = await new Promise((resolve, reject) => {
      const request = indexedDB.open('fruit-storefront-review', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const transaction = idb.transaction('sqlite-snapshots', 'readwrite');
      transaction.objectStore('sqlite-snapshots').put({
        key: 'review',
        revision: 7,
        schemaVersion: 0,
        bytes
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    idb.close();
  });

  await page.reload();
  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page.getByText('No feeds yet.', { exact: false })).toBeVisible();
  const result = await page.evaluate(async () => {
    const idb = await new Promise((resolve, reject) => {
      const request = indexedDB.open('fruit-storefront-review', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const record = await new Promise((resolve, reject) => {
      const request = idb.transaction('sqlite-snapshots').objectStore('sqlite-snapshots').get('review');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const database = new window.SQL.Database(new Uint8Array(record.bytes));
    const values = database.exec('SELECT value FROM migration_sentinel');
    database.close();
    idb.close();
    return { revision: record.revision, value: values[0].values[0][0] };
  });
  expect(result).toEqual({ revision: 8, value: 'keep-me' });
});

test('Review reports failed local snapshot writes instead of claiming they were saved', async ({ page }) => {
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function put(...args) {
      if (this.name === 'sqlite-snapshots') {
        throw new DOMException('Storage quota reached', 'QuotaExceededError');
      }
      return originalPut.apply(this, args);
    };
  });
  await openReview(page);
  await addFeed(page);
  await expect(page.getByRole('alert')).toContainText('Storage quota reached');
  await expect(page.locator('.review-feed')).toHaveCount(0);
});

test('price follows evaluate explicit RSS observations', async ({ page }) => {
  await mockFeed(page);
  await openReview(page);
  await addFeed(page);

  await page.getByLabel('Product', { exact: true }).selectOption('apple');
  await page.getByLabel('Price condition').selectOption('absolute_max');
  await page.getByLabel('Price in USD or percentage').fill('1.30');
  await page.getByRole('button', { name: 'Add price follow' }).click();
  await expect(page.getByText('Apple at or below $1.30', { exact: true })).toBeVisible();
  await expect(page.locator('.review-article').filter({ hasText: 'Apple price changed' })
    .getByText('Price is at or below $1.30')).toBeVisible();

  await page.getByLabel('Price condition').selectOption('percent_decrease');
  await page.getByLabel('Price in USD or percentage').fill('10');
  await page.getByRole('button', { name: 'Add price follow' }).click();
  await expect(page.locator('.review-article').filter({ hasText: 'Apple price changed' })
    .getByText('Price decreased by 16.7%')).toBeVisible();
  await expect(page.locator('.review-article').filter({ hasText: 'Apple invalid precision' })
    .getByText(/Price decreased/)).toHaveCount(0);
  await expect(page.locator('.review-article').filter({ hasText: 'Apple price before change' })
    .getByText(/Price decreased/)).toHaveCount(0);

  await page.getByLabel('Price condition').selectOption('percent_increase');
  await page.getByLabel('Price in USD or percentage').fill('40');
  await page.getByRole('button', { name: 'Add price follow' }).click();
  await expect(page.locator('.review-article').filter({ hasText: 'Apple price before change' })
    .getByText('Price increased by 50.0%')).toBeVisible();
  await expect(page.locator('.review-article').filter({ hasText: 'Apple baseline price' })
    .getByText(/Price increased/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Remove follow' }).first().click();
  await expect(page.getByText('Apple at or below $1.30', { exact: true })).toHaveCount(0);
});

test('Review sanitizes hostile article markup from an RSS feed', async ({ page }) => {
  await mockFeed(page, hostile);
  await openReview(page);
  await addFeed(page);

  const card = page.locator('.review-article').filter({ hasText: 'Article with hostile markup' });
  await expect(card.locator('strong')).toHaveText('formatting');
  await expect(card.locator('script, img, [onclick]')).toHaveCount(0);
  await expect(card.locator('.review-article-content a[href^="javascript:"]')).toHaveCount(0);
  await expect(card.locator('.review-article-content a[href^="mailto:"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});

test('read state persists across reload and Atom metadata is supported', async ({ page }) => {
  await mockFeed(page, atom);
  await openReview(page);
  await addFeed(page);

  const article = page.locator('.review-article').filter({ hasText: 'Atom apple price' });
  await expect(article.locator('.review-article-content em')).toHaveText('summary');
  await article.getByRole('button', { name: 'Mark read' }).click();
  await expect(article.locator('.review-read-state')).toHaveText('Read');

  await page.reload();
  await page.getByRole('button', { name: 'Review' }).click();
  const restored = page.locator('.review-article').filter({ hasText: 'Atom apple price' });
  await expect(restored.locator('.review-read-state')).toHaveText('Read');
  await restored.getByRole('button', { name: 'Mark unread' }).click();
  await page.getByLabel('Show').selectOption('unread');
  await expect(page.locator('.review-article')).toHaveCount(1);
});

test('a stale second tab cannot overwrite a newer review snapshot', async ({ browser }) => {
  const context = await browser.newContext();
  const firstPage = await context.newPage();
  const secondPage = await context.newPage();
  await mockFeed(firstPage);
  await mockFeed(secondPage);
  await openReview(firstPage);
  await addFeed(firstPage);

  await openReview(secondPage);
  await expect(secondPage.locator('.review-article')).toHaveCount(5);

  await firstPage.locator('.review-article').first().getByRole('button', { name: 'Mark read' }).click();
  await expect(firstPage.locator('.review-read-state').first()).toHaveText('Read');
  await secondPage.locator('.review-article').first().getByRole('button', { name: 'Mark read' }).click();
  await expect(secondPage.getByRole('alert')).toContainText('changed in another tab');

  await context.close();
});

test('Review controls remain usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openReview(page);
  await expect(page.getByLabel('RSS or Atom feed URL')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add feed' })).toBeVisible();
  await expect(page.getByLabel('Show')).toBeVisible();
});
