"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, InputAdornment, MenuItem,
  Stack, TextField, Typography,
} from "@mui/material";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

const GROUP_ICONS = {
  database: StorageOutlinedIcon, sendpulse: EmailOutlinedIcon,
  google: GoogleIcon, telegram: SendOutlinedIcon, zarinpal: EmailOutlinedIcon,
  chatbot: SmartToyOutlinedIcon, support: NotificationsNoneOutlinedIcon, tinymce: ArticleOutlinedIcon,
};

function targetLabel(target) {
  return target === "frontend" ? "محیط frontend" : target === "mixed" ? "محیط backend و frontend" : "محیط backend";
}

function statusFor(group) {
  if (group.optional && !group.configured) return { label: "اختیاری", color: "default" };
  if (group.configured) return { label: "تنظیم‌شده", color: "success" };
  if (group.configuredCount > 0) return { label: "تنظیم ناقص", color: "warning" };
  return { label: "نیازمند تنظیم", color: "default" };
}

export default function IntegrationsPage() {
  const [groups, setGroups] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [clears, setClears] = useState({});
  const [visible, setVisible] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const readyCount = useMemo(() => groups.filter((group) => group.configured).length, [groups]);
  const missingCount = useMemo(() => groups.filter((group) => !group.configured && !group.optional).length, [groups]);

  async function load({ initial = false } = {}) {
    if (initial) setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/integrations", { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "بارگذاری اتصال‌ها ناموفق بود");
      setGroups(Array.isArray(body.groups) ? body.groups : []);
      setNote(body.note || "");
    } catch (loadError) {
      setError(loadError.message || "بارگذاری اتصال‌ها ناموفق بود");
    } finally {
      if (initial) setLoading(false); else setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load({ initial: true }); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function openEditor(group) {
    const nextDrafts = {};
    const nextClears = {};
    group.fields.forEach((field) => {
      nextDrafts[field.key] = field.type === "secret" ? "" : (field.value || "");
      nextClears[field.key] = false;
    });
    setDrafts(nextDrafts);
    setClears(nextClears);
    setVisible({});
    setEditing(group);
    setError("");
    setMessage("");
  }

  function updateDraft(key, value) {
    setDrafts((current) => ({ ...current, [key]: value }));
    setClears((current) => ({ ...current, [key]: false }));
  }

  async function save(event) {
    event.preventDefault();
    if (!editing || saving) return;
    const updates = {};
    editing.fields.forEach((field) => {
      const value = String(drafts[field.key] ?? "");
      if (field.type === "secret") {
        if (clears[field.key]) updates[field.key] = { clear: true };
        else if (value.trim()) updates[field.key] = value;
      } else updates[field.key] = value;
    });
    if (!Object.keys(updates).length) {
      setError("یک مقدار محرمانه جدید وارد کنید یا پاک کردن مقدار فعلی را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/integrations", {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "ذخیره تنظیمات اتصال ناموفق بود");
      setGroups(Array.isArray(body.groups) ? body.groups : []);
      setEditing(null);
      setMessage(`${body.changedKeys?.length || 0} تنظیم اتصال ذخیره شد.${body.restartRequired ? " برای اعمال کامل تغییرات، سرویس مربوطه را راه‌اندازی مجدد کنید." : ""}`);
    } catch (saveError) {
      setError(saveError.message || "ذخیره تنظیمات اتصال ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto", minHeight: "100%" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-end" }} gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 850 }}>مدیریت فروشگاه</Typography>
          <Typography component="h1" sx={{ mt: 0.5, color: "#0f172a", fontSize: { xs: 28, md: 36 }, fontWeight: 900 }}>اتصال‌ها</Typography>
          <Typography sx={{ mt: 0.75, color: "#64748b", maxWidth: 780 }}>تنظیمات اتصال فروشگاه به ایمیل، پرداخت، ورود، پشتیبانی، هوش مصنوعی و ویرایش محتوا را مدیریت کنید.</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`${readyCount}/${groups.length || 0} آماده`} color="success" variant="outlined" />
          {missingCount > 0 && <Chip label={`${missingCount} مورد نیازمند تنظیم`} color="warning" variant="outlined" />}
          <Button variant="outlined" onClick={() => load()} disabled={loading || refreshing} startIcon={refreshing ? <CircularProgress size={17} /> : <RefreshOutlinedIcon />} sx={{ borderRadius: 2 }}>{refreshing ? "در حال نوسازی" : "نوسازی"}</Button>
        </Stack>
      </Stack>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Alert severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ mb: 3, borderRadius: 2 }}>
        اطلاعات محرمانه مخفی می‌مانند و هرگز به‌صورت ساده بازگردانده نمی‌شوند. کلیدهای خصوصی را در متغیرهای <code>NEXT_PUBLIC_*</code> قرار ندهید و فایل واقعی <code>.env</code> را commit نکنید. {note}
      </Alert>

      {loading ? <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress size={30} /></Stack> : (
        <Grid container spacing={2.5}>
          {groups.map((group) => {
            const Icon = GROUP_ICONS[group.id] || NotificationsNoneOutlinedIcon;
            const status = statusFor(group);
            return <Grid key={group.id} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%", borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 8px 25px rgba(15,23,42,0.05)" }}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "var(--color-primary-soft)", color: "var(--color-primary)" }}><Icon /></Box>
                      <Box><Typography sx={{ color: "#0f172a", fontSize: 18, fontWeight: 850 }}>{group.title}</Typography><Typography sx={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{targetLabel(group.target)}</Typography></Box>
                    </Stack>
                    <Chip size="small" label={status.label} color={status.color} variant={status.color === "default" ? "outlined" : "filled"} />
                  </Stack>
                  <Typography sx={{ mt: 1.5, mb: 2, color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>{group.description}</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={0.8}>{group.fields.map((field) => <Stack key={field.key} direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ minHeight: 31 }}>
                    <Box sx={{ minWidth: 0 }}><Typography sx={{ color: "#334155", fontSize: 12, fontWeight: 750 }}>{field.label}</Typography><Typography sx={{ color: "#94a3b8", fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{field.key}</Typography></Box>
                    <Typography sx={{ flexShrink: 0, maxWidth: "48%", color: field.configured ? "#475569" : "#cbd5e1", fontSize: 12, fontFamily: field.type === "secret" || field.value ? "monospace" : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{field.placeholderValue ? "Placeholder value" : field.value || "Not set"}</Typography>
                  </Stack>)}</Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                    <Button fullWidth variant="outlined" onClick={() => openEditor(group)} startIcon={<EditOutlinedIcon />} sx={{ borderRadius: 2, fontWeight: 750 }}>ویرایش تنظیمات</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>;
          })}
        </Grid>
      )}

      <Dialog open={Boolean(editing)} onClose={() => !saving && setEditing(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
        {editing && <Box component="form" onSubmit={save}>
          <DialogTitle sx={{ pb: 1 }}><Typography sx={{ fontSize: 21, fontWeight: 850, color: "#0f172a" }}>ویرایش {editing.title}</Typography><Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>{targetLabel(editing.target)} · برای حفظ مقدار فعلی، فیلدهای محرمانه را خالی بگذارید.</Typography></DialogTitle>
          <DialogContent dividers><Stack spacing={2} sx={{ pt: 0.5 }}>{editing.fields.map((field) => {
            if (field.type === "boolean") return <TextField key={field.key} select fullWidth label={field.label} value={drafts[field.key] ?? ""} onChange={(event) => updateDraft(field.key, event.target.value)} helperText={`${field.key} · خالی برای استفاده از مقدار پیش‌فرض`} disabled={saving}><MenuItem value=""><em>خالی / پیش‌فرض برنامه</em></MenuItem><MenuItem value="true">true</MenuItem><MenuItem value="false">false</MenuItem></TextField>;
            const isVisible = Boolean(visible[field.key]);
            return <Box key={field.key}><TextField fullWidth label={field.label} type={field.type === "secret" && !isVisible ? "password" : field.type === "number" ? "number" : "text"} value={drafts[field.key] ?? ""} onChange={(event) => updateDraft(field.key, event.target.value)} placeholder={field.type === "secret" ? (field.configured ? "مقدار جدید را وارد کنید یا خالی بگذارید" : "مقدار را وارد کنید") : ""} helperText={`${field.key}${field.type === "secret" ? " · مقدار محرمانه مخفی است" : ""}`} disabled={saving || clears[field.key]} multiline={field.key.includes("GREETING") || field.key.includes("FALLBACK") || field.key.includes("ERROR")} minRows={3} InputProps={field.type === "secret" ? { endAdornment: <InputAdornment position="end"><IconButton aria-label={isVisible ? `پنهان کردن ${field.label}` : `نمایش ${field.label}`} onClick={() => setVisible((current) => ({ ...current, [field.key]: !isVisible }))} edge="end" disabled={saving}>{isVisible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}</IconButton></InputAdornment> } : undefined} />{field.type === "secret" && field.configured && <FormControlLabel control={<Checkbox size="small" checked={Boolean(clears[field.key])} onChange={(event) => { setClears((current) => ({ ...current, [field.key]: event.target.checked })); if (event.target.checked) setDrafts((current) => ({ ...current, [field.key]: "" })); }} disabled={saving} />} label={<Typography sx={{ fontSize: 12, color: "#64748b" }}>پاک کردن مقدار فعلی</Typography>} />}</Box>;
          })}</Stack></DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={() => setEditing(null)} disabled={saving}>انصراف</Button><Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <EditOutlinedIcon />} sx={{ borderRadius: 2, fontWeight: 800 }}>{saving ? "در حال ذخیره" : "ذخیره تغییرات"}</Button></DialogActions>
        </Box>}
      </Dialog>
    </Box>
  );
}
