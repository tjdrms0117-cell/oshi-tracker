import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Mic, Ticket, Star, X } from 'lucide-react'

export default function Calendar({ 
  concerts, 
  festivals = [],
  attendingConcertIds = [],
  oshiArtistIds = [],
}) {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalDate, setModalDate] = useState(null)
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
    
    const addEvent = (day, type, data) => {
      if (!events[day]) events[day] = { live: [], tickets: [] }
      if (type === 'live') events[day].live.push(data)
      else events[day].tickets.push(data)
    }

    filteredConcerts.forEach(c => {
      // 라이브 날짜
      const dates = (c.is_series && c.series_dates?.length > 0)
        ? c.series_dates
        : [{ date: c.date }]

      dates.forEach(d => {
        if (filter === 'mine' && c.is_series && !attendingConcertIds.includes(d.id)) return
        const liveDate = new Date(d.date)
        if (liveDate.getFullYear() === year && liveDate.getMonth() === month) {
          addEvent(liveDate.getDate(), 'live', c)
        }
      })
      
      // 티켓팅 날짜들 (시작 / 마감 / 결과발표)
      ;(c.ticket_rounds || []).forEach(round => {
        // 접수 시작
        if (round.open_at) {
          const d = new Date(round.open_at)
          if (d.getFullYear() === year && d.getMonth() === month) {
            addEvent(d.getDate(), 'ticket', { concert: c, round, ticketType: 'open' })
          }
        }
        // 접수 마감
if (round.close_at) {
  const d = new Date(round.close_at)
  if (d.getFullYear() === year && d.getMonth() === month) {
    const day = d.getDate()
    const openDay = round.open_at ? new Date(round.open_at).getDate() : null
    if (day !== openDay) {
      // 내 일정 탭 + 내한 캘린더에서는 내한 공연 마감 숨김
      const isKoreaClose = c.country === 'korea' && (filter === 'mine' || filter === 'korea')
      if (!isKoreaClose) {
        addEvent(day, 'ticket', { concert: c, round, ticketType: 'close' })
      }
    }
  }
}
        // 결과 발표
        if (round.result_at) {
          const d = new Date(round.result_at)
          if (d.getFullYear() === year && d.getMonth() === month) {
            addEvent(d.getDate(), 'ticket', { concert: c, round, ticketType: 'result' })
          }
        }
      })
    })
    
    // 페스티벌 날짜 추가
    festivals.forEach(fest => {
      const start = new Date(fest.date)
      const end = fest.end_date ? new Date(fest.end_date) : new Date(fest.date)
      const cur = new Date(start)
      while (cur <= end) {
        if (cur.getFullYear() === year && cur.getMonth() === month) {
          const day = cur.getDate()
          if (!events[day]) events[day] = { live: [], tickets: [], festivals: [] }
          if (!events[day].festivals) events[day].festivals = []
          events[day].festivals.push(fest)
        }
        cur.setDate(cur.getDate() + 1)
      }
    })

    return events
  }, [filteredConcerts, festivals, year, month])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())
  const handleDateClick = (day) => setModalDate(new Date(year, month, day))
  
  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  
  const monthLabels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const dayLabels = ['일','월','화','수','목','금','토']
  
  const totalLives = Object.values(monthEvents).reduce((sum, e) => sum + e.live.length, 0)
  const totalTickets = Object.values(monthEvents).reduce((sum, e) => sum + e.tickets.length, 0)
  const myCount = concerts.filter(c => isMine(c)).length
  
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
          style={filter === 'mine' ? { background: 'linear-gradient(135deg, #e91e63, #00acc1)' } : {}}
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
          style={filter === 'korea' ? { background: 'linear-gradient(135deg, #00acc1, #4dd0e1)' } : {}}
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
          style={filter === 'japan' ? { background: 'linear-gradient(135deg, #e91e63, #ff6090)' } : {}}
        >
          🇯🇵 <span>원정</span>
        </button>
      </div>
      
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={goToToday} className="text-base font-bold text-zinc-900 dark:text-zinc-100 px-3 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800">
          {year}년 {monthLabels[month]}
        </button>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* 통계 */}
      {(totalLives > 0 || totalTickets > 0) && (
        <div className="flex items-center justify-center gap-3 mb-3 text-[11px]">
          {totalLives > 0 && (
            <span className={`flex items-center gap-1 ${filter === 'japan' ? 'text-pink-600' : 'text-cyan-600'}`}>
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
            <div key={label} className={`text-center text-[10px] font-bold tracking-wider py-2 ${
              idx === 0 ? 'text-pink-500' : idx === 6 ? 'text-cyan-500' : 'text-zinc-500 dark:text-zinc-400'
            }`}>
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
                  style={{ borderRight: (idx + 1) % 7 === 0 ? 'none' : undefined }}
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
                  <div className={`text-xs font-medium ${
                    isToday ? 'text-pink-600 dark:text-pink-400 font-bold' :
                    dayOfWeek === 0 ? 'text-pink-500' :
                    dayOfWeek === 6 ? 'text-cyan-500' :
                    'text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {day}
                  </div>
                  
                  {filter === 'mine' && hasEvents && (
                    <div className="mt-1 flex-1 flex flex-col justify-end overflow-hidden gap-0.5">
                      {events.live.length > 0 && (
                        <MyEventLabel event={{ type: 'live', concert: events.live[0] }} filterMode="mine" />
                      )}
                      {events.live.length > 1 && (
                        <div className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400">
                          +{events.live.length - 1}
                        </div>
                      )}
                      {ticketCount === 1 && (
                        <MyEventLabel event={{ type: 'ticket', concert: events.tickets[0].concert, round: events.tickets[0].round, ticketType: events.tickets[0].ticketType }} filterMode="mine" />
                      )}
                      {ticketCount > 1 && (
                        <TicketBadgeGroup tickets={events.tickets} />
                      )}
                    </div>
                  )}
                  {events.festivals?.length > 0 && (
                    <div className="rounded px-1 py-0.5 text-[9px] leading-tight overflow-hidden mt-0.5"
                      style={{ background: '#06b6d420', borderLeft: '3px solid #06b6d4' }}>
                      <div className="font-bold truncate" style={{ color: '#0e7490' }}>
                        🎪 {events.festivals[0].name}
                      </div>
                    </div>
                  )}
                  {filter !== 'mine' && hasEvents && (
                    <div className="mt-1 flex-1 flex flex-col justify-end overflow-hidden gap-0.5">
                      {events.live.length === 1 ? (
                        <MyEventLabel event={{ type: 'live', concert: events.live[0] }} filterMode={filter} />
                      ) : events.live.length > 1 ? (
                        <div className="flex flex-wrap gap-0.5 items-end">
                          {koreaCount > 0 && <EventBadge type="live" country="korea" count={koreaCount} />}
                          {japanCount > 0 && <EventBadge type="live" country="japan" count={japanCount} />}
                        </div>
                      ) : null}
                      {ticketCount === 1 ? (
                        <MyEventLabel event={{ type: 'ticket', concert: events.tickets[0].concert, round: events.tickets[0].round, ticketType: events.tickets[0].ticketType }} filterMode={filter} />
                      ) : ticketCount > 1 ? (
                        <TicketBadgeGroup tickets={events.tickets} />
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
        {filter === 'mine' ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border-l-2 border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30" />
              <span>내한 라이브</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border-l-2 border-pink-500 bg-pink-50 dark:bg-pink-950/30" />
              <span>원정 라이브</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border-l-2 bg-sky-100 dark:bg-sky-950/30" style={{ borderColor: '#0284c7' }} />
              <span>내한 라이브</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border-l-2 bg-pink-100 dark:bg-pink-950/30" style={{ borderColor: '#e91e63' }} />
              <span>원정 라이브</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3 text-amber-500" />
          <span>일반 시작</span>
        </div>
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3 text-orange-400" />
          <span>일반 마감</span>
        </div>
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3" style={{ color: '#10b981' }} />
          <span>선행 시작</span>
        </div>
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3" style={{ color: '#059669' }} />
          <span>선행 마감</span>
        </div>
        <div className="flex items-center gap-1">
          <Ticket className="w-3 h-3" style={{ color: '#7c3aed' }} />
          <span>결과발표</span>
        </div>
      </div>
      
      {Object.keys(monthEvents).length === 0 && (
        <div className="text-center py-8 text-xs text-zinc-500 dark:text-zinc-400 italic mt-4">
          {filter === 'mine' 
            ? '이번 달 내 일정이 없어요' 
            : filter === 'korea'
              ? '이번 달 내한 일정이 없어요'
              : '이번 달 원정 일정이 없어요'}
        </div>
      )}
      
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

// filterMode: 'mine'=아티스트 컬러 알록달록 / 'korea','japan'=라이브 색 고정
function MyEventLabel({ event, filterMode = 'mine' }) {
  const isLive = event.type === 'live'
  const concert = event.concert
  const round = event.round
  const ticketType = event.ticketType
  const artistColor = concert.artist?.color || '#888'

  // 내 일정: 아티스트 컬러 알록달록
  // 내한/원정: 파랑(내한) / 인디고(원정) 고정
  const liveColor = filterMode === 'mine'
    ? artistColor
    : concert.country === 'korea' ? '#0284c7' : '#e91e63'

  const liveBorderColor = filterMode === 'mine'
    ? (concert.country === 'korea' ? '#00acc1' : '#e91e63')
    : liveColor

  // 선행 여부 (method === 'fanclub')
  const isFanclub = round?.method === 'fanclub'

  // 티켓 타입 + 선행/일반에 따라 색상 결정
  // 일반: 시작=amber, 마감=orange
  // 선행: 시작=하늘, 마감=파랑
  // 결과발표: 공통 보라
  const ticketColor = ticketType === 'result'
    ? '#7c3aed'
    : isFanclub
      ? (ticketType === 'close' ? '#059669' : '#10b981')
      : (ticketType === 'close' ? '#f97316' : '#d97706')

  const ticketLabel = ticketType === 'close' ? '마감'
    : ticketType === 'result' ? '결과'
    : isFanclub ? '선행' : '🎫'

  let timeStr = ''
  if (isLive && concert.time) {
    timeStr = concert.time.slice(0, 5)
  } else if (!isLive) {
    const dateVal = ticketType === 'close' ? round?.close_at
      : ticketType === 'result' ? round?.result_at
      : round?.open_at
    if (dateVal) {
      timeStr = new Date(dateVal).toLocaleTimeString('ko', {
        hour: '2-digit', minute: '2-digit', hour12: false
      })
    }
  }

  const bgColor = isLive ? `${liveColor}20` : `${ticketColor}15`
  const borderColor = isLive ? liveBorderColor : ticketColor
  const textColor = isLive ? liveColor : ticketColor

  return (
    <div
      className="rounded px-1 py-0.5 text-[9px] leading-tight overflow-hidden"
      style={{ background: bgColor, borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="font-bold truncate" style={{ color: textColor }}>
        {!isLive && `${ticketLabel} `}
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

// 티켓 여러 개일 때 색상별로 묶어서 표시
function TicketBadgeGroup({ tickets }) {
  // ticketType + method 기준으로 색상 그룹화
  const getTicketColor = (t) => {
    const type = t.ticketType
    const isFanclub = t.round?.method === 'fanclub'
    if (type === 'result') return '#7c3aed'
    if (isFanclub) return type === 'close' ? '#059669' : '#10b981'
    return type === 'close' ? '#f97316' : '#d97706'
  }

  // 색상별 카운트
  const colorMap = {}
  tickets.forEach(t => {
    const color = getTicketColor(t)
    colorMap[color] = (colorMap[color] || 0) + 1
  })

  return (
    <div className="flex flex-wrap gap-0.5 items-center">
      {Object.entries(colorMap).map(([color, count]) => (
        <div
          key={color}
          className="flex items-center justify-center gap-0.5 rounded"
          style={{
            background: `${color}20`,
            border: `1px solid ${color}50`,
            height: '18px',
            padding: '0 4px',
            minWidth: '18px',
          }}
        >
          <Ticket className="w-2.5 h-2.5" style={{ color }} />
          {count > 1 && (
            <span className="text-[8px] font-bold leading-none" style={{ color }}>
              {count}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function EventBadge({ type, country, count }) {
  const isLive = type === 'live'
  const showCount = count > 1
  
  let bg, iconColor
  if (isLive && country === 'korea') {
    bg = 'bg-cyan-100 dark:bg-cyan-950/40'; iconColor = '#0891b2'
  } else if (isLive && country === 'japan') {
    bg = 'bg-pink-100 dark:bg-pink-950/40'; iconColor = '#db2777'
  } else {
    bg = 'bg-amber-100 dark:bg-amber-950/40'; iconColor = '#d97706'
  }
  
  const Icon = isLive ? Mic : Ticket
  
  return (
    <div className={`flex items-center justify-center gap-0.5 rounded ${bg}`}
      style={{ height: '20px', padding: showCount ? '0 4px' : '0', minWidth: '20px' }}
    >
      <Icon className="w-3 h-3" style={{ color: iconColor }} />
      {showCount && (
        <span className="text-[9px] font-bold leading-none" style={{ color: iconColor }}>
          {count}
        </span>
      )}
    </div>
  )
}

function DayDetailModal({ date, events, isMine, isOshiArtist, onClose, onConcertClick }) {
  const dayLabels = ['일','월','화','수','목','금','토']
  const hasEvents = events.live.length > 0 || events.tickets.length > 0

  // 티켓팅 타입 라벨
  const ticketTypeLabel = (type) => {
    if (type === 'close') return '접수 마감'
    if (type === 'result') return '결과 발표'
    return '접수 시작'
  }
  const ticketTypeColor = (type) => {
    if (type === 'close') return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30'
    if (type === 'result') return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{date.getFullYear()}년</div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {date.getMonth() + 1}월 {date.getDate()}일 ({dayLabels[date.getDay()]})
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasEvents ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-30">📭</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">이 날 일정이 없어요</p>
            </div>
          ) : (
            <>
            {events.festivals?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#0e7490' }}>
                    🎪 페스티벌 ({events.festivals.length})
                  </h3>
                  <div className="space-y-2">
                    {events.festivals.map(fest => (
                      <div key={fest.id} className="rounded-xl p-3 border"
                        style={{ borderColor: '#06b6d440', background: '#06b6d410' }}>
                        <div className="text-xs font-bold" style={{ color: '#0e7490' }}>{fest.name}</div>
                        {fest.venue && <div className="text-[11px] text-zinc-500 mt-0.5">📍 {fest.venue}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {events.live.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-2 flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    라이브 ({events.live.length})
                  </h3>
                  <div className="space-y-2">
                    {events.live.map(c => (
                      <ModalCard key={c.id} type="live" concert={c}
                        isMine={isMine(c)} isOshi={isOshiArtist(c)}
                        onClick={() => onConcertClick(c.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
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
                        ticketType={t.ticketType}
                        ticketTypeLabel={ticketTypeLabel(t.ticketType)}
                        ticketTypeColor={ticketTypeColor(t.ticketType)}
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

function ModalCard({ type, concert, round, ticketType, ticketTypeLabel, ticketTypeColor, isMine, isOshi, onClick }) {
  const color = concert.artist?.color || '#888'
  
  // 표시할 시간
  const timeVal = type === 'ticket'
    ? (ticketType === 'close' ? round?.close_at
      : ticketType === 'result' ? round?.result_at
      : round?.open_at)
    : null
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3 bg-white dark:bg-zinc-900 border hover:shadow-md transition relative overflow-hidden ${
        isMine 
          ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-900' 
          : 'border-stone-200 dark:border-zinc-800 hover:border-zinc-300'
      }`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      
      {(isMine || isOshi) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {isMine && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              ✓ 내 공연
            </span>
          )}
          {isOshi && !isMine && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
              <Star className="w-2 h-2" fill="currentColor" />오시
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
            <span className={`flex items-center gap-1 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${ticketTypeColor}`}>
              <Ticket className="w-2.5 h-2.5" />
              {round?.round_name || '티켓팅'} · {ticketTypeLabel}
            </span>
          )}
          
          {type === 'live' && concert.time && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              {concert.time.slice(0, 5)}
            </span>
          )}
          {type === 'ticket' && timeVal && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              {new Date(timeVal).toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        <div className="text-xs font-bold mb-0.5" style={{ color }}>
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
