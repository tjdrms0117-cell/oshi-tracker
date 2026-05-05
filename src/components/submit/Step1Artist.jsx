import { useState, useMemo } from 'react'
import { Search, Plus, X, Check } from 'lucide-react'

export default function Step1Artist({ artists, value, onChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewArtist, setShowNewArtist] = useState(false)
  const [newArtist, setNewArtist] = useState({
    name: '',
    name_jp: '',
    color: '#e91e63',
  })
  
  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return artists
    return artists.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.name_jp?.toLowerCase().includes(q)
    )
  }, [artists, searchQuery])
  
  const handleSelectExisting = (artist) => {
    onChange({
      type: 'existing',
      artist_id: artist.id,
      artist: artist,
    })
    setShowNewArtist(false)
  }
  
  const handleSubmitNewArtist = () => {
    if (!newArtist.name.trim()) {
      alert('가수 이름을 입력해주세요')
      return
    }
    onChange({
      type: 'new',
      artist_id: null,
      new_artist_name: newArtist.name.trim(),
      new_artist_name_jp: newArtist.name_jp.trim() || null,
      new_artist_color: newArtist.color,
    })
  }
  
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
        어떤 가수의 공연인가요?
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        목록에 없으면 새 가수도 함께 제안할 수 있어요
      </p>
      
      {/* 새 가수 모드 */}
      {showNewArtist ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">새 가수 정보</h3>
            <button
              onClick={() => { setShowNewArtist(false); onChange(null) }}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              취소
            </button>
          </div>
          
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
              한국어 이름 *
            </label>
            <input
              type="text"
              value={newArtist.name}
              onChange={(e) => setNewArtist({...newArtist, name: e.target.value})}
              placeholder="예: 요아소비"
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
            />
          </div>
          
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
              원어 이름 (영어/일본어)
            </label>
            <input
              type="text"
              value={newArtist.name_jp}
              onChange={(e) => setNewArtist({...newArtist, name_jp: e.target.value})}
              placeholder="예: YOASOBI"
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
            />
          </div>
          
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 block">
              컬러 (관리자가 검수 시 조정 가능)
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { color: '#e91e63', label: 'J-POP' },
                { color: '#9c27b0', label: '시티팝' },
                { color: '#00acc1', label: '록' },
                { color: '#5c6bc0', label: '우타이테' },
                { color: '#f57c00', label: '싱송' },
                { color: '#10b981', label: '인디' },
                { color: '#ffa726', label: '판타지' },
                { color: '#7e57c2', label: '몽환' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setNewArtist({...newArtist, color: c.color})}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition border-2"
                  style={{
                    backgroundColor: newArtist.color === c.color ? c.color : 'transparent',
                    color: newArtist.color === c.color ? 'white' : c.color,
                    borderColor: c.color,
                  }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ background: c.color }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleSubmitNewArtist}
            className="w-full py-2.5 rounded-lg text-sm font-bold bg-pink-500 text-white"
          >
            <Check className="w-4 h-4 inline mr-1" />
            이 가수로 진행
          </button>
          
          {value?.type === 'new' && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
              ✓ 새 가수 "{value.new_artist_name}" 선택됨
            </div>
          )}
        </div>
      ) : (
        // 기존 가수 선택 모드
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="가수 검색..."
              className="w-full pl-9 pr-9 py-2.5 rounded-full text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
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
          
          {/* 가수 목록 */}
          <div className="space-y-1.5 mb-3 max-h-72 overflow-y-auto">
            {filteredArtists.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">
                {searchQuery ? '검색 결과 없음' : '등록된 가수가 없어요'}
              </div>
            ) : (
              filteredArtists.map((artist) => {
                const isSelected = value?.type === 'existing' && value?.artist_id === artist.id
                return (
                  <button
                    key={artist.id}
                    onClick={() => handleSelectExisting(artist)}
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
                      <span className="text-white text-[10px] font-bold">
                        {artist.name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {artist.name}
                      </div>
                      {artist.name_jp && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {artist.name_jp}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
          
          {/* 새 가수 제안 버튼 */}
          <button
            onClick={() => setShowNewArtist(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed"
          >
            <Plus className="w-4 h-4" />
            목록에 없는 새 가수 제안하기
          </button>
        </>
      )}
    </div>
  )
}