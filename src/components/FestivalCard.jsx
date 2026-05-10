import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Pencil, X } from 'lucide-react'

export default function FestivalCard({ festival, isAdmin, onEdit, attendingDates = [], onToggleAttending }) {
  const navigate = useNavigate()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const dateStr = festival.end_date && festival.end_date !== festival.date
    ? `${formatDate(festival.date)} ~ ${formatDate(festival.end_date)}`
    : formatDate(festival.date)

  const allArtists = festival.festival_artists || []

  // 날짜별 그룹핑
  const artistsByDate = {}
  allArtists.forEach(fa => {
    const key = fa.performance_date || 'tba'
    if (!artistsByDate[key]) artistsByDate[key] = []
    artistsByDate[key].push(fa)
  })
  const dateKeys = Object.keys(artistsByDate).sort()
  const isMultiDay = dateKeys.length > 1

  // 티켓팅 상태
  const now = new Date()
  const activeTicket = (festival.ticket_rounds || []).find(r => {
    const open = r.open_at ? new Date(r.open_at) : null
    const close = r.close_at ? new Date(r.close_at) : null
    return open && open <= now && (!close || close > now)
  })
  const nextTicket = (festival.ticket_rounds || []).find(r => {
    const open = r.open_at ? new Date(r.open_at) : null
    return open && open > now
  })

  return (
    <div
      className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col relative"
      onClick={() => navigate(`/festivals/${festival.id}`)}
    >
      {/* 관리자 수정 버튼 */}
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(festival) }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white z-10"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}

      {/* 포스터 영역 (3:4 비율) */}
      <div className="relative w-full" style={{ paddingBottom: '133%' }}>
        {festival.poster_url ? (
          <img
            src={festival.poster_url}
            alt={festival.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // 포스터 없을 때 민트 그라디언트 플레이스홀더
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)' }}>
            <div className="text-4xl opacity-60">🎪</div>
            <div className="text-white/80 text-xs font-bold text-center px-3 leading-tight">
              {festival.name}
            </div>
          </div>
        )}
        {/* 날짜 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
          <div className="text-white text-[11px] font-bold">{dateStr}</div>
          {(festival.venue || festival.city) && (
            <div className="text-white/70 text-[10px] truncate">{festival.venue || festival.city}</div>
          )}
        </div>
      </div>

      {/* 민트 컬러라인 */}
      <div className="h-0.5 w-full flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, #06b6d4, #0e7490)' }} />

      {/* 정보 영역 */}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
        {/* 페스 배지 */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: '#0e7490' }}>
            🎪 페스
          </span>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
            {festival.country === 'korea' ? '🇰🇷' : '🇯🇵'}
          </span>
        </div>

        {/* 페스 이름 */}
        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-2">
          {festival.name}
        </div>

        {/* 출연진 수 */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {allArtists.length > 0 ? `JPOP 출연진 ${allArtists.length}명` : '출연진 미정'}
        </div>

        {/* 티켓팅 바 */}
        {(activeTicket || nextTicket) && (
          <div className="rounded px-1.5 py-1 text-[9px] font-bold flex items-center gap-1"
            style={{
              background: activeTicket ? '#06b6d420' : '#f0fdf4',
              color: activeTicket ? '#0e7490' : '#16a34a',
              border: `1px solid ${activeTicket ? '#06b6d440' : '#bbf7d0'}`,
            }}>
            <Ticket className="w-2.5 h-2.5" />
            {activeTicket ? `${activeTicket.round_name} 접수중` : `${nextTicket.round_name} 예정`}
          </div>
        )}

        {/* 갈게요 버튼 */}
        {onToggleAttending && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // 당일공연이면 바로 토글
              if (!festival.end_date || festival.end_date === festival.date) {
                onToggleAttending(festival.id, festival.date, attendingDates?.includes(festival.date))
              } else {
                setShowDatePicker(true)
              }
            }}
            className={`mt-auto w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition ${
              attendingDates?.length > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
            }`}
          >
            ✓ {attendingDates?.length > 0 ? `${attendingDates.length}일 갈게요` : '갈게요'}
          </button>
        )}
      </div>
    {/* 날짜 선택 모달 */}
      {showDatePicker && (() => {
        const dates = []
        if (festival.date && festival.end_date && festival.end_date !== festival.date) {
          const cur = new Date(festival.date)
          const end = new Date(festival.end_date)
          while (cur <= end) {
            dates.push(cur.toISOString().slice(0, 10))
            cur.setDate(cur.getDate() + 1)
          }
        } else if (festival.date) {
          dates.push(festival.date)
        }
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setShowDatePicker(false) }}>
            <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-sm shadow-2xl p-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{festival.name}</div>
                <button onClick={() => setShowDatePicker(false)} className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-zinc-500 mb-3">가는 날짜를 선택하세요</div>
              <div className="space-y-2">
                {dates.map((dateStr, idx) => {
                  const d = new Date(dateStr)
                  const label = dates.length > 1 ? `DAY${idx + 1} · ${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})` : `${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`
                  const going = attendingDates?.includes(dateStr)
                  return (
                    <button key={dateStr}
                      onClick={() => onToggleAttending(festival.id, dateStr, going)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                        going ? 'bg-emerald-500 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
                      }`}>
                      <span>{label}</span>
                      <span>{going ? '✓ 갈게요' : '갈게요'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function ArtistChip({ artist }) {
  if (!artist) return null
  return (
    <span className="text-[9px] font-bold px-1 py-0.5 rounded-full text-white"
      style={{ background: artist.color || '#888' }}>
      {artist.name}
    </span>
  )
}