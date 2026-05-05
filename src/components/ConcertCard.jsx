import { Calendar, MapPin, Ticket, Star, Check, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ConcertCard({ 
  concert, 
  isOshi = false,
  isAttending = false,
  isAdmin = false,
  onToggleAttending,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate()
  const handleCardClick = () => {
    navigate(`/concerts/${concert.id}`)
  }
  const [attendingLoading, setAttendingLoading] = useState(false)
  const [ticketsExpanded, setTicketsExpanded] = useState(false)
  
  const artist = concert.artist
  const venue = concert.venue
  const color = artist?.color || '#888'
  const ticketRounds = concert.ticket_rounds || []
  
  // D-day 계산
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const concertDate = new Date(concert.date)
  concertDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((concertDate - today) / (1000 * 60 * 60 * 24))
  
  let dDayLabel = ''
  let dDayUrgent = false
  if (diffDays === 0) {
    dDayLabel = 'D-DAY'
    dDayUrgent = true
  } else if (diffDays > 0) {
    dDayLabel = `D-${diffDays}`
    dDayUrgent = diffDays <= 7
  } else {
    dDayLabel = `D+${Math.abs(diffDays)}`
  }
  
  // 티켓팅 분석
  const now = new Date()
  const upcomingRounds = ticketRounds.filter(r => new Date(r.open_at) > now)
  const pastRounds = ticketRounds.filter(r => new Date(r.open_at) <= now)
  const nextRound = upcomingRounds[0]
  
  const getCountdown = (openAt) => {
    if (!openAt) return '공개전'
    const open = new Date(openAt)
    const diff = open - now
    if (diff < 0) return '오픈됨'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `D-${days}`
    if (hours > 0) return `${hours}시간 후`
    return '곧 오픈!'
  }
  
  const isUrgent = (openAt) => {
    const diff = new Date(openAt) - now
    const hours = diff / (1000 * 60 * 60)
    return hours > 0 && hours <= 72
  }
  
  const countryLabel = concert.country === 'korea' ? '내한' : '원정'
  const methodLabel = {
    lottery: '추첨',
    'first-come': '선착순',
    fanclub: 'FC선예매',
  }
  
  const handleAttendingClick = async (e) => {
    e.stopPropagation()
    if (attendingLoading) return
    setAttendingLoading(true)
    try {
      await onToggleAttending(concert.id, isAttending)
    } finally {
      setAttendingLoading(false)
    }
  }
  
  return (
    <div 
      onClick={handleCardClick}
      className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* 좌측 가수 컬러 바 */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: color }}
      />
      
      {/* 우측 상단 글로우 */}
      <div 
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ background: color }}
      />
      
      <div className="relative p-5 pl-6">
        
        {/* 상단: 라벨 + 액션 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded ${
              concert.country === 'korea' 
                ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300'
                : 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300'
            }`}>
              {countryLabel}
            </span>
            
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${
              dDayUrgent
                ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {dDayLabel}
            </span>
            
            {/* 양일 공연 라벨 */}
            {concert.is_series && (
              <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400">
                {concert.series_dates?.length || 2}일 공연
              </span>
            )}
            {/* ⭐ 오시 라벨 (버튼 X, 표시만) */}
            {isOshi && (
              <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                <Star className="w-2.5 h-2.5" fill="currentColor" />
                오시
              </span>
            )}
          </div>
          
          {/* 액션 버튼들 (✓ + 관리자) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggleAttending && (
              <button
                onClick={handleAttendingClick}
                disabled={attendingLoading}
                className={`p-1.5 rounded-lg transition ${
                  isAttending
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400'
                }`}
                title={isAttending ? '내 공연 해제' : '갈 거예요'}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={isAttending ? 3 : 2} />
              </button>
            )}
            
            {isAdmin && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(concert) }}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(concert.id) }}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {/* 가수명 */}
        {artist && (
          <div 
            className="text-xs font-bold tracking-wider mb-1"
            style={{ color }}
          >
            {artist.name}
            {artist.name_jp && <span className="opacity-60"> · {artist.name_jp}</span>}
          </div>
        )}
        
        {/* 공연 제목 */}
        <h3 className="text-base font-bold mb-3 leading-snug text-zinc-900 dark:text-zinc-100">
          {concert.title}
        </h3>
        
        {/* 정보 라인 */}
        <div className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          {/* 양일/N일 공연이면 모든 날짜 표시 */}
          {concert.is_series && concert.series_dates ? (
            <div className="rounded-lg p-2 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900">
              <div className="flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 mb-1">
                <Calendar className="w-3 h-3" />
                {concert.series_dates.length}일 공연
              </div>
              {concert.series_dates.map((d) => (
                <div key={d.id} className="text-xs text-zinc-700 dark:text-zinc-300 py-0.5 flex items-center gap-2">
                  <span className="font-bold text-pink-600 dark:text-pink-400 min-w-[40px]">
                    {d.day_label || ''}
                  </span>
                  <span>
                    {d.date}
                    {d.time && ` · ${d.time.slice(0, 5)}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <span>
                {concert.date}
                {concert.time && ` · ${concert.time.slice(0, 5)}`}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <span>
              {(venue?.name || concert.venue) || '미정'}
              {(venue?.city || concert.city) && ` · ${venue?.city || concert.city}`}
            </span>
          </div>
        </div>
        
        {/* 티켓팅 */}
        {ticketRounds.length > 0 && (
          <div className="mt-3">
            {nextRound && (
              <div className={`p-3 rounded-lg mb-2 ${
                isUrgent(nextRound.open_at)
                  ? 'bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900'
                  : 'bg-stone-50 dark:bg-zinc-800/50'
              }`}>
                <div className="flex items-start gap-2">
                  <Ticket className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                    isUrgent(nextRound.open_at) ? 'text-pink-500' : 'text-zinc-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${
                        isUrgent(nextRound.open_at) 
                          ? 'text-pink-600 dark:text-pink-400' 
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {nextRound.round_name}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isUrgent(nextRound.open_at)
                          ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'
                          : 'bg-stone-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {getCountdown(nextRound.open_at)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      {new Date(nextRound.open_at).toLocaleString('ko', { 
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                      {nextRound.method && ` · ${methodLabel[nextRound.method]}`}
                      {nextRound.ticket_site && ` · ${nextRound.ticket_site}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {ticketRounds.length > (nextRound ? 1 : 0) && (
              <button
                onClick={(e) => { e.stopPropagation(); setTicketsExpanded(!ticketsExpanded) }}
                className="w-full text-left text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 py-1"
              >
                {ticketsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>
                  {nextRound 
                    ? `이전 티켓팅 ${pastRounds.length}개 보기` 
                    : `티켓팅 ${ticketRounds.length}개 보기`}
                </span>
              </button>
            )}
            
            {ticketsExpanded && (
              <div className="space-y-1.5 mt-2 pl-2 border-l-2 border-stone-200 dark:border-zinc-800">
                {ticketRounds.map((round) => {
                  const isPast = new Date(round.open_at) <= now
                  const isNext = round.id === nextRound?.id
                  
                  if (isNext) return null
                  
                  return (
                    <div 
                      key={round.id}
                      className={`text-[11px] py-1.5 px-2 rounded ${
                        isPast 
                          ? 'text-zinc-400 dark:text-zinc-600 line-through' 
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="font-semibold">
                        {round.round_name}
                        {isPast && <span className="ml-1 text-[10px] opacity-60">[종료]</span>}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {new Date(round.open_at).toLocaleString('ko', { 
                          month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                        {round.method && ` · ${methodLabel[round.method]}`}
                        {round.ticket_site && ` · ${round.ticket_site}`}
                      </div>
                      {round.note && (
                        <div className="text-[10px] italic opacity-70 mt-0.5">
                          {round.note}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* 메모 */}
        {concert.memo && (
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 italic">
            {concert.memo}
          </div>
        )}
      </div>
    </div>
  )
}
