import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { existsSync }                              from "node:fs";
import { fileURLToPath }                           from "node:url";
import path                                        from "node:path";
import * as cheerio                                from "cheerio";

// ─── Paths ────────────────────────────────────────────────────────────────────

const HERE        = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(HERE, "output.json");
const FAILED_PATH = path.join(HERE, "failed_urls.txt");

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL     = "https://ncert.nic.in";
const LIVE_URL     = `${BASE_URL}/textbook.php`;

/** Class codes 01–12 used in POST bodies */
const CLASS_CODES = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; NCERTScraper/1.0)",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
  "Referer": LIVE_URL,
};

const MAX_RETRIES      = 4;
const RETRY_BACKOFF_MS = 2_000;   // doubles each attempt
const TIMEOUT_MS       = 30_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function absUrl(href) {
  if (!href) return null;
  return href.startsWith("http") ? href : new URL(href, BASE_URL).toString();
}

async function recordFailed(entry) {
  await appendFile(FAILED_PATH, entry.trim() + "\n", "utf8").catch(() => {});
}

// ─── Fetch with retry ─────────────────────────────────────────────────────────

async function fetchWithRetry(url, init = {}, retries = MAX_RETRIES) {
  let delay = RETRY_BACKOFF_MS;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        ...init,
        headers : { ...HEADERS, ...(init.headers ?? {}) },
        signal  : controller.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (err) {
      clearTimeout(timer);
      console.warn(`  [warn] ${url} — attempt ${attempt}/${retries}: ${err.message}`);
      if (attempt < retries) { await sleep(delay); delay *= 2; }
    }
  }

  console.error(`  [fail] permanent failure: ${url}`);
  await recordFailed(url);
  return null;
}

async function fetchGet(url, params = {}) {
  const qs      = new URLSearchParams(params).toString();
  const fullUrl = qs ? `${url}?${qs}` : url;
  return fetchWithRetry(fullUrl, { method: "GET" });
}

async function fetchPost(url, data = {}) {
  return fetchWithRetry(url, {
    method  : "POST",
    headers : { "Content-Type": "application/x-www-form-urlencoded" },
    body    : new URLSearchParams(data).toString(),
  });
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Extract <option> values from a named <select>.
 * Returns [{ value, text }, …] — skips placeholder options.
 */
function parseOptions(html, selectName) {
  const $ = cheerio.load(html);
  const select =
    $(`select[name="${selectName}"]`).first() ||
    $(`select#${selectName}`).first();

  const opts = [];
  select.find("option").each((_, el) => {
    const value = $(el).attr("value")?.trim() ?? "";
    const text  = $(el).text().trim();
    if (value && !["0", "select", ""].includes(value.toLowerCase())) {
      opts.push({ value, text });
    }
  });
  return opts;
}

/** Detect language from text / book-code suffix. */
function detectLanguage(text, bookCode = "") {
  if (/\bHindi\b/i.test(text))    return "Hindi";
  if (/\bUrdu\b/i.test(text))     return "Urdu";
  if (/\bSanskrit\b/i.test(text)) return "Sanskrit";
  // NCERT book-code suffix convention: h=Hindi, u=Urdu, s=Sanskrit
  const c = bookCode.toLowerCase();
  if (c.endsWith("h")) return "Hindi";
  if (c.endsWith("u")) return "Urdu";
  if (c.endsWith("s")) return "Sanskrit";
  return "English";
}

/** Detect resource type from URL. */
function detectResourceType(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be"))    return "youtube";
  if (u.includes("drive.google.com"))                          return "google_drive";
  if (u.includes("fliphtml5") || u.includes("flipbook"))       return "flipbook";
  if (u.endsWith(".pdf") || u.includes(".pdf"))                return "pdf";
  return "web";
}

/**
 * Parse chapter number from link text or filename.
 * e.g. "Chapter 3 – Metals" → 3 | "jesc103.pdf" → 3
 */
function parseChapterNo(text, href, fallback) {
  let m = text.match(/(?:chapter|ch\.?)\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  m = text.trim().match(/^(\d+)[\.\s\-]/);
  if (m) return parseInt(m[1], 10);
  const stem = path.basename((href ?? "").split("?")[0], ".pdf");
  m = stem.match(/(\d{2})$/);
  if (m) return parseInt(m[1], 10);
  return fallback;
}

/** Strip "Chapter N –" prefix from chapter name. */
function cleanChapterName(text) {
  text = text.replace(/^(?:chapter|ch\.?)\s*\d+\s*[–\-:.]\s*/i, "");
  text = text.replace(/^\d+\s*[.\-–]\s*/, "");
  return text.trim() || "Untitled Chapter";
}

/**
 * Extract all chapter-level PDF links from the book page.
 * Excludes "download entire book" links.
 */
function extractChapters(html) {
  const $        = cheerio.load(html);
  const chapters = [];
  const seen     = new Set();
  let   counter  = 0;

  $("a[href]").each((_, el) => {
    const href    = $(el).attr("href")?.trim() ?? "";
    const rawText = $(el).text().replace(/\s+/g, " ").trim();

    if (!href.toLowerCase().endsWith(".pdf") && !/\/textbook\//i.test(href)) return;
    if (/entire|full book|complete book|whole book/i.test(rawText))           return;

    const full = absUrl(href);
    if (!full || seen.has(full)) return;
    seen.add(full);

    counter++;
    chapters.push({
      chapter_no  : String(parseChapterNo(rawText, href, counter)),
      chapter_name: cleanChapterName(rawText),
      pdf_url     : full,
    });
  });

  return chapters;
}

/** Extract the "download entire book" PDF URL from the page. */
function extractBookPdf(html) {
  const $ = cheerio.load(html);
  let url = null;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() ?? "";
    const text = $(el).text().toLowerCase();
    if (href.toLowerCase().endsWith(".pdf") &&
        /entire|full book|complete|whole/i.test(text)) {
      url = absUrl(href);
      return false; // break
    }
  });
  return url;
}

/** Extract first heading as book name. */
function extractBookName(html) {
  const $ = cheerio.load(html);
  for (const tag of ["h1", "h2", "h3"]) {
    const text = $(tag).first().text().trim();
    if (text) return text;
  }
  return "";
}

// ─── Portal interaction ───────────────────────────────────────────────────────

const fetchClassPage   = (classCode)                      => fetchGet(LIVE_URL, { tclass: classCode });
const fetchSubjectPage = (classCode, subjectCode)         => fetchPost(LIVE_URL, { tclass: classCode, subject: subjectCode });
const fetchBookPage    = (classCode, subjectCode, bookCode) => fetchPost(LIVE_URL, { tclass: classCode, subject: subjectCode, book: bookCode });

// ─── Scraping ─────────────────────────────────────────────────────────────────

async function scrapeBook(classCode, subjVal, subjText, bookVal, bookText) {
  const html = await fetchBookPage(classCode, subjVal, bookVal);
  if (!html) return null;

  const bookName = extractBookName(html) || bookText;
  const bookPdf  = extractBookPdf(html);
  const chapters = extractChapters(html);
  const language = detectLanguage(bookName + " " + subjText, bookVal);
  if (!["English", "Hindi"].includes(language)) {
    console.log(`    ✗ Skipping ${bookVal} (${language}) — only English & Hindi allowed.`);
    return null;
  }

  return {
    class        : String(parseInt(classCode, 10)),  // "01" → "1"
    subject      : subjText,
    language,
    book_name    : bookName,
    book_code    : bookVal,
    pdf_url      : bookPdf,
    resource_type: bookPdf ? detectResourceType(bookPdf) : "pdf",
    chapters,
  };
}

async function scrapeClass(classCode) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Class ${parseInt(classCode, 10)}`);
  console.log(`${"─".repeat(50)}`);

  const classHtml = await fetchClassPage(classCode);
  if (!classHtml) return [];

  const subjects = parseOptions(classHtml, "subject");
  if (!subjects.length) {
    console.warn(`  [warn] no subjects found for class ${classCode}`);
    return [];
  }
  console.log(`  Subjects: ${subjects.map((s) => s.text).join(", ")}`);

  const records = [];

  for (const subj of subjects) {
    const subjHtml = await fetchSubjectPage(classCode, subj.value);
    if (!subjHtml) continue;

    const books = parseOptions(subjHtml, "book");
    if (!books.length) continue;

    console.log(`\n  [${subj.text}]  ${books.length} book(s)`);

    for (const book of books) {
      const record = await scrapeBook(
        classCode, subj.value, subj.text, book.value, book.text
      );
      if (record) records.push(record);
      await sleep(400);          // polite delay between books
    }
    await sleep(600);            // polite delay between subjects
  }

  return records;
}

// ─── Deduplication ───────────────────────────────────────────────────────────

function deduplicate(records) {
  const seen = new Map();
  for (const rec of records) {
    const key = `${rec.class}::${rec.book_code}`;
    if (!seen.has(key) || rec.chapters.length > seen.get(key).chapters.length) {
      seen.set(key, rec);
    }
  }
  return [...seen.values()];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(HERE, { recursive: true });

  console.log("NCERT Textbook Scraper");
  console.log(`Source : ${LIVE_URL}`);
  console.log(`Output : ${OUTPUT_PATH}\n`);

  const start    = Date.now();
  let   materials = [];

  // Scrape classes sequentially (respectful of government server)
  for (const code of CLASS_CODES) {
    const records = await scrapeClass(code);
    materials.push(...records);
  }

  // Deduplicate & sort
  materials = deduplicate(materials);
  materials.sort((a, b) => {
    const cd = +a.class - +b.class;
    if (cd) return cd;
    const sd = a.subject.localeCompare(b.subject);
    if (sd) return sd;
    return a.language.localeCompare(b.language);
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // Build output matching the reference structure
  const output = {
    source_url : LIVE_URL,
    scraped_at : new Date().toISOString(),
    count      : materials.length,
    materials,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

  // Summary
  const totalChapters = materials.reduce((s, r) => s + r.chapters.length, 0);
  const classes       = [...new Set(materials.map((r) => r.class))].sort((a, b) => +a - +b);
  const langs         = [...new Set(materials.map((r) => r.language))].sort();

  console.log(`\n${"═".repeat(50)}`);
  console.log("  NCERT Scraper — Done");
  console.log(`${"═".repeat(50)}`);
  console.log(`  Books      : ${materials.length}`);
  console.log(`  Chapters   : ${totalChapters}`);
  console.log(`  Classes    : ${classes.join(", ")}`);
  console.log(`  Languages  : ${langs.join(", ")}`);
  console.log(`  Time       : ${elapsed}s`);
  console.log(`  Output     : ${OUTPUT_PATH}`);
  console.log(`${"═".repeat(50)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
