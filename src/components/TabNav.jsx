export default function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="px-5 mb-4">
      <div className="flex gap-1 p-1 rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs md:text-sm font-semibold transition relative ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
