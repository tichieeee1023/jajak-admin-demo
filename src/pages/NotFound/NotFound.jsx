import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './NotFound.module.scss'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    const previousTitle = document.title
    document.title = '404 · 페이지를 찾을 수 없습니다 | JAJAK Admin Demo'
    return () => { document.title = previousTitle }
  }, [])

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <section className={styles.card}>
        <Link to="/admin" className={styles.brand} aria-label="JAJAK 관리자 홈">
          JAJAK <span>ADMIN DEMO</span>
        </Link>

        <div className={styles.code} aria-hidden="true">404</div>
        <p className={styles.eyebrow}>PAGE NOT FOUND</p>
        <h1 id="not-found-title">페이지를 찾을 수 없습니다.</h1>
        <p className={styles.description}>
          주소가 변경되었거나 존재하지 않는 페이지입니다.
          <br />
          주소를 확인하거나 관리자 홈으로 이동해 주세요.
        </p>

        <div className={styles.actions}>
          <Link to="/admin" className={styles.homeLink}>관리자 홈으로</Link>
          <button type="button" onClick={handleGoBack}>이전 화면</button>
        </div>
      </section>
    </main>
  )
}
