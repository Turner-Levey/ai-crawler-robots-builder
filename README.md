# AI Crawler Robots.txt Builder

Free no-tracking browser utility for drafting and auditing `robots.txt` rules for AI crawler and AI search user-agent tokens.

Live site: https://ai-crawler-robots-builder.vercel.app/

No-Login pending listing: https://nologin.tools/tool/ai-crawler-robots-builder-vercel-app/
No-Login badge status: https://nologin.tools/badge/ai-crawler-robots-builder-vercel-app/

## What It Does

- Builds copyable `robots.txt` groups for common AI crawler tokens.
- Separates search/retrieval tokens from model-training tokens where official docs make that distinction.
- Audits pasted `robots.txt` text for common AI crawler tokens and root-level allow/block decisions.
- Runs entirely in the browser with no login, cookies, analytics, beacons, API calls, or external scripts.

## Source Notes

Crawler presets are based on public vendor documentation checked on 2026-05-13:

- OpenAI crawler docs: https://developers.openai.com/api/docs/bots
- Anthropic crawler docs: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Google common crawlers: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- Perplexity robots.txt note: https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt

Robots.txt is a preference file for cooperating crawlers. It is not an authentication, authorization, or enforcement layer.

## Privacy

The app is static HTML, CSS, and JavaScript. It has no runtime network calls and does not store pasted content.

The No-Login directory route is public and pending review. The badge route is public and pending verification.

## License

MIT.
