import { X, Calendar, MapPin, Ticket, ExternalLink } from 'lucide-react'

export default function FestivalDetailModal({ festival, onClose }) {
  if (!festival) return null

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`
  }

  const formatTime = (dt) => {
    if (!dt) return ''
    return new Date(dt).toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })
  }

  const dateStr = festival.end_date && festival.end_date !== festival.date
    ? `${formatDate(festival.date)} ~ ${formatDate(festival.end_date)}`
    : formatDate(festival.date)

  // 날짜별 아티스트 그룹핑
  const artistsByDate = {}
  ;(festival.festival_artists || []).forEach(fa => {
    const key = fa.performance_date || 'tba'
    if (!artistsByDate[key]) artistsByDate[key] = []
    artistsByDate[key].push(fa)
  })
  const dateKeys = Object.keys(artistsByDate).sort()
  const isMultiDay = dateKeys.length > 1
  const allArtists = festival.festival_artists || []

  // 티켓팅
  const now = new Date()
  const tickets = festival.ticket_rounds || []
  const activeTicket = tickets.find(r => {
    const open = r.open_at ? new Date(r.open_at) : null
    const close = r.close_at ? new Date(r.close_at) : null
    return open && open <= now && (!close || close > now)
  })
  const upcomingTickets = tickets.filter(r => r.open_at && new Date(r.open_at) > now)
  const pastTickets = tickets.filter(r => r.close_at && new Date(r.close_at) <= now)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="h-1.5 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg, #06b6d4, #0e7490)' }} />
        <div className="flex items-start justify-between p-4 border-b border-stone-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#0e7490' }}>
                🎪 페스티벌
              </span>
              <span className="text-[10px] text-zinc-500">
                {festival.country === 'korea' ? '🇰🇷 내한' : '🇯🇵 일본'}
              </span>
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {festival.name}
            </h2>
            {festival.name_jp && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{festival.name_jp}</div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 날짜/장소 */}
          <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0" />
              <span>{dateStr}</span>
            </div>
            {(festival.venue || festival.city) && (
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>{[festival.venue, festival.city].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {festival.ticket_price && (
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Ticket className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>{festival.ticket_price}</span>
              </div>
            )}
          </div>

          {/* 출연진 */}
          {allArtists.length > 0 && (
            <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">출연진</div>
              {isMultiDay ? (
                <div className="space-y-4">
                  {dateKeys.map((key, i) => {
                    const dayArtists = artistsByDate[key]
                    const dayLabel = key === 'tba' ? '날짜 미정' : (() => {
                      const d = new Date(key)
                      return `DAY${i + 1}  ${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`
                    })()
                    return (
                      <div key={key}>
                        <div className="text-[11px] font-bold mb-2 px-2 py-1 rounded-lg inline-block"
                          style={{ background: '#06b6d420', color: '#0e7490' }}>
                          {dayLabel}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {dayArtists.map(fa => (
                            <ArtistChip key={fa.artist_id || fa.id} artist={fa.artist} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allArtists.map(fa => (
                    <ArtistChip key={fa.artist_id || fa.id} artist={fa.artist} />
                  ))}
                </div>
              )}
            </div>
          )}

          {allArtists.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500 border-b border-stone-100 dark:border-zinc-800">
              출연진 미정
            </div>
          )}

          {/* 티켓팅 */}
          {tickets.length > 0 && (
            <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">티켓팅</div>
              <div className="space-y-2">
                {tickets.map((r, i) => {
                  const isActive = r.open_at && new Date(r.open_at) <= now && (!r.close_at || new Date(r.close_at) > now)
                  const isUpcoming = r.open_at && new Date(r.open_at) > now
                  const isPast = r.close_at && new Date(r.close_at) <= now
                  return (
                    <div key={i} className={`rounded-xl p-3 border ${
                      isActive ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/30' :
                      isUpcoming ? 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/50' :
                      'border-stone-100 dark:border-zinc-800 opacity-50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{r.round_name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200' :
                          isUpcoming ? 'bg-stone-200 text-stone-600 dark:bg-zinc-700 dark:text-zinc-300' :
                          'bg-stone-100 text-stone-400'
                        }`}>
                          {isActive ? '접수중' : isUpcoming ? '예정' : '종료'}
                        </span>
                      </div>
                      {r.open_at && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          시작: {formatDate(r.open_at)} {formatTime(r.open_at)}
                        </div>
                      )}
                      {r.close_at && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          마감: {formatDate(r.close_at)} {formatTime(r.close_at)}
                        </div>
                      )}
                      {r.ticket_url && (
                        <a href={r.ticket_url} target="_blank" rel="noopener noreferrer"
                          className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="w-3 h-3" />
                          티켓 구매
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 출처 */}
          {festival.source_url && (
            <div className="px-4 py-3">
              <a href={festival.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-cyan-600 transition"
                onClick={e => e.stopPropagation()}>
                <ExternalLink className="w-3.5 h-3.5" />
                공식 페이지
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ArtistChip({ artist }) {
  if (!artist) return null
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
      style={{ background: artist.color || '#888' }}>
      {artist.name}
    </span>
  )
}
