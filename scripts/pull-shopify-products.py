#!/usr/bin/env python3
"""Sync Shopify products via Storefront API → content/shopify/products.json."""

from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "content/shopify/storefront-config.json"
OUT_PATH = ROOT / "content/shopify/products.json"

PRODUCTS_QUERY = """
query Products($cursor: String) {
  products(first: 50, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        handle
        title
        description
        productType
        vendor
        featuredImage { url altText }
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              availableForSale
              selectedOptions { name value }
              price { amount currencyCode }
              image { url altText }
            }
          }
        }
        collections(first: 10) {
          edges { node { handle title } }
        }
      }
    }
  }
}
"""


def load_config() -> dict:
    if CONFIG_PATH.is_file():
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    domain = os.environ.get("SHOPIFY_STORE_DOMAIN", "").strip()
    token = os.environ.get("SHOPIFY_STOREFRONT_TOKEN", "").strip()
    if domain and token:
        return {
            "storeDomain": domain,
            "storefrontAccessToken": token,
            "apiVersion": os.environ.get("SHOPIFY_API_VERSION", "2024-10"),
        }
    raise SystemExit(
        f"Missing {CONFIG_PATH} (or SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_TOKEN)"
    )


def storefront_graphql(config: dict, query: str, variables: dict | None = None) -> dict:
    domain = config["storeDomain"].replace("https://", "").replace("http://", "").strip("/")
    version = config.get("apiVersion", "2024-10")
    url = f"https://{domain}/api/{version}/graphql.json"
    body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": config["storefrontAccessToken"],
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload["data"]


def normalize_product(node: dict) -> dict:
    variants = []
    for edge in node.get("variants", {}).get("edges", []):
        v = edge["node"]
        variants.append(
            {
                "id": v["id"],
                "title": v.get("title") or "",
                "availableForSale": bool(v.get("availableForSale")),
                "price": v.get("price"),
                "selectedOptions": v.get("selectedOptions") or [],
                "image": v.get("image"),
            }
        )
    collections = [
        e["node"]["title"]
        for e in node.get("collections", {}).get("edges", [])
        if e.get("node")
    ]
    feat = node.get("featuredImage") or {}
    min_p = node.get("priceRange", {}).get("minVariantPrice") or {}
    return {
        "id": node["id"],
        "handle": node["handle"],
        "title": node.get("title") or "",
        "description": node.get("description") or "",
        "productType": node.get("productType") or "",
        "vendor": node.get("vendor") or "",
        "image": feat.get("url") or "",
        "imageAlt": feat.get("altText") or node.get("title") or "",
        "price": min_p,
        "variants": variants,
        "collections": collections,
        "href": f"/produkter/{node['handle']}",
    }


def main() -> None:
    config = load_config()
    products: list[dict] = []
    cursor = None
    while True:
        data = storefront_graphql(config, PRODUCTS_QUERY, {"cursor": cursor})
        conn = data["products"]
        for edge in conn.get("edges", []):
            products.append(normalize_product(edge["node"]))
        page = conn.get("pageInfo") or {}
        if not page.get("hasNextPage"):
            break
        cursor = page.get("endCursor")
        time.sleep(0.2)

    categories = sorted({c for p in products for c in p.get("collections") or [] if c})
    payload = {
        "syncedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "storeDomain": config["storeDomain"],
        "categories": ["Alla", *categories],
        "products": products,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(products)} products → {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
