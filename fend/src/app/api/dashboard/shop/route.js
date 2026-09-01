"use server";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireDashboardAdmin } from "../auth";

const dataPath = path.join(process.cwd(), "data", "shop.json");

const DEFAULT_CONTENT = {
  hero: {
    title: "مجموعه محصولات را ببینید",
    description: "محصولات منتخب و کاربردی را برای سبک زندگی خود پیدا کنید.",
    backgroundImage:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    backgroundPosition: "center",
  },
  searchPlaceholder: "جست‌وجوی محصولات",
  ctaText: "شروع خرید",
  catalogTitle: "مرور محصولات",
  emptyMessage: "محصولی با جست‌وجوی شما پیدا نشد.",
  categoryLimit: 6,
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
    console.error("shop content read error", err);
    return DEFAULT_CONTENT;
  }
}

export async function GET() {
  return NextResponse.json(await readContent());
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
    await fs.writeFile(dataPath, JSON.stringify(body.content, null, 2), "utf8");
    return NextResponse.json({ ok: true, content: body.content });
  } catch (err) {
    console.error("shop content write error", err);
    return NextResponse.json({ error: "ذخیره‌سازی ناموفق بود" }, { status: 500 });
  }
}
