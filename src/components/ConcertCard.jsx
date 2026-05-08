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
  const posterUrl = !posterError && concert.poster_url ? concert.poster_url : null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const concertDate = new Date(concert.date)
  concertDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((concertDate - today) / (1000 * 60 * 60 * 24))
  let dDayLabel = ''
  let dDayUrgent = false
  if (diffDays === 0) { dDayLabel = 'D-DAY'; dDayUrgent = true }
  else if (diffDays > 0) { dDayLabel = `D-${diffDays}`; dDayUrgent = diffDays <= 7 }
  else { dDayLabel = `D+${Math.abs(diffDays)}` }

  const attendingDayCount = concert.is_series && concert.series_dates
    ? concert.series_dates.filter(d => attendingConcertIds.includes(d.id)).length
    : 0
  
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
    if (concert.is_series && concert.series_dates?.length > 1) { setShowDayModal(true); return }
    setAttendingLoading(true)
    try { await onToggleAttending(concert.id, isAttending) }
    finally { setAttendingLoading(false) }
  }

  const handleDayModalConfirm = async (toAdd, toRemove) => {
    setShowDayModal(false)
    if (!onToggleAttendingDays) return
    setAttendingLoading(true)
    try { await onToggleAttendingDays(toAdd, toRemove) }
    finally { setAttendingLoading(false) }
  }
  
  return (
    <>
      <div
        onClick={() => navigate(`/concerts/${concert.id}`)}
        className="group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      >
        {/* ── 이미지 영역 (3:4) ── */}
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '120%' }}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={concert.title}
              onError={() => setPosterError(true)}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
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
            {concert.is_series && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-black/60 text-white">
                {concert.series_dates?.length || 2}일
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
                  isAttending ? 'bg-emerald-500 text-white shadow' : 'bg-black/40 text-white'
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
            </p>
          )}

          <h3 className="text-[11px] font-bold leading-tight text-zinc-900 dark:text-zinc-100 line-clamp-2">
            {concert.title}
          </h3>

          {/* 날짜 / 장소 */}
          <div className="space-y-0.5 text-[9px] text-zinc-500 dark:text-zinc-400">
            {concert.is_series && concert.series_dates ? (
              <div className="space-y-0.5">
                {concert.series_dates.map((d) => (
                  <div key={d.id} className="flex items-center gap-1">
                    <span className="font-bold text-[8px] min-w-[22px]" style={{ color }}>{d.day_label}</span>
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
            <div className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />
              <span className="truncate">{(venue?.name || concert.venue) || '미정'}</span>
            </div>
          </div>

          {/* 티켓팅 바 (간소화) */}
          {nextRound && (
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
                <span className={`font-mono font-bold text-[8px] px-1 py-0.5 rounded flex-shrink-0 ${
                  isOngoing
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : isUrgent(nextRound.open_at)
                      ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                      : 'bg-stone-200 dark:bg-zinc-700 text-zinc-500'
                }`}>
                  {nextRound.open_at ? getCountdown(nextRound.open_at) : '공개전'}
                </span>
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
                <div className="mt-1 space-y-0.5 pl-1 border-l border-stone-200 dark:border-zinc-800">
                  {ticketRounds.map((round) => {
                    if (round.id === nextRound?.id) return null
                    const isPast = round.open_at && new Date(round.open_at) <= now
                      && (!round.close_at || new Date(round.close_at) <= now)
                    return (
                      <div key={round.id} className={`text-[8px] px-1 ${
                        isPast ? 'text-zinc-400 dark:text-zinc-600 line-through' : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {round.round_name}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDayModal && (
        <AttendingDayModal
          concert={concert}
          attendingConcertIds={attendingConcertIds}
          onConfirm={handleDayModalConfirm}
          onClose={() => setShowDayModal(false)}
        />
      )}
    </>
  )
}