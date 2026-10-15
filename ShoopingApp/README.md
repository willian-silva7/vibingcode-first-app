# 🛒 Fruit Storefront Prototype

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Status](https://img.shields.io/badge/Status-Prototype-orange.svg)
![Frontend](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JavaScript-blue.svg)

## 📌 Description

Fruit Storefront Prototype is a lightweight, client-side e-commerce demo designed to showcase a complete shopping journey for fresh fruit products. The application allows customers to browse a curated catalog, view detailed product information, add items to a cart, adjust quantities, and complete a simplified checkout flow.

This project is intended as a front-end prototype for product and UX validation, without involving a backend, database, payments, or user authentication.

## 📚 Table of Contents

- [Overview](#-description)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [License](#-license)

## ✨ Features

- 10-item fruit catalog with pricing and descriptions
- Product detail page for each item
- Add-to-cart flow with quantity selection
- Shopping cart with quantity updates and item removal
- Checkout summary and order confirmation flow
- Responsive desktop and mobile layout
- Clean storefront styling and interactive UX feedback
- Fully static front-end implementation with no backend dependency
- Review Page for RSS/Atom article feeds, explicit product-price follows, and read/unread tracking

## 🚀 Installation

### Prerequisites

- A modern web browser
- A local web server or direct browser access to the project files

### Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ShoopingApp
   ```

2. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open the application in the browser:
   ```text
   http://localhost:8000
   ```

> You can also open `index.html` directly in the browser, but using a local server is recommended for a smoother experience.

## 🧭 Usage

1. Open the application in a browser.
2. Browse the available fruit products.
3. Select a product to view its details.
4. Choose a quantity and add it to the cart.
5. Review the cart and adjust quantities as needed.
6. Proceed to checkout and complete the prototype order flow.

## ⚙️ Configuration

This project does not require environment variables or external configuration files. It is intentionally designed as a static storefront prototype.

### Review Page

The Review Page can subscribe to RSS 2.0 and Atom 1.0 URLs that allow cross-origin browser
requests. Add a product ID and USD price to entries using the `vcp` extension described in
[`specs/001-create-review-page/contracts/feed-format.md`](specs/001-create-review-page/contracts/feed-format.md)
for price follows to match. Articles, follows, and reading state are stored locally in the
current browser profile using SQLite in WebAssembly and IndexedDB; they are not synchronized and
may be removed when browser site data is cleared or evicted. Feed article markup is sanitized
before display. The Review Page does not use a backend, feed proxy, background refresh, account,
or notification service.

### Main customization points

- Product catalog and pricing: `app.js`
- Layout and visual styling: `styles.css`
- Page structure and app shell: `index.html`
- Product requirements and scope: `VibeCodingPRD.md`

### Typical adjustments

- Add or remove fruits from the catalog in `app.js`
- Update colors, spacing, and responsive behavior in `styles.css`
- Modify the navigation or page logic in `app.js`

## 🗂️ Project Structure

```text
ShoopingApp/
├── app.js
├── index.html
├── styles.css
├── VibeCodingPRD.md
├── navigation-wireframe.txt
├── products-wireframe.txt
├── productdetails-wireframe.txt
├── shoppingcart-wireframe.txt
├── checkout-wireframe.txt
├── project.instructions.md
└── README.md
```

## 📦 License

This project is licensed under the MIT License.

```text
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
