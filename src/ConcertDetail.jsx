import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, MapPin, Ticket, Star, Check, 
  Clock, Train, Car, Lightbulb, Music, ExternalLink, Users, Building2
} from 'lucide-react'
import { 
  fetchConcertById,
  fetchConcertSeries,
  addToOshi, removeFromOshi, fetchMyOshiList,
  addToAttending, removeFromAttending, fetchMyAttendingList,
} from './lib/api'
import AttendingDayModal from './components/AttendingDayModal'

export default function ConcertDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [concert, setConcert] = useState(null)
  const [seriesConcerts, setSeriesConcerts] = useState([])
  const [isOshi, setIsOshi] = useState(false)
  const [attendingConcertIds, setAttendingConcertIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [oshiLoading, setOshiLoading] = useState(false)
  const [attendingLoading, setAttendingLoading] = useState(false)
  const [showDayModal, setShowDayModal] = useState(false)
  const [posterError, setPosterError] = useState(false)

  useEffect(() => {
    loadData()
  }, [id, session])

  const loadData = async () => {
    setLoading(true)
    try {
      const concertData = await fetchConcertById(id)
      setConcert(concertData)

      if (concertData.series_id) {
        const siblings = await fetchConcertSeries(concertData.series_id)
        setSeriesConcerts(siblings)
      }

      if (session?.user) {
        const [oshiList, attendingList] = await Promise.all([
          fetchMyOshiList(session.user.id).catch(() => []),
          fetchMyAttendingList(session.user.id).catch(() => []),
        ])
        setIsOshi(oshiList.some(o => o.artist_id === concertData.artist_id))
        setAttendingConcertIds(attendingList.map(a => a.concert_id))
      }
    } catch (err) {
      console.error('공연 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const isAttending = concert
    ? concert.series_id
      ? seriesConcerts.some(c => attendingConcertIds.includes(c.id))
      : attendingConcertIds.includes(concert.id)
    : false

  const handleToggleOshi = async () => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    if (oshiLoading) return
    setOshiLoading(true)
    try {
      if (isOshi) {
        await removeFromOshi(session.user.id, concert.artist_id)
      } else {
        await addToOshi(session.user.id, concert.artist_id)
      }
      setIsOshi(!isOshi)
    } catch (err) {
      alert('처리 중 오류가 발생했어요')
    } finally {
      setOshiLoading(false)
    }
  }

  const handleAttendingClick = () => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    if (attendingLoading) return
    if (concert.series_id && seriesConcerts.length > 1) {
      setShowDayModal(true)
      return
    }
    handleToggleSingle()
  }

  const handleToggleSingle = async () => {
    setAttendingLoading(true)
    try {
      if (attendingConcertIds.includes(concert.id)) {
        await removeFromAttending(session.user.id, concert.id)
      } else {
        await addToAttending(session.user.id, concert.id)
      }
      const newList = await fetchMyAttendingList(session.user.id)
      setAttendingConcertIds(newList.map(a => a.concert_id))
    } catch (err) {
      alert('처리 중 오류가 발생했어요')
    } finally {
      setAttendingLoading(false)
    }
  }

  const handleDayModalConfirm = async (toAdd, toRemove) => {
    setShowDayModal(false)
    setAttendingLoading(true)
    try {
      for (const concertId of toAdd) {
        await addToAttending(session.user.id, concertId)
      }
      for (const concertId of toRemove) {
        await removeFromAttending(session.user.id, concertId)
      }
      const newList = await fetchMyAttendingList(session.user.id)
      setAttendingConcertIds(newList.map(a => a.concert_id))
    } catch (err) {
      alert('처리 중 오류가 발생했어요')
    } finally {
      setAttendingLoading(false)
    }
  }

  const concertForModal = concert && concert.series_id && seriesConcerts.length > 1
    ? {
        ...concert,
        is_series: true,
        series_dates: seriesConcerts.map(c => ({
          id: c.id,
          date: c.date,
          time: c.time,
          day_label: c.day_label,
        })),
      }
    : concert

  const attendingDayCount = concert?.series_id
    ? seriesConcerts.filter(c => attendingConcertIds.includes(c.id)).length
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }

  if (!concert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">공연을 찾을 수 없어요</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm">
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const artist = concert.artist
  const venue = concert.venue
  const color = artist?.color || '#888'
  const ticketRounds = concert.ticket_rounds || []
  const posterUrl = !posterError && concert.poster_url ? concert.poster_url : null

  // 티켓팅 상태 분류
  const now = new Date()
  const getRoundStatus = (round) => {
    if (!round.open_at) return 'pending'
    const openAt = new Date(round.open_at)
    const closeAt = round.close_at ? new Date(round.close_at) : null
    if (openAt > now) return 'upcoming'
    if (closeAt && closeAt > now) return 'ongoing'
    return 'past'
  }

  const sortedRounds = [...ticketRounds].sort((a, b) => {
    const order = { ongoing: 0, upcoming: 1, pending: 2, past: 3 }
    return order[getRoundStatus(a)] - order[getRoundStatus(b)]
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const concertDate = new Date(concert.date)
  concertDate.setHours(0, 0, 0, 0)
  const diffDays = Math.round((concertDate - today) / (1000 * 60 * 60 * 24))
  
  let dDayLabel = ''
  if (diffDays === 0) dDayLabel = 'D-DAY'
  else if (diffDays > 0) dDayLabel = `D-${diffDays}`
  else dDayLabel = `D+${Math.abs(diffDays)}`

  const countryLabel = concert.country === 'korea' ? '내한' : '원정'
  const methodLabel = {
    lottery: '추첨',
    'first-come': '선착순',
    fanclub: '선행',
  }
  
  const getYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }
  const youtubeId = artist?.top_song_youtube_url ? getYouTubeId(artist.top_song_youtube_url) : null

  return (
    <>
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
        
        {/* 포스터 히어로 (있을 때) */}
        {posterUrl ? (
          <div className="relative w-full" style={{ maxHeight: '420px', overflow: 'hidden' }}>
            <img
              src={posterUrl}
              alt={concert.title}
              onError={() => setPosterError(true)}
              className="w-full object-cover object-top"
              style={{ maxHeight: '420px' }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, transparent 40%, var(--tw-gradient-to, #fafaf9) 100%)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-50 dark:to-zinc-950" />
            <div className="absolute top-5 left-5">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-black/50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="relative pb-8"
            style={{ background: `linear-gradient(180deg, ${color}25 0%, transparent 100%)` }}
          >
            <div className="px-5 pt-5 pb-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로
              </button>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-5 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded ${
              concert.country === 'korea' 
                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                : 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300'
            }`}>
              {countryLabel}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-stone-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {dDayLabel}
            </span>
            {concert.max_tickets_per_person && (
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                1인 {concert.max_tickets_per_person}매
              </span>
            )}
          </div>

          <div className="text-sm font-bold tracking-wider mb-2" style={{ color }}>
            {artist?.name}
            {artist?.name_jp && <span className="opacity-60"> · {artist.name_jp}</span>}
          </div>

          <h1 className="text-2xl font-black mb-6 leading-tight text-zinc-900 dark:text-zinc-100">
            {concert.title}
          </h1>

          <div className="flex gap-2 mb-8">
            <button
              onClick={handleAttendingClick}
              disabled={attendingLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition ${
                isAttending
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Check className="w-4 h-4" />
              {isAttending
                ? (attendingDayCount > 1 ? `내 공연 (${attendingDayCount}일)` : '내 공연 등록됨')
                : '갈 거예요'}
            </button>
            <button
              onClick={handleToggleOshi}
              disabled={oshiLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition ${
                isOshi
                  ? 'bg-amber-400 text-amber-950 shadow-md'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Star className="w-4 h-4" fill={isOshi ? 'currentColor' : 'none'} />
              {isOshi ? '내 오시' : '오시 등록'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 pb-10 space-y-4">
          <Section icon={Calendar} title="공연 정보">
            <div className="space-y-2">
              {seriesConcerts.length > 1 ? (
                <div className="rounded-lg p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 mb-2">
                    <Calendar className="w-3 h-3" />
                    {seriesConcerts.length}일 공연
                  </div>
                  {seriesConcerts.map((c) => (
                    <div key={c.id} className="text-sm text-zinc-700 dark:text-zinc-300 py-1 flex items-center gap-2">
                      {c.day_label && (
                        <span className="font-bold text-pink-600 dark:text-pink-400 min-w-[40px] text-xs">
                          {c.day_label}
                        </span>
                      )}
                      <span>
                        {c.date}
                        {c.time && ` · ${c.time.slice(0, 5)}`}
                      </span>
                      {attendingConcertIds.includes(c.id) && (
                        <span className="ml-auto flex items-center gap-1 text-emerald-500 text-xs font-bold">
                          <Check className="w-3 h-3" strokeWidth={3} />
                          등록됨
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <InfoRow label="날짜">
                  {concert.date}
                  {concert.time && ` · ${concert.time.slice(0, 5)}`}
                </InfoRow>
              )}
              {concert.seat_type && <InfoRow label="좌석">{concert.seat_type}</InfoRow>}
              {concert.ticket_price && <InfoRow label="가격">{concert.ticket_price}</InfoRow>}
              {concert.max_tickets_per_person && (
                <InfoRow label="매수 제한">1인 {concert.max_tickets_per_person}매</InfoRow>
              )}
              {concert.organizer && (
                <InfoRow icon={Building2} label="주최">{concert.organizer}</InfoRow>
              )}
              {concert.memo && (
                <InfoRow label="메모">
                  <span className="text-pink-600 dark:text-pink-400 font-semibold">⭐ {concert.memo}</span>
                </InfoRow>
              )}
            </div>
          </Section>

          {sortedRounds.length > 0 && (
            <Section icon={Ticket} title={`티켓팅 (${sortedRounds.length}건)`}>
              <div className="space-y-3">
                {sortedRounds.map((round) => {
                  const status = getRoundStatus(round)
                  const isOngoing = status === 'ongoing'
                  const isUpcoming = status === 'upcoming'
                  const isPast = status === 'past'

                  return (
                    <div
                      key={round.id}
                      onClick={() => round.ticket_url && window.open(round.ticket_url, '_blank')}
                      className={`p-3 rounded-lg border transition ${
                        round.ticket_url ? 'cursor-pointer hover:shadow-md' : ''
                      } ${
                        isOngoing
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                          : isUpcoming
                            ? 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900'
                            : 'bg-stone-50 dark:bg-zinc-800/30 border-stone-200 dark:border-zinc-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${
                          isPast
                            ? 'line-through text-zinc-500'
                            : isOngoing
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-zinc-900 dark:text-zinc-100'
                        }`}>
                          {round.round_name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isOngoing
                            ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                            : isUpcoming
                              ? 'bg-pink-200 dark:bg-pink-900 text-pink-800 dark:text-pink-200'
                              : 'bg-stone-200 dark:bg-zinc-700 text-zinc-500'
                        }`}>
                          {isOngoing ? '🟢 진행중' : isUpcoming ? '예정' : '종료'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
                        {round.open_at && (
                          <div>
                            🕐 {new Date(round.open_at).toLocaleString('ko', { 
                              year: 'numeric', month: 'long', day: 'numeric',
                              weekday: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                            {round.close_at && ` ~ ${new Date(round.close_at).toLocaleString('ko', {
                              month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}`}
                          </div>
                        )}
                        {round.result_at && (
                          <div>
                            📋 결과발표: {new Date(round.result_at).toLocaleString('ko', {
                              month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        )}
                        {round.method && <div>📋 {methodLabel[round.method] || round.method}</div>}
                        {round.ticket_site && <div>🌐 {round.ticket_site}</div>}
                        {round.price_info && <div>💰 {round.price_info}</div>}
                        {round.note && <div className="italic text-zinc-500">📝 {round.note}</div>}
                        {round.ticket_url && (
                          <a
                            href={round.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className={`inline-flex items-center gap-1 mt-1 text-[11px] font-bold hover:underline ${
                              isOngoing ? 'text-emerald-600' : 'text-pink-600'
                            }`}
                          >
                            🎟️ 티켓 예매하기
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {(venue || concert.venue) && (
            <Section icon={MapPin} title="공연장">
              <div className="space-y-3">
                <div>
                  <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {venue?.name || concert.venue}
                  </div>
                  {venue?.name_local && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{venue.name_local}</div>
                  )}
                  {venue?.address && (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{venue.address}</div>
                  )}
                </div>
                {venue?.subway_info && <InfoRow icon={Train} label="교통">{venue.subway_info}</InfoRow>}
                {venue?.parking_info && <InfoRow icon={Car} label="주차">{venue.parking_info}</InfoRow>}
                {venue?.tips && <InfoRow icon={Lightbulb} label="꿀팁">{venue.tips}</InfoRow>}
                {venue?.capacity && (
                  <InfoRow icon={Users} label="수용 인원">{venue.capacity.toLocaleString()}명</InfoRow>
                )}
              </div>
            </Section>
          )}

          {artist?.top_song_title && (
            <Section icon={Music} title="대표곡">
              <div>
                <div className="mb-3">
                  <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {artist.top_song_title}
                  </div>
                  {artist.top_song_title_jp && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{artist.top_song_title_jp}</div>
                  )}
                </div>
                {youtubeId ? (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={artist.top_song_title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : artist.top_song_youtube_url && (
                  <a
                    href={artist.top_song_youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    YouTube에서 듣기
                  </a>
                )}
              </div>
            </Section>
          )}

          {concert.source_url && (
            <a
              href={concert.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-pink-500 transition"
            >
              <ExternalLink className="w-3 h-3 inline mr-1" />
              티켓 정보 출처
            </a>
          )}
        </div>
      </div>

      {showDayModal && concertForModal && (
        <AttendingDayModal
          concert={concertForModal}
          attendingConcertIds={attendingConcertIds}
          onConfirm={handleDayModalConfirm}
          onClose={() => setShowDayModal(false)}
        />
      )}
    </>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        <span className="text-zinc-500 dark:text-zinc-400 text-xs mr-2">{label}</span>
        <span className="text-zinc-900 dark:text-zinc-100">{children}</span>
      </div>
    </div>
  )
}