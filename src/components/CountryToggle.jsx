export default function CountryToggle({ country, onCountryChange, koreaCount = 0, japanCount = 0 }) {
  return (
    <div className="px-5 mb-4">
      <div className="flex p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 gap-1">
        {/* KOREA */}
        <button
          onClick={() => onCountryChange('korea')}
          className={`flex-1 py-3 rounded-xl text-center transition ${
            country === 'korea'
              ? 'text-white'
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
          style={
            country === 'korea'
              ? { background: 'linear-gradient(135deg, #00acc1, #4dd0e1)' }
              : {}
          }
        >
          <div className="text-base mb-0.5" style={{ opacity: country === 'korea' ? 1 : 0.5 }}>
            🇰🇷
          </div>
          <div className="text-xs font-semibold tracking-wider">
            KOREA · {koreaCount}
          </div>
        </button>

        {/* JAPAN */}
        <button
          onClick={() => onCountryChange('japan')}
          className={`flex-1 py-3 rounded-xl text-center transition ${
            country === 'japan'
              ? 'text-white'
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
          style={
            country === 'japan'
              ? { background: 'linear-gradient(135deg, #e91e63, #ff6090)' }
              : {}
          }
        >
          <div className="text-base mb-0.5" style={{ opacity: country === 'japan' ? 1 : 0.5 }}>
            🇯🇵
          </div>
          <div className="text-xs font-semibold tracking-wider">
            JAPAN · {japanCount}
          </div>
        </button>
      </div>
    </div>
  )
}
