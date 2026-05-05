import { useEffect, useState } from 'react'
import { MapPin, Plus, X, Calendar } from 'lucide-react'
import { fetchVenues } from '../../lib/api'

export default function Step2Concert({ value, onChange }) {
  const [venues, setVenues] = useState([])
  const [showNewVenue, setShowNewVenue] = useState(false)
  
  useEffect(() => {
    fetchVenues({ country: value.country }).then(setVenues).catch(() => setVenues([]))
  }, [value.country])
  
  const update = (key, val) => {
    onChange({ ...value, [key]: val })
  }
  
  // dates 배열 관리
  const dates = value.dates || [{ date: '', time: '', label: '' }]
  
  const updateDate = (idx, key, val) => {
    const newDates = [...dates]
    newDates[idx] = { ...newDates[idx], [key]: val }
    onChange({ ...value, dates: newDates })
  }
  
  const addDate = () => {
    const newDates = [...dates, { date: '', time: '', label: '' }]
    onChange({ ...value, dates: newDates })
  }
  
  const removeDate = (idx) => {
    if (dates.length === 1) return
    const newDates = dates.filter((_, i) => i !== idx)
    onChange({ ...value, dates: newDates })
  }
  
  const isMultiDay = dates.length > 1
  
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
        공연 정보를 알려주세요
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        모르는 정보는 비워두셔도 돼요
      </p>
      
      <div className="space-y-4">
        
        {/* 국가 토글 */}
        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">
            국가
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => update('country', 'korea')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                value.country === 'korea'
                  ? 'text-white shadow-md'
                  : 'bg-stone-50 dark:bg-zinc-800 text-zinc-500 border border-stone-200 dark:border-zinc-700'
              }`}
              style={value.country === 'korea' ? { background: 'linear-gradient(135deg, #00acc1, #4dd0e1)' } : {}}
            >
              🇰🇷 한국 (내한)
            </button>
            <button
              onClick={() => update('country', 'japan')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                value.country === 'japan'
                  ? 'text-white shadow-md'
                  : 'bg-stone-50 dark:bg-zinc-800 text-zinc-500 border border-stone-200 dark:border-zinc-700'
              }`}
              style={value.country === 'japan' ? { background: 'linear-gradient(135deg, #e91e63, #ff6090)' } : {}}
            >
              🇯🇵 일본 (원정)
            </button>
          </div>
        </div>
        
        {/* 공연 제목 */}
        <Field label="공연 제목" required>
          <input
            type="text"
            value={value.title || ''}
            onChange={(e) => update('title', e.target.value)}
            placeholder="예: YOASOBI ASIA TOUR 2026 in SEOUL"
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
          {isMultiDay && (
            <p className="text-[10px] text-pink-600 dark:text-pink-400 mt-1">
              💡 공통 제목이에요. 일자별 라벨(DAY1, DAY2...)이 자동으로 추가돼요
            </p>
          )}
        </Field>
        
        {/* 공연 일자 (여러 개 가능) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              공연 일자 <span className="text-pink-500">*</span>
              {isMultiDay && (
                <span className="ml-2 text-[10px] font-normal text-pink-600 dark:text-pink-400">
                  ({dates.length}일 공연)
                </span>
              )}
            </label>
          </div>
          
          <div className="space-y-2">
            {dates.map((d, idx) => (
              <div 
                key={idx}
                className={`p-2.5 rounded-lg border ${
                  isMultiDay
                    ? 'bg-pink-50/50 dark:bg-pink-950/10 border-pink-200 dark:border-pink-900'
                    : 'bg-stone-50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700'
                }`}
              >
                {isMultiDay && (
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={d.label || ''}
                      onChange={(e) => updateDate(idx, 'label', e.target.value)}
                      placeholder={`DAY${idx + 1}`}
                      className="text-xs font-bold bg-transparent text-pink-600 dark:text-pink-400 outline-none border-b border-pink-300 dark:border-pink-700 px-1 py-0.5 w-20"
                    />
                    {dates.length > 1 && (
                      <button
                        onClick={() => removeDate(idx)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={d.date || ''}
                    onChange={(e) => updateDate(idx, 'date', e.target.value)}
                    className="px-2 py-1.5 rounded text-xs bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
                  />
                  <input
                    type="time"
                    value={d.time || ''}
                    onChange={(e) => updateDate(idx, 'time', e.target.value)}
                    placeholder="시간"
                    className="px-2 py-1.5 rounded text-xs bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
                  />
                </div>
              </div>
            ))}
            
            <button
              onClick={addDate}
              className="w-full py-2 rounded-lg text-xs font-bold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              일자 추가 (양일/3일 공연)
            </button>
          </div>
        </div>
        
        {/* 공연장 선택 */}
        <Field label="공연장">
          {!showNewVenue ? (
            <>
              <select
                value={value.venue_id || ''}
                onChange={(e) => {
                  const v = venues.find(x => x.id === e.target.value)
                  update('venue_id', e.target.value || null)
                  update('venue', v?.name || '')
                  update('city', v?.city || value.city)
                }}
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300 mb-2"
              >
                <option value="">공연장 선택...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.city && `· ${v.city}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewVenue(true)}
                className="w-full text-xs py-2 rounded-lg bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                목록에 없는 새 공연장
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={value.venue || ''}
                onChange={(e) => update('venue', e.target.value)}
                placeholder="공연장 이름 (예: KBS아레나)"
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300 mb-2"
              />
              <button
                onClick={() => { setShowNewVenue(false); update('venue', ''); update('venue_id', null) }}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                ← 목록에서 선택
              </button>
            </>
          )}
        </Field>
        
        {/* 도시 */}
        <Field label="도시">
          <input
            type="text"
            value={value.city || ''}
            onChange={(e) => update('city', e.target.value)}
            placeholder="예: 서울, 도쿄, 오사카"
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
        </Field>
        
        {/* 공연 시간 + 좌석 */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="공연 시간 (분)">
            <input
              type="number"
              value={value.duration_minutes || ''}
              onChange={(e) => update('duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="120"
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
            />
          </Field>
          <Field label="좌석 종류">
            <input
              type="text"
              value={value.seat_type || ''}
              onChange={(e) => update('seat_type', e.target.value)}
              placeholder="스탠딩, 지정석"
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
            />
          </Field>
        </div>
        
        {/* 가격 */}
        <Field label="가격">
          <input
            type="text"
            value={value.ticket_price || ''}
            onChange={(e) => update('ticket_price', e.target.value)}
            placeholder="예: VIP 220,000원 / R 165,000원"
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
        {label} {required && <span className="text-pink-500">*</span>}
      </label>
      {children}
    </div>
  )
}
