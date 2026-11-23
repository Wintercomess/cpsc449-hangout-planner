// src/services/wikivoyage.service.js
//
// Destination travel guides from Wikivoyage (https://en.wikivoyage.org).
// Uses the public MediaWiki Action API: no API key needed, but Wikimedia asks
// every client to send a descriptive User-Agent.

const API_URL = 'https://en.wikivoyage.org/w/api.php';
const USER_AGENT =
  'cpsc449-hangout-planner/0.1 (https://github.com/Wintercomess/cpsc449-hangout-planner)';
const TIMEOUT_MS = 10000;

// Wikivoyage listing templates, e.g. {{see | name=... | address=... }}
const LISTING_TYPES = ['see', 'do', 'buy', 'eat', 'drink', 'sleep'];
const DEFAULT_TYPES = ['see', 'do', 'eat', 'drink'];

// Small in-memory cache so repeated lookups don't hit Wikivoyage every time
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function callApi(params) {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params });

  const key = url.toString();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    throw httpError(502, `Could not reach Wikivoyage: ${cause.message}`);
  }

  if (!response.ok) {
    throw httpError(502, `Wikivoyage API error (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    throw httpError(502, `Wikivoyage API error: ${data.error.info || data.error.code}`);
  }

  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

function pageUrl(title) {
  return `https://en.wikivoyage.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

// Search results come back with <span class="searchmatch"> highlights
function stripHtml(text = '') {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Search Wikivoyage articles.
 * Returns [{ title, snippet, url }]
 */
async function searchGuides(query, limit = 5) {
  const data = await callApi({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '0',
    srlimit: String(limit),
  });

  return (data.query?.search || []).map((r) => ({
    title: r.title,
    snippet: stripHtml(r.snippet),
    url: pageUrl(r.title),
  }));
}

/**
 * Find the best article for a destination name.
 * Titles are case-sensitive ("los angeles" is not a page), so we use search
 * and skip disambiguation pages ("New York" -> "New York City").
 */
async function findDestinationPage(destination) {
  const data = await callApi({
    action: 'query',
    generator: 'search',
    gsrsearch: destination,
    gsrnamespace: '0',
    gsrlimit: '5',
    prop: 'extracts|pageprops|pageimages',
    exintro: '1',
    explaintext: '1',
    exlimit: '5',
    ppprop: 'disambiguation',
    piprop: 'thumbnail',
    pithumbsize: '640',
  });

  const pages = (data.query?.pages || [])
    .filter((p) => !p.pageprops || !('disambiguation' in p.pageprops))
    .sort((a, b) => a.index - b.index);

  if (pages.length === 0) return null;

  const wanted = destination.trim().toLowerCase();
  return pages.find((p) => p.title.toLowerCase() === wanted) || pages[0];
}

// ---------------------------------------------------------------------------
// Wikitext listing parser
// ---------------------------------------------------------------------------

// Starting at text[start] === '{{', return the index just past the matching '}}'
function findTemplateEnd(text, start) {
  let depth = 0;
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth++;
      i++;
    } else if (text[i] === '}' && text[i + 1] === '}') {
      depth--;
      i++;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

// Split "see | name=A | content=[[x|y]]" on top-level pipes only
function splitParams(body) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      current += two;
      i++;
    } else if ((two === '}}' || two === ']]') && depth > 0) {
      depth--;
      current += two;
      i++;
    } else if (body[i] === '|' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += body[i];
    }
  }
  parts.push(current);
  return parts;
}

// Turn wikitext markup into plain text
function cleanWikitext(text = '') {
  let out = text;
  // Remove nested templates (innermost first), e.g. {{IATA|LAX}}, {{Marker|...}}
  let prev;
  do {
    prev = out;
    out = out.replace(/\{\{[^{}]*\}\}/g, '');
  } while (out !== prev);

  return out
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, '')
    .replace(/\[\[([^|\]]*\|)?([^\]]*)\]\]/g, '$2') // [[Page|text]] -> text
    .replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2') // [http://x text] -> text
    .replace(/'{2,}/g, '') // '''bold''' / ''italic''
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extract structured places from {{see}}, {{do}}, {{eat}}, {{drink}},
 * {{buy}}, {{sleep}} and {{listing | type=...}} templates.
 */
function parseListings(wikitext, types) {
  const listings = Object.fromEntries(types.map((t) => [t, []]));
  const opener = /\{\{\s*(see|do|buy|eat|drink|sleep|listing)\s*[|}\n]/gi;

  let match;
  while ((match = opener.exec(wikitext)) !== null) {
    const start = match.index;
    const end = findTemplateEnd(wikitext, start);
    if (end === -1) break;
    opener.lastIndex = end;

    const [name, ...rawParams] = splitParams(wikitext.slice(start + 2, end - 2));
    const params = {};
    for (const p of rawParams) {
      const eq = p.indexOf('=');
      if (eq === -1) continue;
      params[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
    }

    let type = name.trim().toLowerCase();
    if (type === 'listing') type = (params.type || '').trim().toLowerCase();
    if (!listings[type]) continue;

    const placeName = cleanWikitext(params.name);
    if (!placeName) continue;

    listings[type].push({
      name: placeName,
      description: cleanWikitext(params.content) || null,
      address: cleanWikitext(params.address) || null,
      directions: cleanWikitext(params.directions) || null,
      hours: cleanWikitext(params.hours) || null,
      price: cleanWikitext(params.price) || null,
      phone: cleanWikitext(params.phone) || null,
      url: params.url && /^https?:\/\//.test(params.url) ? params.url : null,
      coordinates:
        toNumber(params.lat) !== null && toNumber(params.long) !== null
          ? { lat: toNumber(params.lat), lng: toNumber(params.long) }
          : null,
    });
  }

  return listings;
}

// Short text block for the Gemini itinerary prompt
function buildGuideSummary(title, summary, listings) {
  const intro = summary.length > 600 ? `${summary.slice(0, 600).trim()}...` : summary;
  const labels = { see: 'See', do: 'Do', buy: 'Shop', eat: 'Eat', drink: 'Drink', sleep: 'Stay' };

  const highlights = Object.entries(listings)
    .filter(([, places]) => places.length > 0)
    .map(([type, places]) => `${labels[type]}: ${places.map((p) => p.name).join(', ')}`);

  return [`Wikivoyage guide for ${title}: ${intro}`, ...highlights].join('\n');
}

function parseTypes(types) {
  if (!types) return DEFAULT_TYPES;
  const list = (Array.isArray(types) ? types : String(types).split(','))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const invalid = list.filter((t) => !LISTING_TYPES.includes(t));
  if (invalid.length > 0) {
    throw httpError(400, `Invalid type(s): ${invalid.join(', ')}. Use: ${LISTING_TYPES.join(', ')}`);
  }
  return list.length > 0 ? [...new Set(list)] : DEFAULT_TYPES;
}

/**
 * Get a destination guide: intro summary, image and top places by type.
 * Returns null if Wikivoyage has no article for the destination.
 *
 * @param {string} destination  e.g. "Fullerton", "new york"
 * @param {object} [options]
 * @param {string|string[]} [options.types]  listing types, default see,do,eat,drink
 * @param {number} [options.limit]  max places per type (default 5)
 */
async function getDestinationGuide(destination, { types, limit = 5 } = {}) {
  const wantedTypes = parseTypes(types);

  const page = await findDestinationPage(destination);
  if (!page) return null;

  const parsed = await callApi({ action: 'parse', pageid: String(page.pageid), prop: 'wikitext' });
  const wikitext = parsed.parse?.wikitext || '';

  const allListings = parseListings(wikitext, wantedTypes);
  const listings = Object.fromEntries(
    Object.entries(allListings).map(([type, places]) => [type, places.slice(0, limit)])
  );

  const summary = (page.extract || '').trim();

  return {
    title: page.title,
    url: pageUrl(page.title),
    summary,
    image: page.thumbnail?.source || null,
    listings,
    guideSummary: buildGuideSummary(page.title, summary, listings),
    source: 'Wikivoyage (CC BY-SA 4.0)',
  };
}

module.exports = {
  searchGuides,
  getDestinationGuide,
  LISTING_TYPES,
  // exported for testing
  parseListings,
  cleanWikitext,
};
