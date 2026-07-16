interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Crawlbase MCP — wraps the Crawlbase Crawling API (crawlbase.com, formerly
 * ProxyCrawl). One endpoint powers everything: rotating residential/datacenter
 * proxies, server-side anti-bot solving (Cloudflare, DataDome, hCaptcha, …),
 * optional headless-browser rendering, screenshots, and a library of named
 * structured scrapers. Base: https://api.crawlbase.com/?token=...&url=...
 *
 * Tools:
 * - crawlbase_scrape:     fetch any URL through the proxy network → HTML / markdown / JSON envelope
 * - crawlbase_screenshot: render the page and capture a JPEG → stored screenshot_url (expires ~1h)
 * - crawlbase_structured: apply a named scraper (amazon-product-details, google-serp, …) → parsed JSON
 *
 * BYO-key only — pass your Crawlbase token via _apiKey (free tier: 10,000
 * requests, no card). The gateway handles auth/rate-limits; this pack is
 * stateless.
 *
 * Token types (IMPORTANT): Crawlbase issues TWO tokens per account. The
 * Normal token does fast static fetches; the JavaScript token loads the page
 * in a real headless browser (needed for SPAs, and for screenshots). There is
 * NO javascript=true query param — rendering is selected purely by WHICH
 * token you pass as _apiKey.
 *
 * WEB-VERIFIED against https://crawlbase.com/docs/crawling-api/ and
 * https://crawlbase.com/docs/scrapers/ (2026-07). Endpoint error shape
 * confirmed live: HTTP 401 with {"pc_status":401,"error":"Token is invalid! …"}
 * when format=json, plain-text message otherwise.
 */


const BASE_URL = 'https://api.crawlbase.com';

const SIGNUP_URL = 'https://crawlbase.com';
const DOCS_URL = 'https://crawlbase.com/docs/crawling-api/';

const tools: McpToolExport['tools'] = [
  {
    name: 'crawlbase_scrape',
    description:
      'Scrape any website through Crawlbase rotating residential proxies with server-side anti-bot bypass (Cloudflare, DataDome, hCaptcha solved for you). Returns the page as HTML (default), clean markdown (format:"md" — great for LLM context), or a JSON envelope with metadata (format:"json"). JavaScript-heavy pages (SPAs) render when you pass your Crawlbase JavaScript token as _apiKey; the Normal token does fast static fetches. Example: crawlbase_scrape({ url: "https://example.com", format: "md", _apiKey: "your-crawlbase-token" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The absolute URL to scrape including scheme, e.g. "https://example.com/page"',
        },
        javascript: {
          type: 'boolean',
          description:
            'Set true when the page needs JavaScript rendering (SPAs, lazy-loaded feeds). Crawlbase selects rendering by TOKEN TYPE, so when this is true you must pass your Crawlbase JavaScript token as _apiKey (the Normal token returns the static HTML shell). Default false.',
        },
        country: {
          type: 'string',
          description: 'Two-letter ISO country code to route the crawl through, e.g. "US", "GB", "DE", "JP". Default: automatic geo selection.',
        },
        format: {
          type: 'string',
          description: 'Response shape: "html" (default, raw page), "md" (GitHub-flavored markdown, LLM-friendly), or "json" (page + metadata in one JSON envelope).',
        },
        device: {
          type: 'string',
          description: 'Device profile to emulate: "desktop" (default), "tablet", or "mobile".',
        },
        page_wait: {
          type: 'number',
          description: 'Milliseconds to wait after page load before capturing (JavaScript token required). Useful for content that animates in.',
        },
        ajax_wait: {
          type: 'boolean',
          description: 'Wait until the network is idle before capturing (JavaScript token required). Best for SPAs that fetch data after mount.',
        },
        _apiKey: {
          type: 'string',
          description:
            'Your Crawlbase token — Normal token for static pages, JavaScript token for rendered pages. Free tier (10,000 requests) at https://crawlbase.com',
        },
      },
      required: ['url', '_apiKey'],
    },
  },
  {
    name: 'crawlbase_screenshot',
    description:
      'Capture a screenshot of a rendered web page via Crawlbase (headless browser + rotating proxies, anti-bot bypass). Returns a stored screenshot_url (JPEG, link expires after about one hour) plus crawl metadata. Requires your Crawlbase JavaScript token as _apiKey — screenshots always render in a real browser. Captures the full page by default; pass mode:"viewport" with width/height to constrain. Example: crawlbase_screenshot({ url: "https://example.com", _apiKey: "your-js-token" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The absolute URL of the page to screenshot, e.g. "https://example.com"',
        },
        mode: {
          type: 'string',
          description: 'Capture mode: full rendered page by default; "viewport" captures only the visible area (pair with width/height).',
        },
        width: {
          type: 'number',
          description: 'Viewport width in pixels (only applies with mode:"viewport").',
        },
        height: {
          type: 'number',
          description: 'Viewport height in pixels (only applies with mode:"viewport").',
        },
        country: {
          type: 'string',
          description: 'Two-letter ISO country code to route through, e.g. "US", "GB".',
        },
        page_wait: {
          type: 'number',
          description: 'Milliseconds to wait after page load before capturing — gives animations/JS time to settle.',
        },
        scroll: {
          type: 'boolean',
          description: 'Scroll the page before capture to trigger lazy-loaded content.',
        },
        _apiKey: {
          type: 'string',
          description: 'Your Crawlbase JavaScript token (screenshots require browser rendering). Free tier at https://crawlbase.com',
        },
      },
      required: ['url', '_apiKey'],
    },
  },
  {
    name: 'crawlbase_structured',
    description:
      'Scrape a page into clean structured JSON using a named Crawlbase scraper — skip HTML parsing entirely. Common scraper names: "amazon-product-details", "amazon-serp", "google-serp", "facebook-page", "facebook-profile", "instagram-profile", "instagram-post", "linkedin-profile", "linkedin-company", "tiktok-profile", "ebay-product", "walmart-product-details", "github-repository", "generic-extractor". Full catalog: https://crawlbase.com/docs/scrapers/ — social-media scrapers (Facebook/Instagram/LinkedIn) work best with your JavaScript token. Example: crawlbase_structured({ url: "https://www.amazon.com/dp/1098145356", scraper: "amazon-product-details", _apiKey: "your-crawlbase-token" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The absolute URL of the page to scrape, e.g. "https://www.google.com/search?q=coffee" for google-serp.',
        },
        scraper: {
          type: 'string',
          description: 'The Crawlbase scraper name to apply, e.g. "amazon-product-details", "google-serp", "linkedin-profile". Catalog: https://crawlbase.com/docs/scrapers/',
        },
        country: {
          type: 'string',
          description: 'Two-letter ISO country code to route through, e.g. "US", "DE". Matters for localized storefronts and SERPs.',
        },
        _apiKey: {
          type: 'string',
          description: 'Your Crawlbase token (JavaScript token recommended for social-media scrapers). Free tier at https://crawlbase.com',
        },
      },
      required: ['url', 'scraper', '_apiKey'],
    },
  },
];

// Defensive access — return undefined instead of throwing on missing keys.
function pick<T = unknown>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[key] as T;
  }
  return undefined;
}

// Turn a Crawlbase HTTP error into an actionable message. Error bodies are
// JSON {"pc_status": N, "error": "..."} when format=json, plain text otherwise.
function crawlbaseError(status: number, tool: string, detail?: string): Error {
  const tail = detail ? ` — ${detail}` : '';
  if (status === 401 || status === 403) {
    return new Error(
      `Crawlbase ${tool}: invalid Crawlbase token (HTTP ${status}) — pass your token via _apiKey (free tier with 10,000 requests at ${SIGNUP_URL}). Remember Crawlbase issues two tokens: Normal (static fetches) and JavaScript (browser rendering / screenshots).${tail}`,
    );
  }
  if (status === 429) {
    return new Error(
      `Crawlbase ${tool}: rate-limited (HTTP 429) — you've hit your plan's concurrency or request limit. Slow down or upgrade at ${SIGNUP_URL}.${tail}`,
    );
  }
  return new Error(`Crawlbase ${tool} error: HTTP ${status}${tail}. Docs: ${DOCS_URL}`);
}

// Pull an error message out of a non-2xx body, best-effort.
async function readErrorDetail(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    if (!text) return undefined;
    try {
      const j = JSON.parse(text) as { error?: unknown; message?: unknown };
      const d = j.error ?? j.message;
      if (typeof d === 'string') return d;
      if (d != null) return JSON.stringify(d);
    } catch {
      // plain-text error body — return a trimmed snippet
      return text.slice(0, 300);
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function doFetch(params: URLSearchParams, tool: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/?${params.toString()}`);
  } catch (err) {
    throw new Error(
      `Crawlbase ${tool}: network error reaching api.crawlbase.com — ${(err as Error).message}`,
    );
  }
  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw crawlbaseError(res.status, tool, detail);
  }
  return res;
}

// Crawl metadata comes back as response headers (html/md formats) — surface it.
function metaFromHeaders(res: Response): {
  pc_status: number | undefined;
  original_status: number | undefined;
  final_url: string | undefined;
} {
  const num = (v: string | null) => {
    const n = v == null ? NaN : Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    pc_status: num(res.headers.get('pc_status')),
    original_status: num(res.headers.get('original_status')),
    final_url: res.headers.get('url') ?? undefined,
  };
}

async function scrape(args: Record<string, unknown>, apiKey: string) {
  const url = args.url as string | undefined;
  if (!url) {
    throw new Error('crawlbase_scrape requires a `url` (absolute, e.g. "https://example.com").');
  }

  const params = new URLSearchParams({ token: apiKey, url });
  const format = typeof args.format === 'string' && args.format ? args.format : 'html';
  if (format !== 'html') params.set('format', format);
  if (args.country) params.set('country', String(args.country));
  if (args.device) params.set('device', String(args.device));
  // JS-token-only params — Crawlbase selects rendering by token type, so these
  // only take effect when the user's _apiKey is their JavaScript token.
  if (args.page_wait !== undefined) params.set('page_wait', String(args.page_wait));
  if (args.ajax_wait === true) params.set('ajax_wait', 'true');
  // `javascript` is advisory: rendering happens when _apiKey is the JavaScript
  // token. There is no query param for it — nothing to send.

  const res = await doFetch(params, 'crawlbase_scrape');
  const text = await res.text();

  if (format === 'json') {
    // JSON envelope: { pc_status, original_status, url, body, ... }
    try {
      const envelope = JSON.parse(text) as Record<string, unknown>;
      const body = pick<string>(envelope, 'body');
      return {
        url,
        format,
        pc_status: pick<number>(envelope, 'pc_status'),
        original_status: pick<number>(envelope, 'original_status'),
        final_url: pick<string>(envelope, 'url') ?? url,
        content: body,
        length: typeof body === 'string' ? body.length : undefined,
        raw: envelope,
      };
    } catch {
      // Unexpected non-JSON body despite format=json — surface it rather than throwing.
      return { url, format, content: text, length: text.length, raw: text };
    }
  }

  // html / md: body is the page content; crawl metadata rides in response headers.
  const meta = metaFromHeaders(res);
  return {
    url,
    format,
    pc_status: meta.pc_status,
    original_status: meta.original_status,
    final_url: meta.final_url ?? url,
    content: text,
    length: text.length,
    raw: text,
  };
}

async function screenshot(args: Record<string, unknown>, apiKey: string) {
  const url = args.url as string | undefined;
  if (!url) {
    throw new Error('crawlbase_screenshot requires a `url` (absolute, e.g. "https://example.com").');
  }

  // Crawling API screenshot mode: screenshot=true + format=json returns a JSON
  // envelope containing screenshot_url (stored JPEG, expires ~1 hour). This is
  // the current documented path — the standalone /screenshots endpoint is
  // legacy (closed to new sign-ups since Nov 2024) and returns raw image bytes.
  const params = new URLSearchParams({ token: apiKey, url, screenshot: 'true', format: 'json' });
  if (args.mode) params.set('mode', String(args.mode));
  if (args.width !== undefined) params.set('width', String(args.width));
  if (args.height !== undefined) params.set('height', String(args.height));
  if (args.country) params.set('country', String(args.country));
  if (args.page_wait !== undefined) params.set('page_wait', String(args.page_wait));
  if (args.scroll === true) params.set('scroll', 'true');

  const res = await doFetch(params, 'crawlbase_screenshot');
  const text = await res.text();

  let envelope: Record<string, unknown>;
  try {
    envelope = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      url,
      note: 'Crawlbase returned a non-JSON body for this screenshot request — returning it as raw text.',
      raw: text.slice(0, 2000),
    };
  }

  const screenshotUrl = pick<string>(envelope, 'screenshot_url');
  return {
    url,
    screenshot_url: screenshotUrl,
    expires: screenshotUrl
      ? 'The screenshot_url link expires after about one hour — download promptly.'
      : undefined,
    pc_status: pick<number>(envelope, 'pc_status'),
    original_status: pick<number>(envelope, 'original_status'),
    final_url: pick<string>(envelope, 'url') ?? url,
    raw: envelope,
  };
}

async function structured(args: Record<string, unknown>, apiKey: string) {
  const url = args.url as string | undefined;
  const scraper = args.scraper as string | undefined;
  if (!url) {
    throw new Error(
      'crawlbase_structured requires a `url` (absolute, e.g. "https://www.amazon.com/dp/1098145356").',
    );
  }
  if (!scraper) {
    throw new Error(
      'crawlbase_structured requires a `scraper` name, e.g. "amazon-product-details", "google-serp", "linkedin-profile". Catalog: https://crawlbase.com/docs/scrapers/',
    );
  }

  const params = new URLSearchParams({ token: apiKey, url, scraper });
  if (args.country) params.set('country', String(args.country));

  const res = await doFetch(params, 'crawlbase_structured');
  const text = await res.text();

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Crawlbase crawlbase_structured: expected JSON from scraper "${scraper}" but got a non-JSON response ` +
        `(first 200 chars: ${text.slice(0, 200)}). Check the scraper name against https://crawlbase.com/docs/scrapers/ and confirm the url matches the page type the scraper expects.`,
    );
  }

  // Scraper responses ride the JSON envelope: { pc_status, original_status, url, body: {...parsed fields} }
  return {
    url,
    scraper,
    pc_status: pick<number>(data, 'pc_status'),
    original_status: pick<number>(data, 'original_status'),
    data: pick<unknown>(data, 'body') ?? data,
    raw: data,
  };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  if (!apiKey) {
    throw new Error(
      `Crawlbase requires a token. Pass it via _apiKey — free tier with 10,000 requests (no card) at ${SIGNUP_URL}. Docs: ${DOCS_URL}`,
    );
  }

  switch (name) {
    case 'crawlbase_scrape':
      return scrape(args, apiKey);
    case 'crawlbase_screenshot':
      return screenshot(args, apiKey);
    case 'crawlbase_structured':
      return structured(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
