import { Star, Check, List, Archive, Search, X, Music } from 'lucide-react'
import { useState } from 'react'

const FILTERS = [
  { id: 'attending', label: '내 공연', icon: Check },
  { id: 'oshi', label: '내 오시', icon: Star },
  { id: 'all', label: '전체', icon: List },
  { id: 'festival', label: '페스티벌', icon: Music },
  { id: 'past', label: '지난', icon: Archive },
]

export default function SubFilter({ activeFilter, onFilterChange, counts = {}, searchQuery = '', onSearchChange }) {
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [isComposing, setIsComposing] = useState(false)
  return (
    <div className="mb-4 space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value)
            if (!isComposing) onSearchChange?.(e.target.value)
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false)
            onSearchChange?.(e.target.value)
          }}
          placeholder="공연명 또는 가수 검색..."
          className="w-full pl-9 pr-9 py-2 rounded-full text-sm bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 outline-none focus:border-pink-300 dark:focus:border-pink-700 transition text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
        />
        {searchQuery && (
          <button onClick={() => { setLocalQuery(''); onSearchChange?.('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id
          const Icon = f.icon
          const count = counts[f.id]
          const isFestival = f.id === 'festival'

          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
              style={isActive ? {
                background: isFestival
                  ? 'linear-gradient(135deg, #06b6d4, #0e7490)'
                  : 'linear-gradient(135deg, #3f3f46, #18181b)',
              } : {}}
            >
              <Icon className="w-3 h-3" />
              <span>{f.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] ${isActive ? 'opacity-70' : 'opacity-50'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}