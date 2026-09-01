"use server";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireDashboardAdmin } from "../auth";
import { sanitizeBlogContent } from "../../../lib/contentSanitizer";

const dataPath = path.join(process.cwd(), "data", "blog.json");

const DEFAULT_CONTENT = {
  hero: {
    title: "تندرستی هوشمند از اینجا آغاز می‌شود.",
    subtitle: "داستان‌ها، نکته‌ها و تجربه‌های تمرینی از مربیان و ورزشکاران.",
    ctaText: "تازه‌ترین مطالب",
    ctaUrl: "/blog",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    alt: "ورزشکار با تجهیزات تمرینی هوشمند",
  },
  posts: [
    {
      id: "post-1",
      title: "طراحی ارگونومیک برای هر حرکت",
      excerpt: "بیومکانیک محصول جدید را بررسی کرده‌ایم؛ ببینید چگونه شما را باثبات و نیرومند نگه می‌دارد.",
      author: "مربی الکس",
      date: "2024-12-01",
      image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
      alt: "نمای نزدیک تجهیزات تمرینی",
      tags: ["تجهیزات", "طراحی"],
      slug: "/blog/ergonomic-design",
    },
    {
      id: "post-2",
      title: "ریکاوری هوشمندتر؛ حرکاتی ماندگار",
      excerpt: "یک برنامه ۱۰ دقیقه‌ای ریکاوری بین جلسه‌های تمرین؛ و اینکه چرا استمرار از شدت مهم‌تر است.",
      author: "دکتر لی",
      date: "2024-11-18",
      image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80",
      alt: "ورزشکار در حال کشش",
      tags: ["ریکاوری", "تحرک"],
      slug: "/blog/smarter-recovery",
    },
    {
      id: "post-3",
      title: "برنامه‌های مربی‌ساخته برای هفته‌های شلوغ",
      excerpt: "چطور در تقویم شلوغ، جلسه‌های کوتاه را برای پیشرفت واقعی کنار هم بچینیم.",
      author: "مربی نینا",
      date: "2024-11-05",
      image: "https://images.unsplash.com/photo-1541537103745-ea3429c65dc1?auto=format&fit=crop&w=800&q=80",
      alt: "یادداشت‌های برنامه تمرینی",
      tags: ["برنامه‌ریزی", "مربی‌گری"],
      slug: "/blog/coach-built-plans",
    },
  ],
};

async function ensureFile() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify(DEFAULT_CONTENT, null, 2), "utf8");
  }
}

async function readContent() {
  try {
    await ensureFile();
    const raw = await fs.readFile(dataPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("blog content read error", err);
    return DEFAULT_CONTENT;
  }
}

async function writeContent(content) {
  await fs.writeFile(dataPath, JSON.stringify(content, null, 2), "utf8");
}

export async function GET() {
  const content = await readContent();
  return NextResponse.json(content);
}

export async function POST(req) {
  const authError = await requireDashboardAdmin("content.manage");
  if (authError) return authError;
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !body.content) {
      return NextResponse.json({ error: "محتوا وارد نشده است" }, { status: 400 });
    }
    await ensureFile();
    const content = sanitizeBlogContent(body.content);
    await writeContent(content);
    return NextResponse.json({ ok: true, content });
  } catch (err) {
    console.error("blog content write error", err);
    return NextResponse.json({ error: "ذخیره‌سازی ناموفق بود" }, { status: 500 });
  }
}
