"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import defaultContent from "../../../data/about.json";

export default function AboutSection({ initialContent = null, onEdit = {} }) {
  const [content, setContent] = useState(initialContent || defaultContent);

  useEffect(() => {
    if (initialContent) {
      queueMicrotask(() => setContent(initialContent));
      return;
    }
    fetch("/api/dashboard/about")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setContent(data))
      .catch(() => setContent(defaultContent));
  }, [initialContent]);

  const renderEdit = (key) =>
    onEdit[key] ? (
      <IconButton
        size="small"
        onClick={onEdit[key]}
        sx={{ position: "absolute", top: 0, right: 0, bgcolor: "var(--color-accent-soft)", color: "var(--color-primary)" }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    ) : null;

  const toStr = (val) => {
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      return val.map((item) => (typeof item === "string" ? item : item?.title || item?.copy || item?.name || "")).join("\n\n");
    }
    return "";
  };
  const data = content || defaultContent;
  const hero = data.hero || defaultContent.hero || {};
  const heroTitle = hero.title || defaultContent.hero?.title || "درباره Weluxo";
  const heroSubtitle = hero.subtitle || defaultContent.hero?.subtitle || "محصولات هوشمند، زندگی بهتر.";
  const missionText = toStr(data.mission);
  const valuesText = toStr(data.values);
  const approachText = toStr(data.approach);
  const teamText = toStr(data.team);
  const storyText = toStr(data.story);
  const cta = data.contactCta || {};
  const footerTitle = cta.title || "Weluxo";
  const footerSubtitle = cta.copy || "زندگی هوشمند، انتخاب‌های بهتر.";

  return (
    <Box sx={{ fontFamily: "var(--site-font-family, 'Space Grotesk','Segoe UI',sans-serif)", bgcolor: "var(--color-background)", color: "var(--color-text-primary)", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        {/* Header / Hero */}
        <Box sx={{ textAlign: "center", mb: 6, position: "relative" }}>
          {renderEdit("hero")}
          <Typography
            variant="overline"
            sx={{ color: "var(--color-accent)", letterSpacing: 2, fontSize: "0.8rem", mb: 1, display: "block" }}
          >
            درباره ما
          </Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            {heroTitle}
          </Typography>
          <Typography variant="h5" fontWeight={600} sx={{ color: "var(--color-primary)" }}>
            {heroSubtitle}
          </Typography>
        </Box>

        {/* Section 1: About Weluxo (mission) */}
        {missionText && (
          <Box sx={{ mb: 5, position: "relative" }}>
            {renderEdit("mission")}
            {missionText.split("\n\n").map((paragraph, i) => (
              <Typography key={i} variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8, mb: 2 }}>
                {paragraph}
              </Typography>
            ))}
          </Box>
        )}

        {/* Section 2: Our Philosophy (values) */}
        {valuesText && (
          <Box sx={{ mb: 5, position: "relative" }}>
            {renderEdit("values")}
            <Typography variant="h4" fontWeight={700} gutterBottom>
              فلسفه ما
            </Typography>
            {valuesText.split("\n\n").map((paragraph, i) => (
              <Typography key={i} variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8, mb: 2 }}>
                {paragraph}
              </Typography>
            ))}
            <Box sx={{ pl: 3, mt: 1 }}>
              <Typography variant="body1" sx={{ color: "var(--color-primary)", lineHeight: 2 }}>
                {"\u2022"} کیفیت مهم‌تر از کمیت است.
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-primary)", lineHeight: 2 }}>
                {"\u2022"} کارایی مهم‌تر از زرق‌وبرق است.
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-primary)", lineHeight: 2 }}>
                {"\u2022"} تجربه مشتری برای ما اولویت دارد.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Section 3: Our Commitment (approach) */}
        {approachText && (
          <Box sx={{ mb: 5, position: "relative" }}>
            {renderEdit("approach")}
            <Typography variant="h4" fontWeight={700} gutterBottom>
              تعهد ما
            </Typography>
            {approachText.split("\n\n").map((paragraph, i) => (
              <Typography key={i} variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8, mb: 2 }}>
                {paragraph}
              </Typography>
            ))}
          </Box>
        )}

        {/* Section 4: Why Customers Choose Weluxo (team) */}
        {teamText && (
          <Box sx={{ mb: 5, position: "relative" }}>
            {renderEdit("team")}
            <Typography variant="h4" fontWeight={700} gutterBottom>
              چرا مشتریان Weluxo را انتخاب می‌کنند
            </Typography>
            {teamText.split("\n\n").map((paragraph, i) => (
              <Typography key={i} variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8, mb: 2 }}>
                {paragraph}
              </Typography>
            ))}
            <Box sx={{ pl: 3, mt: 1 }}>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} مجموعه‌های محصول با دقت انتخاب‌شده
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} راهکارهای مدرن و کاربردی روزمره
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} پرداخت امن و محافظت‌شده
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} ارسال به سراسر کشور
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} پشتیبانی پاسخ‌گو
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} بهبود مستمر کیفیت
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 2 }}>
                {"\u2022"} رویکرد مشتری‌محور
              </Typography>
            </Box>
          </Box>
        )}

        {/* Section 5: Looking Ahead (story) */}
        {storyText && (
          <Box sx={{ mb: 5, position: "relative" }}>
            {renderEdit("story")}
            <Typography variant="h4" fontWeight={700} gutterBottom>
              چشم‌انداز آینده
            </Typography>
            {storyText.split("\n\n").map((paragraph, i) => (
              <Typography key={i} variant="body1" sx={{ color: "var(--color-text-secondary)", lineHeight: 1.8, mb: 2 }}>
                {paragraph}
              </Typography>
            ))}
          </Box>
        )}

        {/* Footer Signature (contactCta) */}
        <Box sx={{ textAlign: "center", mt: 6, position: "relative" }}>
          {renderEdit("contactCta")}
          <Typography variant="h5" fontWeight={700} sx={{ color: "var(--color-primary)" }}>
            {footerTitle}
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--color-text-secondary)", mt: 1 }}>
            {footerSubtitle}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
