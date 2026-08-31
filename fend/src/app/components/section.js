"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EditIcon from "@mui/icons-material/Edit";
import Link from "next/link";
import ResumeShoppingSection from "./ResumeShoppingSection";
import CustomerReviewsSection from "./CustomerReviewsSection";
import { ProductGridSkeleton } from "./LoadingSkeletons";
import defaultContent from "../../../data/home.json";
import { formatMoney } from "../lib/locale";

const API_BASE_URL = "";

// Normalize various image shapes to a usable URL (supports DB /uploads paths)
function resolveImage(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/uploads/")) return `${API_BASE_URL}${trimmed}`;
    return trimmed;
  }
  if (typeof value === "object") {
    const candidate = value.url || value.uri || value.src || value.image || value.imageUrl || value.img || value.Img || value.path;
    return resolveImage(candidate);
  }
  return "";
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productHref(product, title) {
  const explicitSlug = product.slug || product.Slug || product.handle || product.Handle;
  const normalizedSlug = String(explicitSlug || "")
    .replace(/^\/product\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
  return `/product/${encodeURIComponent(slugify(normalizedSlug || title))}`;
}

const LEGACY_FALLBACK = {
  heroCards: [
    {
      title: "Nova One Smart Bottle",
      subtitle: "Keeps water cold for 24 hours, tracks your intake automatically.",
      image:
        "https://images.unsplash.com/photo-1526402462921-3c62b6d1f1ab?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "بسته شروع؛ ۲۰٪ تخفیف",
      subtitle: "یک بطری، دو فیلتر و کاور مسافرتی در بسته.",
      highlights: [
        "حفظ سرما تا ۲۴ ساعت و گرما تا ۱۲ ساعت",
        "درپوش ضدنشت با نوشیدن یک‌دستی",
        "یادآوری نوشیدن آب در اپلیکیشن همراه",
      ],
      cta: "پیش‌خرید کنید",
    },
  ],
  trainingBlock: {
    image:
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
    title: "ساخته‌شده برای استفاده روزمره.",
    copy:
      "بدنه استیل دوجداره، درپوش ضدنشت و رهگیری هوشمند تا هیچ جرعه‌ای را از دست ندهید.",
    cta: "مشاهده مشخصات",
  },
  bannerText: "ارسال رایگان - مرجوعی ۳۰روزه - ضمانت دوساله",
  productsSection: {
    announcement: "محصولات جدید هر دوشنبه می‌رسند · بسته‌ها را انتخاب کنید و بیشتر صرفه‌جویی کنید",
    title: "محصولات",
  },
  products: [],
  actionShots: [
    {
      src: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80",
      alt: "بطری نوا با فیلتر آب",
    },
    {
      src: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80",
      alt: "بطری روی میز کنار لپ‌تاپ",
    },
    {
      src: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=600&q=80",
      alt: "نمای نزدیک بطری استیل",
    },
    {
      src: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=600&q=80",
      alt: "قرار دادن بطری در کیف مسافر",
    },
  ],
  welcome: {
    headline: "با نوا وان آشنا شوید",
    title: "راهی هوشمندتر برای نوشیدن آب.",
    copy: "مصرف آب را ثبت می‌کند، نوشیدنی را سرد یا گرم نگه می‌دارد و با تلفن شما همگام می‌شود تا زمان نوشیدن را بدانید.",
    cta: "پیش‌خرید امروز",
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
  },
  reviews: {
    headline: "کاربران اولیه نوا وان را دوست دارند",
    ratingText: "میانگین امتیاز ۴٫۹ از ۵",
  },
  features: [
    { title: "کنترل دما", copy: "نوشیدنی را ۲۴ ساعت سرد یا ۱۲ ساعت گرم نگه می‌دارد." },
    { title: "یادآوری هوشمند", copy: "اپلیکیشن همراه زمان نوشیدن را به شما یادآوری می‌کند." },
    { title: "ضدنشت", copy: "درپوش یک‌دستی با قفل مناسب کیف." },
    { title: "ضمانت دوساله", copy: "مرجوعی رایگان تا ۳۰ روز و پشتیبانی اختصاصی." },
  ],
  menus: {
    main: ["خانه", "مشخصات", "پرسش‌های متداول", "پشتیبانی"],
    footerTitle: "با نوا هیدراته بمانید",
  },
};

const FALLBACK = { ...LEGACY_FALLBACK, ...defaultContent };

export default function HeroSection({ initialContent = null, onEdit = {} }) {
  const [content, setContent] = useState(initialContent);
  const [productsFromDb, setProductsFromDb] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);

  // Keep local state in sync with provided content (dashboard view)
  useEffect(() => {
    if (initialContent) {
      queueMicrotask(() => setContent(initialContent));
    }
  }, [initialContent]);

  // Fetch when no content provided (public site)
  useEffect(() => {
    if (initialContent) return;
    let mounted = true;
    fetch("/api/dashboard/home")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (mounted) setContent(data);
      })
      .catch(() => {
        if (mounted) setContent(FALLBACK);
      });
    return () => {
      mounted = false;
    };
  }, [initialContent]);

  // Load products from backend DB for live site
  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => setProductsLoading(true));
    fetch("/api/shop")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setProductsFromDb(data);
        }
      })
      .catch(() => {
        if (mounted) setProductsFromDb(null);
      })
      .finally(() => {
        if (mounted) setProductsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const data = content || FALLBACK;
  const heroCards = Array.isArray(data.heroCards) && data.heroCards.length ? data.heroCards : FALLBACK.heroCards;
  const trainingBlock = data.trainingBlock || FALLBACK.trainingBlock;
  const productsSource = Array.isArray(productsFromDb) && productsFromDb.length ? productsFromDb : data.products;
  const products = Array.isArray(productsSource) && productsSource.length ? productsSource : FALLBACK.products;
  const actionShotsRaw = Array.isArray(data.actionShots) && data.actionShots.length ? data.actionShots : FALLBACK.actionShots;
  const actionShots = actionShotsRaw.map((item, idx) => {
    if (typeof item === "string") {
      const isVideo = item.endsWith(".mp4") || item.endsWith(".webm");
      return isVideo
        ? { video: item, poster: "", alt: `Action ${idx + 1}` }
        : { src: item, alt: `Action shot ${idx + 1}` };
    }
    return item;
  });
  const features = Array.isArray(data.features) && data.features.length ? data.features : FALLBACK.features;
  const welcome = data.welcome || FALLBACK.welcome;
  const productsSection = { ...FALLBACK.productsSection, ...(data.productsSection || {}) };
  const menus = data.menus || FALLBACK.menus;
  const firstCard = heroCards[0] || FALLBACK.heroCards[0];
  const secondCard = heroCards[1] || FALLBACK.heroCards[1];
  const highlights = Array.isArray(secondCard?.highlights) ? secondCard.highlights : [];

  const renderEditButton = (key) =>
    onEdit[key] ? (
      <IconButton
        size="small"
        onClick={onEdit[key]}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          bgcolor: "rgba(0,0,0,0.5)",
          color: "white",
          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
          zIndex: 2,
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    ) : null;

  return (
    <Box
      sx={{
        bgcolor: "var(--color-background)",
        color: "var(--color-text-primary)",
        minHeight: "100vh",
        fontFamily: "var(--site-font-family, 'Space Grotesk','Segoe UI',sans-serif)",
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pt: 6,
          mb: 3,
          bgcolor: "var(--color-primary)",
          color: "white",
          borderRadius: 2,
          py: 1.5,
          textAlign: "center",
          fontWeight: 700,
          letterSpacing: 1,
          position: "relative",
        }}
      >
        {renderEditButton("banner")}
        {data.bannerText || FALLBACK.bannerText}
      </Box>

      <Grid
        container
        spacing={3}
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, md: 4 },
          mb: 3,
          textAlign: "center",
          justifyContent: "center",
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
          <Grid
            sx={{ display: "flex", justifyContent: "center" }}
            size={{
              xs: 12,
              md: 6
            }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                bgcolor: "#ffffff",
                border: "1px solid var(--color-border)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {renderEditButton("hero1")}
              <CardMedia
                component="img"
                height="320"
                image={firstCard.image}
                alt={firstCard.alt || firstCard.title}
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography variant="overline" sx={{ color: "var(--color-primary)" }}>
                  {firstCard.subtitle}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {firstCard.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid
            sx={{ display: "flex", justifyContent: "center" }}
            size={{
              xs: 12,
              md: 6
            }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                bgcolor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                position: "relative",
              }}
            >
              {renderEditButton("hero2")}
              <Chip
                label="Limited Release"
                color="primary"
                sx={{ alignSelf: "flex-start", fontWeight: 700 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {secondCard.title}
              </Typography>
              <Typography color="var(--color-text-secondary)">
                {secondCard.subtitle}
              </Typography>
              <Stack spacing={1}>
                {highlights.map((line) => (
                  <Typography
                    key={line}
                    variant="body2"
                    sx={{ color: "var(--color-text-secondary)" }}
                  >
                    • {line}
                  </Typography>
                ))}
              </Stack>
              <Button
                variant="contained"
                size="large"
                sx={{
                  mt: "auto",
                  bgcolor: "var(--color-primary)",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  ":hover": { bgcolor: "var(--color-primary-dark)" },
                }}
              >
                {secondCard.cta || "خرید کنید"}
              </Button>
            </Card>
          </Grid>
        </Grid>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pb: 6 }}>
        <ResumeShoppingSection products={products} />

        <Box sx={{ my: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              border: "1px solid var(--color-border)",
              bgcolor: "#ffffff",
              position: "relative",
            }}
          >
            {renderEditButton("training")}
            <CardMedia
              component="img"
                image={trainingBlock.image}
                alt={trainingBlock.alt || "محصول در حال استفاده"}
                sx={{ height: { xs: 260, md: "100%" }, objectFit: "cover" }}
              />
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, mb: 1, color: "var(--color-primary)" }}
              >
                {trainingBlock.title}
              </Typography>
              <Typography sx={{ color: "var(--color-text-secondary)" }}>
                {trainingBlock.copy}
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  mt: 3,
                  bgcolor: "var(--color-primary)",
                  borderRadius: 2,
                  textTransform: "none",
                  ":hover": { bgcolor: "var(--color-primary-dark)" },
                }}
              >
                {trainingBlock.cta || "مشاهده مشخصات"}
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            bgcolor: "var(--color-accent-soft)",
            borderRadius: 3,
            px: 3,
            py: 2,
            border: "1px solid var(--color-border)",
            textAlign: "center",
            mb: 3,
            position: "relative",
          }}
        >
          {renderEditButton("products")}
          <Typography variant="body2" color="var(--color-text-secondary)">
            {productsSection.announcement}
          </Typography>
        </Box>

        <Box sx={{ mb: 5, position: "relative" }}>
          {renderEditButton("products")}
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            {productsSection.title}
          </Typography>
          {productsLoading ? (
            <ProductGridSkeleton count={4} cardHeight={500} imageHeight={220} columns={4} gridSpacing={2} variant="home" />
          ) : (
            <Grid container spacing={2} justifyContent="center">
              {products.length === 0 && (
                <Grid size={12}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 3,
                      bgcolor: "#ffffff",
                      border: "1px dashed var(--color-border)",
                      textAlign: "center",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    محصولی پیدا نشد. برای نمایش محصولات، آن‌ها را در داشبورد اضافه کنید.
                  </Box>
                </Grid>
              )}
              {products.map((item, idx) => {
              const title = item.title || item.name || `محصول ${idx + 1}`;
              const rawImages = Array.isArray(item.images) ? item.images : [];
              const gallery = rawImages.map(resolveImage).filter(Boolean);
              const primaryCandidate =
                item.image ||
                item.img ||
                item.imageUrl ||
                item.Img ||
                (Array.isArray(item.images) ? item.images[0] : null);
              const img = gallery[0] || resolveImage(primaryCandidate);
              const rawPrice = item.price ?? item.Price ?? "";
              const price =
                typeof rawPrice === "number"
                  ? formatMoney(rawPrice)
                  : typeof rawPrice === "string" && rawPrice.trim().length
                  ? rawPrice
                  : "";
              const alt = item.alt || item.name || title;
              const href = productHref(item, title);
                return (
                  <Grid
                    key={title}
                    sx={{ display: "flex", justifyContent: "center" }}
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 3
                    }}>
                    <Card
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        maxWidth: 300,
                        height: 500,
                        borderRadius: 2.5,
                        overflow: "hidden",
                        bgcolor: "#ffffff",
                        border: "1px solid var(--color-border)",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        transition: "transform 180ms ease, box-shadow 180ms ease",
                        "&:hover": { transform: "translateY(-3px)", boxShadow: "0 14px 30px rgba(43,43,43,0.12)" },
                      }}
                    >
                      <Box
                        component={Link}
                        href={href}
                        aria-label={`مشاهده ${title}`}
                        sx={{ position: "absolute", inset: 0, zIndex: 1 }}
                      />
                      <CardMedia
                        component="img"
                        height="220"
                        image={img || "https://placehold.co/400x300?text=Weluxo"}
                        alt={alt}
                        sx={{ objectFit: "cover", position: "relative", zIndex: 2, pointerEvents: "none" }}
                      />
                      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 2, pointerEvents: "none" }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "var(--color-text-primary)",
                            fontSize: "0.85rem",
                            lineHeight: 1.25,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "normal",
                            mb: 1,
                          }}
                        >
                          {title}
                        </Typography>
                        <Typography sx={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", mb: 1 }}>
                          {price}
                        </Typography>
                        <Box sx={{ mt: "auto" }}>
                          <Button
                            variant="contained"
                            size="small"
                            href="/cart"
                            sx={{ mt: 1.5, borderRadius: 1.5, textTransform: "none", pointerEvents: "auto", position: "relative", zIndex: 3 }}
                          >
                            افزودن به سبد خرید
                          </Button>
                        </Box>
                        {gallery.length > 1 && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: 1.5,
                              overflowX: "auto",
                              pb: 1,
                            }}
                          >
                            {gallery.map((thumb, tIdx) => (
                              <Box
                                key={`${title}-thumb-${tIdx}`}
                                component="img"
                                src={thumb}
                                alt={`${title} ${tIdx + 1}`}
                                sx={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  border: "1px solid var(--color-border)",
                                  pointerEvents: "none",
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 2, textAlign: "center" }}
          >
            در عمل ببینید…
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {actionShots.map((shot, idx) => {
              const isVideo = !!shot.video || (shot.src && (shot.src.endsWith(".mp4") || shot.src.endsWith(".webm")));
              return (
                <Grid
                  key={`${shot.video || shot.src || "action"}-${idx}`}
                  sx={{ display: "flex", justifyContent: "center" }}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3
                  }}>
                  <Box
                    sx={{
                      height: 220,
                      width: "100%",
                      maxWidth: 250,
                      mx: "auto",
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid var(--color-border)",
                      bgcolor: "#ffffff",
                    }}
                  >
                    {idx === 0 && renderEditButton("actionShots")}
                    {isVideo ? (
                      <Box
                        component="video"
                        src={shot.video || shot.src}
                        poster={shot.poster || shot.src}
                        muted
                        loop
                        controls
                        playsInline
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          backgroundColor: "black",
                        }}
                        aria-label={shot.alt || `Action video ${idx + 1}`}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={shot.src}
                        alt={shot.alt || `Action ${idx + 1}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    )}
                    {!isVideo && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(0,0,0,0.25)",
                          color: "white",
                        }}
                      >
                        <PlayArrowIcon />
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Grid container spacing={3} alignItems="stretch" justifyContent="center" sx={{ mb: 4 }}>
          <Grid
            sx={{ display: "flex", justifyContent: "center" }}
            size={{
              xs: 12,
              md: 12
            }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                border: "1px solid var(--color-border)",
                overflow: "hidden",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                position: "relative",
              }}
            >
              {renderEditButton("welcome")}
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  image={welcome.image}
                  alt={welcome.alt || "خوش آمدید"}
                  sx={{ height: "100%", objectFit: "cover" }}
                />
              </Box>
              <CardContent sx={{ p: 3, bgcolor: "var(--color-primary)" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {welcome.headline || "خوش آمدید به"}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                  {welcome.title}
                </Typography>
                <Typography sx={{ color: "#ffffff", mb: 2 }}>
                  {welcome.copy}
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "var(--color-accent)",
                    borderRadius: 2,
                    textTransform: "none",
                    ":hover": { bgcolor: "var(--color-accent-dark)" },
                  }}
                >
                  {welcome.cta || "همین حالا شروع کنید"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box
          sx={{
            bgcolor: "var(--color-primary)",
            borderRadius: 3,
            p: 3,
            mb: 5,
            border: "1px solid rgba(255,255,255,0.1)",
            position: "relative",
          }}
        >
          {renderEditButton("features")}
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, textAlign: "center", mb: 2 }}
          >
            بهتر تمرین کنید، هوشمندانه‌تر خرید کنید.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {features.map((item) => (
              <Grid
                key={item.title}
                sx={{ display: "flex", justifyContent: "center" }}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3
                }}>
                <Card
                  sx={{
                    borderRadius: 2,
                    bgcolor: "rgba(15,23,42,0.2)",
                    height: "100%",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 800 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.85)" }}>
                      {item.copy}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <CustomerReviewsSection />

        {/* Footer section removed per request */}
      </Box>
    </Box>
  );
}
