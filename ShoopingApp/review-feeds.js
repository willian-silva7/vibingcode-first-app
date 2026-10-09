(function () {
  const PRICE_NAMESPACE = 'urn:fruit-storefront:product-price:v1';
  const RSS_CONTENT_NAMESPACE = 'http://purl.org/rss/1.0/modules/content/';
  const SANITIZE_OPTIONS = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'a'
    ],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['svg', 'math', 'style', 'script', 'iframe', 'object', 'embed', 'img'],
    FORBID_ATTR: ['style']
  };
  let sanitizerHookInstalled = false;

  function child(element, name, namespace) {
    return [...element.children].find((node) =>
      node.localName === name && (!namespace || node.namespaceURI === namespace)
    ) || null;
  }

  function text(element, name, namespace) {
    return child(element, name, namespace)?.textContent?.trim() || '';
  }

  function safeUrl(value, baseUrl) {
    if (!value) return null;
    try {
      const url = new URL(value, baseUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function entryLink(entry, baseUrl, atom) {
    if (atom) {
      const alternate = [...entry.children].find((node) =>
        node.localName === 'link' && (!node.getAttribute('rel') || node.getAttribute('rel') === 'alternate')
      );
      return safeUrl(alternate?.getAttribute('href'), baseUrl);
    }
    return safeUrl(text(entry, 'link'), baseUrl);
  }

  function htmlToText(html) {
    const document = new DOMParser().parseFromString(html, 'text/html');
    return document.body.textContent.trim();
  }

  function contentFor(entry, atom) {
    if (atom) {
      const content = child(entry, 'content', 'http://www.w3.org/2005/Atom');
      const summary = child(entry, 'summary', 'http://www.w3.org/2005/Atom');
      const source = content || summary;
      if (!source) return { contentHtml: '', contentText: '' };
      const type = source.getAttribute('type') || 'text';
      let html = '';
      if (type === 'html') {
        html = source.textContent || '';
      } else if (type === 'xhtml') {
        html = [...source.childNodes].map((node) => new XMLSerializer().serializeToString(node)).join('');
      }
      return {
        contentHtml: html,
        contentText: html ? htmlToText(html) : source.textContent.trim()
      };
    }

    const encoded = child(entry, 'encoded', RSS_CONTENT_NAMESPACE);
    const description = child(entry, 'description');
    const value = (encoded || description)?.textContent?.trim() || '';
    const isMarkup = Boolean(encoded) || /<\/?[a-z][\s\S]*>/i.test(value);
    return {
      contentHtml: isMarkup ? value : '',
      contentText: isMarkup ? htmlToText(value) : value
    };
  }

  function extractPrice(entry) {
    const productNodes = [...entry.getElementsByTagNameNS(PRICE_NAMESPACE, 'product-id')];
    const priceNodes = [...entry.getElementsByTagNameNS(PRICE_NAMESPACE, 'price')];
    if (productNodes.length !== 1 || priceNodes.length !== 1) {
      return { productId: null, price: null, currency: null };
    }
    const productNode = productNodes[0];
    const priceNode = priceNodes[0];
    return {
      productId: productNode.textContent.trim(),
      price: priceNode.textContent.trim(),
      currency: (priceNode.getAttribute('currency') || '').toUpperCase()
    };
  }

  function parseEntry(entry, baseUrl, atom) {
    const title = text(entry, 'title', atom ? 'http://www.w3.org/2005/Atom' : null) || '(Untitled article)';
    const link = entryLink(entry, baseUrl, atom);
    const id = atom
      ? text(entry, 'id', 'http://www.w3.org/2005/Atom')
      : text(entry, 'guid');
    const dateText = atom
      ? (text(entry, 'published', 'http://www.w3.org/2005/Atom') ||
        text(entry, 'updated', 'http://www.w3.org/2005/Atom'))
      : text(entry, 'pubDate');
    const parsedDate = dateText ? new Date(dateText) : null;
    const publishedAt = parsedDate && Number.isFinite(parsedDate.getTime())
      ? parsedDate.toISOString()
      : null;
    const content = contentFor(entry, atom);
    const price = extractPrice(entry);
    const entryKey = id || link ||
      `fallback:${title}:${publishedAt || ''}:${content.contentText || content.contentHtml}`;

    return {
      entryKey,
      title,
      url: link,
      publishedAt,
      contentHtml: content.contentHtml,
      contentText: content.contentText,
      productId: price.productId,
      price: price.price,
      currency: price.currency
    };
  }

  function parseFeed(xml, feedUrl) {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.querySelector('parsererror')) throw new Error('The feed contains malformed XML.');
    const root = document.documentElement;
    if (!root) throw new Error('The feed document is empty.');

    let feedTitle;
    let entries;
    let atom;
    if (root.localName === 'rss' && root.getAttribute('version') === '2.0') {
      const channel = child(root, 'channel');
      if (!channel) throw new Error('The RSS feed has no channel.');
      feedTitle = text(channel, 'title');
      entries = [...channel.children].filter((node) => node.localName === 'item');
      atom = false;
    } else if (root.localName === 'feed' && root.namespaceURI === 'http://www.w3.org/2005/Atom') {
      feedTitle = text(root, 'title', 'http://www.w3.org/2005/Atom');
      entries = [...root.children].filter((node) =>
        node.localName === 'entry' && node.namespaceURI === 'http://www.w3.org/2005/Atom'
      );
      atom = true;
    } else {
      throw new Error('This URL did not return an RSS 2.0 or Atom 1.0 feed.');
    }

    if (!entries.length) throw new Error('The feed contains no articles.');
    return {
      title: feedTitle || new URL(feedUrl).host,
      entries: entries.map((entry) => parseEntry(entry, feedUrl, atom))
    };
  }

  async function fetchFeed(url) {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
      throw new Error('Feed URLs must use HTTP or HTTPS and cannot contain credentials.');
    }
    const response = await fetch(parsedUrl.href, {
      headers: { Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' }
    });
    if (!response.ok) throw new Error(`Feed request failed (HTTP ${response.status}).`);
    const type = response.headers.get('content-type') || '';
    const body = await response.text();
    if (type && !/(xml|rss|atom)/i.test(type) && !body.trimStart().startsWith('<')) {
      throw new Error('The feed URL did not return XML content.');
    }
    return parseFeed(body, parsedUrl.href);
  }

  function sanitizeHtml(markup) {
    if (!window.DOMPurify || typeof window.DOMPurify.sanitize !== 'function') {
      throw new Error('Article formatting is unavailable because the HTML sanitizer did not load.');
    }
    if (!sanitizerHookInstalled) {
      window.DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
        if (data.attrName !== 'href') return;
        try {
          const url = new URL(data.attrValue, window.location.href);
          if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            data.keepAttr = false;
          } else {
            data.attrValue = url.href;
          }
        } catch {
          data.keepAttr = false;
        }
      });
      sanitizerHookInstalled = true;
    }
    return window.DOMPurify.sanitize(markup, SANITIZE_OPTIONS);
  }

  function getTextFallback(markup) {
    return htmlToText(markup);
  }

  function findMatches(feedId, follows) {
    const matches = new Map();
    for (const follow of follows) {
      const observations = window.ReviewStore.getObservations(feedId, follow.product_id);
      let previous = null;
      for (const observation of observations) {
        const current = observation.price_minor_units / 100;
        let qualifies = false;
        if (follow.condition_type === 'absolute_max') {
          qualifies = current <= follow.threshold;
        } else if (previous && previous.price_minor_units > 0) {
          const percent = ((observation.price_minor_units - previous.price_minor_units) /
            previous.price_minor_units) * 100;
          qualifies = follow.condition_type === 'percent_increase'
            ? percent >= follow.threshold
            : percent <= -follow.threshold;
        }
        if (qualifies) {
          const labels = matches.get(observation.article_id) || [];
          labels.push({
            productId: follow.product_id,
            conditionType: follow.condition_type,
            threshold: follow.threshold,
            currentPrice: current,
            previousPrice: previous ? previous.price_minor_units / 100 : null
          });
          matches.set(observation.article_id, labels);
        }
        previous = observation;
      }
    }
    return matches;
  }

  window.ReviewFeeds = {
    fetchFeed,
    parseFeed,
    sanitizeHtml,
    getTextFallback,
    findMatches
  };
})();
