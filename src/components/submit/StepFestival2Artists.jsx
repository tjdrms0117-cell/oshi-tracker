import { useState, useMemo } from 'react'
import { Search, X, Check, Calendar } from 'lucide-react'

// props에 festivalDates 추가 (시작일, 종료일 배열)
export default function StepFestival2Artists({ artists, value, onChange, startDate, endDate }) {
  const [searchQuery, setSearchQuery] = useState('')

  // 다일 여부
  const isMultiDay = startDate && endDate && startDate !== endDate

  // 날짜 범위 배열 생성
  const dateOptions = useMemo(() => {
    if (!isMultiDay || !startDate) return []
    const dates = []
    const cur = new Date(startDate)
    const end = new Date(endDate)
    let i = 1
    while (cur <= end) {
      dates.push({
        value: cur.toISOString().split('T')[0],
        label: `DAY${i} (${cur.getMonth() + 1}/${cur.getDate()})`,
      })
      cur.setDate(cur.getDate() + 1)
      i++
    }
    return dates
  }, [startDate, endDate, isMultiDay])

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
      onChange([...value, {
        artist_id: artist.id,
        name: artist.name,
        name_jp: artist.name_jp,
        color: artist.color,
        performance_date: isMultiDay ? '' : (startDate || ''),
      }])
    }
  }

  const updateDate = (artistId, date) => {
    onChange(value.map(a => a.artist_id === artistId ? { ...a, performance_date: date } : a))
  }

  const removeArtist = (artistId) => {
    onChange(value.filter(a => a.artist_id !== artistId))
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">출연 아티스트</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        알려진 출연진을 추가해주세요. 순차 공개되는 아티스트는 나중에 추가할 수 있어요
      </p>

      {/* 선택된 아티스트 */}
      {value.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {value.map(a => (
            <div key={a.artist_id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.color || '#888' }} />
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1">{a.name}</span>
              {isMultiDay && (
                <select
                  value={a.performance_date || ''}
                  onChange={e => updateDate(a.artist_id, e.target.value)}
                  className="text-[11px] px-2 py-1 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-cyan-400"
                >
                  <option value="">날짜 미정</option>
                  {dateOptions.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              )}
              <button onClick={() => removeArtist(a.artist_id)} className="text-zinc-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {isMultiDay && (
            <p className="text-[10px] text-zinc-400 pl-1">출연 날짜를 선택해주세요 (모르면 미정으로 두셔도 돼요)</p>
          )}
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
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {filteredArtists.map(artist => {
          const isSelected = selectedIds.includes(artist.id)
          return (
            <button key={artist.id} onClick={() => toggleArtist(artist)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition text-left ${
                isSelected
                  ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700'
                  : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: artist.color || '#888' }}>
                <span className="text-white text-[10px] font-bold">{artist.name?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{artist.name}</div>
                {artist.name_jp && <div className="text-[11px] text-zinc-500 truncate">{artist.name_jp}</div>}
              </div>
              {isSelected && <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" />}
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