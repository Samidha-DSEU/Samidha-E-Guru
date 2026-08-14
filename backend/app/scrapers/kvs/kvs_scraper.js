import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as cheerio from "cheerio";

const LIVE_URL = "https://kvsangathan.nic.in/en/knowledge-hub/";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOCAL_HTML = path.join(
  HERE,
  "..",
  "https___kvsangathan.nic.in_en_knowledge-hub_.html"
);
const OUTPUT_PATH = path.join(HERE, "output.json");

// Table column index -> { group label, default classes for that column }.
const COLUMN_CLASS_MAP = {
  2: { group: "General", classes: [] }, // "Document/YouTube Link"
  3: { group: "IX/X", classes: ["9", "10"] }, // "IX/X Class Document"
  4: { group: "XI/XII", classes: ["11", "12"] }, // "XI/XII Class Document"
};

async function loadHtml(source) {
  if (source == null || source === "--url" || source === "--live") {
    if (source == null && existsSync(DEFAULT_LOCAL_HTML)) {
      return { html: await readFile(DEFAULT_LOCAL_HTML, "utf-8"), sourceUrl: LIVE_URL };
    }
    return { html: await fetchUrl(LIVE_URL), sourceUrl: LIVE_URL };
  }
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return { html: await fetchUrl(source), sourceUrl: source };
  }
  return { html: await readFile(source, "utf-8"), sourceUrl: LIVE_URL };
}

async function fetchUrl(url) {
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KVSSupportMaterialScraper/1.0)" },
  });
  if (!resp.ok) throw new Error(`Fetch failed ${resp.status} for ${url}`);
  return await resp.text();
}

function detectLanguage(title) {
  const t = title.toLowerCase();
  if (t.includes("sanskrit")) return "Sanskrit";
  if (t.includes("hindi")) return "Hindi";
  if (t.includes("english") || t.includes("(eng") || t.includes("eng)")) return "English";
  return null;
}

function detectClassesFromTitle(title) {
  return [...title.matchAll(/class\s*(\d{1,2})/gi)].map((m) => m[1]);
}

function cleanSubject(title) {
  let s = title;
  s = s.replace(/class\s*\d{1,2}/gi, ""); // "Class 11"
  s = s.replace(/\(\s*(english|eng|hindi|sanskrit)\s*\)?/gi, "");
  s = s.replace(/\b(english|hindi|sanskrit|eng)\b/gi, "");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/^[\s\-–—()]+|[\s\-–—()]+$/g, "");
  if (s.trim()) return s.trim();
  // Title was purely "Class N <Language>" -> the language is the subject/book.
  return detectLanguage(title) || title.trim();
}

function detectResourceType(url) {
  const u = url.toLowerCase();
  if (u.endsWith(".pdf") || u.includes(".pdf")) return "pdf";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("drive.google.com")) return "google_drive";
  if (u.includes("fliphtml5") || u.includes("flipbook")) return "flipbook";
  return "web";
}

function parse(html, sourceUrl) {
  const $ = cheerio.load(html);

  let table = $("table.data-table-1").first();
  if (table.length === 0) table = $("table").first();
  if (table.length === 0) throw new Error("No data table found on the page.");

  const materials = [];
  const body = table.find("tbody").length ? table.find("tbody") : table;

  body.find("tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 5) return; // skip header / malformed rows

    const slNoText = $(cells[0]).text().trim();
    const title = $(cells[1]).text().replace(/\s{2,}/g, " ").trim();
    if (!title) return;

    // Find which of the three link columns actually holds the document link.
    let url = null;
    let group = null;
    let defaultClasses = [];
    for (const idx of [2, 3, 4]) {
      const href = $(cells[idx]).find("a[href]").first().attr("href");
      if (href) {
        url = href.trim();
        ({ group, classes: defaultClasses } = COLUMN_CLASS_MAP[idx]);
        break;
      }
    }

    const titleClasses = detectClassesFromTitle(title);
    const classes = titleClasses.length ? titleClasses : defaultClasses;

    materials.push({
      sl_no: /^\d+$/.test(slNoText) ? Number(slNoText) : slNoText,
      title,
      subject: cleanSubject(title),
      classes,
      class_group: group,
      language: detectLanguage(title) ?? "English", // default to English when not detectable
      resource_type: url ? detectResourceType(url) : null,
      url,
    });
  });

  return {
    source_url: sourceUrl,
    scraped_at: new Date().toISOString(),
    count: materials.length,
    materials,
  };
}

async function main() {
  const source = process.argv[2] ?? null;
  const isStdout = process.argv.includes('--stdout');
  const { html, sourceUrl } = await loadHtml(source);
  const data = parse(html, sourceUrl);
  
  if (isStdout) {
    // Only print JSON to stdout for python to parse
    console.log(JSON.stringify(data.materials));
  } else {
    await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`Wrote ${data.count} records to ${OUTPUT_PATH}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
