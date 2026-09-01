"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast } from "../lib/notifications";

const API_BASE = "";

const labelSx = { color: "var(--color-text-secondary)" };
const inputSx = {
  color: "var(--color-text-primary)",
  backgroundColor: "#ffffff",
  borderRadius: 1.5,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-border)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
};
const helperSx = { color: "var(--color-text-secondary)" };
const checkboxSx = {
  color: "#a0a2a5",
  "&.Mui-checked": { color: "var(--color-accent)" },
};

const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
const days = Array.from({ length: 31 }, (_, index) => String(index + 1));

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  emailMarketing: false,
  password: "",
  phone: "",
  smsMarketing: false,
  birthdayMonth: "",
  birthdayDay: "",
  zip: "",
  keepSignedIn: false,
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      setError("نام، نام خانوادگی، ایمیل و رمز عبور الزامی هستند.");
      return;
    }
    if (form.password.length < 8 || form.password.length > 32) {
      setError("رمز عبور باید بین ۸ تا ۳۲ نویسه باشد.");
      return;
    }
    if (form.smsMarketing && !form.phone.trim()) {
      setError("برای دریافت پیام‌های تبلیغاتی شماره تلفن وارد کنید یا این گزینه را انتخاب نکنید.");
      return;
    }

    setLoading(true);
    try {
      try {
        localStorage.setItem("weluxoKeepSignedIn", String(form.keepSignedIn));
      } catch (_error) {
        // Remembering the preference is optional and must not block signup.
      }

      const username = `${form.firstName.trim()}.${form.lastName.trim()}`.toLowerCase().replace(/[^a-z0-9.]+/g, "").slice(0, 100);
      const response = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, username }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "ثبت‌نام ناموفق بود");

      toast.success("حساب ساخته شد", { description: "اکنون می‌توانید وارد شوید.", duration: 1200 });
      router.push("/signin");
    } catch (submitError) {
      setError(submitError.message || "ساخت حساب انجام نشد");
      toast.error("ساخت حساب انجام نشد", { description: submitError.message || "لطفاً دوباره تلاش کنید." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", bgcolor: "var(--color-background)", color: "var(--color-text-primary)", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, border: "1px solid var(--color-border)", bgcolor: "#ffffff", boxShadow: "0 20px 60px rgba(43,43,43,0.08)" }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>حساب خود را بسازید</Typography>
            <Typography sx={{ color: "var(--color-text-secondary)", mb: 3 }}>برای تجربه خرید شخصی‌تر به فروشگاه ایرانی بپیوندید.</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="نام" value={form.firstName} onChange={handleChange("firstName")} fullWidth required InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }} />
                <TextField label="نام خانوادگی" value={form.lastName} onChange={handleChange("lastName")} fullWidth required InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }} />
              </Stack>

              <TextField label="آدرس ایمیل" type="email" value={form.email} onChange={handleChange("email")} fullWidth required autoComplete="email" InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }} />
              <FormControlLabel
                control={<Checkbox checked={Boolean(form.emailMarketing)} onChange={(event) => setForm((current) => ({ ...current, emailMarketing: event.target.checked }))} sx={checkboxSx} />}
                label={<Typography sx={{ color: "var(--color-text-primary)", fontSize: 14, fontWeight: 750 }}>اخبار محصولات و پیشنهادهای فروشگاه ایرانی را برایم ایمیل کنید.</Typography>}
                sx={{ m: 0, alignItems: "flex-start" }}
              />
              <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 12, lineHeight: 1.55, mt: -1 }}>
                این تنظیم را هر زمان از بخش تنظیمات حساب می‌توانید تغییر دهید.
              </Typography>
              <TextField label="رمز عبور (۸ تا ۳۲ نویسه)" type="password" value={form.password} onChange={handleChange("password")} fullWidth required inputProps={{ minLength: 8, maxLength: 32 }} autoComplete="new-password" helperText="از ۸ تا ۳۲ نویسه استفاده کنید." FormHelperTextProps={{ sx: helperSx }} InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <TextField label="شماره تلفن" type="tel" value={form.phone} onChange={handleChange("phone")} fullWidth autoComplete="tel" InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }} />
                <Typography sx={{ flex: 1, minWidth: 190, color: "var(--color-text-secondary)", fontSize: 12, lineHeight: 1.35, fontWeight: 700 }}>برای پیگیری آسان سفارش شماره تلفن خود را وارد کنید.</Typography>
              </Stack>

              <FormControlLabel
                control={<Checkbox checked={form.smsMarketing} onChange={(event) => setForm((current) => ({ ...current, smsMarketing: event.target.checked }))} sx={checkboxSx} />}
                label={<Typography sx={{ color: "var(--color-text-primary)", fontSize: 14, fontWeight: 750 }}>عضویت در پیامک‌های تبلیغاتی فروشگاه ایرانی.</Typography>}
                sx={{ m: 0, alignItems: "flex-start" }}
              />
              <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 12, lineHeight: 1.55, mt: -1 }}>
                با وارد کردن شماره تلفن و انتخاب این گزینه، با دریافت پیامک‌های تبلیغاتی خودکار موافقت می‌کنید. رضایت شرط خرید نیست و ممکن است هزینه پیامک اعمال شود. <MuiLink href="/privacy-policy" underline="always" sx={{ color: "var(--color-primary)" }}>حریم خصوصی</MuiLink> و <MuiLink href="/terms-conditions" underline="always" sx={{ color: "var(--color-primary)" }}>شرایط استفاده</MuiLink> را ببینید.
              </Typography>

              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ pt: 0.5 }}>
                <CakeOutlinedIcon sx={{ color: "var(--color-accent)" }} />
                <Typography sx={{ color: "var(--color-text-primary)", fontSize: 14, fontWeight: 750 }}>تاریخ تولد خود را برای دریافت هدیه سالانه وارد کنید.</Typography>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField select label="ماه" value={form.birthdayMonth} onChange={handleChange("birthdayMonth")} fullWidth InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }}>
                  {months.map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
                </TextField>
                <TextField select label="روز" value={form.birthdayDay} onChange={handleChange("birthdayDay")} fullWidth InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }}>
                  {days.map((day) => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                </TextField>
              </Stack>

              <TextField label="کد پستی (اختیاری)" value={form.zip} onChange={handleChange("zip")} fullWidth autoComplete="postal-code" InputLabelProps={{ sx: labelSx }} InputProps={{ sx: inputSx }} />

              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ marginInlineStart: -1 }}>
                <FormControlLabel
                  control={<Checkbox checked={form.keepSignedIn} onChange={(event) => setForm((current) => ({ ...current, keepSignedIn: event.target.checked }))} sx={checkboxSx} />}
                  label={<Typography sx={{ color: "var(--color-text-primary)", fontSize: 14 }}>مرا وارد نگه دار</Typography>}
                  sx={{ m: 0 }}
                />
                <Tooltip title="فقط این ترجیح ذخیره می‌شود و رمز عبور هرگز در مرورگر ذخیره نمی‌شود.">
                  <InfoOutlinedIcon sx={{ color: "var(--color-text-secondary)", fontSize: 18, cursor: "help" }} />
                </Tooltip>
              </Stack>
              <Typography sx={{ color: "var(--color-text-secondary)", fontSize: 12, lineHeight: 1.55 }}>
                با انتخاب «ساخت حساب»، <MuiLink href="/terms-conditions" underline="always" sx={{ color: "var(--color-primary)" }}>شرایط استفاده</MuiLink> و <MuiLink href="/privacy-policy" underline="always" sx={{ color: "var(--color-primary)" }}>حریم خصوصی</MuiLink> را می‌پذیرید.
              </Typography>

              <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ borderRadius: 999, py: 1.35, backgroundColor: "var(--color-primary)", color: "#ffffff", fontWeight: 800, textTransform: "none", "&:hover": { backgroundColor: "var(--color-primary-dark)" } }}>
                {loading ? "در حال ساخت..." : "ساخت حساب"}
              </Button>
              <Button variant="text" onClick={() => router.push("/signin")} sx={{ color: "var(--color-primary)" }}>حساب دارید؟ وارد شوید</Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
