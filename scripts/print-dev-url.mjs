#!/usr/bin/env node
const port = process.env.PORT || "4000";
const host = process.env.HOST && process.env.HOST !== "0.0.0.0" ? process.env.HOST : "localhost";
const base = `http://${host}:${port}`;

console.log("");
console.log(`Vivaci local → ${base}/`);
console.log(`Admin login → ${base}/login`);
console.log(`Treatment pages → ${base}/treatment-pages`);
console.log(`Footer shortcut → ${base}/content-admin (→ /treatment-pages)`);
console.log("");
