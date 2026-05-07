import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { fetchVenues, fetchFestivals } from '../../lib/api'

export default function StepFestival1Info({ value, onChange, mode }) {
  const [venues, setVenues] = useState([])
  const [festivals, setFestivals] = useState([])
  const [showNewVenue, setShowNewVenue] = useState(false)

  useEffect(() => {
    fetchVenues({ country: value.country }).then(setVenues).catch(() => setVenues([]))
    if (mode === 'add_artist') {
      fetchFestivals().then(setFestivals).catch(() => setFestivals([]))
    }
  }, [value.country, mode])

  const update = (key, val) => onChange({ ...value, [key]: val })

  const dates = value.dates || [{ date: '', label: '' }]

  const updateDate = (idx, key, val) => {
    const newDates = [...dates]
    newDates[idx] = { ...newDates[idx], [key]: val }
    onChange({ ...value, dates: newDates })
  }

  const addDate = () => {
    onChange({ ...value, dates: [...dates, { date: '', label: '' }] })
  }

  const removeDate = (idx) => {
    if (dates.length === 1) return
    onChange({ ...value, dates: dates.filter((_, i) => i !== idx) })
  }

  // 기존 페스티벌에 아티스트 추가하는 모드
  if (mode === 'add_artist') {
    return (
      <div>
        <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
          어떤 페스티벌인가요?
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          출연 아티스트를 추가할 페스티벌을 선택해주세요
        </p>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {festivals.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">등록된 페스티벌이 없어요</div>
          ) : (
            festivals.map(f => (
              <button
                key={f.id}
                onClick={() => update('festival_id', f.id)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  value.festival_id === f.id
                    ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700'
                    : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800'
                }`}
              >
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{f.name}</div>
                {f.name_jp && <div className="text-xs text-zinc-500">{f.name_jp}</div>}
                <div className="text-xs text-zinc-400 mt-0.5">{f.date}</div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // 새 페스티벌 제보 모드
  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
        페스티벌 정보를 알려주세요
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        모르는 정보는 비워두셔도 돼요
      </p>

      <div className="space-y-4">
        {/* 국가 */}
        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">국가</label>
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

        {/* 페스 이름 */}
        <Field label="페스티벌 이름" required>
          <input
            type="text"
            value={value.name || ''}
            onChange={e => update('name', e.target.value)}
            placeholder="예: SUMMER SONIC 2026"
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
        </Field>

        <Field label="페스티벌 이름 (원어)">
          <input
            type="text"
            value={value.name_jp || ''}
            onChange={e => update('name_jp', e.target.value)}
            placeholder="예: サマーソニック2026"
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
        </Field>

        {/* 날짜 */}
        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">
            개최 일자 <span className="text-pink-500">*</span>
            {dates.length > 1 && (
              <span className="ml-2 text-[10px] font-normal text-pink-600">({dates.length}일)</span>
            )}
          </label>
          <div className="space-y-2">
            {dates.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700">
                {dates.length > 1 && (
                  <input
                    type="text"
                    value={d.label || ''}
                    onChange={e => updateDate(idx, 'label', e.target.value)}
                    placeholder={`DAY${idx + 1}`}
                    className="text-xs font-bold bg-transparent text-pink-600 outline-none border-b border-pink-300 px-1 py-0.5 w-16"
                  />
                )}
                <input
                  type="date"
                  value={d.date || ''}
                  onChange={e => updateDate(idx, 'date', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded text-xs bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
                />
                {dates.length > 1 && (
                  <button onClick={() => removeDate(idx)} className="text-zinc-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addDate}
              className="w-full py-2 rounded-lg text-xs font-bold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              날짜 추가 (다일 페스)
            </button>
          </div>
        </div>

        {/* 공연장 */}
        <Field label="공연장">
          {!showNewVenue ? (
            <>
              <select
                value={value.venue_id || ''}
                onChange={e => {
                  const v = venues.find(x => x.id === e.target.value)
                  update('venue_id', e.target.value || null)
                  update('venue', v?.name || '')
                  update('city', v?.city || value.city)
                }}
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300 mb-2"
              >
                <option value="">공연장 선택...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} {v.city && `· ${v.city}`}</option>
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
                onChange={e => update('venue', e.target.value)}
                placeholder="공연장 이름"
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300 mb-2"
              />
              <button onClick={() => { setShowNewVenue(false); update('venue', ''); update('venue_id', null) }} className="text-xs text-zinc-500">
                ← 목록에서 선택
              </button>
            </>
          )}
        </Field>

        <Field label="도시">
          <input
            type="text"
            value={value.city || ''}
            onChange={e => update('city', e.target.value)}
            placeholder="예: 도쿄, 오사카"
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
        </Field>

        <Field label="가격">
          <input
            type="text"
            value={value.ticket_price || ''}
            onChange={e => update('ticket_price', e.target.value)}
            placeholder="예: 1일권 13,000엔 / 2일권 23,000엔"
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
