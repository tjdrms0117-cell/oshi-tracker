import { useState, useMemo } from 'react'
import ArtistEditModal from './ArtistEditModal'
import { Search, Plus, X } from 'lucide-react'
import ArtistCard from './ArtistCard'

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
  const [filterMode, setFilterMode] = useState('all') // all | oshi
  
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
    
    // 오시만 보기
    if (filterMode === 'oshi') {
      filtered = filtered.filter(a => oshiArtistIds.includes(a.id))
    }
    
    // 정렬: 오시 먼저, 그 다음 이름순
    filtered = [...filtered].sort((a, b) => {
      const aOshi = oshiArtistIds.includes(a.id) ? 0 : 1
      const bOshi = oshiArtistIds.includes(b.id) ? 0 : 1
      if (aOshi !== bOshi) return aOshi - bOshi
      return (a.name || '').localeCompare(b.name || '')
    })
    
    return filtered
  }, [artists, searchQuery, filterMode, oshiArtistIds])
  
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
        
        {isAdmin && onAddArtist && (
          <button
            onClick={onAddArtist}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        )}
      </div>
      
      {/* 필터 토글 */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filterMode === 'all'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
        >
          전체 {artists.length}
        </button>
        <button
          onClick={() => setFilterMode('oshi')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            filterMode === 'oshi'
              ? 'bg-amber-400 text-amber-950'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
          }`}
        >
          ⭐ 내 오시 {oshiArtistIds.length}
        </button>
      </div>
      
      {/* 가수 목록 */}
      {filteredArtists.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4 opacity-20">🎤</div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            {searchQuery 
              ? '검색 결과가 없어요' 
              : filterMode === 'oshi' 
                ? '아직 오시 등록한 가수가 없어요' 
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