import { aiLogs as mockLogs } from '../../demo/data/catalog'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js'
import {
  Bar,
  Radar,
} from 'react-chartjs-2'

import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminPanel from '../../components/admin/AdminPanel'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminSummaryCard from '../../components/admin/AdminSummaryCard'

import styles from './AiLogManage.module.scss'


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
)


const PAGE_SIZE = 8


// ========================================
// 시연용 AI 추천 기록
// ========================================



const topProducts = Object.entries(mockLogs.reduce((counts, log) => { counts[log.representativeProduct] = (counts[log.representativeProduct] ?? 0) + 1; return counts }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)


// ========================================
// 요약 아이콘
// ========================================

const SummaryIcon = ({ type }) => {
  const icons = {
    total: (
      <>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
        />
        <path d="M8 9h8M8 12h8M8 15h5" />
      </>
    ),

    week: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),

    success: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),

    fail: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m9 9 6 6M15 9l-6 6" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  )
}


// ========================================
// AI 추천 관리
// ========================================

const parseLogDate = (date) => {
  const parts = String(date || '')
    .split('.')
    .map((value) =>
      Number(value.trim())
    )
    .filter(Boolean)

  if (parts.length < 3) {
    return null
  }

  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  )
}


const AiLogManage = () => {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    memberFilter,
    setMemberFilter,
  ] = useState('all')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    selectedId,
    setSelectedId,
  ] = useState(null)

  const [
    detailStep,
    setDetailStep,
  ] = useState(1)

  const [
    topPeriod,
    setTopPeriod,
  ] = useState('all')

  const [
    activeSummaryKey,
    setActiveSummaryKey,
  ] = useState('summaryTotal')

  const detailPanelRef =
    useRef(null)


  // ========================================
  // 필터
  // ========================================

  const filteredLogs =
    useMemo(() => {
      const keyword =
        searchQuery
          .trim()
          .toLowerCase()

      const today =
        new Date()

      today.setHours(
        0,
        0,
        0,
        0
      )

      return mockLogs.filter(
        (log) => {
          const matchesSearch =
            !keyword ||
            [
              log.id,
              log.userId,
              log.user,
              log.preference,
              log.representativeProduct,
            ].some((value) =>
              String(value || '')
                .toLowerCase()
                .includes(keyword)
            )

          const matchesMember =
            memberFilter === 'all' ||
            log.memberType ===
              memberFilter

          const matchesStatus =
            statusFilter === 'all' ||
            log.status ===
              statusFilter

          let matchesSummary = true

          if (
            activeSummaryKey ===
            'summaryWeek'
          ) {
            const logDate =
              parseLogDate(
                log.date
              )

            if (!logDate) {
              matchesSummary = false
            } else {
              logDate.setHours(
                0,
                0,
                0,
                0
              )

              const difference =
                today.getTime()
                - logDate.getTime()

              matchesSummary =
                difference >= 0
                && difference
                  <= 6
                  * 24
                  * 60
                  * 60
                  * 1000
            }
          }

          return (
            matchesSearch
            && matchesMember
            && matchesStatus
            && matchesSummary
          )
        }
      )
    }, [
      searchQuery,
      memberFilter,
      statusFilter,
      activeSummaryKey,
    ])


  // ========================================
  // 페이지네이션
  // ========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLogs.length /
          PAGE_SIZE
      )
    )

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    )

  const visibleLogs =
    filteredLogs.slice(
      (safeCurrentPage - 1) *
        PAGE_SIZE,

      safeCurrentPage *
        PAGE_SIZE
    )

  const pageStart =
    Math.max(
      1,
      Math.min(
        safeCurrentPage - 2,
        totalPages - 4
      )
    )

  const pageNumbers =
    Array.from(
      {
        length:
          Math.min(
            totalPages,
            5
          ),
      },
      (_, index) =>
        pageStart + index
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchQuery,
    memberFilter,
    statusFilter,
    activeSummaryKey,
  ])


  // ========================================
  // 선택된 상세
  // ========================================

  const selectedLog =
    mockLogs.find(
      (log) =>
        log.id === selectedId
    ) || null


  // ========================================
  // 상세 열기
  // ========================================

  const openDetail = (log) => {
    setSelectedId(log.id)
    setDetailStep(1)

    if (
      typeof window !== 'undefined'
      && window.matchMedia(
        '(max-width: 767px)'
      ).matches
    ) {
      window.setTimeout(() => {
        detailPanelRef.current
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 100)
    }
  }


  const closeDetail = () => {
    setSelectedId(null)
    setDetailStep(1)
  }


  // ========================================
  // 필터 초기화
  // ========================================

  const resetFilters = () => {
    setSearchQuery('')
    setMemberFilter('all')
    setStatusFilter('all')
    setActiveSummaryKey('summaryTotal')
    setCurrentPage(1)
    setSelectedId(null)
  }


  // ========================================
  // 요약 카드
  // ========================================

  const handleSummaryFilter = (key) => {
    setSearchQuery('')
    setMemberFilter('all')
    setStatusFilter('all')
    setActiveSummaryKey(key)
    setCurrentPage(1)
    setSelectedId(null)

    if (key === 'summarySuccess') {
      setStatusFilter('success')
    }

    if (key === 'summaryFail') {
      setStatusFilter('failed')
    }
  }


  const summaryCards = [
    {
      key: 'summaryTotal',
      icon: 'total',
      label: '전체 추천 횟수',
      value: mockLogs.length,
      unit: '건',
      caption: '누적 AI 추천 이용',
      tone: 'primary',
    },
    {
      key: 'summaryWeek',
      icon: 'week',
      label: '최근 7일 추천',
      value: mockLogs.length,
      unit: '건',
      caption: '최근 이용 흐름',
      tone: 'info',
    },
    {
      key: 'summarySuccess',
      icon: 'success',
      label: '추천 성공',
      value: mockLogs.filter(log => log.status === 'success').length,
      unit: '건',
      caption: '정상 추천 완료',
      tone: 'success',
    },
    {
      key: 'summaryFail',
      icon: 'fail',
      label: '추천 실패',
      value: mockLogs.filter(log => log.status === 'failed').length,
      unit: '건',
      caption: '확인이 필요한 요청',
      tone: 'danger',
    },
  ]


  // ========================================
  // 사용자 취향 Radar Chart
  // ========================================

  const preferenceScores =
    useMemo(() => {
      const scoreMaps = {
        sweetness: {
          '거의 달지 않음': 1,
          '은은한 단맛': 3,
          '달콤함': 5,
          '잘 모르겠음': 3,
        },

        acidity: {
          '거의 없음': 1,
          '은은함': 3,
          '확실한 산미': 5,
          '상관없음': 3,
        },

        body: {
          '가볍고 깔끔': 1,
          '적당한 무게감': 3,
          '진하고 묵직': 5,
          '잘 모르겠음': 3,
        },

        aroma: {
          '은은함': 1,
          '적당함': 3,
          '확실함': 5,
          '상관없음': 3,
        },

        alcohol: {
          '10도 이하': 1,
          '11~16도': 2,
          '17~25도': 4,
          '26도 이상': 5,
          '상관없음': 3,
        },
      }

      const axes = [
        'sweetness',
        'acidity',
        'body',
        'aroma',
        'alcohol',
      ]

      return axes.map((axis) => {
        const values =
          mockLogs
            .map((log) =>
              scoreMaps[axis][
                log.preferenceDetail?.[axis]
              ]
            )
            .filter((value) =>
              Number.isFinite(value)
            )

        if (values.length === 0) {
          return 0
        }

        return Number(
          (
            values.reduce(
              (sum, value) =>
                sum + value,
              0
            )
            / values.length
          ).toFixed(1)
        )
      })
    }, [])


  const preferenceChartData =
    useMemo(
      () => ({
        labels: [
          '단맛',
          '산미',
          '바디감',
          '향',
          '도수',
        ],

        datasets: [
          {
            label: '평균 취향',

            data:
              preferenceScores,

            backgroundColor:
              'rgba(86, 138, 128, 0.16)',

            borderColor:
              '#568a80',

            borderWidth: 2,

            pointBackgroundColor:
              '#568a80',

            pointBorderColor:
              '#ffffff',

            pointBorderWidth: 2,

            pointRadius: 3,

            pointHoverRadius: 5,

            fill: true,
          },
        ],
      }),
      [preferenceScores]
    )


  const preferenceChartOptions =
    useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,

        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            displayColors: false,
            padding: 10,

            callbacks: {
              label: (context) =>
                `평균 ${Number(
                  context.raw
                ).toFixed(1)} / 5`,
            },
          },
        },

        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 5,

            ticks: {
              display: false,
              stepSize: 1,
            },

            angleLines: {
              color:
                'rgba(140, 148, 144, 0.24)',
            },

            grid: {
              color:
                'rgba(140, 148, 144, 0.22)',
            },

            pointLabels: {
              color: '#4f5653',

              font: {
                size: 10,
                weight: '600',
              },
            },
          },
        },
      }),
      []
    )


  // ========================================
  // 추천 상품 TOP 5 Horizontal Bar Chart
  // ========================================

  const topProductLabelPlugin =
    useMemo(
      () => ({
        id: 'topProductLabels',

        afterDraw: (chart) => {
          const {
            ctx,
            chartArea,
            scales,
          } = chart

          const yScale = scales.y

          if (
            !chartArea
            || !yScale
          ) {
            return
          }

          ctx.save()

          topProducts.forEach(
            (product, index) => {
              const y =
                yScale.getPixelForValue(
                  index
                )

              const badgeSize = 18
              const badgeX =
                chartArea.left - 132
              const badgeY =
                y - badgeSize / 2

              ctx.beginPath()
              ctx.roundRect(
                badgeX,
                badgeY,
                badgeSize,
                badgeSize,
                4
              )
              ctx.fillStyle =
                '#568a80'
              ctx.fill()

              ctx.fillStyle =
                '#ffffff'
              ctx.font =
                '700 9px sans-serif'
              ctx.textAlign =
                'center'
              ctx.textBaseline =
                'middle'

              ctx.fillText(
                String(index + 1),
                badgeX
                  + badgeSize / 2,
                y
              )

              ctx.fillStyle =
                '#222524'
              ctx.font =
                '600 10px sans-serif'
              ctx.textAlign =
                'left'
              ctx.textBaseline =
                'middle'

              ctx.fillText(
                product.name,
                badgeX
                  + badgeSize
                  + 10,
                y
              )
            }
          )

          ctx.restore()
        },
      }),
      []
    )


  const topProductChartData =
    useMemo(
      () => ({
        labels:
          topProducts.map(
            (product, index) =>
              `${index + 1}. ${product.name}`
          ),

        datasets: [
          {
            label: '추천 횟수',

            data:
              topProducts.map(
                (product) =>
                  product.count
              ),

            backgroundColor:
              'rgba(86, 138, 128, 0.84)',

            borderColor:
              '#568a80',

            borderWidth: 1,

            borderRadius: 5,

            barThickness: 10,
          },
        ],
      }),
      [topPeriod]
    )


  const topProductChartOptions =
    useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,

        indexAxis: 'y',

        layout: {
          padding: {
            left: 132,
          },
        },

        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            displayColors: false,
            padding: 10,

            callbacks: {
              label: (context) =>
                `추천 ${context.raw}회`,
            },
          },
        },

        scales: {
          x: {
            beginAtZero: true,

            suggestedMax:
              Math.max(
                ...topProducts.map(
                  (product) =>
                    product.count
                )
              ) + 8,

            border: {
              display: false,
            },

            grid: {
              color:
                'rgba(223, 226, 224, 0.68)',
            },

            ticks: {
              precision: 0,

              color: '#8c9490',

              font: {
                size: 9,
              },
            },
          },

          y: {
            border: {
              display: false,
            },

            grid: {
              display: false,
            },

            ticks: {
              display: false,
            },
          },
        },
      }),
      []
    )


  return (
    <section
      className={styles.page}
      aria-labelledby="ai-log-title"
    >

      {/* ========================================
          제목
      ======================================== */}

      <AdminPageHeader
        title="AI 추천 기록 관리"
        titleId="ai-log-title"
      />


      {/* ========================================
          요약 카드
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="AI 추천 현황"
      >
        <div className={styles.summaryGrid}>
          {summaryCards.map(
            (card) => (
              <AdminSummaryCard
                key={card.key}
                icon={
                  <span
                    className={
                      styles.summarySvg
                    }
                  >
                    <SummaryIcon
                      type={card.icon}
                    />
                  </span>
                }
                label={card.label}
                value={card.value.toLocaleString(
                  'ko-KR'
                )}
                unit={card.unit}
                caption={card.caption}
                tone={card.tone}
                active={
                  activeSummaryKey
                  === card.key
                }
                onClick={() =>
                  handleSummaryFilter(
                    card.key
                  )
                }
              />
            )
          )}
        </div>
      </section>


      {/* ========================================
          본문
      ======================================== */}

      <div className={styles.managementGrid}>

        {/* ========================================
            왼쪽 목록
        ======================================== */}

        <section
          className={styles.mainSection}
          aria-labelledby="ai-log-list-title"
        >

          <AdminFilterBar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value)
              setActiveSummaryKey(null)
              setCurrentPage(1)
            }}
            searchPlaceholder="사용자 ID, 추천 ID, 상품명으로 검색"
            searchLabel="AI 추천 검색"
            onReset={resetFilters}
          >
            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                회원 유형
              </span>

              <select
                value={memberFilter}
                onChange={(event) => {
                  setMemberFilter(
                    event.target.value
                  )
                  setActiveSummaryKey(null)
                  setCurrentPage(1)
                }}
              >
                <option value="all">
                  전체 회원 유형
                </option>

                <option value="member">
                  회원
                </option>

                <option value="guest">
                  비회원
                </option>
              </select>
            </label>

            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                추천 상태
              </span>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  )
                  setActiveSummaryKey(null)
                  setCurrentPage(1)
                }}
              >
                <option value="all">
                  전체 추천 상태
                </option>

                <option value="success">
                  성공
                </option>

                <option value="failed">
                  실패
                </option>
              </select>
            </label>
          </AdminFilterBar>


          {/* 목록 제목 */}

          <div className={styles.sectionHeading}>

            <div className={styles.titleWrap}>
              <h2 id="ai-log-list-title">
                AI 추천 기록
              </h2>
            </div>

            <span className={styles.logCount}>
              총{' '}
              <strong>
                {filteredLogs.length.toLocaleString(
                  'ko-KR'
                )}
              </strong>
              건
            </span>

          </div>


          {/* 테이블 */}

          {filteredLogs.length === 0 ? (

            <AdminEmptyState
              title="검색 결과가 없습니다."
              description="검색어나 필터 조건을 다시 확인해주세요."
            />

          ) : (

            <>

              <div className={styles.tableWrap}>
                <table className={styles.logTable}>

                  <thead>
                    <tr>
                      <th>추천 ID</th>
                      <th>사용자</th>
                      <th>회원 유형</th>
                      <th>추천 일자</th>
                      <th>사용자 취향 요약</th>
                      <th>대표 추천 상품</th>
                      <th>상태</th>
                      <th>관리</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleLogs.map(
                      (log) => (
                        <tr
                          key={log.id}
                          className={
                            selectedId === log.id
                              ? styles.selectedRow
                              : ''
                          }
                          onClick={() =>
                            openDetail(log)
                          }
                        >
                          <td>
                            <strong
                              className={
                                styles.logId
                              }
                            >
                              {log.id}
                            </strong>
                          </td>

                          <td>
                            {log.user}
                          </td>

                          <td>
                            <AdminStatusBadge
                              tone={
                                log.memberType ===
                                'member'
                                  ? 'success'
                                  : 'neutral'
                              }
                              size="small"
                            >
                              {log.memberType ===
                              'member'
                                ? '회원'
                                : '비회원'}
                            </AdminStatusBadge>
                          </td>

                          <td>
                            <span
                              className={
                                styles.dateCell
                              }
                            >
                              <span>
                                {log.date}
                              </span>

                              <small>
                                {log.time}
                              </small>
                            </span>
                          </td>

                          <td
                            className={
                              styles.preferenceCell
                            }
                            title={
                              log.preference
                            }
                          >
                            {log.preference}
                          </td>

                          <td
                            className={
                              styles.productCell
                            }
                            title={
                              log.representativeProduct
                            }
                          >
                            {
                              log.representativeProduct
                            }
                          </td>

                          <td>
                            <AdminStatusBadge
                              tone={
                                log.status ===
                                'success'
                                  ? 'success'
                                  : 'danger'
                              }
                              size="small"
                            >
                              {log.status ===
                              'success'
                                ? '성공'
                                : '실패'}
                            </AdminStatusBadge>
                          </td>

                          <td>
                            <button
                              type="button"
                              className={
                                styles.detailButton
                              }
                              onClick={(event) => {
                                event.stopPropagation()
                                openDetail(log)
                              }}
                            >
                              상세 보기
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>


              {totalPages > 1 && (

                <nav
                  className={styles.pagination}
                  aria-label="AI 추천 기록 페이지"
                >

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    aria-label="이전 페이지"
                  >
                    ‹
                  </button>

                  {pageNumbers.map(
                    (page) => (
                      <button
                        type="button"
                        key={page}
                        className={
                          page ===
                          safeCurrentPage
                            ? styles.activePage
                            : ''
                        }
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        aria-current={
                          page ===
                          safeCurrentPage
                            ? 'page'
                            : undefined
                        }
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    aria-label="다음 페이지"
                  >
                    ›
                  </button>

                </nav>

              )}

            </>

          )}

        </section>


        {/* ========================================
            오른쪽 영역
        ======================================== */}

        {!selectedLog ? (

          <aside
            className={styles.analyticsColumn}
          >

            <AdminPanel
              title="AI 추천 이용자 취향 분석"
              padding="compact"
            >
              <div className={styles.preferenceRadarChart}>
                <Radar
                  data={preferenceChartData}
                  options={preferenceChartOptions}
                />
              </div>
            </AdminPanel>


            <AdminPanel
              title="추천 상품 TOP 5"
              padding="compact"
              action={
                <select
                  className={styles.periodSelect}
                  value={topPeriod}
                  onChange={(event) =>
                    setTopPeriod(
                      event.target.value
                    )
                  }
                  aria-label="추천 상품 집계 기간"
                >
                  <option value="all">
                    전체 기간
                  </option>

                  <option value="7">
                    최근 7일
                  </option>

                  <option value="30">
                    최근 30일
                  </option>
                </select>
              }
            >
              <div className={styles.topProductChart}>
                <Bar
                  data={topProductChartData}
                  options={topProductChartOptions}
                  plugins={[
                    topProductLabelPlugin,
                  ]}
                />
              </div>
            </AdminPanel>

          </aside>

        ) : (

          <aside
            ref={detailPanelRef}
            className={styles.detailPanel}
            aria-labelledby="ai-log-detail-title"
          >

            <header className={styles.panelTopHeader}>

              <div>
                <h2 id="ai-log-detail-title">
                  AI 추천 상세
                </h2>

                <span className={styles.stepLabel}>
                  {detailStep} / 2
                </span>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                aria-label="닫기"
              >
                ×
              </button>

            </header>


            {/* ========================================
                상세 1단계
            ======================================== */}

            {detailStep === 1 && (

              <div className={styles.detailPage}>

                <section className={styles.detailSection}>
                  <h3>
                    기본 정보
                  </h3>

                  <dl className={styles.detailInfoList}>

                    <div>
                      <dt>
                        추천 ID
                      </dt>

                      <dd>
                        {selectedLog.id}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        사용자 ID
                      </dt>

                      <dd>
                        {selectedLog.userId}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        사용자
                      </dt>

                      <dd>
                        {selectedLog.user}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        회원 유형
                      </dt>

                      <dd>
                        <AdminStatusBadge
                          tone={
                            selectedLog.memberType ===
                            'member'
                              ? 'success'
                              : 'neutral'
                          }
                          size="small"
                        >
                          {selectedLog.memberType ===
                          'member'
                            ? '회원'
                            : '비회원'}
                        </AdminStatusBadge>
                      </dd>
                    </div>

                    <div>
                      <dt>
                        추천 일시
                      </dt>

                      <dd>
                        {selectedLog.date}
                        {' '}
                        {selectedLog.time}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        추천 상태
                      </dt>

                      <dd>
                        <AdminStatusBadge
                          tone={
                            selectedLog.status ===
                            'success'
                              ? 'success'
                              : 'danger'
                          }
                          size="small"
                        >
                          {selectedLog.status ===
                          'success'
                            ? '성공'
                            : '실패'}
                        </AdminStatusBadge>
                      </dd>
                    </div>

                  </dl>
                </section>


                <section className={styles.detailSection}>
                  <h3>
                    회원 취향 정보
                  </h3>

                  <dl className={styles.detailInfoList}>

                    <div>
                      <dt>
                        단맛 선호
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .sweetness
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        산미 선호
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .acidity
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        바디감
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .body
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        향의 강도
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .aroma
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        선호 도수
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .alcohol
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        회피 재료
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .avoidIngredients
                        }
                      </dd>
                    </div>

                  </dl>
                </section>


                <div className={styles.nextArea}>
                  <button
                    type="button"
                    className={styles.nextButton}
                    onClick={() =>
                      setDetailStep(2)
                    }
                  >
                    추천 결과 보기 →
                  </button>
                </div>

              </div>

            )}


            {/* ========================================
                상세 2단계
            ======================================== */}

            {detailStep === 2 && (

              <div className={styles.detailPage}>

                <section className={styles.detailSection}>
                  <h3>
                    AI 추천 결과
                  </h3>

                  <dl className={styles.resultList}>

                    <div>
                      <dt>
                        추천 전통주
                      </dt>

                      <dd>
                        {selectedLog
                          .result
                          .liquors
                          .length > 0
                          ? selectedLog
                            .result
                            .liquors
                            .join(', ')
                          : '-'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        추천 안주
                      </dt>

                      <dd>
                        {selectedLog
                          .result
                          .foods
                          .length > 0
                          ? selectedLog
                            .result
                            .foods
                            .join(', ')
                          : '-'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        추천 술잔
                      </dt>

                      <dd>
                        {selectedLog
                          .result
                          .glasses
                          .length > 0
                          ? selectedLog
                            .result
                            .glasses
                            .join(', ')
                          : '-'}
                      </dd>
                    </div>

                  </dl>
                </section>


                <section className={styles.detailSection}>
                  <h3>
                    추천 이유
                  </h3>

                  <div className={styles.reasonBox}>
                    {selectedLog.reason}
                  </div>
                </section>


                <section className={styles.detailSection}>
                  <h3>
                    시스템 정보
                  </h3>

                  <dl className={styles.detailInfoList}>

                    <div>
                      <dt>
                        후보 상품 수
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .system
                            .candidateCount
                        }
                        개
                      </dd>
                    </div>

                    <div>
                      <dt>
                        모델 버전
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .system
                            .model
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        프롬프트 버전
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .system
                            .promptVersion
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        오류 여부
                      </dt>

                      <dd
                        className={
                          selectedLog.status ===
                          'failed'
                            ? styles.errorText
                            : ''
                        }
                      >
                        {
                          selectedLog
                            .system
                            .errorType
                        }
                      </dd>
                    </div>

                  </dl>
                </section>


                <div className={styles.prevArea}>
                  <button
                    type="button"
                    className={styles.prevButton}
                    onClick={() =>
                      setDetailStep(1)
                    }
                  >
                    ← 이전
                  </button>
                </div>

              </div>

            )}

          </aside>

        )}

      </div>

    </section>
  )
}


export default AiLogManage
