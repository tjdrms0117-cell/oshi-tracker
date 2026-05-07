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
  fetchPendingFestivalSubmissions,
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
import VenueEditModal from './components/VenueEditModal'
import { deleteVenue } from './lib/api'
import ArtistEditModal from './components/ArtistEditModal'

const VALID_TABS = ['concerts', 'calendar', 'artists', 'venues', 'submit', 'review']

export default function MainApp({ session, theme, onThemeChange }) {
  const [profile, setProfile] = useState(null)
  const [mode, setMode] = useState('user')
  const [searchParams, setSearchParams] = useSearchParams()

  // 탭 + 국가를 URL searchParams로 관리 → 새로고침/뒤로가기 모두 유지
  const activeTab = VALID_TABS.includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'concerts'

  const country = searchParams.get('country') === 'japan' ? 'japan' : 'korea'

  const setActiveTab = (tab) => {
    setSearchParams({ tab, country })
  }

  const setCountry = (newCountry) => {
    setSearchParams({ tab: activeTab, country: newCountry })
  }

  const [subFilter, setSubFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [concerts, setConcerts] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [oshiList, setOshiList] = useState([])
  const [attendingList, setAttendingList] = useState([])
  const [artists, setArtists] = useState([])
  const [venues, setVenues] = useState([])
  const [pendingFestivalCount, setPendingFestivalCount] = useState(0)
  const [editConcertId, setEditConcertId] = useState(null)
  const [editVenue, setEditVenue] = useState(null)
  const [addArtistOpen, setAddArtistOpen] = useState(false)
  const [addVenueOpen, setAddVenueOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user.id).then(setProfile).catch(console.error)
    }
  }, [session])

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

      if (session?.user) {
        const [submissionsData, oshiData, attendingData, festivalSubData] = await Promise.all([
          fetchSubmissions().catch(() => []),
          fetchMyOshiList(session.user.id).catch(() => []),
          fetchMyAttendingList(session.user.id).catch(() => []),
          fetchPendingFestivalSubmissions().catch(() => []),
        ])
        setSubmissions(submissionsData)
        setOshiList(oshiData)
        setAttendingList(attendingData)
        setPendingFestivalCount(festivalSubData.length)
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOshi = async (artistId, currentlyOshi) => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
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

  const handleEditConcert = (concert) => setEditConcertId(concert.id)
  
  const handleDeleteConcert = async (concertId) => {
    if (!confirm('이 공연을 삭제할까요?\n양일 공연이면 함께 삭제됩니다.\n복구할 수 없어요.')) return
    try {
      await deleteConcert(concertId)
      alert('삭제 완료')
      loadAllData()
    } catch (err) {
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
      alert('삭제 중 오류: ' + err.message)
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
  
  const oshiArtistIds = oshiList.map(o => o.artist_id)
  const attendingConcertIds = attendingList.map(a => a.concert_id)
  
  const koreaCount = concerts.filter(c => c.country === 'korea').length
  const japanCount = concerts.filter(c => c.country === 'japan').length
  
  // 검수 뱃지: 공연 + 페스티벌 제보 합산
  const pendingConcertCount = submissions.filter(s => s.status === 'pending').length
  const pendingCount = pendingConcertCount + pendingFestivalCount
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const getFilteredConcerts = () => {
    let filtered = concerts.filter(c => c.country === country)

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.artist?.name?.toLowerCase().includes(q) ||
        c.artist?.name_jp?.toLowerCase().includes(q)
      )
    }
    
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
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
        return filtered
      case 'ticketing': {
        const now = new Date()
        const limit = new Date(now.getTime() + 72 * 60 * 60 * 1000)
        filtered = filtered.filter(c =>
          (c.ticket_rounds || []).some(r =>
            r.open_at && new Date(r.open_at) > now && new Date(r.open_at) <= limit
          )
        )
        filtered.sort((a, b) => {
          const now2 = new Date()
          const aNext = Math.min(...(a.ticket_rounds || []).filter(r => r.open_at && new Date(r.open_at) > now2).map(r => new Date(r.open_at)))
          const bNext = Math.min(...(b.ticket_rounds || []).filter(r => r.open_at && new Date(r.open_at) > now2).map(r => new Date(r.open_at)))
          return aNext - bNext
        })
        return filtered
      }
      case 'all':
      default:
        filtered = filtered.filter(c => new Date(c.date) >= today)
        break
    }
    
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
    return filtered
  }
  
  const filteredConcerts = getFilteredConcerts()
  
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
    ticketing: (() => {
      const now = new Date()
      const limit = new Date(now.getTime() + 72 * 60 * 60 * 1000)
      return concerts.filter(c =>
        c.country === country &&
        (c.ticket_rounds || []).some(r =>
          r.open_at && new Date(r.open_at) > now && new Date(r.open_at) <= limit
        )
      ).length
    })(),
  }

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
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen transition-colors" style={{
      background: 'linear-gradient(135deg, #fafaf7 0%, #faf6ff 50%, #f0fdfa 100%)',
    }}>
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
          onTabChange={setActiveTab}
        />

        <main className="px-5">
          {activeTab === 'concerts' && (
            <>
              <SubFilter
                activeFilter={subFilter}
                onFilterChange={setSubFilter}
                counts={subFilterCounts}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
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
              onEdit={(venue) => setEditVenue(venue)}
              onDelete={async (venue) => {
                if (!confirm(`"${venue.name}" 공연장을 삭제할까요?`)) return
                try {
                  await deleteVenue(venue.id)
                  loadAllData()
                } catch (err) {
                  alert('삭제 오류: ' + err.message)
                }
              }}
              onAdd={() => setAddVenueOpen(true)}
              country={country}
              onCountryChange={setCountry}
            />
          )}

          {activeTab === 'artists' && (
            <ArtistList
              artists={artists}
              oshiArtistIds={oshiArtistIds}
              isAdmin={mode === 'admin' && isAdmin}
              onToggleOshi={handleToggleOshi}
              onAddArtist={() => setAddArtistOpen(true)}
              onDeleteArtist={handleDeleteArtist}
              onArtistUpdated={loadAllData}
            />
          )}
          
          <div className={activeTab === 'submit' ? '' : 'hidden'}>
            <SubmitConcert session={session} />
          </div>
          
          {activeTab === 'review' && isAdmin && (
            <ReviewList session={session} />
          )}
        </main>
      </div>

      {editConcertId && (
        <ConcertEditModal
          concertId={editConcertId}
          onClose={() => setEditConcertId(null)}
          onDone={() => { setEditConcertId(null); loadAllData() }}
        />
      )}
      {(editVenue || addVenueOpen) && (
        <VenueEditModal
          venue={editVenue}
          onClose={() => { setEditVenue(null); setAddVenueOpen(false) }}
          onDone={() => { setEditVenue(null); setAddVenueOpen(false); loadAllData() }}
        />
      )}
      {addArtistOpen && (
        <ArtistEditModal
          artist={null}
          onClose={() => setAddArtistOpen(false)}
          onDone={() => { setAddArtistOpen(false); loadAllData() }}
        />
      )}
    </div>
  )
}