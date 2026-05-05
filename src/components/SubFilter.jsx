import { Star, Check, List, Archive } from 'lucide-react'

const FILTERS = [
  { id: 'attending', label: '내 공연', icon: Check },
  { id: 'oshi', label: '내 오시', icon: Star },
  { id: 'all', label: '전체', icon: List },
  { id: 'past', label: '지난', icon: Archive },
]

export default function SubFilter({ activeFilter, onFilterChange, counts = {} }) {
  return (
    <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.id
        const Icon = f.icon
        const count = counts[f.id]
        
        return (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              isActive
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{f.label}</span>
            {count !== undefined && count > 0 && (
              <span className={`text-[10px] ${
                isActive ? 'opacity-70' : 'opacity-50'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
