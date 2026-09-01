"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Chip, Container, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const statuses = ["New", "Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
const priorities = ["Low", "Normal", "High", "Urgent"];
const statusLabels = { New: "جدید", Open: "باز", "In Progress": "در حال رسیدگی", "Waiting for Customer": "در انتظار مشتری", Resolved: "حل‌شده", Closed: "بسته‌شده" };
const priorityLabels = { Low: "کم", Normal: "عادی", High: "زیاد", Urgent: "فوری" };

export default function AdminTicketList() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);

    fetch(`/api/support/admin/tickets?${params.toString()}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : response.json().then((data) => Promise.reject(new Error(String(data.error || "").match(/[\u0600-\u06ff]/) ? data.error : "بارگذاری تیکت‌ها ممکن نیست."))))
      .then((data) => setTickets(data.tickets || []))
      .catch((loadError) => setError(loadError.message));
  };

  // Search is submitted explicitly; status and priority changes refresh immediately.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status, priority]);

  return (
    <Box component="main" sx={{ bgcolor: "#f8fafc", minHeight: "100vh", py: 4, color: "#0f172a" }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ color: "var(--color-primary)", fontWeight: 800, letterSpacing: "0.14em" }}>مدیریت پشتیبانی</Typography>
            <Typography component="h1" sx={{ fontWeight: 850, fontSize: { xs: "2.5rem", md: "4rem" }, letterSpacing: "-0.05em", lineHeight: 1 }}>تیکت‌های پشتیبانی</Typography>
            <Typography sx={{ color: "#64748b", mt: 1 }}>گفت‌وگوهای مشتریان را جست‌وجو، اولویت‌بندی و پیگیری کنید.</Typography>
          </Box>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ alignSelf: "flex-start", textTransform: "none" }}>داشبورد</Button>
        </Stack>

        <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              label="جست‌وجوی تیکت، مشتری یا موضوع"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && load()}
              InputProps={{ endAdornment: <Button onClick={load} startIcon={<SearchIcon />} sx={{ textTransform: "none" }}>جست‌وجو</Button> }}
            />
            <TextField select size="small" label="وضعیت" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 210 }}>
              <MenuItem value="">همه وضعیت‌ها</MenuItem>
              {statuses.map((item) => <MenuItem key={item} value={item}>{statusLabels[item]}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="اولویت" value={priority} onChange={(event) => setPriority(event.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">همه اولویت‌ها</MenuItem>
              {priorities.map((item) => <MenuItem key={item} value={item}>{priorityLabels[item]}</MenuItem>)}
            </TextField>
          </Stack>
        </Paper>

        {error && <Typography sx={{ color: "#b91c1c", mb: 2 }}>{error}</Typography>}

        <Stack spacing={1}>
          {tickets.map((ticket) => (
            <Paper
              key={ticket.id}
              component={Link}
              href={`/dashboard/tikects/${ticket.id}`}
              elevation={0}
              sx={{ display: "block", textDecoration: "none", color: "inherit", p: 2, border: "1px solid #e2e8f0", "&:hover": { borderColor: "#93c5fd", bgcolor: "#f8fbff" } }}
            >
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography sx={{ color: "var(--color-primary)", fontSize: 12, fontWeight: 800 }}>{ticket.ticketNumber}</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{ticket.subject}</Typography>
                  <Typography sx={{ color: "#64748b", fontSize: 13 }}>{ticket.customerName} · {ticket.customerEmail} · {ticket.category}</Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={priorityLabels[ticket.priority] || ticket.priority} color={ticket.priority === "Urgent" ? "error" : "default"} />
                  <Chip size="small" label={statusLabels[ticket.status] || ticket.status} />
                </Stack>
              </Stack>
            </Paper>
          ))}
          {tickets.length === 0 && <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px dashed #cbd5e1" }}><Typography sx={{ color: "#64748b" }}>تیکتی با این فیلترها پیدا نشد.</Typography></Paper>}
        </Stack>
      </Container>
    </Box>
  );
}
