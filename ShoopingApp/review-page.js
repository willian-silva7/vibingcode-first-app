(function () {
  let initialization;
  let root;
  let unreadOnly = false;

  function createElement(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = value;
    return element;
  }

  function announce(message, isError = false) {
    const status = root.querySelector('#review-status');
    status.textContent = message;
    status.classList.toggle('error-message', isError);
    status.setAttribute('role', isError ? 'alert' : 'status');
  }

  function makeButton(label, action, id, className = 'secondary-button') {
    const button = createElement('button', className, label);
    button.type = 'button';
    button.dataset.reviewAction = action;
    if (id != null) button.dataset.reviewId = String(id);
    return button;
  }

  function appendFeed(feed, list) {
    const item = createElement('li', 'review-feed');
    const info = createElement('div', 'review-feed-info');
    info.append(
      createElement('strong', '', feed.title),
      createElement('span', 'review-feed-url', feed.url)
    );
    const stateText = feed.last_fetch_status === 'success'
      ? `Last refreshed ${new Date(feed.last_fetched_at).toLocaleString()}`
      : feed.last_fetch_status === 'error'
        ? feed.last_fetch_error || 'Could not refresh this feed.'
        : 'Not refreshed yet';
    info.append(createElement('small', 'review-muted', stateText));
    const actions = createElement('div', 'review-inline-actions');
    actions.append(
      makeButton('Refresh', 'refresh-feed', feed.id),
      makeButton('Remove', 'remove-feed', feed.id, 'danger-button')
    );
    item.append(info, actions);
    list.append(item);
  }

  function appendFollow(follow, list) {
    const product = window.StorefrontProducts.find((item) => item.id === follow.product_id);
    const conditionNames = {
      absolute_max: 'at or below',
      percent_increase: 'increase by at least',
      percent_decrease: 'decrease by at least'
    };
    const value = follow.condition_type === 'absolute_max'
      ? `$${Number(follow.threshold).toFixed(2)}`
      : `${Number(follow.threshold)}%`;
    const item = createElement('li', 'review-follow');
    item.append(
      createElement('span', '', `${product?.name || follow.product_id} ${conditionNames[follow.condition_type]} ${value}`),
      makeButton('Remove follow', 'remove-follow', follow.id, 'danger-button')
    );
    list.append(item);
  }

  function formatMatch(match) {
    const product = window.StorefrontProducts.find((item) => item.id === match.productId);
    const labels = {
      absolute_max: `Price is at or below $${match.threshold.toFixed(2)}`,
      percent_increase: `Price increased by ${((match.currentPrice - match.previousPrice) /
        match.previousPrice * 100).toFixed(1)}%`,
      percent_decrease: `Price decreased by ${((match.previousPrice - match.currentPrice) /
        match.previousPrice * 100).toFixed(1)}%`
    };
    return `${product?.name || match.productId}: ${labels[match.conditionType]}`;
  }

  function appendArticle(article, matches, list) {
    const card = createElement('article', `review-article${article.is_read ? ' is-read' : ''}`);
    card.dataset.articleId = String(article.id);
    const header = createElement('div', 'review-article-header');
    const title = createElement('h3', '', article.title);
    header.append(title, createElement('span', 'review-read-state', article.is_read ? 'Read' : 'Unread'));
    card.append(header);

    const metadata = createElement(
      'p',
      'review-article-meta',
      `${article.feed_title} · ${article.published_at
        ? new Date(article.published_at).toLocaleString()
        : 'Date unavailable'}`
    );
    card.append(metadata);

    if (article.url) {
      const link = document.createElement('a');
      link.href = article.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open source article';
      card.append(link);
    }

    const content = createElement('div', 'review-article-content');
    if (article.content_html) {
      try {
        content.innerHTML = window.ReviewFeeds.sanitizeHtml(article.content_html);
      } catch (error) {
        content.textContent = window.ReviewFeeds.getTextFallback(article.content_html);
        announce(`${error.message} Showing article text only.`, true);
      }
    } else {
      content.textContent = article.content_text || '';
    }
    if (content.childNodes.length) card.append(content);

    const articleMatches = matches.get(article.id) || [];
    if (articleMatches.length) {
      const matchList = createElement('ul', 'review-price-matches');
      for (const match of articleMatches) matchList.append(createElement('li', '', formatMatch(match)));
      card.append(matchList);
    }

    card.append(makeButton(
      article.is_read ? 'Mark unread' : 'Mark read',
      'toggle-read',
      article.id
    ));
    list.append(card);
  }

  function renderShell() {
    root.innerHTML = `
      <section class="page review-page">
        <header class="page-header">
          <div>
            <h1>Review</h1>
            <p>Follow product prices and review articles from your feeds.</p>
          </div>
        </header>
        <p id="review-status" class="review-status" role="status" aria-live="polite"></p>
        <section class="review-panel" aria-labelledby="review-feed-heading">
          <h2 id="review-feed-heading">Feeds</h2>
          <form id="review-feed-form" class="review-form">
            <label for="review-feed-url">RSS or Atom feed URL</label>
            <div class="review-form-row">
              <input id="review-feed-url" name="feedUrl" type="url" inputmode="url"
                placeholder="https://example.com/feed.xml" required autocomplete="url" />
              <button class="primary-button" type="submit">Add feed</button>
            </div>
          </form>
          <ul id="review-feed-list" class="review-list"></ul>
        </section>
        <section class="review-panel" aria-labelledby="review-follow-heading">
          <h2 id="review-follow-heading">Price follows</h2>
          <form id="review-follow-form" class="review-form">
            <label for="review-product">Product</label>
            <select id="review-product" name="productId" required></select>
            <label for="review-condition">Price condition</label>
            <select id="review-condition" name="conditionType" required>
              <option value="absolute_max">Price at or below</option>
              <option value="percent_increase">Increase by at least</option>
              <option value="percent_decrease">Decrease by at least</option>
            </select>
            <label for="review-threshold">Price in USD or percentage</label>
            <input id="review-threshold" name="threshold" type="number" min="0" step="0.01"
              required value="1.00" />
            <button class="primary-button" type="submit">Add price follow</button>
          </form>
          <ul id="review-follow-list" class="review-list"></ul>
        </section>
        <section class="review-panel" aria-labelledby="review-articles-heading">
          <header class="review-article-list-header">
            <h2 id="review-articles-heading">Articles</h2>
            <label for="review-filter">Show</label>
            <select id="review-filter" name="filter">
              <option value="all">All articles</option>
              <option value="unread">Unread only</option>
            </select>
          </header>
          <div id="review-article-list" class="review-article-list"></div>
        </section>
      </section>
    `;
    const products = window.StorefrontProducts || [];
    const selector = root.querySelector('#review-product');
    for (const product of products) {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.name;
      selector.append(option);
    }
  }

  function renderData() {
    const feedList = root.querySelector('#review-feed-list');
    const followList = root.querySelector('#review-follow-list');
    const articleList = root.querySelector('#review-article-list');
    feedList.replaceChildren();
    followList.replaceChildren();
    articleList.replaceChildren();

    const feeds = window.ReviewStore.listFeeds();
    const follows = window.ReviewStore.listFollows();
    const articles = window.ReviewStore.listArticles(unreadOnly);
    for (const feed of feeds) appendFeed(feed, feedList);
    for (const follow of follows) appendFollow(follow, followList);
    const matchesByFeed = new Map();
    for (const feed of feeds) {
      matchesByFeed.set(feed.id, window.ReviewFeeds.findMatches(feed.id, follows));
    }
    for (const article of articles) {
      appendArticle(article, matchesByFeed.get(article.feed_id) || new Map(), articleList);
    }

    if (!feeds.length) {
      feedList.append(createElement('li', 'review-empty', 'No feeds yet. Add an RSS or Atom feed to get started.'));
    }
    if (!follows.length) {
      followList.append(createElement('li', 'review-empty', 'No price follows yet.'));
    }
    if (!articles.length) {
      articleList.append(createElement('p', 'review-empty',
        unreadOnly ? 'There are no unread articles.' : 'Articles from your feeds will appear here.'));
    }
    if (!window.ReviewStore.status().persistent) {
      announce(window.ReviewStore.status().message, true);
    }
  }

  async function runAction(action) {
    try {
      await action();
      renderData();
    } catch (error) {
      announce(error.message || 'The requested change could not be saved.', true);
      renderData();
    }
  }

  async function refreshFeed(feed) {
    try {
      const result = await window.ReviewFeeds.fetchFeed(feed.url);
      await window.ReviewStore.saveRefresh(feed.id, result.title, result.entries);
      announce(`Updated ${result.title}.`);
    } catch (error) {
      try {
        await window.ReviewStore.setFeedStatus(feed.id, 'error', error.message);
      } catch (storageError) {
        announce(`${error.message} The feed status could not be saved: ${storageError.message}`, true);
        return;
      }
      announce(`${error.message} Existing articles were kept.`, true);
    }
  }

  async function initialize() {
    if (!initialization) initialization = window.ReviewStore.open();
    return initialization;
  }

  async function render(container) {
    root = container;
    renderShell();
    try {
      const status = await initialize();
      if (!status.persistent) announce(status.message, true);
      renderData();
    } catch (error) {
      announce(`${error.message} Review data was not replaced.`, true);
    }
    if (root.dataset.reviewHandlersReady) return;
    root.dataset.reviewHandlersReady = 'true';

    root.addEventListener('submit', async (event) => {
      if (event.target.id === 'review-feed-form') {
        event.preventDefault();
        const input = root.querySelector('#review-feed-url');
        const submit = event.target.querySelector('button[type="submit"]');
        submit.disabled = true;
        let feed;
        try {
          feed = await window.ReviewStore.addFeed(input.value.trim());
          input.value = '';
          await refreshFeed(feed);
          renderData();
        } catch (error) {
          announce(error.message, true);
        } finally {
          submit.disabled = false;
        }
      } else if (event.target.id === 'review-follow-form') {
        event.preventDefault();
        const formData = new FormData(event.target);
        await runAction(() => window.ReviewStore.addFollow(
          formData.get('productId'),
          formData.get('conditionType'),
          formData.get('threshold')
        ));
      }
    });

    root.addEventListener('change', (event) => {
      if (event.target.id === 'review-filter') {
        unreadOnly = event.target.value === 'unread';
        renderData();
      }
    });

    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-review-action]');
      if (!button) return;
      const id = button.dataset.reviewId;
      const action = button.dataset.reviewAction;
      if (action === 'remove-feed') {
        runAction(() => window.ReviewStore.removeFeed(id));
      } else if (action === 'remove-follow') {
        runAction(() => window.ReviewStore.removeFollow(id));
      } else if (action === 'toggle-read') {
        const article = window.ReviewStore.listArticles().find((item) => String(item.id) === id);
        if (article) runAction(() => window.ReviewStore.setRead(article.id, !article.is_read));
      } else if (action === 'refresh-feed') {
        const feed = window.ReviewStore.listFeeds().find((item) => item.id === id);
        if (feed) {
          button.disabled = true;
          refreshFeed(feed).then(renderData).finally(() => {
            button.disabled = false;
          });
        }
      }
    });
  }

  window.ReviewPage = { render };
})();
