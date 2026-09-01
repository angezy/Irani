const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const defaultPath = path.resolve(__dirname, "../../fend/data/ai-knowledge.json");
const dataPath = String(process.env.AI_KNOWLEDGE_PATH || defaultPath).trim() || defaultPath;
const KNOWLEDGE_CATEGORIES = new Set(["faq", "policy", "product_guidance"]);

function cleanText(value, max = 6000) {
  return String(value || "").trim().replace(/\r\n/g, "\n").slice(0, max);
}

function cleanKeywords(value) {
  const input = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(input.map((item) => cleanText(item, 80).toLowerCase()).filter(Boolean))].slice(0, 20);
}

function makeId(value, index) {
  const base = cleanText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (base || `knowledge-${index + 1}`).slice(0, 96);
}

function normalizeAIKnowledge(value) {
  const source = value && typeof value === "object" ? value : {};
  const seenIds = new Set();
  const entries = (Array.isArray(source.entries) ? source.entries : [])
    .slice(0, 150)
    .map((entry, index) => {
      const category = KNOWLEDGE_CATEGORIES.has(entry?.category) ? entry.category : "faq";
      const title = cleanText(entry?.title, 200);
      const content = cleanText(entry?.content, 6000);
      let id = cleanText(entry?.id, 100).replace(/[^a-zA-Z0-9_-]/g, "") || makeId(title, index);
      while (seenIds.has(id)) id = `${id.slice(0, 90)}-${index + 1}`;
      seenIds.add(id);
      return { id, category, title, content, keywords: cleanKeywords(entry?.keywords), enabled: entry?.enabled !== false };
    })
    .filter((entry) => entry.title && entry.content);

  return {
    greeting: cleanText(source.greeting, 1000),
    entries,
  };
}

function defaultKnowledge() {
  try {
    return JSON.parse(fs.readFileSync(defaultPath, "utf8"));
  } catch (_error) {
    return { greeting: "سلام؛ چطور می‌توانم کمک کنم؟", entries: [] };
  }
}

async function readAIKnowledge() {
  try {
    return normalizeAIKnowledge(JSON.parse(await fsp.readFile(dataPath, "utf8")));
  } catch (error) {
    console.error("AI knowledge read error", error);
    return normalizeAIKnowledge(defaultKnowledge());
  }
}

async function writeAIKnowledge(value) {
  const normalized = normalizeAIKnowledge(value);
  await fsp.mkdir(path.dirname(dataPath), { recursive: true });
  await fsp.writeFile(dataPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

module.exports = { normalizeAIKnowledge, readAIKnowledge, writeAIKnowledge };
