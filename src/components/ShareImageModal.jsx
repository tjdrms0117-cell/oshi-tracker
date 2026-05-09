import { useRef, useState, useMemo } from 'react'
import { X, ChevronDown } from 'lucide-react'

export default function ShareImageModal({ 
  nickname,
  upcomingConcerts = [],
  pastConcerts = [],
  oshiArtists = [],
  onClose,
}) {
  const [tab, setTab] = useState('concerts')
  
  const allConcerts = useMemo(() => {
    return [...upcomingConcerts, ...pastConcerts]
  }, [upcomingConcerts, pastConcerts])
  
  const availableYears = useMemo(() => {
    const years = new Set()
    allConcerts.forEach(c => {
      if (c?.date) years.add(new Date(c.date).getFullYear())
    })
    years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [allConcerts])
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [yearMenuOpen, setYearMenuOpen] = useState(false)
  
  const yearConcerts = useMemo(() => {
    return allConcerts
      .filter(c => c?.date && new Date(c.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [allConcerts, selectedYear])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingCount = yearConcerts.filter(c => new Date(c.date) >= today).length
  const pastCount = yearConcerts.filter(c => new Date(c.date) < today).length
  
  // 카드 개수에 따른 그리드 컬럼 결정
  const items = tab === 'concerts' ? yearConcerts : oshiArtists
  const gridCols = useMemo(() => {
  const n = items.length
  if (n <= 4) return n === 1 ? 1 : Math.min(n, 3)
  if (n <= 9) return 3
  if (n <= 16) return 4
  if (n <= 25) return 5
  if (n <= 36) return 6
  return 7
}, [items.length])
  
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'linear-gradient(145deg, #1a0d2e 0%, #0f0a1f 50%, #1a0d2e 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        right: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,30,99,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,172,193,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      
      {/* 상단 컨트롤 */}
      <div className="relative flex items-center justify-between p-3 z-10">
        {/* 좌측: 탭 + 연도 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab('concerts')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
              tab === 'concerts'
                ? 'bg-white text-zinc-900'
                : 'bg-white/10 text-white/70 backdrop-blur-sm'
            }`}
          >
            🎤 콘서트
          </button>
          <button
            onClick={() => setTab('oshi')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
              tab === 'oshi'
                ? 'bg-white text-zinc-900'
                : 'bg-white/10 text-white/70 backdrop-blur-sm'
            }`}
          >
            ⭐ 오시
          </button>
          
          {tab === 'concerts' && availableYears.length > 1 && (
            <div className="relative ml-1">
              <button
                onClick={() => setYearMenuOpen(!yearMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/90 backdrop-blur-sm"
              >
                <span>{selectedYear}</span>
                <ChevronDown className={`w-3 h-3 transition ${yearMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {yearMenuOpen && (
                <div className="absolute left-0 mt-1 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
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
                        className={`block w-full text-left px-3 py-1.5 text-xs transition ${
                          year === selectedYear
                            ? 'bg-pink-500/30 text-pink-300 font-bold'
                            : 'hover:bg-white/10 text-white/80'
                        }`}
                      >
                        {year}년 <span className="text-[10px] opacity-60">({yearCount})</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 우측: 닫기 */}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="relative flex-1 flex flex-col px-5 pb-6 overflow-hidden mx-auto w-full" style={{ maxWidth: '900px' }}>
        {/* 로고 */}
        <div style={{
          fontSize: '13px',
          fontWeight: 900,
          background: 'linear-gradient(90deg, #e91e63, #00acc1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.15em',
          marginBottom: '4px',
          flexShrink: 0,
        }}>
          OSHI TRACKER
        </div>
        
        {/* 타이틀 */}
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 900,
          color: 'white',
          marginBottom: '4px',
          lineHeight: 1.2,
          flexShrink: 0,
        }}>
          {tab === 'concerts' 
            ? `${nickname}의 ${selectedYear} 콘서트` 
            : `${nickname}의 오시`}
        </h1>
        
        {/* 카운트 */}
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '20px',
          flexShrink: 0,
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
        
        {/* 그리드 (꽉 채우기) */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {tab === 'concerts' ? (
            <ConcertsGrid concerts={yearConcerts} cols={gridCols} />
          ) : (
            <OshiGrid artists={oshiArtists} cols={gridCols} />
          )}
        </div>
        
        {/* 푸터 */}
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.15em',
          flexShrink: 0,
        }}>
          oshi-tracker.com
        </div>
      </div>
    </div>
  )
}

// ============================================
// 콘서트 그리드
// ============================================
function ConcertsGrid({ concerts, cols }) {
  if (concerts.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '14px',
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
    gridTemplateColumns: `repeat(${cols}, minmax(0, 140px))`,
    gap: '8px',
    height: '100%',
    alignContent: 'start',
    justifyContent: 'center',
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
  const fallbackColor = concert.artist?.color || '#666'
  
  return (
    <div style={{
      borderRadius: '6px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
      opacity: isPast ? 0.65 : 1,
    }}>
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        position: 'relative',
        background: `linear-gradient(135deg, ${fallbackColor}, ${fallbackColor}dd)`,
        overflow: 'hidden',
      }}>
        {concert.poster_url && (
          <img 
            src={concert.poster_url}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        
        <div style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          padding: '1px 5px',
          borderRadius: '3px',
          background: flagColor,
          color: 'white',
          fontSize: '8px',
          fontWeight: 700,
          zIndex: 2,
        }}>
          {isKorea ? '내한' : '원정'}
        </div>
        
        {isPast && (
          <div style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            padding: '1px 4px',
            borderRadius: '3px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '8px',
            fontWeight: 700,
            zIndex: 2,
          }}>
            ✓
          </div>
        )}
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '14px 4px 3px 4px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          color: 'white',
          fontSize: '10px',
          fontWeight: 700,
          zIndex: 2,
        }}>
          {dateStr}
        </div>
      </div>
      
      <div style={{
        padding: '4px 3px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '9px',
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
function OshiGrid({ artists, cols }) {
  if (artists.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '14px',
      }}>
        오시가 없어요 ⭐
      </div>
    )
  }
  
  // 오시는 더 많이 보여줄 수 있음 (원형이라 작아도 OK)
  const oshiCols = Math.max(cols, 4)
  
  return (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${oshiCols}, minmax(0, 100px))`,
    gap: '10px',
    height: '100%',
    alignContent: 'start',
    justifyContent: 'center',
  }}>
    {artists.map(artist => (
      <OshiMiniCard key={artist.id} artist={artist} />
    ))}
  </div>
)
}

function OshiMiniCard({ artist }) {
  const color = artist.color || '#888'
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
        {artist.youtube_thumbnail_url && (
          <img 
            src={artist.youtube_thumbnail_url}
            alt=""
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