import { Plus, X, Ticket } from 'lucide-react'

const METHODS = [
  { value: 'lottery', label: '추첨' },
  { value: 'first-come', label: '선착순' },
  { value: 'fanclub', label: 'FC선예매' },
]

export default function Step3Ticketing({ rounds, onChange }) {
  const addRound = () => {
    onChange([
      ...rounds,
      { round_name: '', open_at: '', method: 'first-come', ticket_site: '', price_info: '', note: '' }
    ])
  }
  
  const removeRound = (idx) => {
    onChange(rounds.filter((_, i) => i !== idx))
  }
  
  const updateRound = (idx, key, val) => {
    onChange(rounds.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }
  
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
        티켓팅 정보
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        FC선예매, 일반예매 등 여러 차례 티켓팅이 있으면 모두 추가해주세요
      </p>
      
      <div className="space-y-3">
        {rounds.map((round, idx) => (
          <div 
            key={idx}
            className="rounded-xl p-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {idx + 1}차 티켓팅
                </span>
              </div>
              {rounds.length > 1 && (
                <button
                  onClick={() => removeRound(idx)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <div className="space-y-2.5">
              <input
                type="text"
                value={round.round_name}
                onChange={(e) => updateRound(idx, 'round_name', e.target.value)}
                placeholder="라운드 이름 (예: FC선예매, 일반예매)"
                className="w-full px-3 py-2 rounded-lg text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
              />
              
              <input
                type="datetime-local"
                value={round.open_at || ''}
                onChange={(e) => updateRound(idx, 'open_at', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
              />
              
              <div className="flex gap-1.5">
                {METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => updateRound(idx, 'method', m.value)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition ${
                      round.method === m.value
                        ? 'bg-pink-500 text-white'
                        : 'bg-stone-50 dark:bg-zinc-800 text-zinc-500 border border-stone-200 dark:border-zinc-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              
              <input
                type="text"
                value={round.ticket_site}
                onChange={(e) => updateRound(idx, 'ticket_site', e.target.value)}
                placeholder="사이트 (예: 인터파크, 멜론티켓)"
                className="w-full px-3 py-2 rounded-lg text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
              />
              
              <input
                type="text"
                value={round.price_info}
                onChange={(e) => updateRound(idx, 'price_info', e.target.value)}
                placeholder="가격 정보 (이번 라운드만, 비워둬도 됨)"
                className="w-full px-3 py-2 rounded-lg text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
              />
              
              <input
                type="text"
                value={round.note}
                onChange={(e) => updateRound(idx, 'note', e.target.value)}
                placeholder="메모 (예: 시야제한석만 추가 오픈)"
                className="w-full px-3 py-2 rounded-lg text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
              />
            </div>
          </div>
        ))}
        
        <button
          onClick={addRound}
          className="w-full py-3 rounded-xl text-sm font-bold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          티켓팅 라운드 추가
        </button>
        
        {rounds.length === 0 && (
          <div className="text-center py-4 text-xs text-zinc-500 italic">
            티켓팅 정보가 없거나 모르면 비워두셔도 돼요
          </div>
        )}
      </div>
    </div>
  )
}
