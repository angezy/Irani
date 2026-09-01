"use server";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireDashboardAdmin } from "../auth";

const dataPath = path.join(process.cwd(), "data", "about.json");

const DEFAULT_CONTENT = {
  hero: {
    title: "درباره ما",
    subtitle: "تجربه‌های دیجیتالی می‌سازیم که برندها را به مردم نزدیک می‌کند.",
    ctaText: "ارتباط با ما",
    ctaUrl: "/contact",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    alt: "همکاری اعضای تیم",
  },
  mission: "با فناوری ساده و کاربردی به کسب‌وکارها توان بیشتری می‌دهیم. تمرکز ما حل مسئله‌های واقعی با راهکارهای دقیق و زیباست.",
  values: "صداقت، مهارت و همکاری راهنمای همه کارهای ماست.",
  team: [
    {
      name: "Nick Farahmand",
      role: "مدیرعامل و بنیان‌گذار",
      img: "/images/team-nick.jpg",
      bio: "با علاقه تیم‌ها و محصولاتی ماندگار می‌سازد.",
    },
    {
      name: "Parmis Nik Khah",
      role: "مدیر فنی",
      img: "/images/team-parmis.jpg",
      bio: "متخصص سیستم‌ها که از تبدیل مسئله‌های پیچیده به فرایندهای ساده لذت می‌برد.",
    },
  ],
  story: [
    "این پروژه را با یک باور ساده شروع کردیم: خرید آنلاین باید قابل اعتماد، آسان و انسانی باشد.",
    "رویکرد ما روشن است: کوچک شروع می‌کنیم، سریع یاد می‌گیریم و نیازهای مهم مشتریان را در اولویت می‌گذاریم.",
    "به‌عنوان تیمی کوچک، برای شفافیت و خدمت‌رسانی شخصی ارزش قائلیم. بازخورد شما برای ما مهم است.",
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
    console.error("about content read error", err);
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
    await writeContent(body.content);
    return NextResponse.json({ ok: true, content: body.content });
  } catch (err) {
    console.error("about content write error", err);
    return NextResponse.json({ error: "ذخیره‌سازی ناموفق بود" }, { status: 500 });
  }
}
