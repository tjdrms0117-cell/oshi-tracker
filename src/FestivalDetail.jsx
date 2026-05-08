import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Ticket, ExternalLink, Check, Clock } from 'lucide-react'
import { fetchFestivalById, fetchMyFestivalPicks, toggleFestivalPick } from './lib/api'

export default function FestivalDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [festival, setFestival] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(null)
  const [picks, setPicks] = useState([])

  useEffect(() => {
    loadFestival()
  }, [id])

  useEffect(() => {
    if (session?.user && festival) {
      fetchMyFestivalPicks(session.user.id, festival.id)
        .then(setPicks)
        .catch(() => {})
    }
  }, [session, festival])

  const loadFestival = async () => {
    try {
      const data = await fetchFestivalById(id)
      setFestival(data)

      // 첫 번째 날짜 탭 자동 선택
      const artists = data.festival_artists || []
      const dateKeys = [...new Set(
        artists.map(fa => fa.performance_date || 'tba')
      )].sort()
      if (dateKeys.length > 0) setActiveDay(dateKeys[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePick = async (artistId) => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    const currentlyPicked = picks.includes(artistId)
    // 낙관적 업데이트
    setPicks(prev => currentlyPicked
      ? prev.filter(id => id !== artistId)
      : [...prev, artistId]
    )
    try {
      await toggleFestivalPick(session.user.id, festival.id, artistId, currentlyPicked)
    } catch {
      // 롤백
      setPicks(prev => currentlyPicked
        ? [...prev, artistId]
        : prev.filter(id => id !== artistId)
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-cyan-500 text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }

  if (!festival) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">페스티벌을 찾을 수 없어요</p>
      </div>
    )
  }

  const allArtists = festival.festival_artists || []

  // 날짜 키 목록
  const dateKeys = [...new Set(
    allArtists.map(fa => fa.performance_date || 'tba')
  )].sort((a, b) => {
    if (a === 'tba') return 1
    if (b === 'tba') return -1
    return a.localeCompare(b)
  })

  const isMultiDay = dateKeys.length > 1

  // 현재 탭 아티스트 (시간순 정렬, 미정은 뒤로)
  const currentArtists = allArtists
    .filter(fa => (fa.performance_date || 'tba') === activeDay)
    .sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    })

  // 날짜 탭 라벨
  const getDayLabel = (key, idx) => {
    if (key === 'tba') return '날짜 미정'
    const d = new Date(key)
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    return `DAY${idx + 1}  ${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`
  }

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`
  }

  const dateStr = festival.end_date && festival.end_date !== festival.date
    ? `${formatDate(festival.date)} ~ ${formatDate(festival.end_date)}`
    : formatDate(festival.date)

  const now = new Date()
  const tickets = festival.ticket_rounds || []

  // 내 픽 카운트 (현재 탭 기준)
  const pickedInCurrentDay = currentArtists.filter(fa => picks.includes(fa.artist_id)).length

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #fafaf7 0%, #f0fdfa 100%)',
    }}>
      <div className="fixed inset-0 -z-10 hidden dark:block" style={{
        background: 'linear-gradient(135deg, #0f0a1a 0%, #0a1520 100%)',
      }} />

      <div className="max-w-2xl mx-auto pb-20">
        {/* 헤더 */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">🎪 페스티벌</div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{festival.name}</div>
            </div>
          </div>
        </div>

        {/* 민트 컬러 라인 */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #06b6d4, #0e7490)' }} />

        {/* 기본 정보 */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{festival.name}</h1>
          {festival.name_jp && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{festival.name_jp}</div>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="text-base">📅</span>
              <span>{dateStr}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-500">
                {festival.country === 'korea' ? '🇰🇷 내한' : '🇯🇵 일본'}
              </span>
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
            {festival.source_url && (
              <a href={festival.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline mt-1">
                <ExternalLink className="w-3.5 h-3.5" />
                공식 페이지
              </a>
            )}
          </div>
        </div>

        {/* 티켓팅 */}
        {tickets.length > 0 && (
          <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">티켓팅</div>
            <div className="space-y-2">
              {tickets.map((r, i) => {
                const isActive = r.open_at && new Date(r.open_at) <= now && (!r.close_at || new Date(r.close_at) > now)
                const isUpcoming = r.open_at && new Date(r.open_at) > now
                return (
                  <div key={i} className={`rounded-xl p-3 border flex items-center justify-between ${
                    isActive ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/30' :
                    isUpcoming ? 'border-stone-200 dark:border-zinc-700' :
                    'border-stone-100 dark:border-zinc-800 opacity-50'
                  }`}>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.round_name}</div>
                      {r.open_at && (
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {new Date(r.open_at).toLocaleDateString('ko')} {new Date(r.open_at).toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200' :
                        isUpcoming ? 'bg-stone-200 text-stone-600 dark:bg-zinc-700 dark:text-zinc-300' :
                        'bg-stone-100 text-stone-400'
                      }`}>
                        {isActive ? '접수중' : isUpcoming ? '예정' : '종료'}
                      </span>
                      {r.ticket_url && (
                        <a href={r.ticket_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5">
                          <ExternalLink className="w-3 h-3" />
                          구매
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 출연진 섹션 */}
        <div className="bg-white dark:bg-zinc-900">
          {/* 날짜 탭 */}
          {isMultiDay && (
            <div className="px-5 pt-4 flex gap-2 overflow-x-auto pb-1 border-b border-stone-200 dark:border-zinc-800">
              {dateKeys.map((key, idx) => (
                <button key={key} onClick={() => setActiveDay(key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${
                    activeDay === key
                      ? 'text-white'
                      : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-stone-200'
                  }`}
                  style={activeDay === key ? { background: 'linear-gradient(135deg, #06b6d4, #0e7490)' } : {}}>
                  {getDayLabel(key, idx)}
                </button>
              ))}
            </div>
          )}

          {/* 탭 헤더 */}
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              출연진 {currentArtists.length > 0 && `(${currentArtists.length})`}
            </div>
            {picks.length > 0 && (
              <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
                ✓ {pickedInCurrentDay}명 픽
              </div>
            )}
          </div>

          {/* 아티스트 목록 */}
          {currentArtists.length === 0 ? (
            <div className="px-5 pb-8 text-center text-sm text-zinc-400 py-8">
              출연진 미정
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-2">
              {currentArtists.map(fa => {
                const artist = fa.artist
                if (!artist) return null
                const isPicked = picks.includes(fa.artist_id)
                const hasTime = fa.start_time

                return (
                  <div key={fa.id || fa.artist_id}
                    className={`rounded-2xl border p-3.5 flex items-center gap-3 transition ${
                      isPicked
                        ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/20'
                        : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}>
                    {/* 아티스트 컬러 아바타 */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                      style={{ background: artist.color || '#888' }}>
                      {artist.name?.[0]}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{artist.name}</div>
                      {artist.name_jp && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{artist.name_jp}</div>
                      )}
                      {/* 시간 */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {hasTime ? (
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                            {fa.start_time.slice(0, 5)}
                            {fa.end_time && ` ~ ${fa.end_time.slice(0, 5)}`}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">시간 미정</span>
                        )}
                        {fa.stage && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-500 ml-1">
                            {fa.stage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 픽 버튼 */}
                    <button onClick={() => handleTogglePick(fa.artist_id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                        isPicked
                          ? 'text-white'
                          : 'bg-stone-100 dark:bg-zinc-800 text-zinc-400 hover:bg-stone-200'
                      }`}
                      style={isPicked ? { background: artist.color || '#06b6d4' } : {}}>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}