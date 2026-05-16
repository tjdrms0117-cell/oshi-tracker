import { Calendar, MapPin, Ticket, Star, Check, Edit3, Trash2, ChevronDown, ChevronUp, Music } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AttendingDayModal from './AttendingDayModal'

export default function ConcertCard({ 
  concert, 
  isOshi = false,
  isAttending = false,
  attendingConcertIds = [],
  isAdmin = false,
  onToggleAttending,
  onToggleAttendingDays,
  onEdit,
  onDelete,
  showPastStyle = false,  // 내 공연 탭에서만 true로 넘김
}) {
  const navigate = useNavigate()
  const [attendingLoading, setAttendingLoading] = useState(false)
  const [ticketsExpanded, setTicketsExpanded] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [posterError, setPosterError] = useState(false)
  
  const artist = concert.artist
  const venue = concert.venue
  const color = artist?.color || '#888'
  const ticketRounds = concert.ticket_rounds || []
  const isTour = concert.is_tour
  const tourConcerts = concert.tour_concerts || []
  const posterUrl = !posterError && concert.poster_url ? concert.poster_url : null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // D-day 계산용 날짜: 투어/시리즈는 오늘 이후 가장 빠른 날짜 기준
  const getDDayDate = () => {
    if (isTour && tourConcerts.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10)
      for (const tc of tourConcerts) {
        const dates = tc.series_dates?.length > 1 ? tc.series_dates : [{ date: tc.date }]
        for (const d of dates) {
          if (d.date > todayStr) return new Date(d.date)
        }
      }
      // 모두 지났으면 마지막 날짜
      const last = tourConcerts[tourConcerts.length - 1]
      const lastDate = last.series_dates?.length > 1
        ? last.series_dates[last.series_dates.length - 1].date
        : last.date
      return new Date(lastDate)
    }
    if (concert.is_series && concert.series_dates?.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10)
      const upcoming = concert.series_dates.find(d => d.date > todayStr)
      if (upcoming) return new Date(upcoming.date)
      return new Date(concert.series_dates[concert.series_dates.length - 1].date)
    }
    return new Date(concert.date)
  }

  const dDayDate = getDDayDate()
  dDayDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dDayDate - today) / (1000 * 60 * 60 * 24))
  let dDayLabel = ''
  let dDayUrgent = false
  if (diffDays === 0) { dDayLabel = 'D-DAY'; dDayUrgent = true }
  else if (diffDays > 0) { dDayLabel = `D-${diffDays}`; dDayUrgent = diffDays <= 7 }
  else { dDayLabel = `D+${Math.abs(diffDays)}` }

  const attendingDayCount = isTour
  ? tourConcerts.flatMap(tc => tc.series_dates || [{ id: tc.id }])
      .filter(d => attendingConcertIds.includes(d.id)).length
  : concert.is_series && concert.series_dates
    ? concert.series_dates.filter(d => attendingConcertIds.includes(d.id)).length
    : 0

const isAttendingTour = isTour
  ? attendingDayCount > 0
  : false
  
  const now = new Date()
  const upcomingRounds = ticketRounds.filter(r => r.open_at && new Date(r.open_at) > now)
  const pendingRounds = ticketRounds.filter(r => !r.open_at)
  const ongoingRounds = ticketRounds
    .filter(r => r.open_at && new Date(r.open_at) <= now && r.close_at && new Date(r.close_at) > now)
    .sort((a, b) => new Date(b.open_at) - new Date(a.open_at))
  const nextRound = ongoingRounds[0] || upcomingRounds[0] || pendingRounds[0]
  
  const getCountdown = (openAt) => {
    if (!openAt) return '공개전'
    const diff = new Date(openAt) - now
    if (diff < 0) return '진행중'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `D-${days}`
    if (hours > 0) return `${hours}h`
    return '곧!'
  }
  const isUrgent = (openAt) => {
    const diff = new Date(openAt) - now
    return diff > 0 && diff / (1000 * 60 * 60) <= 72
  }
  const isOngoing = !!ongoingRounds[0]
  
  const countryLabel = concert.country === 'korea' ? '내한' : '원정'
  
  const handleAttendingClick = async (e) => {
  e.stopPropagation()
  if (attendingLoading) return
  if (concert.is_tour) { setShowDayModal(true); return }
  if (concert.is_series && concert.series_dates?.length > 1) { setShowDayModal(true); return }
  setAttendingLoading(true)
  try { await onToggleAttending(concert.id, isAttending) }
  finally { setAttendingLoading(false) }
}

  const handleDayModalConfirm = async (toAdd, toRemove) => {
  setShowDayModal(false)
  if (!onToggleAttendingDays) return
  setAttendingLoading(true)
  try {
    await onToggleAttendingDays(toAdd, toRemove)
  } finally {
    setAttendingLoading(false)
  }
}
  
  // 투어는 아직 미래 공연이 있으면 지난 공연이 아님
  const isTourAllPast = concert.is_tour
    ? concert.tour_concerts?.every(tc => {
        const lastDate = tc.series_dates?.length > 1
          ? tc.series_dates[tc.series_dates.length - 1].date
          : tc.date
        return lastDate < new Date().toISOString().slice(0, 10)
      })
    : false
  const isPast = showPastStyle && (
    concert.is_tour
      ? isTourAllPast
      : new Date(concert.date) < today
  )

  return (
    <>
      <div
        onClick={() => {
          if (isTour && tourConcerts.length > 0) {
            const todayStr = new Date().toISOString().slice(0, 10)
            const next = tourConcerts.find(tc => tc.date > todayStr)
              || tourConcerts.find(tc => tc.date === todayStr)
              || tourConcerts[tourConcerts.length - 1]
            navigate(`/concerts/${next.id}`)
          } else {
            navigate(`/concerts/${concert.id}`)
          }
        }}
        className={`group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${isPast ? 'opacity-60' : ''}`}
      >
        {/* ── 이미지 영역 (3:4) ── */}
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '120%' }}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={concert.title}
              onError={() => setPosterError(true)}
              className={`absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500 ${isPast ? 'grayscale' : ''}`}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)` }}
            >
              <Music className="w-8 h-8 opacity-25" style={{ color }} />
            </div>
          )}

          {/* 하단 그라데이션 */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

          {/* 좌하단 배지 */}
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
            <span className={`text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded ${
              concert.country === 'korea' ? 'bg-cyan-500 text-white' : 'bg-pink-500 text-white'
            }`}>
              {countryLabel}
            </span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
              dDayUrgent ? 'bg-red-500 text-white' : 'bg-black/60 text-white'
            }`}>
              {dDayLabel}
            </span>
            {concert.is_series && !isTour && (
  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-black/60 text-white">
    {concert.series_dates?.length || 2}일
  </span>
)}
{isTour && (
  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-violet-500/90 text-white">
    투어 {tourConcerts.length}
  </span>
)}
          </div>

          {/* 우상단 액션 */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
            {onToggleAttending && (
              <button
                onClick={handleAttendingClick}
                disabled={attendingLoading}
                className={`flex items-center gap-0.5 p-1.5 rounded-full backdrop-blur-sm transition-all ${
  (isAttending || isAttendingTour) ? 'bg-emerald-500 text-white shadow' : 'bg-black/40 text-white'
}`}
              >
                <Check className="w-3 h-3" strokeWidth={isAttending ? 3 : 2} />
                {concert.is_series && attendingDayCount > 0 && (
                  <span className="text-[8px] font-bold">{attendingDayCount}</span>
                )}
              </button>
            )}
            {isOshi && (
              <div className="p-1.5 rounded-full bg-amber-400 shadow">
                <Star className="w-3 h-3 text-white" fill="white" />
              </div>
            )}
            {isAdmin && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(concert) }}
                className="p-1.5 rounded-full backdrop-blur-sm bg-black/40 text-white"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(concert.id) }}
                className="p-1.5 rounded-full backdrop-blur-sm bg-black/40 text-white hover:bg-red-500/90"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 컬러 라인 */}
        <div className="h-[2px] w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}00 90%)` }} />

        {/* ── 텍스트 영역 ── */}
        <div className="flex flex-col flex-1 px-2 pt-1.5 pb-2 gap-0.5">
          {artist && (
            <p className="text-[9px] font-bold tracking-wider truncate" style={{ color }}>
              {artist.name}
              {concert.co_artist && (
                <span className="text-zinc-400"> × </span>
              )}
              {concert.co_artist && (
                <span style={{ color: concert.co_artist.color || color }}>
                  {concert.co_artist.name}
                </span>
              )}
              {concert.co_artist_2 && (
                <span className="text-zinc-400"> × </span>
              )}
              {concert.co_artist_2 && (
                <span style={{ color: concert.co_artist_2.color || color }}>
                  {concert.co_artist_2.name}
                </span>
              )}
              {concert.co_artist_3 && (
                <span className="text-zinc-400"> × </span>
              )}
              {concert.co_artist_3 && (
                <span style={{ color: concert.co_artist_3.color || color }}>
                  {concert.co_artist_3.name}
                </span>
              )}
            </p>
          )}

          <h3 className="text-[11px] font-bold leading-tight text-zinc-900 dark:text-zinc-100 line-clamp-2">
            {concert.title}
          </h3>

          {/* 날짜 / 장소 + 매수제한 */}
          <div className="flex items-end gap-1">
            <div className="flex-1 min-w-0 space-y-0.5 text-[9px] text-zinc-500 dark:text-zinc-400">
              {isTour ? (
  <div className="space-y-0.5">
    <div className="flex items-center gap-1">
      <Calendar className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />
      <span className="truncate">
        {tourConcerts[0]?.date?.slice(5)} ~ {(() => {
          const last = tourConcerts[tourConcerts.length - 1]
          if (last?.series_dates?.length > 1) {
            return last.series_dates[last.series_dates.length - 1].date?.slice(5)
          }
          return last?.date?.slice(5)
        })()}
      </span>
    </div>
    <div className="flex items-center gap-1">
      <MapPin className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />
      <span className="truncate">
        {concert.tour_cities?.[0]}
        {concert.tour_cities?.length > 1 && (
          <span className="text-violet-500 font-bold"> 외 {concert.tour_cities.length - 1}곳</span>
        )}
      </span>
    </div>
  </div>
) : concert.is_series && concert.series_dates ? (
  <div className="space-y-0.5">
    {concert.series_dates.map((d) => (
      <div key={d.id} className="flex items-center gap-1">
        <span className="font-bold text-[8px] min-w-[22px]" style={{ color }}>{d.day_label || ''}</span>
        <span className="truncate">{d.date.slice(5)}{d.time && ` · ${d.time.slice(0, 5)}`}</span>
        {attendingConcertIds.includes(d.id) && (
          <Check className="w-2 h-2 text-emerald-500 ml-auto" strokeWidth={3} />
        )}
      </div>
    ))}
  </div>
) : (
  <div className="flex items-center gap-1">
    <Calendar className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />
    <span className="truncate">{concert.date}{concert.time && ` · ${concert.time.slice(0, 5)}`}</span>
  </div>
)}
{!isTour && (
  <div className="flex items-center gap-1">
    <MapPin className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />
    <span className="truncate">{(venue?.name || concert.venue) || '미정'}</span>
  </div>
)}
            </div>
            {/* 매수제한 우측 정렬 */}
            {concert.max_tickets_per_person && (
              <div className="flex-shrink-0 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-600 dark:text-zinc-300">
                1인 {concert.max_tickets_per_person}매
              </div>
            )}
          </div>

          {/* 티켓팅 바 (내한만 표시) */}
          {nextRound && concert.country === 'korea' && (
            <div className="mt-0.5">
              <div className={`flex items-center justify-between px-1.5 py-1 rounded text-[9px] ${
                isOngoing
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                  : isUrgent(nextRound.open_at)
                    ? 'bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900'
                    : 'bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700'
              }`}>
                <div className="flex items-center gap-1 min-w-0">
                  <Ticket className={`w-2.5 h-2.5 flex-shrink-0 ${
                    isOngoing ? 'text-emerald-500'
                    : isUrgent(nextRound.open_at) ? 'text-pink-500'
                    : 'text-zinc-400'
                  }`} />
                  <span className={`font-bold truncate ${
                    isOngoing ? 'text-emerald-700 dark:text-emerald-400'
                    : isUrgent(nextRound.open_at) ? 'text-pink-600 dark:text-pink-400'
                    : 'text-zinc-600 dark:text-zinc-300'
                  }`}>
                    {nextRound.round_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`font-mono font-bold text-[8px] px-1 py-0.5 rounded ${
                    isOngoing
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : isUrgent(nextRound.open_at)
                        ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                        : 'bg-stone-200 dark:bg-zinc-700 text-zinc-500'
                  }`}>
                    {nextRound.open_at ? getCountdown(nextRound.open_at) : '공개전'}
                  </span>
                  {nextRound.ticket_url && (
                    <a
                      href={nextRound.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-pink-500 hover:text-pink-700 text-[8px]"
                    >
                      예매→
                    </a>
                  )}
                </div>
              </div>

              {ticketRounds.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setTicketsExpanded(!ticketsExpanded) }}
                  className="flex items-center gap-0.5 text-[8px] text-zinc-400 hover:text-zinc-600 pt-0.5 pl-0.5"
                >
                  {ticketsExpanded ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                  {ticketsExpanded ? '접기' : `+${ticketRounds.length - 1}`}
                </button>
              )}
              {ticketsExpanded && ticketRounds.length > 1 && (
                <div className="mt-1 space-y-1 pl-1 border-l-2 border-stone-100 dark:border-zinc-800">
                  {ticketRounds.map((round) => {
                    if (round.id === nextRound?.id) return null
                    const isPast = round.open_at && new Date(round.open_at) <= now
                      && (!round.close_at || new Date(round.close_at) <= now)
                    const methodLabel = { lottery: '추첨', 'first-come': '선착순', fanclub: 'FC선예매' }
                    return (
                      <div
                        key={round.id}
                        className={`text-[9px] px-1.5 py-1 rounded ${
                          isPast ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={isPast ? 'line-through' : 'font-semibold'}>
                            {round.round_name}
                          </span>
                          {isPast && <span className="opacity-50 text-[8px]">[종료]</span>}
                        </div>
                        <div className="text-[8px] mt-0.5 opacity-70">
                          {round.open_at
                            ? new Date(round.open_at).toLocaleString('ko', {
                                month: 'numeric', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : ''}
                          {round.method && ` · ${methodLabel[round.method] || round.method}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 원정 공연 - 공식 페이지 링크 */}
          {concert.country === 'japan' && concert.source_url && (
            <a
              href={concert.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-0.5 flex items-center justify-between px-1.5 py-1 rounded text-[9px] bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700"
            >
              <span className="text-zinc-500 dark:text-zinc-400 font-bold">🎟️ 티켓 및 상세정보</span>
              <span className="text-pink-500 font-bold">공식페이지→</span>
            </a>
          )}

          {/* 메모 (VIP/특전 등 짧은 정보) */}
          {concert.memo && (
            <div className="mt-1">
              <p className="text-[9px] text-pink-600 dark:text-pink-400 font-semibold leading-snug line-clamp-2">
                ⭐ {concert.memo}
              </p>
            </div>
          )}
        </div>
      </div>

      {showDayModal && (
  <AttendingDayModal
    concert={concert.is_tour ? {
      ...concert,
      tour_concerts: concert.tour_concerts,
    } : concert}
    attendingConcertIds={attendingConcertIds}
    onConfirm={handleDayModalConfirm}
    onClose={() => setShowDayModal(false)}
  />
)}
    </>
  )
}