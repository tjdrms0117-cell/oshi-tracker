import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Mic, Ticket, Star, X } from 'lucide-react'

export default function Calendar({ 
  concerts, 
  attendingConcertIds = [],
  oshiArtistIds = [],
}) {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalDate, setModalDate] = useState(null) // 모달용
  const [filter, setFilter] = useState('mine')
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const filteredConcerts = useMemo(() => {
    if (filter === 'korea') return concerts.filter(c => c.country === 'korea')
    if (filter === 'japan') return concerts.filter(c => c.country === 'japan')
    return concerts.filter(c =>
  attendingConcertIds.includes(c.id) ||
  (c.is_series && c.series_dates?.some(d => attendingConcertIds.includes(d.id)))
)
  }, [concerts, filter, attendingConcertIds])
  
  const isMine = (concert) => attendingConcertIds.includes(concert.id)
  const isOshiArtist = (concert) => oshiArtistIds.includes(concert.artist_id)
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const monthEvents = useMemo(() => {
    const events = {}
    
    filteredConcerts.forEach(c => {
  // 양일공연은 series_dates의 각 날짜에 찍기
  const dates = (c.is_series && c.series_dates?.length > 0)
    ? c.series_dates
    : [{ date: c.date }]

  dates.forEach(d => {
  // 양일공연은 attending한 날짜만 표시
  if (c.is_series && !attendingConcertIds.includes(d.id)) return

  const liveDate = new Date(d.date)
  if (liveDate.getFullYear() === year && liveDate.getMonth() === month) {
    const day = liveDate.getDate()
    if (!events[day]) events[day] = { live: [], tickets: [] }
    events[day].live.push(c)
  }
})
      
      ;(c.ticket_rounds || []).forEach(round => {
        if (!round.open_at) return
        const openDate = new Date(round.open_at)
        if (openDate.getFullYear() === year && openDate.getMonth() === month) {
          const day = openDate.getDate()
          if (!events[day]) events[day] = { live: [], tickets: [] }
          events[day].tickets.push({ concert: c, round })
        }
      })
    })
    
    return events
  }, [filteredConcerts, year, month])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const handleDateClick = (day) => {
    const date = new Date(year, month, day)
    setModalDate(date)
  }
  
  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  
  const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  
  const totalLives = Object.values(monthEvents).reduce((sum, e) => sum + e.live.length, 0)
  const totalTickets = Object.values(monthEvents).reduce((sum, e) => sum + e.tickets.length, 0)
  const myCount = concerts.filter(c => isMine(c)).length
  
  // 모달용 데이터
  const modalEvents = modalDate 
    ? (monthEvents[modalDate.getDate()] || { live: [], tickets: [] })
    : null
  
  return (
    <div>
      {/* 서브 필터 */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFilter('mine')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filter === 'mine'
              ? 'text-white shadow-md'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
          style={filter === 'mine' ? {
            background: 'linear-gradient(135deg, #e91e63, #00acc1)',
          } : {}}
        >
          <Star className="w-3 h-3" />
          <span>내 일정</span>
          {myCount > 0 && (
            <span className={`text-[10px] ${filter === 'mine' ? 'opacity-80' : 'opacity-50'}`}>
              {myCount}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setFilter('korea')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filter === 'korea'
              ? 'text-white shadow-md'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
          style={filter === 'korea' ? {
            background: 'linear-gradient(135deg, #00acc1, #4dd0e1)',
          } : {}}
        >
          🇰🇷 <span>내한</span>
        </button>
        
        <button
          onClick={() => setFilter('japan')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filter === 'japan'
              ? 'text-white shadow-md'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
          style={filter === 'japan' ? {
            background: 'linear-gradient(135deg, #e91e63, #ff6090)',
          } : {}}
        >
          🇯🇵 <span>원정</span>
        </button>
      </div>
      
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={goToToday}
          className="text-base font-bold text-zinc-900 dark:text-zinc-100 px-3 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800"
        >
          {year}년 {monthLabels[month]}
        </button>
        
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* 통계 */}
      {(totalLives > 0 || totalTickets > 0) && (
        <div className="flex items-center justify-center gap-3 mb-3 text-[11px]">
          {totalLives > 0 && (
            <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
              <Mic className="w-3 h-3" />
              라이브 {totalLives}
            </span>
          )}
          {totalTickets > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Ticket className="w-3 h-3" />
              티켓팅 {totalTickets}
            </span>
          )}
        </div>
      )}
      
      {/* 캘린더 박스 */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 overflow-hidden">
        
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-stone-50 dark:bg-zinc-800/50 border-b border-stone-200 dark:border-zinc-800">
          {dayLabels.map((label, idx) => (
            <div 
              key={label} 
              className={`text-center text-[10px] font-bold tracking-wider py-2 ${
                idx === 0 ? 'text-pink-500' : 
                idx === 6 ? 'text-cyan-500' : 
                'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div 
                  key={`empty-${idx}`} 
                  className="border-r border-b border-stone-100 dark:border-zinc-800/50 bg-stone-50/30 dark:bg-zinc-900/30 min-h-[60px] md:min-h-[80px]"
                  style={{ 
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : undefined,
                  }}
                />
              )
            }
            
            const date = new Date(year, month, day)
            const isToday = date.getTime() === today.getTime()
            const events = monthEvents[day] || { live: [], tickets: [] }
            const hasEvents = events.live.length > 0 || events.tickets.length > 0
            const dayOfWeek = date.getDay()
            const isLastCol = (idx + 1) % 7 === 0
            
            const koreaCount = events.live.filter(c => c.country === 'korea').length
            const japanCount = events.live.filter(c => c.country === 'japan').length
            const ticketCount = events.tickets.length
            
            // "내 일정" 모드일 때 보여줄 첫 번째 이벤트
            const firstEvent = filter === 'mine' && hasEvents
              ? (events.live[0] 
                  ? { type: 'live', concert: events.live[0] }
                  : { type: 'ticket', ...events.tickets[0] })
              : null
            const totalEvents = events.live.length + events.tickets.length
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`relative border-b border-stone-100 dark:border-zinc-800/50 text-left transition min-h-[60px] md:min-h-[80px] ${
                  !isLastCol ? 'border-r' : ''
                } ${
                  isToday
                    ? 'bg-pink-50 dark:bg-pink-950/30 ring-2 ring-pink-400 dark:ring-pink-700 ring-inset'
                    : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800/30'
                }`}
              >
                <div className="p-1.5 h-full flex flex-col">
                  {/* 날짜 숫자 */}
                  <div className={`text-xs font-medium ${
                    isToday
                      ? 'text-pink-600 dark:text-pink-400 font-bold'
                      : dayOfWeek === 0 ? 'text-pink-500' :
                        dayOfWeek === 6 ? 'text-cyan-500' :
                        'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {day}
                  </div>
                  
                  {/* "내 일정" 모드: 가수명 + 시간 표시 */}
                  {filter === 'mine' && firstEvent && (
                    <div className="mt-1 flex-1 flex flex-col justify-end overflow-hidden">
                      <MyEventLabel event={firstEvent} />
                      
                      {/* 추가 일정 있으면 +N */}
                      {totalEvents > 1 && (
                        <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                          +{totalEvents - 1}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* "내한"/"원정" 모드: 공연명 표시 */}
                  {filter !== 'mine' && hasEvents && (
                    <div className="mt-1 flex-1 flex flex-col justify-end overflow-hidden gap-0.5">
                      {events.live.length === 1 ? (
                        <MyEventLabel event={{ type: 'live', concert: events.live[0] }} />
                      ) : events.live.length > 1 ? (
                        <div className="flex flex-wrap gap-0.5 items-end">
                          {koreaCount > 0 && <EventBadge type="live" country="korea" count={koreaCount} />}
                          {japanCount > 0 && <EventBadge type="live" country="japan" count={japanCount} />}
                        </div>
                      ) : null}
                      {ticketCount === 1 ? (
                        <MyEventLabel event={{ type: 'ticket', concert: events.tickets[0].concert, round: events.tickets[0].round }} />
                      ) : ticketCount > 1 ? (
                        <EventBadge type="ticket" count={ticketCount} />
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-zinc-500 dark:text-zinc-400 flex-wrap">
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3 text-cyan-500" />
          <span>한국 공연</span>
        </div>
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3 text-pink-500" />
          <span>일본 공연</span>
        </div>
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3 text-amber-500" />
          <span>티켓팅</span>
        </div>
      </div>
      
      {/* 빈 상태 */}
      {Object.keys(monthEvents).length === 0 && (
        <div className="text-center py-8 text-xs text-zinc-500 dark:text-zinc-400 italic mt-4">
          {filter === 'mine' 
            ? '이번 달 내 일정이 없어요' 
            : filter === 'korea'
              ? '이번 달 내한 일정이 없어요'
              : '이번 달 원정 일정이 없어요'}
        </div>
      )}
      
      {/* 모달 */}
      {modalDate && (
        <DayDetailModal
          date={modalDate}
          events={modalEvents}
          isMine={isMine}
          isOshiArtist={isOshiArtist}
          onClose={() => setModalDate(null)}
          onConcertClick={(id) => {
            setModalDate(null)
            navigate(`/concerts/${id}`)
          }}
        />
      )}
    </div>
  )
}
// "내 일정" 모드의 칸 안 라벨 (가수명 + 시간)
function MyEventLabel({ event }) {
  const isLive = event.type === 'live'
  const concert = event.concert
  const round = event.round
  const color = concert.artist?.color || '#888'
  
  // 시간 포맷
  let timeStr = ''
  if (isLive && concert.time) {
    timeStr = concert.time.slice(0, 5)
  } else if (!isLive && round?.open_at) {
    timeStr = new Date(round.open_at).toLocaleTimeString('ko', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
    })
  }
  
  return (
    <div 
      className="rounded px-1 py-0.5 text-[9px] leading-tight overflow-hidden relative"
      style={{
        background: `${color}20`,
        borderLeft: `3px solid ${isLive ? (concert.country === 'korea' ? '#00acc1' : '#e91e63') : color}`,
      }}
    >
      <div 
        className="font-bold truncate" 
        style={{ color }}
      >
        {!isLive && '🎫 '}
      {concert.artist?.name || '미정'}
      </div>
      {timeStr && (
        <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[8px]">
          {timeStr}
        </div>
      )}
    </div>
  )
}
// 이벤트 뱃지 (아이콘 + 카운트)
function EventBadge({ type, country, count }) {
  const isLive = type === 'live'
  const showCount = count > 1
  
  let bg, iconColor
  if (isLive && country === 'korea') {
    bg = 'bg-cyan-100 dark:bg-cyan-950/40'
    iconColor = '#0891b2'
  } else if (isLive && country === 'japan') {
    bg = 'bg-pink-100 dark:bg-pink-950/40'
    iconColor = '#db2777'
  } else {
    bg = 'bg-amber-100 dark:bg-amber-950/40'
    iconColor = '#d97706'
  }
  
  const Icon = isLive ? Mic : Ticket
  
  return (
    <div 
      className={`flex items-center justify-center gap-0.5 rounded ${bg}`}
      style={{ 
        height: '20px', 
        padding: showCount ? '0 4px' : '0',
        minWidth: '20px',
      }}
    >
      <Icon className="w-3 h-3" style={{ color: iconColor }} />
      {showCount && (
        <span 
          className="text-[9px] font-bold leading-none" 
          style={{ color: iconColor }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

// 날짜 상세 모달
function DayDetailModal({ date, events, isMine, isOshiArtist, onClose, onConcertClick }) {
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  const hasEvents = events.live.length > 0 || events.tickets.length > 0
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {date.getFullYear()}년
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {date.getMonth() + 1}월 {date.getDate()}일 ({dayLabels[date.getDay()]})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {!hasEvents ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-30">📭</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                이 날 일정이 없어요
              </p>
            </div>
          ) : (
            <>
              {/* 라이브 */}
              {events.live.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-2 flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    라이브 ({events.live.length})
                  </h3>
                  <div className="space-y-2">
                    {events.live.map(c => (
                      <ModalCard 
                        key={c.id} 
                        type="live" 
                        concert={c}
                        isMine={isMine(c)}
                        isOshi={isOshiArtist(c)}
                        onClick={() => onConcertClick(c.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 티켓팅 */}
              {events.tickets.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    티켓팅 ({events.tickets.length})
                  </h3>
                  <div className="space-y-2">
                    {events.tickets.map((t, idx) => (
                      <ModalCard 
                        key={`${t.concert.id}-${idx}`}
                        type="ticket"
                        concert={t.concert}
                        round={t.round}
                        isMine={isMine(t.concert)}
                        isOshi={isOshiArtist(t.concert)}
                        onClick={() => onConcertClick(t.concert.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// 모달 안의 카드
function ModalCard({ type, concert, round, isMine, isOshi, onClick }) {
  const color = concert.artist?.color || '#888'
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3 bg-white dark:bg-zinc-900 border hover:shadow-md transition relative overflow-hidden ${
        isMine 
          ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-900' 
          : 'border-stone-200 dark:border-zinc-800 hover:border-zinc-300'
      }`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: color }}
      />
      
      {(isMine || isOshi) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {isMine && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              ✓ 내 공연
            </span>
          )}
          {isOshi && !isMine && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
              <Star className="w-2 h-2" fill="currentColor" />
              오시
            </span>
          )}
        </div>
      )}
      
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-1">
          {type === 'live' ? (
            <span className={`flex items-center gap-1 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${
              concert.country === 'korea' 
                ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300'
                : 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300'
            }`}>
              <Mic className="w-2.5 h-2.5" />
              {concert.country === 'korea' ? '내한' : '원정'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
              <Ticket className="w-2.5 h-2.5" />
              {round?.round_name || '티켓팅'}
            </span>
          )}
          
          {type === 'live' && concert.time && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              {concert.time.slice(0, 5)}
            </span>
          )}
          {type === 'ticket' && round?.open_at && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              {new Date(round.open_at).toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        <div 
          className="text-xs font-bold mb-0.5"
          style={{ color }}
        >
          {concert.artist?.name}
        </div>
        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {concert.title}
        </div>
        
        {type === 'live' && (concert.venue?.name || concert.venue) && (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            📍 {concert.venue?.name || concert.venue}
          </div>
        )}
        {type === 'ticket' && round?.ticket_site && (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            🌐 {round.ticket_site}
          </div>
        )}
      </div>
    </button>
  )
}
