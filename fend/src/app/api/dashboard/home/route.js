"use server";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireDashboardAdmin } from "../auth";

const dataPath = path.join(process.cwd(), "data", "home.json");

const DEFAULT_CONTENT = {
  heroCards: [
    {
      title: "روش تمرین ترکیبی",
      subtitle: "قدرت انفجاری · ثبات مرکزی",
      image:
        "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "۹٪ تخفیف افتتاحیه",
      subtitle: "قیمت ویژه راه‌اندازی برای مدت محدود و برنامه‌های حرفه‌ای.",
      highlights: [
        "طراحی ارگونومیک برای هر حرکت",
        "ساخت بادوام برای باشگاه و خانه",
        "ارسال رایگان و مرجوعی آسان",
      ],
      cta: "مشاهده محصولات جدید",
    },
  ],
  trainingBlock: {
    image:
      "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=80",
    title: "هوشمندانه‌تر تمرین کنید؛ قوی‌تر دیده شوید؛ بهتر احساس کنید.",
    copy:
      "برای ورزشکارانی ساخته شده که بیشتر می‌خواهند. با تجهیزاتی که در هر جلسه همراه شماست، وضعیت بدن، تحرک و قدرت خود را بهتر کنید.",
    cta: "شروع تمرین",
  },
  bannerText: "تناسب‌اندام کاربردی · تجهیزات حرفه‌ای · برنامه‌های طراحی‌شده توسط مربی",
  productsSection: {
    announcement: "محصولات جدید هر دوشنبه می‌رسند · با خرید بسته‌ای بیشتر صرفه‌جویی کنید",
    title: "محصولات",
  },
  products: [
    {
      title: "دستهٔ تمرینی",
      price: 690000,
      currency: "IRT",
      image:
        "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "دسته‌های قدرتی",
      price: 540000,
      currency: "IRT",
      image:
        "https://images.unsplash.com/photo-1528372444006-1bfc81acab02?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "کیت بند تمرینی",
      price: 470000,
      currency: "IRT",
      image:
        "https://images.unsplash.com/photo-1527933053326-89d1746b76dc?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "کیت سطح دوم",
      price: 990000,
      currency: "IRT",
      image:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    },
  ],
  actionShots: [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1541537103745-ea3429c65dc1?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=600&q=80",
  ],
    welcome: {
    headline: "به فروشگاه ما خوش آمدید",
    title: "همراه شما برای پیشرفت.",
    copy: "برنامه، تجهیزات و آموزش برای ادامه مسیر شما؛ آزموده‌شده در تمرین و تأییدشده توسط ورزشکاران.",
    cta: "همین حالا شروع کنید",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
  reviews: {
    headline: "+۱۰۰ دیدگاه از ورزشکاران راضی",
    ratingText: "میانگین امتیاز ۴٫۹ از ۵",
  },
  features: [
    { title: "ارسال سریع", copy: "تحویل سفارش‌ها در سراسر کشور." },
    { title: "پرداخت امن", copy: "تسویه‌حساب رمزگذاری‌شده برای آسودگی خاطر." },
    { title: "ضمانت مطمئن", copy: "پوشش مناسب برای هر روز تمرین جدی." },
    { title: "پشتیبانی تخصصی", copy: "کارشناسان آماده راهنمایی برنامه شما هستند." },
  ],
  menus: {
    main: ["خانه", "فروشگاه", "برنامه‌ها", "پشتیبانی"],
    footerTitle: "همراه ما بمانید",
  },
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
    console.error("home content read error", err);
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
    console.error("home content write error", err);
    return NextResponse.json({ error: "ذخیره‌سازی ناموفق بود" }, { status: 500 });
  }
}
