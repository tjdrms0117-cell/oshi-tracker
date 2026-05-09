import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Music, ExternalLink, Calendar } from 'lucide-react'
import { 
  fetchArtistById, 
  fetchConcertsByArtist,
  fetchMyOshiList,
  fetchMyAttendingList,
  addToOshi,
  removeFromOshi,
  addToAttending,
  removeFromAttending,
} from './lib/api'
import { supabase } from './lib/supabase'
import ConcertCard from './components/ConcertCard'

export default function ArtistDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [artist, setArtist] = useState(null)
  const [concerts, setConcerts] = useState([])
  const [oshiList, setOshiList] = useState([])
  const [attendingList, setAttendingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [oshiLoading, setOshiLoading] = useState(false)
  const [festivals, setFestivals] = useState([])

  useEffect(() => {
    loadData()
  }, [id, session])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [artistData, concertsData] = await Promise.all([
        fetchArtistById(id),
        fetchConcertsByArtist(id),
      ])
      setArtist(artistData)
      setConcerts(concertsData)

      // 이 아티스트가 출연하는 페스티벌
      const { data: faData } = await supabase
        .from('festival_artists')
        .select('festival_id, performance_date, festivals(*)')
        .eq('artist_id', id)
      setFestivals((faData || []).map(fa => ({ ...fa.festivals, performance_date: fa.performance_date })))

      if (session?.user) {
        const [oshi, attending] = await Promise.all([
          fetchMyOshiList(session.user.id).catch(() => []),
          fetchMyAttendingList(session.user.id).catch(() => []),
        ])
        setOshiList(oshi)
        setAttendingList(attending)
      }
    } catch (err) {
      console.error('가수 정보 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleToggleOshi = async () => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    if (oshiLoading || !artist) return
    setOshiLoading(true)
    try {
      const isOshi = oshiArtistIds.includes(artist.id)
      if (isOshi) {
        await removeFromOshi(session.user.id, artist.id)
      } else {
        await addToOshi(session.user.id, artist.id)
      }
      const newOshi = await fetchMyOshiList(session.user.id)
      setOshiList(newOshi)
    } catch (err) {
      alert('처리 중 오류가 발생했어요')
    } finally {
      setOshiLoading(false)
    }
  }
  
  const handleToggleConcertOshi = async (artistId, currentlyOshi) => {
    try {
      if (currentlyOshi) {
        await removeFromOshi(session.user.id, artistId)
      } else {
        await addToOshi(session.user.id, artistId)
      }
      const newOshi = await fetchMyOshiList(session.user.id)
      setOshiList(newOshi)
    } catch (err) {
      alert('처리 중 오류가 발생했어요')
    }
  }
  
  const handleToggleAttending = async (concertId, currentlyAttending) => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    try {
      if (currentlyAttending) {
        await removeFromAttending(session.user.id, concertId)
      } else {
        await addToAttending(session.user.id, concertId)
      }
      const newAttending = await fetchMyAttendingList(session.user.id)
      setAttendingList(newAttending)
    } catch (err) {
      alert('처리 중 오류가 발생했어요')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">
          LOADING...
        </div>
      </div>
    )
  }
  
  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">가수를 찾을 수 없어요</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm"
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }
  
  const color = artist.color || '#888'
  const oshiArtistIds = oshiList.map(o => o.artist_id)
  const attendingConcertIds = attendingList.map(a => a.concert_id)
  const isOshi = oshiArtistIds.includes(artist.id)
  
  // 오늘 자정 기준
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const upcomingConcerts = concerts.filter(c => new Date(c.date) >= today)
  const pastConcerts = concerts.filter(c => new Date(c.date) < today)
  pastConcerts.sort((a, b) => new Date(b.date) - new Date(a.date)) // 최신순
  
  // YouTube ID 추출
  const getYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }
  const youtubeId = getYouTubeId(artist.top_song_youtube_url)
  
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors">
      
      {/* 상단 그라디언트 헤더 */}
      <div 
        className="relative pb-8"
        style={{
          background: `linear-gradient(180deg, ${color}30 0%, transparent 100%)`,
        }}
      >
        {/* 뒤로 가기 */}
        <div className="px-5 pt-5 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-5 pt-4">
          <div className="flex items-start gap-4 mb-6">
            {/* 가수 컬러 도트 */}
            <div 
              className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              }}
            >
              <Music className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
              <h1 
                className="text-2xl font-black mb-1 leading-tight"
                style={{ color }}
              >
                {artist.name}
              </h1>
              {artist.name_jp && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {artist.name_jp}
                </p>
              )}
              
              {/* 공연 카운트 */}
              <div className="flex items-center gap-3 mt-3 text-xs">
                {upcomingConcerts.length > 0 && (
                  <span className="font-bold text-pink-600 dark:text-pink-400">
                    예정 {upcomingConcerts.length}
                  </span>
                )}
                {pastConcerts.length > 0 && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    지난 {pastConcerts.length}
                  </span>
                )}
                {concerts.length === 0 && (
                  <span className="text-zinc-400 dark:text-zinc-500 italic">
                    아직 등록된 공연이 없어요
                  </span>
                )}
              </div>
            </div>
            
            {/* 오시 버튼 */}
            <button
              onClick={handleToggleOshi}
              disabled={oshiLoading}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                isOshi
                  ? 'bg-amber-400 text-amber-950 shadow-md'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={isOshi ? 'currentColor' : 'none'} />
              {isOshi ? '내 오시' : '오시 등록'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="max-w-3xl mx-auto px-5 pb-20 space-y-6">
        
        {/* 대표곡 */}
        {(artist.top_song_title || artist.top_song_title_jp || artist.top_song_youtube_url) && (
          <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              <Music className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              대표곡
            </h2>
            <div>
              <div className="mb-3">
                <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {artist.top_song_title || artist.top_song_title_jp}
                </div>
                {artist.top_song_title && artist.top_song_title_jp && artist.top_song_title !== artist.top_song_title_jp && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {artist.top_song_title_jp}
                  </div>
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
          </section>
        )}
        
        {/* 예정 공연 */}
        {upcomingConcerts.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 px-1">
              <Calendar className="w-4 h-4 text-pink-500" />
              예정 공연 ({upcomingConcerts.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {upcomingConcerts.map((concert) => (
                <ConcertCard
                  key={concert.id}
                  concert={concert}
                  isOshi={oshiArtistIds.includes(concert.artist_id)}
                  isAttending={attendingConcertIds.includes(concert.id)}
                  onToggleAttending={handleToggleAttending}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* 예정 페스티벌 */}
        {festivals.filter(f => f && new Date(f.date) >= today).length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 px-1">
              <span>🎪</span>
              페스티벌 출연 예정
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {festivals
                .filter(f => f && new Date(f.date) >= today)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(f => {
                  const formatDate = (d) => {
                    if (!d) return ''
                    const date = new Date(d)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }
                  const dateStr = f.end_date && f.end_date !== f.date
                    ? `${formatDate(f.date)} ~ ${formatDate(f.end_date)}`
                    : formatDate(f.date)

                  return (
                    <button
                      key={f.id}
                      onClick={() => navigate(`/festivals/${f.id}`)}
                      className="text-left rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition flex flex-col"
                    >
                      {/* 포스터 */}
                      <div className="relative w-full" style={{ paddingBottom: '133%' }}>
                        {f.poster_url ? (
                          <img src={f.poster_url} alt={f.name}
                            className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                            style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)' }}>
                            <div className="text-2xl opacity-60">🎪</div>
                            <div className="text-white/80 text-[10px] font-bold text-center px-2 leading-tight">
                              {f.name}
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 px-2 py-1"
                          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                          <div className="text-white text-[10px] font-bold">{dateStr}</div>
                          {(f.venue || f.city) && (
                            <div className="text-white/70 text-[9px] truncate">{f.venue || f.city}</div>
                          )}
                        </div>
                      </div>

                      {/* 컬러라인 */}
                      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #06b6d4, #0e7490)' }} />

                      {/* 정보 */}
                      <div className="p-2">
                        <div className="text-[9px] font-bold mb-0.5" style={{ color: '#0e7490' }}>🎪 페스</div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-2">
                          {f.name}
                        </div>
                        {f.performance_date && f.performance_date !== f.date && (
                          <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 font-bold">
                            {new Date(f.performance_date).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })} 출연
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
            </div>
          </section>
        )}

        {/* 지난 공연 */}
        {pastConcerts.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3 px-1">
              <Calendar className="w-4 h-4" />
              지난 공연 ({pastConcerts.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 opacity-70">
              {pastConcerts.map((concert) => (
                <ConcertCard
                  key={concert.id}
                  concert={concert}
                  isOshi={oshiArtistIds.includes(concert.artist_id)}
                  isAttending={attendingConcertIds.includes(concert.id)}
                  onToggleOshi={handleToggleConcertOshi}
                  onToggleAttending={handleToggleAttending}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* 공연 없음 */}
        {concerts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🎤</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              아직 등록된 공연이 없어요
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              제보 탭에서 새 공연을 알려주세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}