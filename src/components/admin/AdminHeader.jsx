import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import styles from './AdminHeader.module.scss'


const SITE_LINKS = [{label:'대시보드',to:'/admin'},{label:'상품 관리',to:'/admin/products'},{label:'주문 관리',to:'/admin/orders'},{label:'이벤트 관리',to:'/admin/events'}]


const AdminHeader = () => {
  const navigate = useNavigate()

  const [isShortcutOpen, setIsShortcutOpen] = useState(false)

  const shortcutRef = useRef(null)


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        shortcutRef.current
        && !shortcutRef.current.contains(event.target)
      ) {
        setIsShortcutOpen(false)
      }
    }


    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsShortcutOpen(false)
      }
    }


    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)


    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])


  const handleLogout = async () => {
    try {
      // Local navigation only.

      navigate('/admin')
    } catch (error) {
      console.error('데모 이동 실패:', error)
    }
  }


  const handleToggleShortcut = () => {
    setIsShortcutOpen((prev) => !prev)
  }


  const handleLinkClick = () => {
    setIsShortcutOpen(false)
  }


  return (
    <header className={styles.adminHeader}>
      <div className={styles.inner}>

        {/* 로고 */}
        <Link
          to="/admin"
          className={styles.logoArea}
        >
          <span className={styles.logo}>
            JAJAK
          </span>

          <span className={styles.adminLabel}>
            ADMIN
          </span>
        </Link>


        {/* 우측 메뉴 */}
        <div className={styles.rightArea}>

          {/* 데모 홈 */}
          <button
            type="button"
            className={styles.headerAction}
            onClick={handleLogout}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>

            <span>
              데모 홈
            </span>
          </button>


          {/* 데모 바로가기 */}
          <div
            ref={shortcutRef}
            className={styles.shortcutWrap}
          >
            <button
              type="button"
              className={`
                ${styles.headerAction}
                ${styles.shortcutButton}
                ${isShortcutOpen ? styles.active : ''}
              `}
              onClick={handleToggleShortcut}
              aria-haspopup="menu"
              aria-expanded={isShortcutOpen}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 11.5L12 4l9 7.5" />
                <path d="M5.5 10v10h13V10" />
                <path d="M9.5 20v-6h5v6" />
              </svg>

              <span>
                데모 바로가기
              </span>

              <i
                className={`
                  ${styles.chevron}
                  ${isShortcutOpen ? styles.chevronOpen : ''}
                `}
                aria-hidden="true"
              />
            </button>


            {isShortcutOpen && (
              <div className={styles.dropdownLayer}>
                <nav
                  className={styles.shortcutMenu}
                  aria-label="데모 바로가기"
                >
                  <div className={styles.menuHeader}>
                    <span>
                      JAJAK
                    </span>

                    <strong>
                      데모 바로가기
                    </strong>
                  </div>


                  <div className={styles.menuList}>
                    {SITE_LINKS.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        state={item.state}
                        className={styles.menuItem}
                        onClick={handleLinkClick}
                      >
                        <span>
                          {item.label}
                        </span>

                        <span
                          className={styles.menuArrow}
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  )
}


export default AdminHeader