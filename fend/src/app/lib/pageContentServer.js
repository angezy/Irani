import { promises as fs } from "fs";
import path from "path";

export async function readPageContent(filename, fallback) {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", filename), "utf8");
    const content = JSON.parse(raw);
    return content && typeof content === "object" ? content : fallback;
  } catch (_error) {
    return fallback;
  }
}
