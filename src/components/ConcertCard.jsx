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
  
  // artists 배열 우선, 없으면 단일 artist fallback
  const artists = concert.artists?.length > 0
    ? concert.artists
    : concert.artist ? [concert.artist] : []
  const primaryArtist = artists[0]
  const isMultiArtist = artists.length > 1

  const venue = concert.venue
  // 컬러: 단일이면 그대로, 투맨이면 첫 번째 아티스트 컬러
  const primaryColor = primaryArtist?.color || '#888'

  const ticketRounds = concert.ticket_rounds || []
  const posterUrl = !posterError && concert.poster_url ? concert.poster_url : null
  
  // D-day
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
    if (hours > 0) return `${hours}시간 후`
    return '곧 오픈!'
  }
  const isUrgent = (openAt) => {
    const diff = new Date(openAt) - now
    return diff > 0 && diff / (1000 * 60 * 60) <= 72
  }
  const isOngoing = !!ongoingRounds[0]
  
  const countryLabel = concert.country === 'korea' ? '내한' : '원정'
  const methodLabel = { lottery: '추첨', 'first-come': '선착순', fanclub: 'FC선예매' }
  
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
        className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      >
        {/* ── 이미지 영역 (3:4 세로형) ── */}
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '118%' }}>
          
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
              style={{ background: `linear-gradient(135deg, ${primaryColor}18 0%, ${primaryColor}06 100%)` }}
            >
              {/* 투맨이면 두 아티스트 이니셜 표시 */}
              {isMultiArtist ? (
                <div className="flex items-center gap-2">
                  {artists.slice(0, 2).map((a, i) => (
                    <div key={a.id}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white opacity-60"
                        style={{ background: a.color || '#888' }}
                      >
                        {a.name.slice(0, 1)}
                      </div>
                      {i === 0 && (
                        <span className="absolute text-[10px] text-zinc-400 font-black" style={{ left: '50%', transform: 'translateX(-50%)' }}>×</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Music className="w-10 h-10 opacity-20" style={{ color: primaryColor }} />
              )}
            </div>
          )}

          {/* 하단 그라데이션 */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

          {/* 좌하단 배지 */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${
              concert.country === 'korea' ? 'bg-cyan-500 text-white' : 'bg-pink-500 text-white'
            }`}>
              {countryLabel}
            </span>
            <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${
              dDayUrgent ? 'bg-red-500 text-white' : 'bg-black/50 text-white'
            }`}>
              {dDayLabel}
            </span>
            {concert.is_series && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-black/50 text-white">
                {concert.series_dates?.length || 2}일
              </span>
            )}
            {isMultiArtist && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/80 text-white">
                투맨
              </span>
            )}
          </div>

          {/* 우상단 액션 버튼 */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {onToggleAttending && (
              <button
                onClick={handleAttendingClick}
                disabled={attendingLoading}
                className={`flex items-center gap-1 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                  isAttending ? 'bg-emerald-500 text-white shadow-md' : 'bg-black/30 text-white hover:bg-black/50'
                }`}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={isAttending ? 3 : 2} />
                {concert.is_series && attendingDayCount > 0 && (
                  <span className="text-[9px] font-bold pr-0.5">{attendingDayCount}일</span>
                )}
              </button>
            )}
            {isOshi && (
              <div className="p-1.5 rounded-full bg-amber-400 shadow-md">
                <Star className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            )}
            {isAdmin && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(concert) }}
                className="p-1.5 rounded-full backdrop-blur-sm bg-black/30 text-white hover:bg-black/50 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(concert.id) }}
                className="p-1.5 rounded-full backdrop-blur-sm bg-black/30 text-white hover:bg-red-500/90 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 아티스트 컬러 라인 — 투맨이면 두 색 분할 */}
        <div className="h-[2px] w-full flex-shrink-0 flex">
          {artists.slice(0, 2).map((a, i) => (
            <div
              key={a.id}
              className="flex-1"
              style={{
                background: i === 0
                  ? `linear-gradient(90deg, ${a.color || '#888'} 0%, ${a.color || '#888'}88 100%)`
                  : `linear-gradient(90deg, ${a.color || '#888'}88 0%, ${a.color || '#888'} 100%)`,
              }}
            />
          ))}
        </div>

        {/* ── 텍스트 영역 ── */}
        <div className="flex flex-col flex-1 px-2.5 pt-2 pb-2.5 gap-0.5">

          {/* 가수명 — 투맨이면 두 명 표시 */}
          {isMultiArtist ? (
            <div className="flex items-center gap-1 flex-wrap">
              {artists.map((a, i) => (
                <span key={a.id}>
                  <span className="text-[10px] font-bold tracking-wider" style={{ color: a.color || '#888' }}>
                    {a.name}
                  </span>
                  {i < artists.length - 1 && (
                    <span className="text-[10px] text-zinc-400 mx-1">×</span>
                  )}
                </span>
              ))}
            </div>
          ) : primaryArtist ? (
            <p className="text-[10px] font-bold tracking-wider truncate" style={{ color: primaryColor }}>
              {primaryArtist.name}
              {primaryArtist.name_jp && (
                <span className="opacity-50 font-normal"> · {primaryArtist.name_jp}</span>
              )}
            </p>
          ) : null}

          {/* 공연 제목 */}
          <h3 className="text-[12px] font-bold leading-snug text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-0.5">
            {concert.title}
          </h3>

          {/* 날짜 / 장소 */}
          <div className="space-y-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            {concert.is_series && concert.series_dates ? (
              <div className="space-y-0.5">
                {concert.series_dates.map((d) => (
                  <div key={d.id} className="flex items-center gap-1.5">
                    <span className="font-bold text-[9px] min-w-[28px]" style={{ color: primaryColor }}>{d.day_label}</span>
                    <span className="truncate">{d.date}{d.time && ` · ${d.time.slice(0, 5)}`}</span>
                    {attendingConcertIds.includes(d.id) && (
                      <Check className="w-2.5 h-2.5 text-emerald-500 ml-auto flex-shrink-0" strokeWidth={3} />
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
              <span className="truncate">
                {(venue?.name || concert.venue) || '미정'}
                {(venue?.city || concert.city) && ` · ${venue?.city || concert.city}`}
              </span>
            </div>
          </div>

          {/* 티켓팅 바 */}
          {nextRound && (
            <div className="mt-0.5">
              <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] ${
                isOngoing
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                  : isUrgent(nextRound.open_at)
                    ? 'bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900'
                    : 'bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700'
              }`}>
                <div className="flex items-center gap-1.5 min-w-0">
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
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full ${
                    isOngoing
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : isUrgent(nextRound.open_at)
                        ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                        : 'bg-stone-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {nextRound.open_at ? getCountdown(nextRound.open_at) : '공개전'}
                  </span>
                  {nextRound.ticket_url && (
                    <a
                      href={nextRound.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-pink-500 hover:text-pink-700 text-[9px]"
                    >
                      예매 →
                    </a>
                  )}
                </div>
              </div>

              {ticketRounds.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTicketsExpanded(!ticketsExpanded) }}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 pt-1 pl-0.5"
                  >
                    {ticketsExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                    {ticketsExpanded ? '접기' : `+${ticketRounds.length - 1}개 더`}
                  </button>
                  {ticketsExpanded && (
                    <div className="mt-1 space-y-1 pl-1 border-l-2 border-stone-100 dark:border-zinc-800">
                      {ticketRounds.map((round) => {
                        const isPast = round.open_at && new Date(round.open_at) <= now
                          && (!round.close_at || new Date(round.close_at) <= now)
                        if (round.id === nextRound?.id) return null
                        return (
                          <div key={round.id} className={`text-[10px] px-2 py-1 rounded-lg ${
                            isPast ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            <span className={isPast ? 'line-through' : 'font-semibold'}>{round.round_name}</span>
                            {isPast && <span className="ml-1 opacity-50 text-[9px]">[종료]</span>}
                            <div className="text-[9px] mt-0.5 opacity-70">
                              {round.open_at ? new Date(round.open_at).toLocaleString('ko', {
                                month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              }) : ''}
                              {round.method && ` · ${methodLabel[round.method]}`}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {concert.memo && (
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 italic line-clamp-1">
              {concert.memo}
            </p>
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
