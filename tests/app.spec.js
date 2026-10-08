const { test, expect } = require('@playwright/test');

test('storefront loads and shows products', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Apple', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Add to Cart/i }).first()).toBeVisible();
});

test('user can add an item to the cart and view it', async ({ page }) => {
  await page.goto('/');

  const addButton = page.getByRole('button', { name: /Add to Cart/i }).first();
  await addButton.click();

  await expect(page.getByRole('heading', { name: 'Shopping Cart', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Apple', exact: true })).toBeVisible();
});
