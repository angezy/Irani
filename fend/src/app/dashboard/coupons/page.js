"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";

const emptyForm = { code: "", discountPercent: "10", expiresAt: "" };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fa-IR");
}

function statusColor(status) {
  if (status === "Active") return "success";
  if (status === "Expired") return "warning";
  return "default";
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(() => coupons.filter((coupon) => coupon.status === "Active").length, [coupons]);

  async function loadCoupons() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/coupons", { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => []);
      if (!response.ok) throw new Error(body.error || "بارگذاری کدهای تخفیف ممکن نیست");
      setCoupons(Array.isArray(body) ? body : []);
    } catch (loadError) {
      setError(loadError.message || "بارگذاری کدهای تخفیف ممکن نیست");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadCoupons);
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: field === "code" ? value.toUpperCase() : value }));
    setMessage("");
    setError("");
  }

  async function createCoupon(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!form.code.trim() || !form.expiresAt) {
      setError("کد تخفیف و تاریخ انقضا را وارد کنید.");
      return;
    }
    const expiresAt = new Date(form.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      setError("تاریخ انقضا باید در آینده باشد.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/coupons", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountPercent: Number(form.discountPercent),
          expiresAt: expiresAt.toISOString(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "ایجاد کد تخفیف ممکن نیست");
      setCoupons((current) => [body, ...current]);
      setForm(emptyForm);
      setMessage(`${body.code} برای استفاده در پرداخت آماده است.`);
    } catch (saveError) {
      setError(saveError.message || "ایجاد کد تخفیف ممکن نیست");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon) {
    if (coupon.status === "Expired") return;
    setUpdatingId(coupon.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/dashboard/coupons/${encodeURIComponent(coupon.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "به‌روزرسانی کد تخفیف ممکن نیست");
      setCoupons((current) => current.map((entry) => entry.id === body.id ? body : entry));
      setMessage(`${body.code} اکنون ${body.status === "Active" ? "فعال" : "غیرفعال"} است.`);
    } catch (updateError) {
      setError(updateError.message || "به‌روزرسانی کد تخفیف ممکن نیست");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-end" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 850, letterSpacing: "0.14em" }}>ابزارهای بازاریابی</Typography>
          <Typography component="h1" sx={{ mt: 0.5, color: "#0f172a", fontSize: { xs: 28, md: 36 }, fontWeight: 900, letterSpacing: "-0.04em" }}>کدهای تخفیف</Typography>
          <Typography sx={{ mt: 0.75, color: "#64748b", maxWidth: 720 }}>تخفیف درصدی بسازید تا مشتریان پیش از پرداخت امن آن را در سبد خرید اعمال کنند. کدهای منقضی‌شده خودکار از کار می‌افتند.</Typography>
        </Box>
        <Chip icon={<LocalOfferOutlinedIcon />} label={`${activeCount} فعال`} color="primary" variant="outlined" />
      </Stack>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 25px rgba(15,23,42,0.05)" }}>
        <CardContent component="form" onSubmit={createCoupon} sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <AddOutlinedIcon sx={{ color: "var(--color-primary)" }} />
            <Typography sx={{ color: "#0f172a", fontSize: 19, fontWeight: 850 }}>ایجاد کد تخفیف</Typography>
          </Stack>
          <Typography sx={{ color: "#64748b", fontSize: 13, mb: 2.5 }}>کدها به بزرگی و کوچکی حروف حساس نیستند و پس از ذخیره فعال می‌شوند.</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
            <TextField fullWidth label="کد تخفیف" value={form.code} onChange={(event) => updateForm("code", event.target.value)} placeholder="تابستان۲۰" inputProps={{ maxLength: 64, spellCheck: false }} helperText="۳ تا ۶۴ حرف، عدد، خط تیره یا زیرخط" />
            <TextField fullWidth label="درصد تخفیف" type="number" value={form.discountPercent} onChange={(event) => updateForm("discountPercent", event.target.value)} inputProps={{ min: 0.01, max: 100, step: 0.01 }} InputProps={{ endAdornment: <Typography sx={{ color: "#64748b" }}>%</Typography> }} />
            <TextField fullWidth label="تاریخ انقضا" type="datetime-local" value={form.expiresAt} onChange={(event) => updateForm("expiresAt", event.target.value)} InputLabelProps={{ shrink: true }} helperText="پس از این زمان مشتریان نمی‌توانند از کد استفاده کنند" />
            <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <AddOutlinedIcon />} sx={{ minWidth: 150, minHeight: 56, borderRadius: 2, fontWeight: 800 }}>{saving ? "در حال ذخیره…" : "ایجاد کد تخفیف"}</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 25px rgba(15,23,42,0.05)" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ p: { xs: 2, md: 3 }, pb: 2 }}>
            <Typography sx={{ color: "#0f172a", fontSize: 19, fontWeight: 850 }}>همه کدهای تخفیف</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 13, mt: 0.5 }}>کدهای غیرفعال و منقضی برای مراجعه بعدی همچنان نمایش داده می‌شوند.</Typography>
          </Box>
          <Divider />
          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
          ) : !coupons.length ? (
            <Typography sx={{ p: 3, color: "#64748b" }}>هنوز کد تخفیفی ایجاد نشده است.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead><TableRow><TableCell sx={{ fontWeight: 800 }}>کد</TableCell><TableCell sx={{ fontWeight: 800 }}>تخفیف</TableCell><TableCell sx={{ fontWeight: 800 }}>انقضا</TableCell><TableCell sx={{ fontWeight: 800 }}>وضعیت</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>عملیات</TableCell></TableRow></TableHead>
                <TableBody>
                  {coupons.map((coupon, index) => (
                    <TableRow key={coupon.id ?? coupon.code ?? `coupon-${index}`} hover>
                      <TableCell><Typography sx={{ fontWeight: 850, letterSpacing: "0.04em" }}>{coupon.code}</Typography></TableCell>
                      <TableCell>{Number(coupon.discountPercent).toFixed(2).replace(/\.00$/, "")} %</TableCell>
                      <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                      <TableCell><Chip size="small" label={coupon.status === "Active" ? "فعال" : coupon.status === "Expired" ? "منقضی" : "غیرفعال"} color={statusColor(coupon.status)} /></TableCell>
                      <TableCell align="right"><Button size="small" onClick={() => toggleCoupon(coupon)} disabled={coupon.status === "Expired" || updatingId === coupon.id} sx={{ textTransform: "none" }}>{updatingId === coupon.id ? "در حال ذخیره…" : coupon.isActive ? "غیرفعال‌سازی" : "فعال‌سازی دوباره"}</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
