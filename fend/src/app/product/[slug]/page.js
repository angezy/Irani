"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Country } from "country-state-city";
import {
  AddRounded,
  ArrowBackRounded,
  CheckCircleRounded,
  FavoriteBorderRounded,
  FavoriteRounded,
  KeyboardArrowLeftRounded,
  LocalShippingOutlined,
  LockOutlined,
  RemoveRounded,
  ReplayRounded,
  SecurityRounded,
  ShareRounded,
  StarBorderRounded,
  StarRounded,
  ZoomInRounded,
} from "@mui/icons-material";
import { addToCart, estimateCartShipping, fetchSavedProducts, removeSavedProduct, saveProduct } from "../../lib/apiClient";
import { readCheckoutState, updateCheckoutState } from "../../checkout/components/checkoutState";
import { hideSupplierBranding } from "../../lib/customerFacingText";
import { toast } from "../../lib/notifications";
import { rememberProduct } from "../../lib/recentProducts";
import { formatMoney as formatStoreMoney } from "../../lib/locale";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80";

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .replace(/^\/product\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

function getProductSlug(product) {
  const explicitSlug = product.slug || product.Slug || product.handle || product.Handle;
  return normalizeSlug(explicitSlug || slugify(product.name || product.Name || product.title));
}

function getImageValue(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    return String(value.url || value.imageUrl || value.src || value.path || "").trim();
  }
  return "";
}

function formatMoney(value, currency) {
  return formatStoreMoney(value, currency);
}

function deliveryWindow(value) {
  const window = String(value || "").trim();
  return /^\d+\s*[-–]\s*\d+$/.test(window) ? `${window.replace(/\s*-\s*/, "–")} روز کاری` : window || "زمان تحویل پس از انتخاب روش ارسال اعلام می‌شود";
}

function normalizeProductComments(value) {
  const list = Array.isArray(value) ? value : Array.isArray(value?.list) ? value.list : [];

  return list
    .filter((entry) => entry && typeof entry === "object")
    .map((entry, index) => {
      const rawImages = entry.images ?? entry.commentUrls ?? entry.imageList ?? [];
      const images = (Array.isArray(rawImages) ? rawImages : [rawImages])
        .map(getImageValue)
        .filter(Boolean);
      const rating = Number(entry.rating ?? entry.score ?? entry.star ?? entry.stars);

      return {
        id: String(entry.id ?? entry.commentId ?? `comment-${index}`),
        author: String(entry.author ?? entry.commentUser ?? entry.userName ?? entry.username ?? "خریدار تأییدشده").trim() || "خریدار تأییدشده",
        text: String(entry.text ?? entry.comment ?? entry.content ?? entry.message ?? "").trim(),
        rating: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : null,
        date: String(entry.date ?? entry.commentDate ?? entry.createdAt ?? entry.createTime ?? "").trim(),
        countryCode: String(entry.countryCode ?? entry.country ?? "").trim(),
        flagIconUrl: getImageValue(entry.flagIconUrl ?? entry.flagUrl),
        images: [...new Set(images)],
      };
    })
    .filter((entry) => entry.text || entry.images.length);
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function ProductReviewList({ reviews, emptyMessage, heading }) {
  if (!reviews.length) {
    return <Typography sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>{emptyMessage}</Typography>;
  }

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 900 }}>
      <Typography component="h2" sx={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>{heading}</Typography>
      {reviews.map((review) => {
        const meta = [review.countryCode, formatReviewDate(review.date)].filter(Boolean).join(" · ");
        return (
          <Box key={review.id} sx={{ pb: 2.5, borderBottom: "1px solid var(--color-border)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                {review.flagIconUrl && <Box component="img" src={review.flagIconUrl} alt={review.countryCode ? `${review.countryCode} flag` : ""} sx={{ width: 18, height: 13, objectFit: "cover", borderRadius: 0.5 }} />}
                <Typography sx={{ fontWeight: 850 }}>{review.author}</Typography>
              </Stack>
              {review.rating !== null && (
                <Stack direction="row" spacing={0.1} aria-label={`${review.rating} از ۵ ستاره`}>
                  {[1, 2, 3, 4, 5].map((star) => star <= Math.round(review.rating)
                    ? <StarRounded key={star} sx={{ color: "var(--color-accent)", fontSize: 18 }} />
                    : <StarBorderRounded key={star} sx={{ color: "var(--color-text-secondary)", fontSize: 18 }} />)}
                </Stack>
              )}
            </Stack>
            {meta && <Typography sx={{ mt: 0.35, color: "var(--color-text-secondary)", fontSize: 13 }}>{meta}</Typography>}
            {review.text && <Typography sx={{ mt: 1.15, color: "var(--color-text-secondary)", lineHeight: 1.75, whiteSpace: "pre-line" }}>{review.text}</Typography>}
            {review.images.length > 0 && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                {review.images.map((image, index) => <Box key={`${review.id}-${image}`} component="img" src={image} alt={`تصویر دیدگاه ${index + 1}`} sx={{ width: 76, height: 76, borderRadius: 1.5, border: "1px solid var(--color-border)", objectFit: "cover" }} />)}
              </Stack>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function normalizeProduct(product = {}) {
  const title = hideSupplierBranding(product.name || product.Name || product.title, "محصول بدون عنوان");
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const images = [
    ...rawImages,
    product.img,
    product.Img,
    product.IMG,
    product.image,
    product.imageUrl,
    product.imageURL,
  ]
    .map(getImageValue)
    .filter(Boolean);
  const uniqueImages = [...new Set(images)];
  const rawPrice = product.price ?? product.Price ?? 0;
  const rawCompareAtPrice = product.compareAtPrice ?? product.CompareAtPrice ?? product.originalPrice ?? product.OriginalPrice;
  const rawStock = product.stock ?? product.Stock ?? product.quantity ?? product.Quantity;
  const numericPrice = Number(rawPrice);
  const numericCompareAtPrice = Number(rawCompareAtPrice);
  const numericStock = rawStock === undefined || rawStock === null || rawStock === "" ? null : Number(rawStock);
  const price = Number.isFinite(numericPrice) ? numericPrice : 0;
  const buyerReviews = normalizeProductComments(product.buyerReviews ?? product.BuyerReviews ?? product.productComments);
  const reportedBuyerReviewTotal = Number(product.buyerReviewTotal ?? product.BuyerReviewTotal ?? product.reviewTotal);

  return {
    id: product.id ?? product.PID ?? product.ProductId ?? product.productId ?? title,
    slug: getProductSlug(product),
    title,
    description: hideSupplierBranding(product.description || product.Description, "توضیحی برای این محصول ثبت نشده است."),
    category: product.category || product.Category || "مجموعه",
    brand: hideSupplierBranding(product.brand || product.Brand, "فروشگاه ایرانی"),
    price,
    salePrice: Number.isFinite(Number(product.salePrice ?? product.SalePrice)) ? Number(product.salePrice ?? product.SalePrice) : price,
    compareAtPrice: Number.isFinite(numericCompareAtPrice) && numericCompareAtPrice > price ? numericCompareAtPrice : null,
    currency: product.currency || product.Currency || "IRR",
    sku: product.sku || product.SKU || product.ProductCode || "",
    stock: Number.isFinite(numericStock) ? numericStock : null,
    isTrending: Boolean(product.isTrending ?? product.IsTrending ?? product.trending ?? product.Trending),
    alt: hideSupplierBranding(product.alt || product.Alt, title),
    address: product.address || product.Address || "",
    images: uniqueImages.length ? uniqueImages : [FALLBACK_IMAGE],
    buyerReviews,
    buyerReviewTotal: Number.isFinite(reportedBuyerReviewTotal) ? Math.max(buyerReviews.length, reportedBuyerReviewTotal) : buyerReviews.length,
  };
}

function ProductLoading() {
  const skeletonColor = "#eee8df";
  const panelSx = {
    bgcolor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 3,
  };

  return (
    <Box
      component="main"
      aria-busy="true"
      aria-label="در حال بارگذاری جزئیات محصول"
      sx={{ backgroundColor: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)", py: { xs: 3, md: 6 } }}
    >
      <Container maxWidth="lg">
        <Skeleton variant="text" width={180} height={26} sx={{ bgcolor: skeletonColor }} />
        <Grid container spacing={5} sx={{ mt: 1 }}>
          <Grid
            size={{
              xs: 12,
              md: 7
            }}>
            <Box sx={panelSx}>
              <Skeleton
                variant="rounded"
                sx={{ height: { xs: 300, md: 480 }, bgcolor: skeletonColor, borderRadius: 3 }}
              />
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ mt: 2, overflow: "hidden" }}>
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} variant="rounded" width={72} height={72} sx={{ flexShrink: 0, bgcolor: skeletonColor, borderRadius: 1.5 }} />
              ))}
            </Stack>
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 5
            }}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={84} height={24} sx={{ bgcolor: skeletonColor, borderRadius: 999 }} />
                <Skeleton variant="rounded" width={68} height={24} sx={{ bgcolor: skeletonColor, borderRadius: 999 }} />
              </Stack>
              <Box>
                <Skeleton variant="text" height={48} sx={{ bgcolor: skeletonColor }} />
                <Skeleton variant="text" width="68%" height={48} sx={{ bgcolor: skeletonColor }} />
              </Box>
              <Skeleton variant="text" width="34%" height={36} sx={{ bgcolor: skeletonColor }} />
              <Box>
                <Skeleton variant="text" height={20} sx={{ bgcolor: skeletonColor }} />
                <Skeleton variant="text" height={20} sx={{ bgcolor: skeletonColor }} />
                <Skeleton variant="text" width="82%" height={20} sx={{ bgcolor: skeletonColor }} />
              </Box>
              <Box sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Skeleton variant="text" width={105} sx={{ bgcolor: skeletonColor }} />
                    <Skeleton variant="text" width={85} sx={{ bgcolor: skeletonColor }} />
                  </Stack>
                  <Divider sx={{ borderColor: "var(--color-border)", my: 0.75 }} />
                  <Stack direction="row" spacing={1.5}>
                    <Skeleton variant="rounded" width={40} height={40} sx={{ bgcolor: skeletonColor, borderRadius: 1.5 }} />
                    <Skeleton variant="rounded" width={40} height={40} sx={{ bgcolor: skeletonColor, borderRadius: 1.5 }} />
                    <Skeleton variant="rounded" height={40} sx={{ flex: 1, bgcolor: skeletonColor, borderRadius: 999 }} />
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 6, md: 8 } }}>
          <Skeleton variant="text" width={210} height={34} sx={{ bgcolor: skeletonColor }} />
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {[0, 1, 2, 3].map((item) => (
              <Grid
                key={item}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3
                }}>
                <Box sx={{ ...panelSx, overflow: "hidden" }}>
                  <Skeleton variant="rectangular" height={160} sx={{ bgcolor: skeletonColor }} />
                  <Box sx={{ p: 2 }}>
                    <Skeleton variant="text" height={28} sx={{ bgcolor: skeletonColor }} />
                    <Skeleton variant="text" width="36%" sx={{ bgcolor: skeletonColor }} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

function ProductNotFound({ error }) {
  return (
    <Container sx={{ py: 8 }}>
      <Card sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          محصول پیدا نشد
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {error || "ممکن است این محصول حذف شده باشد یا پیوند آن قدیمی باشد."}
        </Typography>
        <Button component={Link} href="/shop" variant="contained" sx={{ borderRadius: 999 }}>
          بازگشت به فروشگاه
        </Button>
      </Card>
    </Container>
  );
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const requestedSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const normalizedRequestedSlug = normalizeSlug(requestedSlug);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState("details");
  const initialShipping = readCheckoutState().shipping || {};
  const [shippingCountry, setShippingCountry] = useState(initialShipping.country || "US");
  const [shippingPostalCode, setShippingPostalCode] = useState(initialShipping.postalCode || "");
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingName, setSelectedShippingName] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const countryOptions = useMemo(() => Country.getAllCountries().map((country) => ({ code: country.isoCode, label: country.name })).sort((a, b) => a.label.localeCompare(b.label)), []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/shop", { cache: "no-store" });
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(/[\u0600-\u06ff]/.test(String(data?.error || "")) ? data.error : "بارگذاری جزئیات محصول ممکن نیست.");
        if (active) setCatalog(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setLoadError(error.message || "بارگذاری جزئیات محصول ممکن نیست.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const products = useMemo(() => catalog.map(normalizeProduct), [catalog]);
  const product = useMemo(
    () =>
      products.find(
        (item) => item.slug === normalizedRequestedSlug || String(item.id) === String(normalizedRequestedSlug)
      ),
    [normalizedRequestedSlug, products]
  );

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((item) => item.slug !== product.slug && item.category === product.category)
      .slice(0, 4);
  }, [product, products]);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedImage(0);
      setQuantity(1);
      setSaved(false);
      setSaving(false);
      setActiveInfoTab("details");
      setShippingOptions([]);
      setSelectedShippingName("");
      setShippingError("");
    });
  }, [product?.slug]);

  useEffect(() => {
    if (product) rememberProduct(product);
  }, [product]);

  useEffect(() => {
    if (!product?.id) return undefined;
    let active = true;
    fetchSavedProducts()
      .then((data) => {
        if (active) setSaved((data.items || []).some((item) => String(item.id) === String(product.id)));
      })
      .catch((error) => {
        if (error.message !== "unauthorized") console.error("Unable to load saved product state", error);
      });
    return () => {
      active = false;
    };
  }, [product?.id]);

  async function handleAddToCart() {
    if (!product || product.stock === 0) return;
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        image: product.images[0],
        quantity,
      });
      toast.success("به سبد خرید اضافه شد", {
        description: `${product.title} اکنون در سبد خرید شماست.`,
        action: { label: "مشاهده سبد خرید", onClick: () => router.push("/cart") },
        cancel: { label: "ادامه خرید" },
      });
    } catch (error) {
      const isUnauthorized = error.message === "unauthorized";
      (isUnauthorized ? toast.info : toast.error)(isUnauthorized ? "نشست سبد خرید منقضی شد" : "افزودن محصول ممکن نیست", {
        description: isUnauthorized ? "لطفاً دوباره محصول را اضافه کنید." : error.message || "لطفاً دوباره تلاش کنید.",
      });
    } finally {
      setAdding(false);
    }
  }

  function invalidateShippingQuote() {
    setShippingOptions([]);
    setSelectedShippingName("");
    setShippingError("");
    const checkout = readCheckoutState();
    if (String(checkout.shipping?.sourceProductId || "") === String(product?.id || "")) {
      updateCheckoutState({ shipping: {
        ...checkout.shipping,
        method: "",
        logisticName: "",
        label: "",
        window: "",
        cost: null,
        fromCountryCode: "",
      } });
    }
  }

  function changeQuantity(amount) {
    setQuantity((value) => Math.max(1, value + amount));
    invalidateShippingQuote();
  }

  function chooseShippingOption(option) {
    const logisticName = option.logisticName || option.method;
    setSelectedShippingName(logisticName);
    const checkout = readCheckoutState();
    updateCheckoutState({ shipping: {
      ...checkout.shipping,
      country: shippingCountry,
      postalCode: shippingPostalCode,
      method: logisticName,
      logisticName,
      label: hideSupplierBranding(option.label || logisticName, "روش ارسال"),
      window: option.window || "",
      cost: Number(option.cost) || 0,
      fromCountryCode: option.fromCountryCode || "",
      sourceProductId: String(product.id),
      sourceProductSlug: product.slug,
      sourceProductTitle: product.title,
    } });
  }

  async function handleShippingEstimate(event) {
    event.preventDefault();
    if (!shippingCountry || !shippingPostalCode.trim()) {
      setShippingError("کشور را انتخاب و کد پستی را وارد کنید.");
      return;
    }
    setShippingLoading(true);
    setShippingError("");
    try {
      const result = await estimateCartShipping({
        productId: product.id,
        quantity,
        country: shippingCountry,
        postalCode: shippingPostalCode,
      });
      const options = Array.isArray(result.estimates) ? result.estimates : [];
      if (!options.length) throw new Error("سرویس تحویلی برای این مقصد در دسترس نیست.");
      setShippingOptions(options);
      chooseShippingOption(result.selected || options[0]);
    } catch (error) {
      setShippingOptions([]);
      setSelectedShippingName("");
      setShippingError(error.message || "محاسبه هزینه ارسال این محصول ممکن نیست.");
    } finally {
      setShippingLoading(false);
    }
  }

  async function handleToggleSaved() {
    if (!product || saving) return;
    setSaving(true);
    try {
      if (saved) {
        await removeSavedProduct(product.id);
        setSaved(false);
        toast.success("از محصولات ذخیره‌شده حذف شد", { description: `${product.title} دیگر در فهرست ذخیره‌شده شما نیست.` });
      } else {
        await saveProduct(product.id);
        setSaved(true);
        toast.success("برای بعد ذخیره شد", {
          description: `${product.title} از بخش حساب شما در دسترس است.`,
          action: { label: "مشاهده ذخیره‌شده‌ها", onClick: () => router.push("/account/saved") },
        });
      }
    } catch (error) {
      if (error.message === "unauthorized") {
        toast.info("برای ذخیره محصول وارد شوید", {
          description: "محصولات ذخیره‌شده در حساب مشتری شما نگهداری می‌شوند.",
          action: { label: "ورود", onClick: () => router.push("/signin") },
        });
      } else {
        toast.error("به‌روزرسانی محصولات ذخیره‌شده ممکن نیست", { description: error.message || "دوباره تلاش کنید." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const shareData = { title: product?.title, text: product?.description, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copied", { description: "The product link is ready to share." });
    } catch (_error) {
      // Sharing can be cancelled by the user; there is nothing else to do.
    }
  }

  if (loading) return <ProductLoading />;
  if (!product) return <ProductNotFound error={loadError} />;

  const inStock = product.stock === null || product.stock > 0;
  const currentImage = product.images[selectedImage] || product.images[0];
  const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const stockLabel = product.stock === null ? "موجود" : product.stock > 0 ? `${product.stock} عدد موجود` : "ناموجود";
  const infoTabs = [
    { id: "details", label: "جزئیات محصول" },
    { id: "buyer-reviews", label: `دیدگاه خریداران (${product.buyerReviewTotal})` },
    { id: "shipping", label: "ارسال و مرجوعی" },
    { id: "care", label: "راهنمای نگهداری" },
  ];

  return (
    <Box component="main" sx={{ backgroundColor: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2.5, sm: 4, lg: 6 } }}>
        <Breadcrumbs
          separator={<KeyboardArrowLeftRounded sx={{ fontSize: 18, color: "var(--color-text-secondary)" }} />}
          sx={{ mb: { xs: 3, md: 4 }, color: "var(--color-text-secondary)", fontSize: 13 }}
        >
          <Link href="/shop">فروشگاه</Link>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <Typography sx={{ color: "var(--color-text-primary)", fontSize: "inherit", fontWeight: 700 }} noWrap>{product.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="flex-start">
          <Grid
            size={{
              xs: 12,
              md: 7
            }}>
            <Box component="section" aria-label="گالری محصول">
              <Card
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: { xs: 3, md: 4 },
                  bgcolor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "0 22px 55px rgba(43,43,43,0.08)",
                }}
              >
                <Box
                  component="img"
                  src={currentImage}
                  alt={product.alt}
                  sx={{ display: "block", width: "100%", height: { xs: 390, sm: 500, md: 610 }, objectFit: "cover" }}
                />
                <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 18, insetInlineStart: 18 }}>
                  {product.isTrending && <Chip label="پرفروش" size="small" sx={{ bgcolor: "var(--color-accent)", color: "#fff", fontWeight: 850 }} />}
                  {hasDiscount && <Chip label={`${discountPercent}٪ تخفیف`} size="small" sx={{ bgcolor: "var(--color-primary)", color: "#fff", fontWeight: 850 }} />}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 14, insetInlineEnd: 14 }}>
                  <Button
                    type="button"
                    onClick={handleToggleSaved}
                    disabled={saving}
                    aria-label={saved ? "حذف از محصولات ذخیره‌شده" : "ذخیره محصول"}
                    aria-pressed={saved}
                    sx={{ minWidth: 42, width: 42, height: 42, p: 0, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", color: saved ? "var(--color-error)" : "var(--color-text-primary)", boxShadow: "0 8px 18px rgba(43,43,43,0.12)", "&:hover": { bgcolor: "#fff" } }}
                  >
                    {saved ? <FavoriteRounded /> : <FavoriteBorderRounded />}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleShare}
                    aria-label="اشتراک‌گذاری محصول"
                    sx={{ minWidth: 42, width: 42, height: 42, p: 0, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", color: "var(--color-text-primary)", boxShadow: "0 8px 18px rgba(43,43,43,0.12)", "&:hover": { bgcolor: "#fff" } }}
                  >
                    <ShareRounded />
                  </Button>
                </Stack>
                <Button
                  component="a"
                  href={currentImage}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="مشاهده تصویر محصول در اندازه کامل"
                  sx={{ position: "absolute", insetInlineStart: 18, bottom: 18, minWidth: 42, width: 42, height: 42, p: 0, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", color: "var(--color-text-primary)", boxShadow: "0 8px 18px rgba(43,43,43,0.12)", "&:hover": { bgcolor: "#fff" } }}
                >
                  <ZoomInRounded />
                </Button>
                <Box sx={{ position: "absolute", insetInlineEnd: 18, bottom: 18, px: 1.25, py: 0.65, borderRadius: 999, bgcolor: "rgba(43,43,43,0.72)", color: "#fff", fontSize: 12, fontWeight: 800 }}>
                  {selectedImage + 1} / {product.images.length}
                </Box>
              </Card>

              <Stack direction="row" spacing={1.5} sx={{ mt: 2, overflowX: "auto", pb: 1, scrollbarWidth: "thin" }}>
                {product.images.map((image, index) => (
                  <Box
                    component="button"
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`مشاهده تصویر محصول ${index + 1}`}
                    aria-pressed={index === selectedImage}
                    sx={{
                      position: "relative",
                      border: index === selectedImage ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      borderRadius: 2.5,
                      p: 0,
                      width: 86,
                      height: 86,
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                      bgcolor: "var(--color-surface)",
                      opacity: index === selectedImage ? 1 : 0.72,
                      transition: "opacity 160ms ease, border-color 160ms ease, transform 160ms ease",
                      "&:hover": { opacity: 1, transform: "translateY(-2px)" },
                    }}
                  >
                    <Box component="img" src={image} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 5
            }}>
            <Box component="section" aria-labelledby="product-title" sx={{ position: { md: "sticky" }, top: { md: 116 } }}>
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Typography sx={{ color: "var(--color-primary)", fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    {product.brand || "Weluxo"}
                  </Typography>
                  {product.sku && <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 11, letterSpacing: "0.04em" }}>کد محصول {product.sku}</Typography>}
                </Stack>
                <Typography id="product-title" component="h1" sx={{ maxWidth: 650, fontSize: { xs: "2.45rem", md: "3.65rem" }, fontWeight: 950, letterSpacing: "-0.055em", lineHeight: 0.98 }}>
                  {product.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap" useFlexGap>
                  <Chip label={product.category} size="small" sx={{ bgcolor: "var(--color-accent-soft)", color: "var(--color-accent-dark)", fontWeight: 850 }} />
                  <Stack direction="row" spacing={0.6} alignItems="center" sx={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                    <CheckCircleRounded sx={{ fontSize: 17, color: "var(--color-success)" }} />
                    <Typography component="span" sx={{ fontSize: "inherit" }}>بررسی‌شده از نظر کیفیت</Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Typography sx={{ color: "var(--color-primary)", fontSize: { xs: 31, md: 36 }, fontWeight: 950, letterSpacing: "-0.04em" }}>
                    {formatMoney(product.price, product.currency)}
                  </Typography>
                  {hasDiscount && <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 18, textDecoration: "line-through" }}>{formatMoney(product.compareAtPrice, product.currency)}</Typography>}
                  {hasDiscount && <Typography sx={{ color: "var(--color-accent-dark)", fontSize: 13, fontWeight: 850 }}>صرفه‌جویی {formatMoney(product.compareAtPrice - product.price, product.currency)}</Typography>}
                </Stack>
                <Typography sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8, fontSize: 15, whiteSpace: "pre-line" }}>
                  {product.description}
                </Typography>

                <Card sx={{ bgcolor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 3.5, boxShadow: "0 16px 42px rgba(43,43,43,0.07)" }}>
                  <CardContent sx={{ p: { xs: 2.25, md: 2.75 }, "&:last-child": { pb: { xs: 2.25, md: 2.75 } } }}>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: inStock ? "var(--color-success)" : "var(--color-error)", boxShadow: inStock ? "0 0 0 5px rgba(46,139,87,0.12)" : "0 0 0 5px rgba(201,74,74,0.12)" }} />
                          <Typography sx={{ fontWeight: 850 }}>{stockLabel}</Typography>
                        </Stack>
                        {product.stock !== null && product.stock > 0 && product.stock <= 5 && <Typography sx={{ color: "var(--color-accent-dark)", fontSize: 12, fontWeight: 850 }}>موجودی محدود</Typography>}
                      </Stack>
                      {product.address && (
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <LocalShippingOutlined sx={{ mt: 0.15, color: "var(--color-primary)", fontSize: 19 }} />
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>ارسال از {product.address}</Typography>
                            <Typography sx={{ mt: 0.25, color: "var(--color-text-secondary)", fontSize: 12 }}>گزینه‌های ارسال هنگام تسویه‌حساب نمایش داده می‌شوند.</Typography>
                          </Box>
                        </Stack>
                      )}
                      <Divider sx={{ borderColor: "var(--color-border)" }} />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 48, px: 0.5, border: "1px solid var(--color-border)", borderRadius: 999, bgcolor: "var(--color-surface-muted)" }}>
                          <Button type="button" onClick={() => changeQuantity(-1)} disabled={!inStock || quantity <= 1} aria-label="کاهش تعداد" sx={{ minWidth: 40, width: 40, height: 40, p: 0, color: "var(--color-text-primary)" }}><RemoveRounded fontSize="small" /></Button>
                          <Typography sx={{ minWidth: 28, textAlign: "center", fontSize: 14, fontWeight: 850 }}>{quantity}</Typography>
                          <Button type="button" onClick={() => changeQuantity(1)} disabled={!inStock} aria-label="افزایش تعداد" sx={{ minWidth: 40, width: 40, height: 40, p: 0, color: "var(--color-text-primary)" }}><AddRounded fontSize="small" /></Button>
                        </Stack>
                        <Button fullWidth variant="contained" onClick={handleAddToCart} disabled={!inStock || adding} data-button-loading-managed="true" startIcon={adding ? <CircularProgress size={18} color="inherit" /> : undefined} sx={{ minHeight: 48, px: 3, fontSize: 15, borderRadius: 999 }}>
                          {adding ? "در حال افزودن..." : inStock ? "افزودن به سبد خرید" : "ناموجود"}
                        </Button>
                      </Stack>
                      {true && (
                        <Box component="form" onSubmit={handleShippingEstimate} sx={{ p: 1.75, border: "1px solid var(--color-border)", borderRadius: 2.5, bgcolor: "var(--color-surface-muted)" }}>
                          <Stack spacing={1.25}>
                            <Stack direction="row" spacing={1} alignItems="center"><LocalShippingOutlined sx={{ color: "var(--color-primary)", fontSize: 20 }} /><Typography sx={{ fontWeight: 900 }}>روش‌های ارسال</Typography></Stack>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                              <TextField select size="small" label="کشور" value={shippingCountry} onChange={(event) => { setShippingCountry(event.target.value); invalidateShippingQuote(); }}>
                                {countryOptions.map((country) => <MenuItem key={country.code} value={country.code}>{country.label}</MenuItem>)}
                              </TextField>
                              <TextField size="small" label="کد پستی" value={shippingPostalCode} onChange={(event) => { setShippingPostalCode(event.target.value); invalidateShippingQuote(); }} />
                            </Box>
                            <Button type="submit" variant="outlined" disabled={shippingLoading} startIcon={shippingLoading ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ alignSelf: "flex-start", borderRadius: 999 }}>
                              {shippingLoading ? "در حال بررسی..." : "مشاهده روش‌های ارسال"}
                            </Button>
                            {shippingError && <Alert severity="error">{shippingError}</Alert>}
                            {!!shippingOptions.length && (
                              <RadioGroup value={selectedShippingName} onChange={(event) => {
                                const option = shippingOptions.find((item) => (item.logisticName || item.method) === event.target.value);
                                if (option) chooseShippingOption(option);
                              }}>
                                {shippingOptions.map((option) => (
                                  <Box key={option.logisticName || option.method} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, borderBottom: "1px solid var(--color-border)" }}>
                                    <Radio value={option.logisticName || option.method} size="small" />
                                    <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{hideSupplierBranding(option.label || option.logisticName, "روش ارسال")}</Typography><Typography sx={{ color: "var(--color-text-secondary)", fontSize: 11.5 }}>{deliveryWindow(option.window)}</Typography></Box>
                                    <Typography sx={{ fontSize: 13, fontWeight: 850 }}>{formatMoney(option.cost)}</Typography>
                                  </Box>
                                ))}
                              </RadioGroup>
                            )}
                          </Stack>
                        </Box>
                      )}
                      <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 11.5, textAlign: "center" }}>مالیات و روش ارسال انتخاب‌شده در تسویه‌حساب نهایی می‌شود.</Typography>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={1.25}>
                  {[
                    { icon: <SecurityRounded />, title: "پرداخت امن", copy: "تسویه‌حساب محافظت‌شده" },
                    { icon: <ReplayRounded />, title: "پشتیبانی آسان", copy: "هر زمان نیاز داشته باشید" },
                    { icon: <LockOutlined />, title: "حفاظت از سفارش", copy: "بسته‌بندی دقیق" },
                  ].map((item) => (
                    <Grid key={item.title} size={4}>
                      <Stack alignItems="center" spacing={0.7} sx={{ height: "100%", px: { xs: 0.25, sm: 1 }, py: 1.25, textAlign: "center", border: "1px solid var(--color-border)", borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.34)" }}>
                        <Box sx={{ color: "var(--color-primary)", lineHeight: 1 }}>{item.icon}</Box>
                        <Typography sx={{ fontSize: { xs: 10, sm: 11 }, fontWeight: 850, lineHeight: 1.2 }}>{item.title}</Typography>
                        <Typography sx={{ display: { xs: "none", sm: "block" }, color: "var(--color-text-secondary)", fontSize: 10.5, lineHeight: 1.2 }}>{item.copy}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Box component="section" aria-label="اطلاعات محصول" sx={{ mt: { xs: 7, md: 10 }, p: { xs: 2, sm: 3, md: 4 }, borderRadius: { xs: 3, md: 4 }, bgcolor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0.5, md: 1 }} sx={{ mb: 3, borderBottom: "1px solid var(--color-border)" }}>
            {infoTabs.map((tab) => (
              <Button key={tab.id} type="button" onClick={() => setActiveInfoTab(tab.id)} sx={{ justifyContent: "flex-start", minHeight: 46, px: { xs: 1, md: 1.5 }, borderRadius: 0, color: activeInfoTab === tab.id ? "var(--color-primary)" : "var(--color-text-secondary)", borderBottom: activeInfoTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent", fontWeight: 850, "&:hover": { bgcolor: "var(--color-primary-soft)" } }}>
                {tab.label}
              </Button>
            ))}
          </Stack>
          {activeInfoTab === "details" && (
            <Grid container spacing={{ xs: 3, md: 6 }}>
              <Grid
                size={{
                  xs: 12,
                  md: 7
                }}>
                <Typography component="h2" sx={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", mb: 1.25 }}>برای استفاده روزمره شما</Typography>
                <Typography sx={{ color: "var(--color-text-secondary)", lineHeight: 1.85, whiteSpace: "pre-line" }}>{product.description}</Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 5
                }}>
                <Stack spacing={1.25}>
                  {[
                    ["دسته‌بندی", product.category],
                    ["برند", product.brand],
                    ...(product.sku ? [["شناسه", product.sku]] : []),
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 1.25, borderBottom: "1px solid var(--color-border)" }}>
                      <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 13 }}>{label}</Typography>
                      <Typography sx={{ maxWidth: "62%", textAlign: "right", fontSize: 13, fontWeight: 800 }}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          )}
          {activeInfoTab === "buyer-reviews" && (
            <Stack spacing={1.25}>
              <ProductReviewList
                heading="دیدگاه خریداران"
                reviews={product.buyerReviews}
                emptyMessage="هنوز دیدگاهی برای این محصول ثبت نشده است."
              />
              {product.buyerReviewTotal > product.buyerReviews.length && (
                <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
                  نمایش {product.buyerReviews.length} دیدگاه از مجموع {product.buyerReviewTotal} دیدگاه.
                </Typography>
              )}
            </Stack>
          )}
          {activeInfoTab === "shipping" && (
            <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
              <Typography component="h2" sx={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>ارسال ساده و شفاف</Typography>
              <Typography sx={{ color: "var(--color-text-secondary)", lineHeight: 1.85 }}>روش‌های ارسال و زمان تقریبی تحویل بر اساس مقصد شما در زمان تسویه‌حساب نمایش داده می‌شود.</Typography>
              <Stack direction="row" spacing={1.25} alignItems="flex-start"><LocalShippingOutlined sx={{ color: "var(--color-primary)", mt: 0.25 }} /><Typography sx={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>سفارش خود را از زمان تأیید تا تحویل پیگیری کنید.</Typography></Stack>
              <Button component={Link} href="/shipping-information" endIcon={<ArrowBackRounded />} sx={{ alignSelf: "flex-start", px: 0, color: "var(--color-primary)" }}>مطالعه اطلاعات ارسال</Button>
            </Stack>
          )}
          {activeInfoTab === "care" && (
            <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
              <Typography component="h2" sx={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em" }}>محصول را سالم نگه دارید</Typography>
              <Typography sx={{ color: "var(--color-text-secondary)", lineHeight: 1.85 }}>دستورالعمل نگهداری همراه محصول را دنبال کنید و آن را بین هر بار استفاده در محیطی تمیز و خشک نگه دارید. اگر به کمک نیاز دارید، تیم پشتیبانی آماده پاسخ‌گویی است.</Typography>
              <Button component={Link} href="/contact" endIcon={<ArrowBackRounded />} sx={{ alignSelf: "flex-start", px: 0, color: "var(--color-primary)" }}>تماس با پشتیبانی</Button>
            </Stack>
          )}
        </Box>

        {relatedProducts.length > 0 && (
          <Box component="section" aria-labelledby="related-products-title" sx={{ mt: { xs: 7, md: 10 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-end" }} spacing={1} sx={{ mb: 3 }}>
              <Box>
                <Typography sx={{ color: "var(--color-accent-dark)", fontSize: 12, fontWeight: 900, letterSpacing: "0.15em" }}>پیشنهادهای مشابه</Typography>
                <Typography id="related-products-title" component="h2" sx={{ mt: 0.5, fontSize: { xs: 28, md: 34 }, fontWeight: 950, letterSpacing: "-0.045em" }}>محصولات بیشتر از دسته {product.category}</Typography>
              </Box>
              <Button component={Link} href={`/shop?category=${encodeURIComponent(product.category)}`} endIcon={<ArrowBackRounded />} sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, color: "var(--color-primary)" }}>مشاهده مجموعه</Button>
            </Stack>
            <Grid container spacing={2.5}>
              {relatedProducts.map((related) => (
                <Grid
                  key={related.id}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3
                  }}>
                  <Card component={Link} href={`/product/${related.slug}`} sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: 3.5, overflow: "hidden", transition: "transform 180ms ease, box-shadow 180ms ease", "&:hover": { transform: "translateY(-5px)", boxShadow: "0 20px 38px rgba(43,43,43,0.12)" } }}>
                    <Box sx={{ position: "relative", bgcolor: "var(--color-surface-muted)" }}>
                      <Box component="img" src={related.images[0]} alt={related.alt} sx={{ display: "block", width: "100%", height: 220, objectFit: "cover" }} />
                      <Box sx={{ position: "absolute", insetInlineStart: 12, bottom: 12, width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "rgba(255,255,255,0.92)", color: "var(--color-primary)" }}><ArrowBackRounded sx={{ fontSize: 18 }} /></Box>
                    </Box>
                    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2.25 }}>
                      <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>{related.brand}</Typography>
                      <Typography sx={{ mt: 0.75, fontWeight: 850, lineHeight: 1.3 }}>{related.title}</Typography>
                      <Typography sx={{ mt: "auto", pt: 2, color: "var(--color-primary)", fontSize: 17, fontWeight: 900 }}>{formatMoney(related.price, related.currency)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
