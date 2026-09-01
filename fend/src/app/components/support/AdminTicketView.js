"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Chip, Container, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SendIcon from "@mui/icons-material/Send";
import RichTextEditor from "./RichTextEditor";
import { DetailPageSkeleton } from "../LoadingSkeletons";
import { sanitizeCmsHtml } from "../../lib/contentSanitizer";
import { formatMoney } from "../../lib/locale";

const statuses = ["New", "Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
const priorities = ["Low", "Normal", "High", "Urgent"];
const categories = ["Order", "Shipping", "Payment", "Refund", "Return", "Product Question", "Warranty", "Technical Issue", "Account", "Partnership"];
const statusLabels = { New: "جدید", Open: "باز", "In Progress": "در حال رسیدگی", "Waiting for Customer": "در انتظار مشتری", Resolved: "حل‌شده", Closed: "بسته‌شده" };
const priorityLabels = { Low: "کم", Normal: "عادی", High: "زیاد", Urgent: "فوری" };
const categoryLabels = { Order: "سفارش", Shipping: "ارسال", Payment: "پرداخت", Refund: "بازپرداخت", Return: "مرجوعی", "Product Question": "پرسش درباره محصول", Warranty: "گارانتی", "Technical Issue": "مشکل فنی", Account: "حساب کاربری", Partnership: "همکاری" };
const senderLabels = { customer: "مشتری", agent: "کارشناس", admin: "مدیر", system: "سیستم" };

function htmlText(value) {
  return String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function safeMessageHtml(item) {
  const fallback = "<p>" + escapeHtml(item?.contentText) + "</p>";
  return sanitizeCmsHtml(item?.contentHtml || fallback);
}

function normalizeTicketData(value) {
  return { ...value, ticket: { ...value.ticket, messages: (value.ticket?.messages || []).map((item) => ({ ...item, contentHtml: safeMessageHtml(item) })) } };
}

export default function AdminTicketView({ ticketId }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [assignedAgentId, setAssignedAgentId] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => fetch(`/api/support/admin/tickets/${ticketId}`, { credentials: "include" })
    .then((response) => response.ok ? response.json() : response.json().then((body) => Promise.reject(new Error(String(body.error || "").match(/[\u0600-\u06ff]/) ? body.error : "بارگذاری تیکت ممکن نیست."))))
    .then((value) => {
      setData(normalizeTicketData(value));
      setStatus(value.ticket.status);
      setPriority(value.ticket.priority);
      setCategory(value.ticket.category);
      setAssignedAgentId(value.ticket.assignedAgentId || "");
      setTags((value.ticket.tags || []).join(", "));
    })
    .catch((loadError) => setError(loadError.message));

  // The ticket id is the only lifecycle input; load also initializes the control state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [ticketId]);

  const save = async () => {
    const response = await fetch(`/api/support/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, priority, category, assignedAgentId: assignedAgentId || null, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(body.error || "").match(/[\u0600-\u06ff]/) ? body.error : "به‌روزرسانی تیکت ممکن نیست.");
    setData((prev) => ({ ...(prev || {}), ticket: body.ticket }));
  };

  const send = async (event) => {
    event.preventDefault();
    if (!htmlText(draft)) return setError("پیش از ارسال، متن پیام را بنویسید.");
    setSending(true);
    setError("");
    try {
      const body = new FormData();
      body.append("contentHtml", draft);
      body.append("contentText", htmlText(draft));
      body.append("visibility", visibility);
      files.forEach((file) => body.append("attachments", file));
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, { method: "POST", body, credentials: "include" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(result.error || "").match(/[\u0600-\u06ff]/) ? result.error : "ارسال پیام ممکن نیست.");
      setData((prev) => normalizeTicketData({ ...(prev || {}), ticket: result.ticket }));
      setDraft("");
      setFiles([]);
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  };

  if (error && !data) return <Container sx={{ py: 8 }}><Alert severity="error">{error}</Alert></Container>;
  if (!data) return <DetailPageSkeleton />;

  const { ticket, customer, orders, previousTickets } = data;
  const customerValue = (orders || []).reduce((sum, order) => sum + (Number(order.Total) || 0), 0);
  return (
    <Box component="main" sx={{ bgcolor: "#f8fafc", minHeight: "100vh", py: 3, color: "#0f172a" }}>
      <Container maxWidth="xl">
        <Button component={Link} href="/admin/tickets" startIcon={<ArrowForwardIcon />} sx={{ mb: 2, textTransform: "none" }}>همه تیکت‌ها</Button>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid
            size={{
              xs: 12,
              md: 3
            }}>
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e2e8f0" }}>
              <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 800 }}>مشتری</Typography>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20 }}>{ticket.customerName}</Typography>
              <Typography sx={{ color: "#64748b", mb: 2 }}>{ticket.customerEmail}</Typography>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>پروفایل مشتری</Typography>
              <Typography sx={{ color: "#64748b", fontSize: 13 }}>شناسه کاربر: {customer?.UserID || ticket.userId || "مهمان"}</Typography>
              <Typography sx={{ color: "#64748b", fontSize: 13 }}>عضویت از: {customer?.CreatedAt ? new Date(customer.CreatedAt).toLocaleDateString("fa-IR") : "-"}</Typography>
              <Typography sx={{ color: "#64748b", fontSize: 13 }}>ارزش مشتری: {formatMoney(customerValue)}</Typography>
              <Typography sx={{ fontWeight: 800, mt: 3, mb: 1 }}>سفارش‌ها</Typography>
              {orders?.length ? orders.map((order) => <Typography key={order.OrderId} sx={{ color: "#475569", fontSize: 13, mb: 0.5 }}>#{order.OrderId} · {statusLabels[order.Status] || order.Status} · {formatMoney(order.Total)}</Typography>) : <Typography sx={{ color: "#64748b", fontSize: 13 }}>سفارش مرتبطی وجود ندارد.</Typography>}
              <Typography sx={{ fontWeight: 800, mt: 3, mb: 1 }}>تیکت‌های قبلی</Typography>
              {previousTickets?.length ? previousTickets.map((previous) => <Button key={previous.id} component={Link} href={`/admin/tickets/${previous.id}`} sx={{ display: "block", textAlign: "right", p: 0, mb: 0.75, color: "var(--color-primary)", textTransform: "none", fontSize: 12 }}>{previous.ticketNumber} · {statusLabels[previous.status] || previous.status}</Button>) : <Typography sx={{ color: "#64748b", fontSize: 13 }}>تیکت قبلی وجود ندارد.</Typography>}
              <Typography sx={{ fontWeight: 800, mt: 3, mb: 1 }}>تاریخچه تیکت</Typography>
              {ticket.events?.map((event) => <Typography key={event.id} sx={{ color: "#64748b", fontSize: 12, mb: 0.75 }}>{event.action} · {new Date(event.createdAt).toLocaleString()}</Typography>)}
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <Box sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 800 }}>{ticket.ticketNumber}</Typography>
                <Typography component="h1" sx={{ fontWeight: 850, fontSize: 25 }}>{ticket.subject}</Typography>
              </Box>
              <Box sx={{ p: 2.5, maxHeight: "60vh", overflow: "auto", bgcolor: "#fbfdff" }}>
                {ticket.messages?.map((item) => (
                  <Box key={item.id} sx={{ mb: 1.5, p: 1.75, bgcolor: item.visibility === "internal" ? "#fff7ed" : "white", border: `1px solid ${item.visibility === "internal" ? "#fed7aa" : "#e2e8f0"}`, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography sx={{ fontWeight: 800, fontSize: 12, color: item.visibility === "internal" ? "#c2410c" : "var(--color-primary)" }}>{senderLabels[item.senderType] || item.senderType} · {item.visibility === "internal" ? "داخلی" : "عمومی"}</Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: 11 }}>{new Date(item.createdAt).toLocaleString("fa-IR")}</Typography>
                    </Stack>
                    <Box sx={{ mt: 1, color: "#334155", "& p": { mt: 0, mb: 1 }, "& ul": { paddingInlineStart: "24px" } }} dangerouslySetInnerHTML={{ __html: safeMessageHtml(item) }} />
                    {item.attachments?.length > 0 && (
                      <Stack spacing={0.5} sx={{ mt: 1, pt: 1, borderTop: "1px solid #e2e8f0" }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 12 }}>پیوست‌ها</Typography>
                        {item.attachments.map((file, index) => <a key={`${file.url || "attachment"}-${index}`} href={file.url} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", fontSize: 13 }}>{file.name || "دریافت پیوست"}</a>)}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Box>
              <Box component="form" onSubmit={send} sx={{ p: 2.5, borderTop: "1px solid #e2e8f0" }}>
                <RichTextEditor label={visibility === "internal" ? "یادداشت داخلی" : "پاسخ به مشتری"} value={draft} onChange={setDraft} minHeight={220} />
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mt: 2 }}>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <TextField select size="small" label="قابل مشاهده برای" value={visibility} onChange={(event) => setVisibility(event.target.value)}><MenuItem value="public">پاسخ عمومی</MenuItem><MenuItem value="internal">یادداشت داخلی</MenuItem></TextField>
                    <Button component="label" variant="outlined" sx={{ textTransform: "none" }}>
                      افزودن پیوست
                      <input hidden multiple type="file" accept="image/*,.pdf,.txt,.docx" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
                    </Button>
                    {files.length > 0 && <Typography sx={{ color: "#64748b", fontSize: 12 }}>{files.length} فایل انتخاب شد</Typography>}
                  </Stack>
                  <Button type="submit" disabled={sending} variant="contained" startIcon={<SendIcon />} sx={{ bgcolor: "var(--color-primary)", textTransform: "none" }}>{sending ? "در حال ارسال…" : "افزودن پیام"}</Button>
                </Stack>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              </Box>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 3
            }}>
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e2e8f0" }}>
              <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 800 }}>کنترل‌های تیکت</Typography>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <TextField select fullWidth size="small" label="وضعیت" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <MenuItem key={item} value={item}>{statusLabels[item]}</MenuItem>)}</TextField>
                <TextField select fullWidth size="small" label="اولویت" value={priority} onChange={(event) => setPriority(event.target.value)}>{priorities.map((item) => <MenuItem key={item} value={item}>{priorityLabels[item]}</MenuItem>)}</TextField>
                <TextField select fullWidth size="small" label="دسته‌بندی" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <MenuItem key={item} value={item}>{categoryLabels[item]}</MenuItem>)}</TextField>
                <TextField fullWidth size="small" label="شناسه کارشناس" value={assignedAgentId} onChange={(event) => setAssignedAgentId(event.target.value)} />
                <TextField fullWidth size="small" label="برچسب‌ها (با ویرگول جدا کنید)" value={tags} onChange={(event) => setTags(event.target.value)} />
                <Button onClick={() => save().catch((saveError) => setError(saveError.message))} variant="contained" sx={{ bgcolor: "#0f172a", textTransform: "none" }}>ذخیره کنترل‌ها</Button>
              </Stack>
              <Typography sx={{ color: "#64748b", fontSize: 12, mt: 2 }}>روند رسیدگی: جدید ← باز ← در حال رسیدگی ← در انتظار مشتری ← حل‌شده ← بسته‌شده</Typography>
              <Chip label={statusLabels[ticket.status] || ticket.status} sx={{ mt: 2 }} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
