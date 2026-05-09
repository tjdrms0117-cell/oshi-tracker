import { useState, useMemo } from 'react'
import ArtistEditModal from './ArtistEditModal'
import { Search, Plus, X, RefreshCw } from 'lucide-react'
import ArtistCard from './ArtistCard'
import { syncAllArtistsYouTubeData } from '../lib/youtube'

export default function ArtistList({ 
  artists, 
  oshiArtistIds = [],
  isAdmin = false,
  onToggleOshi,
  onAddArtist,
  onDeleteArtist,
  onArtistUpdated,
}) {
  const [editArtist, setEditArtist] = useState(null)
const [searchQuery, setSearchQuery] = useState('')
const [filterMode, setFilterMode] = useState('all') // all | oshi | upcoming
const [subFilter, setSubFilter] = useState('all') // all | kr | jp | festival
const [syncing, setSyncing] = useState(false)
const [syncProgress, setSyncProgress] = useState(null)

const handleSyncAll = async () => {
  if (syncing) return
  if (!confirm('모든 아티스트의 YouTube 정보를 동기화할까요?\n(채널 ID 등록된 아티스트만, 약 1~2분 소요)')) return
  
  setSyncing(true)
  setSyncProgress({ current: 0, total: 0, artistName: '' })
  try {
    const result = await syncAllArtistsYouTubeData((p) => {
      setSyncProgress(p)
    })
    alert(`동기화 완료\n성공: ${result.success}명\n실패: ${result.failed}명`)
    if (onArtistUpdated) onArtistUpdated()
  } catch (err) {
    alert('동기화 중 오류: ' + err.message)
  } finally {
    setSyncing(false)
    setSyncProgress(null)
  }
}
  
  // 아티스트가 공연/페스가 예정되어 있는지
  const hasUpcoming = (artist, type = 'all') => {
    const fests = artist.upcoming_festivals || []
    if (type === 'kr') {
      return (artist.upcoming_kr || 0) > 0 || fests.some(f => f.country === 'korea')
    }
    if (type === 'jp') {
      return (artist.upcoming_jp || 0) > 0 || fests.some(f => f.country === 'japan')
    }
    if (type === 'festival') {
      return fests.length > 0
    }
    // all
    return (artist.upcoming_concerts || 0) > 0 || fests.length > 0
  }
  
  // 카운트 (서브 필터 버튼에 표시)
  const counts = useMemo(() => {
    return {
      upcoming: artists.filter(a => hasUpcoming(a)).length,
      kr: artists.filter(a => hasUpcoming(a, 'kr')).length,
      jp: artists.filter(a => hasUpcoming(a, 'jp')).length,
      festival: artists.filter(a => hasUpcoming(a, 'festival')).length,
    }
  }, [artists])
  
  // 검색 + 필터링
  const filteredArtists = useMemo(() => {
    let filtered = artists
    
    // 검색
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter(a => 
        a.name?.toLowerCase().includes(q) || 
        a.name_jp?.toLowerCase().includes(q)
      )
    }
    
    // 메인 필터
    if (filterMode === 'oshi') {
      filtered = filtered.filter(a => oshiArtistIds.includes(a.id))
    } else if (filterMode === 'upcoming') {
      filtered = filtered.filter(a => hasUpcoming(a, subFilter))
    }
    
    // 정렬: 오시 먼저, 그 다음 이름순
    filtered = [...filtered].sort((a, b) => {
      const aOshi = oshiArtistIds.includes(a.id) ? 0 : 1
      const bOshi = oshiArtistIds.includes(b.id) ? 0 : 1
      if (aOshi !== bOshi) return aOshi - bOshi
      return (a.name || '').localeCompare(b.name || '')
    })
    
    return filtered
  }, [artists, searchQuery, filterMode, subFilter, oshiArtistIds])
  
  const handleFilterChange = (mode) => {
    setFilterMode(mode)
    if (mode !== 'upcoming') {
      setSubFilter('all') // 다른 필터로 가면 서브 필터 초기화
    }
  }
  
  return (
    <div>
      {/* 검색창 + 추가 버튼 */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="가수 검색..."
            className="w-full pl-9 pr-9 py-2 rounded-full text-sm bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 outline-none focus:border-pink-300 dark:focus:border-pink-700 transition text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        {isAdmin && (
  <button
    onClick={handleSyncAll}
    disabled={syncing}
    className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 disabled:opacity-50"
    title="모든 아티스트의 YouTube 정보 갱신"
  >
    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
    {syncing ? '동기화...' : '동기화'}
  </button>
)}

{isAdmin && onAddArtist && (
  <button
    onClick={onAddArtist}
    disabled={syncing}
    className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-50"
  >
    <Plus className="w-3.5 h-3.5" />
    추가
  </button>
)}
      </div>
      
       {/* 동기화 진행 상황 */}
      {syncing && syncProgress && syncProgress.total > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
              YouTube 동기화 중... {syncProgress.current}/{syncProgress.total}
            </span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
              {syncProgress.artistName}
            </span>
          </div>
          <div className="h-1.5 bg-cyan-100 dark:bg-cyan-950/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* 필터 토글 (메인) */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filterMode === 'all'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
        >
          전체 {artists.length}
        </button>
        <button
          onClick={() => handleFilterChange('oshi')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filterMode === 'oshi'
              ? 'bg-amber-400 text-amber-950'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
        >
          ⭐ 내 오시 {oshiArtistIds.length}
        </button>
        <button
          onClick={() => handleFilterChange('upcoming')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filterMode === 'upcoming'
              ? 'bg-pink-500 text-white'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
        >
          🎤 공연 예정 {counts.upcoming}
        </button>
      </div>
      
      {/* 서브 필터 (공연 예정 활성화 시에만) */}
      {filterMode === 'upcoming' && (
        <div className="flex gap-1.5 mb-4 flex-wrap pl-2 border-l-2 border-pink-200 dark:border-pink-900">
          <button
            onClick={() => setSubFilter('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              subFilter === 'all'
                ? 'bg-pink-500 text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
            }`}
          >
            전체 {counts.upcoming}
          </button>
          <button
            onClick={() => setSubFilter('kr')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              subFilter === 'kr'
                ? 'bg-cyan-500 text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
            }`}
          >
            🇰🇷 내한 {counts.kr}
          </button>
          <button
            onClick={() => setSubFilter('jp')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              subFilter === 'jp'
                ? 'bg-pink-600 text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
            }`}
          >
            🇯🇵 원정 {counts.jp}
          </button>
          <button
            onClick={() => setSubFilter('festival')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              subFilter === 'festival'
                ? 'bg-cyan-600 text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
            }`}
          >
            🎪 페스 {counts.festival}
          </button>
        </div>
      )}
      
      {/* 메인 필터에 서브필터 없을 때 mb 보정 */}
      {filterMode !== 'upcoming' && <div className="mb-2" />}
      
      {/* 가수 목록 */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 opacity-20">🎤</div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            {searchQuery 
              ? '검색 결과가 없어요' 
              : filterMode === 'oshi' 
                ? '아직 오시 등록한 가수가 없어요' 
                : filterMode === 'upcoming'
                  ? subFilter === 'kr' ? '내한 공연 예정 가수가 없어요'
                    : subFilter === 'jp' ? '원정 공연 예정 가수가 없어요'
                    : subFilter === 'festival' ? '페스티벌 출연 예정 가수가 없어요'
                    : '공연 예정 가수가 없어요'
                  : '등록된 가수가 없어요'}
          </p>
          {filterMode === 'oshi' && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              가수 카드의 ⭐ 버튼을 눌러 등록하세요
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              isOshi={oshiArtistIds.includes(artist.id)}
              onToggleOshi={onToggleOshi}
              isAdmin={isAdmin}
              onEdit={isAdmin ? setEditArtist : undefined}
              onDelete={isAdmin && onDeleteArtist ? (a) => onDeleteArtist(a.id, a.name) : undefined}
            />
          ))}
        </div>
      )}
      
      {editArtist && (
        <ArtistEditModal
          artist={editArtist}
          onClose={() => setEditArtist(null)}
          onDone={() => {
            setEditArtist(null)
            if (onArtistUpdated) onArtistUpdated()
          }}
        />
      )}
    </div>
  )
}