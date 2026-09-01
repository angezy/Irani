import React from 'react'
import styles from './link.module.css'
import Link from 'next/link'

export default function LinkBlogManager() {
  return (
    <Link className={styles.link} href="/dashboard/blogManager">
      مدیریت وبلاگ
    </Link>
  )
}
