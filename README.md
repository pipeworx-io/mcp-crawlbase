# mcp-crawlbase

Crawlbase MCP — wraps the Crawlbase Crawling API (crawlbase.com, formerly ProxyCrawl). One endpoint powers everything: rotating residential/datacenter proxies, server-side anti-bot solving (Cloudflare, DataDome, hCaptcha, …), optional headless-browser rendering, screenshots, and a library of named…

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1863+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/crawlbase/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1863+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

This pack takes your own API key (`_apiKey`) — we don't front one for it, so there's no curl here that would run without it. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/crawlbase_scrape`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-crawlbase` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/crawlbase/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "crawlbase": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-crawlbase"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Crawlbase data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
