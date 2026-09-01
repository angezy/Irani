"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Avatar from '@mui/material/Avatar'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from '../lib/notifications'
import styles from './register.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '', emailMarketing: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  // restore saved form from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('registerForm')
      if (raw) {
        queueMicrotask(() => setForm(JSON.parse(raw)))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  function validate() {
    const e = {}
    if (!form.username || form.username.length < 3) e.username = 'نام کاربری باید حداقل ۳ نویسه باشد'
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'نشانی ایمیل معتبر نیست'
    if (!form.password || form.password.length < 8 || form.password.length > 128) e.password = 'رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد'
    return e
  }

  const onChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
    try {
      const next = { ...form, [field]: e.target.value }
      localStorage.setItem('registerForm', JSON.stringify(next))
    } catch (err) {
      // ignore
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const eObj = validate()
    if (Object.keys(eObj).length) return setErrors(eObj)

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.status === 201) {
        localStorage.removeItem('registerForm')
        toast.success('ثبت‌نام انجام شد', { description: 'حساب شما ساخته شد؛ در حال انتقال به صفحه ورود…', duration: 1500 })
        router.push('/signin')
        return
      }
      // Robust parsing: only call res.json() when content-type is JSON
      const contentType = res.headers.get('content-type') || ''
      let message = 'خطایی رخ داد'

      if (res.redirected) {
        message = 'سرور درخواست را به نشانی دیگری هدایت کرد: ' + res.url
      } else if (contentType.includes('application/json')) {
        try {
          const body = await res.json()
          message = body.error || body.message || message
        } catch (parseErr) {
          message = 'پاسخ نامعتبر از سرور دریافت شد'
        }
      } else {
        // attempt to read plain text (HTML or plain error message)
        try {
          const txt = await res.text()
          message = txt ? txt : message
        } catch (textErr) {
          // fallback
        }
      }

      setServerError(message)
      toast.error('ثبت‌نام ناموفق بود', { description: message })
    } catch (err) {
      const message = 'ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید'
      setServerError(message)
      toast.error('خطای ارتباطی', { description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="sm" className={styles.container}>
      <Box className={styles.card}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" className={styles.title}>
          ثبت‌نام
        </Typography>

        {serverError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={onSubmit} className={styles.form}>
          <TextField
            label="نام کاربری"
            value={form.username}
            onChange={onChange('username')}
            fullWidth
            margin="normal"
            error={!!errors.username}
            helperText={errors.username}
          />
          <TextField
            label="ایمیل"
            value={form.email}
            onChange={onChange('email')}
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email}
          />
          <FormControlLabel
            control={<Checkbox checked={Boolean(form.emailMarketing)} onChange={(event) => setForm(prev => ({ ...prev, emailMarketing: event.target.checked }))} />}
            label="خبرها و پیشنهادهای محصولات Weluxo را برایم ارسال کنید"
          />
          <TextField
            label="رمز عبور"
            type="password"
            value={form.password}
            onChange={onChange('password')}
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'ثبت‌نام'}
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => router.push('/signin')}
          >
            حساب دارید؟ وارد شوید
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
