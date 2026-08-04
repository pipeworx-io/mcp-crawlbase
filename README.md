# mcp-crawlbase

Crawlbase MCP — wraps the Crawlbase Crawling API (crawlbase.com, formerly

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `crawlbase_scrape` | Scrape any website through Crawlbase rotating residential proxies with server-side anti-bot bypass (Cloudflare, DataDome, hCaptcha solved for you). Returns the page as HTML (default), clean markdown (format:"md" — great for LLM context), or a JSON envelope with metadata (format:"json"). JavaScript-heavy pages (SPAs) render when you pass your Crawlbase JavaScript token as _apiKey; the Normal token does fast static fetches. Example: crawlbase_scrape({ url: "https://example.com", format: "md", _apiKey: "your-crawlbase-token" }) |
| `crawlbase_screenshot` | Capture a screenshot of a rendered web page via Crawlbase (headless browser + rotating proxies, anti-bot bypass). Returns a stored screenshot_url (JPEG, link expires after about one hour) plus crawl metadata. Requires your Crawlbase JavaScript token as _apiKey — screenshots always render in a real browser. Captures the full page by default; pass mode:"viewport" with width/height to constrain. Example: crawlbase_screenshot({ url: "https://example.com", _apiKey: "your-js-token" }) |
| `crawlbase_structured` | Scrape a page into clean structured JSON using a named Crawlbase scraper — skip HTML parsing entirely. Common scraper names: "amazon-product-details", "amazon-serp", "google-serp", "facebook-page", "facebook-profile", "instagram-profile", "instagram-post", "linkedin-profile", "linkedin-company", "tiktok-profile", "ebay-product", "walmart-product-details", "github-repository", "generic-extractor". Full catalog: https://crawlbase.com/docs/scrapers/ — social-media scrapers (Facebook/Instagram/LinkedIn) work best with your JavaScript token. Example: crawlbase_structured({ url: "https://www.amazon.com/dp/1098145356", scraper: "amazon-product-details", _apiKey: "your-crawlbase-token" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "crawlbase": {
      "url": "https://gateway.pipeworx.io/crawlbase/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Crawlbase data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
