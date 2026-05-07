import { useState, useMemo } from 'react'
import { Search, X, Check, Plus } from 'lucide-react'

export default function StepFestival2Artists({ artists, value, onChange }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return artists
    return artists.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.name_jp?.toLowerCase().includes(q)
    )
  }, [artists, searchQuery])

  const selectedIds = value.map(a => a.artist_id)

  const toggleArtist = (artist) => {
    if (selectedIds.includes(artist.id)) {
      onChange(value.filter(a => a.artist_id !== artist.id))
    } else {
      onChange([...value, { artist_id: artist.id, name: artist.name, name_jp: artist.name_jp, color: artist.color }])
    }
  }

  const removeArtist = (artistId) => {
    onChange(value.filter(a => a.artist_id !== artistId))
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
        출연 아티스트
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        알려진 출연진을 추가해주세요. 순차 공개되는 아티스트는 나중에 추가할 수 있어요
      </p>

      {/* 선택된 아티스트 */}
      {value.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {value.map(a => (
            <div
              key={a.artist_id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ background: a.color || '#888' }}
            >
              {a.name}
              <button onClick={() => removeArtist(a.artist_id)} className="opacity-70 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 검색 */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="아티스트 검색..."
          className="w-full pl-9 pr-9 py-2.5 rounded-full text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 아티스트 목록 */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {filteredArtists.map(artist => {
          const isSelected = selectedIds.includes(artist.id)
          return (
            <button
              key={artist.id}
              onClick={() => toggleArtist(artist)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition text-left ${
                isSelected
                  ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700'
                  : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: artist.color || '#888' }}
              >
                <span className="text-white text-[10px] font-bold">{artist.name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{artist.name}</div>
                {artist.name_jp && (
                  <div className="text-[11px] text-zinc-500 truncate">{artist.name_jp}</div>
                )}
              </div>
              {isSelected && <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {value.length === 0 && (
        <div className="mt-4 text-center text-xs text-zinc-500 italic">
          아직 출연진이 공개되지 않았으면 비워두셔도 돼요
        </div>
      )}
    </div>
  )
}
