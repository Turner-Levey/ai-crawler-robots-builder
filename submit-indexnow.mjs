#!/usr/bin/env node
const siteUrl = new URL(process.argv[2] || "https://ai-crawler-robots-builder.vercel.app/");
const origin = siteUrl.origin;
const key = "7b1e5a0d6c384f3a8d2f91b4a6c0e5f7";
const urlList = [
  `${origin}/`,
  `${origin}/llms.txt`,
  `${origin}/sitemap.xml`
];

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: {
    "content-type": "application/json"
  },
  body: JSON.stringify({
    host: siteUrl.host,
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList
  })
});

const body = await response.text();
console.log(JSON.stringify({
  status: response.status,
  statusText: response.statusText,
  urlList,
  body: body.slice(0, 300)
}, null, 2));

if (!response.ok && response.status !== 202) {
  process.exitCode = 1;
}
