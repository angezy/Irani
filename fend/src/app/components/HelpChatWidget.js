"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Box, Button, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import { useSiteSettings } from "./SiteThemeProvider";
import { clearLiveChatSession, loadSessionChatMessages, saveSessionChatMessages } from "../lib/chatSession";

const DEFAULT_CHAT_STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "فروشگاه شما";
const DEFAULT_CONFIG = {
  enabled: true,
  title: `پشتیبانی هوشمند ${DEFAULT_CHAT_STORE_NAME}`,
  subtitle: `پاسخ‌ها از کتابخانه راهنمای ${DEFAULT_CHAT_STORE_NAME}`,
  greeting: `سلام؛ من پشتیبان هوشمند ${DEFAULT_CHAT_STORE_NAME} هستم. امروز برای پیدا کردن چه چیزی کمک می‌خواهید؟`,
  placeholder: "درباره سفارش یا ارسال بپرسید…",
  triggerLabel: "باز کردن گفت‌وگوی زنده",
  thinking: "در حال بررسی…",
  error: "در حال حاضر دسترسی به پشتیبانی ممکن نیست. دوباره تلاش کنید.",
};

function createConversationId() {
  if (typeof window === "undefined") return "";
  try {
    const generated = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem("weluxoChatConversationId", generated);
    return generated;
  } catch (_error) {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

function getConversationId() {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem("weluxoChatConversationId") || createConversationId();
  } catch (_error) {
    return createConversationId();
  }
}

function getStoredVisitor() {
  if (typeof window === "undefined") return { name: "", email: "" };
  try {
    const value = JSON.parse(window.sessionStorage.getItem("weluxoChatVisitor") || "null");
    return value && typeof value === "object" ? { name: value.name || "", email: value.email || "" } : { name: "", email: "" };
  } catch (_error) {
    return { name: "", email: "" };
  }
}

function greetingMessage(text) {
  return { role: "assistant", text, system: true };
}

function cleanVisitorValue(value, max) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function lastSeenAgentStorageKey(conversationId) {
  return `weluxoChatLastSeenAgentId:${conversationId}`;
}

function getLastSeenAgentId(conversationId) {
  if (typeof window === "undefined") return 0;
  try {
    return Math.max(0, Number(window.sessionStorage.getItem(lastSeenAgentStorageKey(conversationId))) || 0);
  } catch (_error) {
    return 0;
  }
}

function getStoredConversationToken() {
  if (typeof window === "undefined") return "";
  try { return window.sessionStorage.getItem("weluxoChatConversationToken") || ""; } catch (_error) { return ""; }
}

export default function HelpChatWidget({ floating = true, initialOpen = false, triggerLabel }) {
  const siteSettings = useSiteSettings();
  const messagesContainerRef = useRef(null);
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [conversationId, setConversationId] = useState(getConversationId);
  const [conversationToken, setConversationToken] = useState(getStoredConversationToken);
  const [visitor, setVisitor] = useState(getStoredVisitor);
  const [signedIn, setSignedIn] = useState(false);
  const [visitorChecked, setVisitorChecked] = useState(false);
  const [visitorError, setVisitorError] = useState("");
  const [started, setStarted] = useState(() => Boolean(getStoredConversationToken()));
  const [starting, setStarting] = useState(false);
  const [humanSupportEnabled, setHumanSupportEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("weluxoChatHumanSupport") === "true";
  });
  const [lastReplyId, setLastReplyId] = useState(0);
  const [latestAgentId, setLatestAgentId] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState(() => [
    greetingMessage(DEFAULT_CONFIG.greeting),
    ...loadSessionChatMessages(conversationId),
  ]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/chat/config").then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([data]) => {
        if (!active) return;
        const configured = data || {};
        const site = siteSettings;
        const nextConfig = {
          ...DEFAULT_CONFIG,
          ...configured,
          title: configured.title && configured.title !== DEFAULT_CONFIG.title ? configured.title : `پشتیبانی هوشمند ${site.siteName}`,
          subtitle: configured.subtitle && configured.subtitle !== DEFAULT_CONFIG.subtitle ? configured.subtitle : `پاسخ‌ها از کتابخانه راهنمای ${site.siteName}`,
          greeting: configured.greeting && configured.greeting !== DEFAULT_CONFIG.greeting ? configured.greeting : `سلام؛ من پشتیبان هوشمند ${site.siteName} هستم. امروز برای پیدا کردن چه چیزی کمک می‌خواهید؟`,
          fallback: configured.fallback && configured.fallback !== DEFAULT_CONFIG.fallback ? configured.fallback : `پاسخ دقیقی در راهنمای ${site.siteName} پیدا نشد. درباره ارسال، سفارش، مرجوعی، پرداخت، محصولات یا حساب خود بپرسید.`,
        };
        setConfig(nextConfig);
        setMessages((current) => current.map((message, index) => (
          index === 0 && message.system
            ? { ...message, text: nextConfig.greeting || message.text }
            : message
        )));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [siteSettings]);

  useEffect(() => {
    let active = true;
    fetch("/api/session", { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        const account = data?.user;
        if (account) {
          setSignedIn(true);
          setVisitor((current) => ({
            name: cleanVisitorValue(account.name || account.username || current.name, 200),
            email: cleanVisitorValue(account.email || current.email, 255).toLowerCase(),
          }));
        }
      })
      .catch(() => undefined)
      .finally(() => { if (active) setVisitorChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!started || !conversationId) return;
    saveSessionChatMessages(conversationId, messages);
  }, [conversationId, messages, started]);

  useEffect(() => {
    if (!started || !conversationId) return undefined;
    let active = true;

    const loadHistory = async () => {
      setHistoryLoaded(false);
      try {
        const response = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`, {
          cache: "no-store",
          headers: { "X-Chat-Session-Token": conversationToken },
        });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok || !Array.isArray(data.messages)) return;
        const history = data.messages
          .filter((message) => message?.text && (message.senderType === "customer" || message.senderType === "assistant" || message.senderType === "agent"))
          .map((message) => ({
            role: message.senderType === "customer" ? "user" : "assistant",
            senderType: message.senderType,
            text: message.text,
            messageId: message.id,
            createdAt: message.createdAt,
          }));
        const newestMessageId = Math.max(0, ...history.map((message) => Number(message.messageId) || 0));
        const agentMessages = history.filter((message) => message.senderType === "agent");
        const newestAgentId = Math.max(0, ...agentMessages.map((message) => Number(message.messageId) || 0));
        const lastSeenAgentId = getLastSeenAgentId(conversationId);
        if (history.length) {
          setMessages((current) => [greetingMessage(current[0]?.system ? current[0].text : DEFAULT_CONFIG.greeting), ...history]);
        }
        setLastReplyId(newestMessageId);
        setLatestAgentId(newestAgentId);
        setUnreadCount(agentMessages.filter((message) => Number(message.messageId) > lastSeenAgentId).length);
      } catch (_error) {
        // Keep the chat usable if history is temporarily unavailable.
      } finally {
        if (active) setHistoryLoaded(true);
      }
    };

    loadHistory();
    return () => { active = false; };
  }, [conversationId, conversationToken, started]);

  useEffect(() => {
    if (!humanSupportEnabled || !conversationId || !historyLoaded) return undefined;
    let active = true;
    let requestInFlight = false;

    const pollReplies = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(`/api/chat/replies?conversationId=${encodeURIComponent(conversationId)}&afterId=${lastReplyId}`, {
          cache: "no-store",
          headers: { "X-Chat-Session-Token": conversationToken },
        });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok || !Array.isArray(data.messages) || data.messages.length === 0) return;
        const replies = data.messages.filter((message) => message?.text).map((message) => ({ role: "assistant", text: message.text, messageId: message.id }));
        if (!replies.length) return;
        setMessages((current) => {
          const knownIds = new Set(current.map((message) => String(message.messageId || "")).filter(Boolean));
          return [...current, ...replies.filter((message) => !knownIds.has(String(message.messageId)))];
        });
        const newestAgentId = Math.max(lastReplyId, ...replies.map((message) => Number(message.messageId) || 0));
        setLastReplyId(newestAgentId);
        setLatestAgentId((current) => Math.max(current, newestAgentId));
        setUnreadCount((current) => current + replies.length);
      } catch (_error) {
        // Polling is best effort; the normal chat remains usable if Telegram is offline.
      } finally {
        requestInFlight = false;
      }
    };

    pollReplies();
    const interval = window.setInterval(pollReplies, 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [conversationId, conversationToken, historyLoaded, humanSupportEnabled, lastReplyId]);

  useEffect(() => {
    if (!open || !started || !messagesContainerRef.current) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, open, sending, started]);

  function dismissNewMessageNotice() {
    setUnreadCount(0);
    try {
      window.sessionStorage.setItem(lastSeenAgentStorageKey(conversationId), String(latestAgentId));
    } catch (_storageError) {
      // Session storage is optional.
    }
  }

  function resetExpiredChatSession() {
    clearLiveChatSession();
    const nextConversationId = createConversationId();
    setConversationId(nextConversationId);
    setConversationToken("");
    setStarted(false);
    setHumanSupportEnabled(false);
    setLastReplyId(0);
    setLatestAgentId(0);
    setUnreadCount(0);
    setHistoryLoaded(false);
    setMessages([greetingMessage(config.greeting)]);
    return nextConversationId;
  }

  function startNewAIChat() {
    if (sending || starting) return;
    resetExpiredChatSession();
    setConfig((current) => ({
      ...current,
      title: current.title.endsWith(" Support") ? `${current.title.slice(0, -" Support".length)} AI Concierge` : current.title,
      subtitle: current.subtitle === "A team member will reply from Telegram" ? `Answers from the ${siteSettings.siteName} help library` : current.subtitle,
    }));
  }

  function updateVisitor(field, value) {
    setVisitor((current) => ({ ...current, [field]: value }));
    setVisitorError("");
  }

  function validGuestDetails() {
    return Boolean(visitor.name.trim()) && /^\S+@\S+\.\S+$/.test(visitor.email.trim());
  }

  async function startChat({ fresh = false } = {}) {
    const targetConversationId = fresh ? resetExpiredChatSession() : conversationId;
    const targetConversationToken = fresh ? "" : conversationToken;
    const name = visitor.name.trim();
    const email = visitor.email.trim().toLowerCase();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter your name and a valid email address before starting the chat.");
    setStarting(true);
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: targetConversationId, conversationToken: targetConversationToken, name, email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "شروع گفت‌وگوی زنده ممکن نیست");
      const savedVisitor = { name: data.visitor?.name || name, email: data.visitor?.email || email };
      setConversationId(targetConversationId);
      setConversationToken(data.conversationToken);
      setVisitor(savedVisitor);
      setStarted(true);
      setHumanSupportEnabled(false);
      setMessages((current) => current.length ? current : [greetingMessage(config.greeting)]);
      setLastReplyId(0);
      setLatestAgentId(0);
      setUnreadCount(0);
      setHistoryLoaded(false);
      try {
        window.sessionStorage.setItem("weluxoChatVisitor", JSON.stringify(savedVisitor));
        window.sessionStorage.setItem("weluxoChatHumanSupport", "false");
        window.sessionStorage.setItem("weluxoChatConversationToken", data.conversationToken);
      } catch (_storageError) {
        // Session storage is optional.
      }
      return { conversationId: targetConversationId, conversationToken: data.conversationToken };
    } catch (error) {
      throw error;
    } finally {
      setStarting(false);
    }
  }

  async function ensureStarted() {
    if (started && conversationToken) return { conversationId, conversationToken };
    const session = await startChat();
    if (!session?.conversationToken) throw new Error("شروع گفت‌وگو ممکن نیست");
    return session;
  }

  async function submitChatRequest(payload) {
    let session = await ensureStarted();
    const send = async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, conversationId: session.conversationId, conversationToken: session.conversationToken }),
      });
      return { response, data: await response.json().catch(() => ({})) };
    };

    let result = await send();
    let restarted = false;
    if (result.response.status === 403 && /chat session proof/i.test(result.data?.error || "")) {
      session = await startChat({ fresh: true });
      result = await send();
      restarted = true;
    }
    return { ...result, restarted };
  }

  async function sendMessage(event) {
    event?.preventDefault();
    const message = input.trim();
    if (!message || sending) return;
    if (!signedIn && !validGuestDetails()) {
      setVisitorError("پیش از ارسال پیام، نام و ایمیل معتبر خود را وارد کنید.");
      return;
    }
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setSending(true);
    try {
      const { response, data, restarted } = await submitChatRequest({ message, name: visitor.name, email: visitor.email, handoffActive: humanSupportEnabled });
      if (!response.ok) throw new Error(data.error || config.error);
      if (data.humanSupport) {
        setHumanSupportEnabled(true);
        setConfig((current) => ({ ...current, title: `${current.title.replace(/ AI Concierge$/, "")} Support`, subtitle: "A team member will reply from Telegram" }));
        try { window.sessionStorage.setItem("weluxoChatHumanSupport", "true"); } catch (_storageError) {}
      }
      setMessages((current) => [...current, ...(restarted ? [{ role: "user", text: message }] : []), { role: "assistant", text: data.reply || config.error }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message || config.error }]);
    } finally {
      setSending(false);
    }
  }

  const panelSx = floating
    ? { position: "fixed", right: { xs: 12, md: 28 }, bottom: { xs: 72, md: 78 }, width: { xs: "calc(100vw - 24px)", sm: 360 }, zIndex: 1301 }
    : { position: "absolute", left: 0, top: "calc(100% + 10px)", width: { xs: "calc(100vw - 48px)", sm: 360 }, maxWidth: "calc(100vw - 48px)", zIndex: 20 };

  if (!config.enabled) return null;

  return (
    <Box sx={{ position: floating ? "static" : "relative", display: "inline-block" }}>
      {!open && (
        floating ? (
          <Tooltip title={triggerLabel || config.triggerLabel} placement="left">
            <Badge badgeContent={unreadCount} color="error" max={9} overlap="circular" sx={{ position: "fixed", right: { xs: 14, md: 28 }, bottom: { xs: 16, md: 24 }, zIndex: 1300 }}>
              <IconButton type="button" onClick={() => setOpen(true)} aria-label={triggerLabel || config.triggerLabel} sx={{ width: 48, height: 48, bgcolor: "var(--color-primary)", color: "#ffffff", boxShadow: "0 12px 28px color-mix(in srgb, var(--color-primary) 28%, transparent)", "&:hover": { bgcolor: "var(--color-primary-dark)" } }}>
                <SupportAgentOutlinedIcon />
              </IconButton>
            </Badge>
          </Tooltip>
        ) : (
          <Badge badgeContent={unreadCount} color="error" max={9}>
            <Button type="button" onClick={() => setOpen(true)} startIcon={<SupportAgentOutlinedIcon />} sx={{ bgcolor: "var(--color-primary)", color: "#ffffff", borderRadius: 999, px: 2, py: 1.2, textTransform: "none", fontWeight: 800, boxShadow: "none", "&:hover": { bgcolor: "var(--color-primary-dark)" } }}>
              {triggerLabel || config.triggerLabel}
            </Button>
          </Badge>
        )
      )}
      {open && (
        <Paper elevation={12} sx={{ ...panelSx, overflow: "hidden", borderRadius: 3, border: "1px solid var(--color-border)" }}>
          <Box sx={{ bgcolor: "var(--color-primary)", color: "#ffffff", px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box><Typography sx={{ fontWeight: 850, fontSize: 15 }}>{config.title}</Typography><Typography sx={{ color: "#dbe8ff", fontSize: 11 }}>{config.subtitle}</Typography></Box>
            <Stack direction="row" spacing={0.25}>
              {humanSupportEnabled && (
                <Tooltip title="شروع گفت‌وگوی هوشمند جدید">
                  <IconButton size="small" aria-label="شروع گفت‌وگوی هوشمند جدید" onClick={startNewAIChat} sx={{ color: "white" }}><RestartAltRoundedIcon fontSize="small" /></IconButton>
                </Tooltip>
              )}
              <IconButton size="small" aria-label="بستن گفت‌وگو" onClick={() => setOpen(false)} sx={{ color: "white" }}><CloseRoundedIcon fontSize="small" /></IconButton>
            </Stack>
          </Box>
          <>
              {unreadCount > 0 && (
                <Box role="status" sx={{ px: 1.5, py: 1, bgcolor: "#b42318", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                    {unreadCount === 1 ? "پیام جدید دریافت شد" : `${unreadCount} پیام جدید دریافت شد`}
                  </Typography>
                  <Button type="button" size="small" onClick={dismissNewMessageNotice} sx={{ minWidth: 0, color: "#ffffff", borderColor: "rgba(255,255,255,0.7)", textTransform: "none", fontSize: 11 }} variant="outlined">
                    علامت‌گذاری به‌عنوان خوانده‌شده
                  </Button>
                </Box>
              )}
              <Stack ref={messagesContainerRef} spacing={1} sx={{ p: 1.5, height: 280, overflowY: "auto", bgcolor: "var(--color-background)" }} aria-live="polite">
                {messages.map((message, index) => (
                  <Box key={message.messageId ? `message-${message.messageId}` : `${message.role}-${index}`} sx={{ alignSelf: message.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", px: 1.25, py: 1, borderRadius: message.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", bgcolor: message.role === "user" ? "var(--color-primary-soft)" : "#ffffff", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
                    <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{message.text}</Typography>
                  </Box>
                ))}
                {sending && <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{config.thinking}</Typography>}
              </Stack>
              {visitorChecked && !signedIn && (
                <Box sx={{ px: 1.5, py: 1.25, bgcolor: "#ffffff", borderTop: "1px solid var(--color-border)" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.75 }}>پیش از شروع، نام و ایمیل خود را وارد کنید.</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField size="small" required fullWidth label="نام شما" value={visitor.name} onChange={(event) => updateVisitor("name", event.target.value)} autoComplete="name" />
                    <TextField size="small" required fullWidth type="email" label="نشانی ایمیل" value={visitor.email} onChange={(event) => updateVisitor("email", event.target.value)} autoComplete="email" />
                  </Stack>
                  {visitorError && <Typography role="alert" sx={{ mt: 0.75, color: "#b42318", fontSize: 12 }}>{visitorError}</Typography>}
                </Box>
              )}
              <Box component="form" onSubmit={sendMessage} sx={{ display: "flex", gap: 1, p: 1.25, bgcolor: "#ffffff", borderTop: "1px solid var(--color-border)" }}>
                <TextField size="small" fullWidth value={input} onChange={(event) => setInput(event.target.value)} placeholder={config.placeholder} aria-label={config.placeholder} />
                <IconButton type="submit" aria-label="ارسال پیام" disabled={!input.trim() || sending} sx={{ bgcolor: "var(--color-accent)", color: "var(--color-text-primary)", borderRadius: 2, "&:hover": { bgcolor: "var(--color-accent-dark)" } }}><SendRoundedIcon fontSize="small" /></IconButton>
              </Box>
            </>
        </Paper>
      )}
    </Box>
  );
}
