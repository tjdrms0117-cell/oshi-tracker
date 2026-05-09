import { useEffect, useRef, useState, useMemo, forwardRef } from 'react'
import { X, Download, Share2, Loader, ChevronDown } from 'lucide-react'
import { toPng } from 'html-to-image'

// 외부 이미지 URL을 CORS 안전한 프록시로 감싸기
function proxyImage(url) {
  if (!url) return null
  // Supabase Storage는 그대로 (이미 CORS 허용)
  if (url.includes('supabase.co')) return url
  // 외부 이미지는 프록시 거치기
  return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`
}
// 모든 이미지 preload (캡처 전 대기)
function preloadImages(urls) {
  return Promise.all(
    urls.filter(Boolean).map(url => 
      new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false) // 실패해도 그냥 진행
        img.src = url
        // 5초 타임아웃
        setTimeout(() => resolve(false), 5000)
      })
    )
  )
}

export default function ShareImageModal({
  nickname,
  upcomingConcerts = [],
  pastConcerts = [],
  oshiArtists = [],
  onClose,
}) {
  const cardRef = useRef(null)
  const [tab, setTab] = useState('concerts') // concerts | oshi
  const [generating, setGenerating] = useState(false)
  
  // 모든 콘서트 (미래+과거) 합치기
  const allConcerts = useMemo(() => {
    return [...upcomingConcerts, ...pastConcerts]
  }, [upcomingConcerts, pastConcerts])
  
  // 콘서트가 있는 연도 목록 (최신순)
  const availableYears = useMemo(() => {
    const years = new Set()
    allConcerts.forEach(c => {
      if (c?.date) years.add(new Date(c.date).getFullYear())
    })
    // 현재 연도 항상 포함
    years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [allConcerts])
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearMenuOpen, setYearMenuOpen] = useState(false)
  
  // 선택된 연도의 콘서트들
  const yearConcerts = useMemo(() => {
    return allConcerts
      .filter(c => c?.date && new Date(c.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [allConcerts, selectedYear])
  
  // 미래/과거 카운트
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingCount = yearConcerts.filter(c => new Date(c.date) >= today).length
  const pastCount = yearConcerts.filter(c => new Date(c.date) < today).length
  
  // 이미지 생성
  const generateImage = async () => {
  if (!cardRef.current) return null
  
  try {
    // 카드 안의 모든 이미지 URL 수집
    const imgs = cardRef.current.querySelectorAll('img')
    const urls = Array.from(imgs).map(img => img.src).filter(Boolean)
    
    // 모든 이미지 로드 대기 (실패해도 계속 진행)
    if (urls.length > 0) {
      await preloadImages(urls).catch(err => {
        console.warn('일부 이미지 preload 실패:', err)
      })
    }
    
    // 추가 안전장치: 페인트 대기
    await new Promise(r => setTimeout(r, 300))
  } catch (err) {
    console.warn('preload 단계 에러:', err)
  }
  
  // 실제 캡처
  return await toPng(cardRef.current, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#0f0a1f',
  })
}
  
  const handleDownload = async () => {
  setGenerating(true)
  try {
    const dataUrl = await generateImage()
    if (!dataUrl) return
    const fileName = tab === 'concerts' 
      ? `oshi-tracker-${selectedYear}-concerts.png`
      : `oshi-tracker-oshi.png`
    
    // 모바일이면 공유 시트로 (갤러리 저장 가능)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile && navigator.share) {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], fileName, { type: 'image/png' })
      
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'OSHI TRACKER' })
        return
      }
    }
    
    // PC 또는 공유 미지원: 일반 다운로드
    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } catch (err) {
  if (err.name !== 'AbortError') {
    console.error('이미지 저장 실패:', err)
    alert('이미지 저장에 실패했어요\n\n에러: ' + (err.message || err.name || '알 수 없음'))
  }
} finally {
    setGenerating(false)
  }
}
  
  const handleShare = async () => {
    setGenerating(true)
    try {
      const dataUrl = await generateImage()
      if (!dataUrl) return
      
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const fileName = tab === 'concerts' 
        ? `oshi-tracker-${selectedYear}-concerts.png`
        : `oshi-tracker-oshi.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'OSHI TRACKER',
          text: '내 콘서트 일정 보러오세요 🎤',
        })
      } else {
        handleDownload()
      }
    } catch (err) {
  if (err.name !== 'AbortError') {
    console.error('공유 실패:', err)
    alert('공유에 실패했어요\n\n에러: ' + (err.message || err.name || '알 수 없음'))
  }
} finally {
      setGenerating(false)
    }
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-5"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            이미지로 공유
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 탭 */}
        <div className="flex gap-1.5 p-3 border-b border-stone-200 dark:border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setTab('concerts')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${
              tab === 'concerts'
                ? 'bg-pink-500 text-white'
                : 'bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            🎤 콘서트
          </button>
          <button
            onClick={() => setTab('oshi')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${
              tab === 'oshi'
                ? 'bg-amber-400 text-amber-950'
                : 'bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            ⭐ 내 오시 ({oshiArtists.length})
          </button>
        </div>
        
        {/* 연도 선택 (콘서트 탭일 때만) */}
        {tab === 'concerts' && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0 relative">
            <button
              onClick={() => setYearMenuOpen(!yearMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <span>{selectedYear}년 ({yearConcerts.length}회)</span>
              <ChevronDown className={`w-4 h-4 transition ${yearMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {yearMenuOpen && (
              <div className="absolute left-3 right-3 mt-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 overflow-hidden">
                {availableYears.map(year => {
                  const yearCount = allConcerts.filter(
                    c => c?.date && new Date(c.date).getFullYear() === year
                  ).length
                  return (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year)
                        setYearMenuOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition ${
                        year === selectedYear
                          ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 font-bold'
                          : 'hover:bg-stone-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {year}년 <span className="text-xs text-zinc-400">({yearCount}회)</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* 미리보기 */}
        <div className="flex-1 overflow-y-auto p-4 bg-stone-100 dark:bg-zinc-950">
          <div className="mx-auto" style={{ maxWidth: '360px' }}>
            <ShareCard 
              ref={cardRef}
              tab={tab}
              nickname={nickname}
              year={selectedYear}
              concerts={yearConcerts}
              upcomingCount={upcomingCount}
              pastCount={pastCount}
              oshiArtists={oshiArtists}
            />
          </div>
        </div>
        
        {/* 액션 버튼 */}
        <div className="border-t border-stone-200 dark:border-zinc-800 p-4 flex gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            저장
          </button>
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-500 text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            공유
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 카드 본체
// ============================================

const ShareCard = forwardRef(({ tab, nickname, year, concerts, upcomingCount, pastCount, oshiArtists }, ref) => {
  return (
    <div 
      ref={ref}
      style={{
        width: '360px',
        background: 'linear-gradient(145deg, #1a0d2e 0%, #0f0a1f 50%, #1a0d2e 100%)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,30,99,0.4) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,172,193,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      
      {/* 콘텐츠 */}
      <div style={{ position: 'relative', padding: '24px 20px' }}>
        {/* 로고 */}
        <div style={{
          fontSize: '14px',
          fontWeight: 900,
          background: 'linear-gradient(90deg, #e91e63, #00acc1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.1em',
          marginBottom: '4px',
        }}>
          OSHI TRACKER
        </div>
        
        {/* 타이틀 */}
        <div style={{
          fontSize: '22px',
          fontWeight: 900,
          color: 'white',
          marginBottom: '4px',
          lineHeight: 1.3,
        }}>
          {tab === 'concerts' 
            ? `${nickname}의 ${year} 콘서트` 
            : `${nickname}의 오시`}
        </div>
        
        {/* 카운트 */}
        <div style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '20px',
        }}>
          {tab === 'concerts' 
            ? (() => {
                const parts = []
                if (upcomingCount > 0) parts.push(`예정 ${upcomingCount}회`)
                if (pastCount > 0) parts.push(`다녀옴 ${pastCount}회`)
                return parts.join(' · ') || '아직 일정이 없어요'
              })()
            : `${oshiArtists.length}명`}
        </div>
        
        {/* 카드 그리드 */}
        {tab === 'concerts' ? (
          <ConcertsGrid concerts={concerts} />
        ) : (
          <OshiGrid artists={oshiArtists} />
        )}
        
        {/* 푸터 */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.1em',
        }}>
          oshi-tracker.com
        </div>
      </div>
    </div>
  )
})

// ============================================
// 콘서트 그리드
// ============================================
function ConcertsGrid({ concerts }) {
  if (concerts.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
      }}>
        이 해엔 아직 일정이 없어요 🎤
      </div>
    )
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
    }}>
      {concerts.map(c => (
        <ConcertMiniCard key={c.id} concert={c} isPast={new Date(c.date) < today} />
      ))}
    </div>
  )
}

function ConcertMiniCard({ concert, isPast }) {
  const date = new Date(concert.date)
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
  const isKorea = concert.country === 'korea'
  const flagColor = isKorea ? '#06b6d4' : '#ec4899'
  const posterUrl = concert.poster_url ? proxyImage(concert.poster_url) : null
  const fallbackColor = concert.artist?.color || '#666'
  
  return (
    <div style={{
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
      opacity: isPast ? 0.65 : 1,
    }}>
      {/* 포스터 */}
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        position: 'relative',
        background: `linear-gradient(135deg, ${fallbackColor}, ${fallbackColor}dd)`,
        overflow: 'hidden',
      }}>
        {posterUrl && (
          <img 
            src={posterUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        
        {/* 국가 뱃지 */}
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: flagColor,
          color: 'white',
          fontSize: '9px',
          fontWeight: 700,
          zIndex: 2,
        }}>
          {isKorea ? '내한' : '원정'}
        </div>
        
        {/* 다녀옴 뱃지 */}
        {isPast && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '8px',
            fontWeight: 700,
            zIndex: 2,
          }}>
            ✓
          </div>
        )}
        
        {/* 날짜 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 6px 4px 6px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          color: 'white',
          fontSize: '11px',
          fontWeight: 700,
          zIndex: 2,
        }}>
          {dateStr}
        </div>
      </div>
      
      {/* 가수명 */}
      <div style={{
        padding: '6px 4px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'white',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {concert.artist?.name || ''}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 오시 그리드
// ============================================
function OshiGrid({ artists }) {
  if (artists.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
      }}>
        오시가 없어요 ⭐
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: '8px',
    }}>
      {artists.map(artist => (
        <OshiMiniCard key={artist.id} artist={artist} />
      ))}
    </div>
  )
}

function OshiMiniCard({ artist }) {
  const color = artist.color || '#888'
  const thumbUrl = artist.youtube_thumbnail_url ? proxyImage(artist.youtube_thumbnail_url) : null
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: '50%',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        marginBottom: '4px',
        border: `2px solid ${color}`,
        position: 'relative',
      }}>
        {thumbUrl && (
          <img 
            src={thumbUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
      <div style={{
        fontSize: '9px',
        fontWeight: 700,
        color: 'white',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {artist.name}
      </div>
    </div>
  )
}