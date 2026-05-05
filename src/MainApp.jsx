import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProfile } from './lib/auth'
import { 
  fetchConcerts, 
  fetchSubmissions,
  fetchMyOshiList,
  addToOshi,
  removeFromOshi,
  fetchMyAttendingList,
  addToAttending,
  removeFromAttending,
  fetchArtistsWithCounts,
  fetchVenues,
} from './lib/api'
import Header from './components/Header'
import CountryToggle from './components/CountryToggle'
import TabNav from './components/TabNav'
import SubFilter from './components/SubFilter'
import ConcertList from './components/ConcertList'
import ArtistList from './components/ArtistList'
import SubmitConcert from './SubmitConcert'
import ReviewList from './components/ReviewList'
import ConcertEditModal from './components/ConcertEditModal'
import { deleteConcert, deleteArtist } from './lib/api'
import Calendar from './components/Calendar'
import VenueList from './components/VenueList'

export default function MainApp({ session, theme, onThemeChange }) {
  const [profile, setProfile] = useState(null)
  const [mode, setMode] = useState('user')
  const [country, setCountry] = useState('korea')
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    ['concerts', 'calendar', 'artists', 'venues', 'submit', 'review'].includes(initialTab)
      ? initialTab
      : 'concerts'
  )
  const [subFilter, setSubFilter] = useState('all')
  
  const [concerts, setConcerts] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [oshiList, setOshiList] = useState([])
  const [attendingList, setAttendingList] = useState([])
  const [artists, setArtists] = useState([])
  const [venues, setVenues] = useState([])
  const [editConcertId, setEditConcertId] = useState(null)
  const [loading, setLoading] = useState(true)

  // 프로필 로드
  useEffect(() => {
    if (session?.user) {
      getProfile(session.user.id)
        .then(setProfile)
        .catch(console.error)
    }
  }, [session])

  // 데이터 로드
  useEffect(() => {
    loadAllData()
  }, [session])

const loadAllData = async () => {
    setLoading(true)
    try {
      const [concertsData, artistsData, venuesData] = await Promise.all([
        fetchConcerts(),
        fetchArtistsWithCounts().catch(() => []),
        fetchVenues().catch(() => []),
      ])
      setConcerts(concertsData)
      setArtists(artistsData)
      setVenues(venuesData)

      // 로그인 상태일 때만
      if (session?.user) {
        const [submissionsData, oshiData, attendingData] = await Promise.all([
          fetchSubmissions().catch(() => []),
          fetchMyOshiList(session.user.id).catch(() => []),
          fetchMyAttendingList(session.user.id).catch(() => []),
        ])
        setSubmissions(submissionsData)
        setOshiList(oshiData)
        setAttendingList(attendingData)
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

 // 오시 토글
  const handleToggleOshi = async (artistId, currentlyOshi) => {
    if (!session?.user) {
      alert('로그인 후 이용할 수 있어요')
      return
    }
    try {
      if (currentlyOshi) {
        await removeFromOshi(session.user.id, artistId)
      } else {
        await addToOshi(session.user.id, artistId)
      }
      const newOshi = await fetchMyOshiList(session.user.id)
      setOshiList(newOshi)
    } catch (err) {
      console.error('오시 토글 실패:', err)
      alert('처리 중 오류가 발생했어요')
    }
  }

  const handleEditConcert = (concert) => {
    setEditConcertId(concert.id)
  }
  
  const handleDeleteConcert = async (concertId) => {
    if (!confirm('이 공연을 삭제할까요?\n양일 공연이면 함께 삭제됩니다.\n복구할 수 없어요.')) return
    
    try {
      await deleteConcert(concertId)
      alert('삭제 완료')
      loadAllData()
    } catch (err) {
      console.error(err)
      alert('삭제 중 오류: ' + err.message)
    }
  }
  
  const handleDeleteArtist = async (artistId, artistName) => {
    if (!confirm(`"${artistName}" 가수를 삭제할까요?\n이 가수의 공연도 모두 함께 삭제됩니다.\n복구할 수 없어요.`)) return
    
    try {
      const result = await deleteArtist(artistId)
      alert(`삭제 완료 (공연 ${result.concertCount}개도 삭제됨)`)
      loadAllData()
    } catch (err) {
      console.error(err)
      alert('삭제 중 오류: ' + err.message)
    }
  }
  // 갈 거예요 토글
  const handleToggleAttending = async (concertId, currentlyAttending) => {
    if (!session?.user) {
      alert('로그인 후 이용할 수 있어요')
      return
    }
    try {
      if (currentlyAttending) {
        await removeFromAttending(session.user.id, concertId)
      } else {
        await addToAttending(session.user.id, concertId)
      }
      const newAttending = await fetchMyAttendingList(session.user.id)
      setAttendingList(newAttending)
    } catch (err) {
      console.error('참석 토글 실패:', err)
      alert('처리 중 오류가 발생했어요')
    }
  }
const handleToggleAttendingDays = async (toAdd, toRemove) => {
  if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
  try {
    for (const concertId of toAdd) await addToAttending(session.user.id, concertId)
    for (const concertId of toRemove) await removeFromAttending(session.user.id, concertId)
    const newAttending = await fetchMyAttendingList(session.user.id)
    setAttendingList(newAttending)
  } catch (err) {
    alert('처리 중 오류가 발생했어요')
  }
}
  const isAdmin = profile?.is_admin === true
  
  // ID 배열로 변환
  const oshiArtistIds = oshiList.map(o => o.artist_id)
  const attendingConcertIds = attendingList.map(a => a.concert_id)
  
  // 국가별 카운트
  const koreaCount = concerts.filter(c => c.country === 'korea').length
  const japanCount = concerts.filter(c => c.country === 'japan').length
  
  // 검수 대기 카운트
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  
  // 오늘 자정 기준
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 현재 국가 + 서브 필터 적용
  const getFilteredConcerts = () => {
    let filtered = concerts.filter(c => c.country === country)
    
    switch (subFilter) {
      case 'attending':
  filtered = filtered.filter(c =>
    attendingConcertIds.includes(c.id) ||
    (c.is_series && c.series_dates?.some(d => attendingConcertIds.includes(d.id)))
  )
        filtered = filtered.filter(c => new Date(c.date) >= today)
        break
      case 'oshi':
        filtered = filtered.filter(c => oshiArtistIds.includes(c.artist_id))
        filtered = filtered.filter(c => new Date(c.date) >= today)
        break
      case 'past':
        filtered = filtered.filter(c => new Date(c.date) < today)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)) // 최신순
        return filtered
      case 'all':
      default:
        filtered = filtered.filter(c => new Date(c.date) >= today)
        break
    }
    
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
    return filtered
  }
  
  const filteredConcerts = getFilteredConcerts()
  
  // 서브 필터 카운트
  const subFilterCounts = {
    attending: concerts.filter(c => 
  c.country === country && 
  (attendingConcertIds.includes(c.id) ||
    (c.is_series && c.series_dates?.some(d => attendingConcertIds.includes(d.id)))) &&
  new Date(c.date) >= today
).length,
    oshi: concerts.filter(c => 
      c.country === country && 
      oshiArtistIds.includes(c.artist_id) && 
      new Date(c.date) >= today
    ).length,
    all: concerts.filter(c => 
      c.country === country && 
      new Date(c.date) >= today
    ).length,
    past: concerts.filter(c => 
      c.country === country && 
      new Date(c.date) < today
    ).length,
  }

  // 탭 정의
  const userTabs = [
    { id: 'concerts', label: '공연' },
    { id: 'calendar', label: '달력' },
    { id: 'artists', label: '아티스트' },
    { id: 'venues', label: '공연장' },
    { id: 'submit', label: '제보' },
  ]
  
  const adminTabs = [
    { id: 'concerts', label: '공연' },
    { id: 'calendar', label: '달력' },
    { id: 'artists', label: '아티스트' },
    { id: 'venues', label: '공연장' },
    { id: 'review', label: '검수', badge: pendingCount },
  ]
  
  const tabs = mode === 'admin' && isAdmin ? adminTabs : userTabs

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">
          LOADING...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen transition-colors" style={{
      background: 'linear-gradient(135deg, #fafaf7 0%, #faf6ff 50%, #f0fdfa 100%)',
    }}>
      {/* 다크 모드 배경 */}
      <div className="fixed inset-0 -z-10 hidden dark:block" style={{
        background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f25 50%, #0a1520 100%)',
      }} />
      
      <div className="max-w-3xl mx-auto pb-20">
        
        <Header
          profile={profile}
          session={session}
          mode={mode}
          onModeChange={setMode}
          theme={theme}
          onThemeChange={onThemeChange}
        />

        <CountryToggle
          country={country}
          onCountryChange={setCountry}
          koreaCount={koreaCount}
          japanCount={japanCount}
        />

        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSearchParams({})
          }}
        />

        <main className="px-5">
          {activeTab === 'concerts' && (
            <>
              <SubFilter
                activeFilter={subFilter}
                onFilterChange={setSubFilter}
                counts={subFilterCounts}
              />
              <ConcertList
                concerts={filteredConcerts}
                oshiArtistIds={oshiArtistIds}
                attendingConcertIds={attendingConcertIds}
                isAdmin={mode === 'admin' && isAdmin}
                onToggleAttending={handleToggleAttending}
                onToggleAttendingDays={handleToggleAttendingDays}
                onEdit={handleEditConcert}
                onDelete={handleDeleteConcert}
                emptyMessage={
                  subFilter === 'attending' ? '참석 예정 공연이 없어요' :
                  subFilter === 'oshi' ? '오시 등록된 가수의 공연이 없어요' :
                  subFilter === 'past' ? '지난 공연이 없어요' :
                  `${country === 'korea' ? '내한' : '원정'} 공연이 없어요`
                }
                emptySubMessage={
                  subFilter === 'attending' ? '카드에서 ✓ 버튼을 눌러 추가하세요' :
                  subFilter === 'oshi' ? '카드에서 ⭐ 버튼을 눌러 추가하세요' :
                  subFilter === 'past' ? '' :
                  '제보 탭에서 새 정보를 알려주세요'
                }
              />
            </>
          )}
          
          {activeTab === 'calendar' && (
            <Calendar
              concerts={concerts}
              attendingConcertIds={attendingConcertIds}
              oshiArtistIds={oshiArtistIds}
            />
          )}
          {activeTab === 'venues' && (
            <VenueList
              venues={venues}
              isAdmin={mode === 'admin' && isAdmin}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
          {activeTab === 'artists' && (
            <ArtistList
              artists={artists}
              oshiArtistIds={oshiArtistIds}
              isAdmin={mode === 'admin' && isAdmin}
              onToggleOshi={handleToggleOshi}
              onDeleteArtist={handleDeleteArtist}
              onArtistUpdated={loadAllData}
            />
          )}
          
         {activeTab === 'submit' && (
            <SubmitConcert session={session} />
          )} 
          
          {activeTab === 'review' && isAdmin && (
            <ReviewList session={session} />
          )}
        </main>
            </div>

      {/* 공연 수정 모달 */}
      {editConcertId && (
        <ConcertEditModal
          concertId={editConcertId}
          onClose={() => setEditConcertId(null)}
          onDone={() => {
            setEditConcertId(null)
            loadAllData()
          }}
        />
      )}

    </div>
  )
}

function Placeholder({ title }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4 opacity-20">🚧</div>
      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
        {title}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        다음 단계에서 만들 예정이에요
      </p>
    </div>
  )
}
