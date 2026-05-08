import { useNavigate } from 'react-router-dom'
import { Ticket, Pencil, Users } from 'lucide-react'

export default function FestivalCard({ festival, isAdmin, onEdit }) {
  const navigate = useNavigate()

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
          <div className="rounded px-1.5 py-1 text-[9px] font-bold flex items-center gap-1 mt-auto"
            style={{
              background: activeTicket ? '#06b6d420' : '#f0fdf4',
              color: activeTicket ? '#0e7490' : '#16a34a',
              border: `1px solid ${activeTicket ? '#06b6d440' : '#bbf7d0'}`,
            }}>
            <Ticket className="w-2.5 h-2.5" />
            {activeTicket ? `${activeTicket.round_name} 접수중` : `${nextTicket.round_name} 예정`}
          </div>
        )}
      </div>
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