# Shopify (headless storefront)

## Setup

1. In Shopify Admin: **Settings → Apps and sales channels → Develop apps** (or Headless channel) and create a **Storefront API** access token with scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts` (cart)
   - `unauthenticated_read_checkouts`

2. Copy `storefront-config.example.json` → `storefront-config.json` and fill in your store domain and token.

3. Sync products (writes `products.json` for the grid + PDP metadata):

   ```bash
   python3 scripts/pull-shopify-products.py
   ```

4. Run the dev server and open `/produkter`.

Cart and checkout use Shopify’s Storefront Cart API; checkout opens Shopify’s hosted checkout URL.
