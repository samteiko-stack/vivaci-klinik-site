/**
 * Shopify Storefront API client (config + GraphQL).
 */
(function () {
  if (window.VivaciShopify) return;

  var CONFIG_URL = "/content/shopify/storefront-config.json";
  var configPromise = null;

  function loadConfig() {
    if (!configPromise) {
      configPromise = fetch(CONFIG_URL)
        .then(function (res) {
          if (!res.ok) throw new Error("Shopify config missing — copy storefront-config.example.json");
          return res.json();
        })
        .then(function (cfg) {
          if (!cfg.storeDomain || !cfg.storefrontAccessToken) {
            throw new Error("Invalid Shopify config");
          }
          return cfg;
        });
    }
    return configPromise;
  }

  function graphql(query, variables) {
    return loadConfig().then(function (cfg) {
      var domain = cfg.storeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
      var version = cfg.apiVersion || "2024-10";
      var url = "https://" + domain + "/api/" + version + "/graphql.json";
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": cfg.storefrontAccessToken,
        },
        body: JSON.stringify({ query: query, variables: variables || {} }),
      }).then(function (res) {
        return res.json();
      }).then(function (payload) {
        if (payload.errors && payload.errors.length) {
          throw new Error(payload.errors.map(function (e) { return e.message; }).join("; "));
        }
        return payload.data;
      });
    });
  }

  window.VivaciShopify = {
    loadConfig: loadConfig,
    graphql: graphql,
  };
})();
