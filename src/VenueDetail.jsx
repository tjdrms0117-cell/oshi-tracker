import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Train, Car, Lightbulb, Users, ExternalLink, Calendar } from 'lucide-react'
import { fetchVenueById, fetchConcertsByVenue } from './lib/api'

export default function VenueDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [venue, setVenue] = useState(null)
  const [concerts, setConcerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [venueData, concertsData] = await Promise.all([
        fetchVenueById(id),
        fetchConcertsByVenue(id),
      ])
      setVenue(venueData)
      setConcerts(concertsData)
    } catch (err) {
      console.error('공연장 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">공연장을 찾을 수 없어요</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm">홈으로</button>
        </div>
      </div>
    )
  }

  const [showPast, setShowPast] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingConcerts = concerts
    .filter(c => new Date(c.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const pastConcerts = concerts
    .filter(c => new Date(c.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const naverMapUrl = venue.address
    ? `https://map.naver.com/v5/search/${encodeURIComponent(venue.address)}`
    : null

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative pb-8" style={{ background: 'linear-gradient(180deg, #06b6d410 0%, transparent 100%)' }}>
        <div className="px-5 pt-5 pb-3">
         <button onClick={() => navigate('/?tab=venues')} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition">
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-5 pt-4">
          <h1 className="text-2xl font-black mb-1 text-zinc-900">{venue.name}</h1>
          {venue.name_local && <p className="text-sm text-zinc-500 mb-4">{venue.name_local}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-20 space-y-6">

        <section className="rounded-2xl bg-white border border-stone-200 p-5">
          <h2 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-400" />
            공연장 정보
          </h2>
          <div className="space-y-2 text-sm">
            {venue.address && (
              <div className="flex items-start gap-2 text-zinc-600">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span>{venue.address}</span>
              </div>
            )}
            {venue.subway_info && (
              <div className="flex items-start gap-2 text-zinc-600">
                <Train className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span>{venue.subway_info}</span>
              </div>
            )}
            {venue.parking_info && (
              <div className="flex items-start gap-2 text-zinc-600">
                <Car className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span>{venue.parking_info}</span>
              </div>
            )}
            {venue.tips && (
              <div className="flex items-start gap-2 text-zinc-600">
                <Lightbulb className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span>{venue.tips}</span>
              </div>
            )}
            {venue.capacity && (
              <div className="flex items-center gap-2 text-zinc-600">
                <Users className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span>{venue.capacity.toLocaleString()}명</span>
              </div>
            )}
            {naverMapUrl && (
              <a
                href={naverMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[11px] text-cyan-600 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                네이버 지도에서 보기
              </a>
            )}
          </div>
        </section>

        {concerts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-20">🏟️</div>
            <p className="text-sm text-zinc-500">아직 등록된 공연이 없어요</p>
          </div>
        )}

        {upcomingConcerts.length > 0 && (
          <section className="rounded-2xl bg-white border border-stone-200 p-5">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-500" />
              예정 공연 ({upcomingConcerts.length})
            </h2>
            <div className="space-y-2">
              {upcomingConcerts.map(concert => (
                <div
                  key={concert.id}
                  onClick={() => navigate(`/concerts/${concert.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-pink-500 mb-0.5">
                      {concert.artist?.name}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 truncate">
                      {concert.title}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {concert.date}{concert.time && ` · ${concert.time.slice(0,5)}`}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-pink-50 text-pink-600 ml-3 flex-shrink-0">
                    D-{Math.round((new Date(concert.date) - today) / (1000*60*60*24))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pastConcerts.length > 0 && (
          <section className="rounded-2xl bg-white border border-stone-200 p-5">
            <button
              onClick={() => setShowPast(!showPast)}
              className="w-full flex items-center justify-between text-sm font-bold text-zinc-500"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                지난 공연 ({pastConcerts.length})
              </span>
              <span>{showPast ? '▲' : '▼'}</span>
            </button>
            {showPast && (
              <div className="space-y-2 mt-3">
                {pastConcerts.map(concert => (
                  <div
                    key={concert.id}
                    onClick={() => navigate(`/concerts/${concert.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-zinc-400 mb-0.5">
                        {concert.artist?.name}
                      </div>
                      <div className="text-sm font-semibold text-zinc-700 truncate">
                        {concert.title}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {concert.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}