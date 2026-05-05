import { X, Check, Calendar } from 'lucide-react'

/**
 * 양일(N일) 공연 날짜 선택 모달
 * 
 * Props:
 *   concert       - 공연 객체 (is_series, series_dates 포함)
 *   attendingConcertIds - 현재 attending 중인 concert_id 배열
 *   onConfirm(selectedIds, deselectedIds) - 확인 콜백
 *   onClose       - 닫기 콜백
 */
export default function AttendingDayModal({ concert, attendingConcertIds, onConfirm, onClose }) {
  const seriesDates = concert.series_dates || []

  // 초기 선택 상태: 현재 attending 중인 날만 true
  const [selected, setSelected] = useState(() => {
    const init = {}
    seriesDates.forEach(d => {
      init[d.id] = attendingConcertIds.includes(d.id)
    })
    return init
  })

  const toggleDay = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleConfirm = () => {
    const toAdd = seriesDates
      .filter(d => selected[d.id] && !attendingConcertIds.includes(d.id))
      .map(d => d.id)
    const toRemove = seriesDates
      .filter(d => !selected[d.id] && attendingConcertIds.includes(d.id))
      .map(d => d.id)
    onConfirm(toAdd, toRemove)
  }

  const anySelected = Object.values(selected).some(Boolean)
  const color = concert.artist?.color || '#e91e63'

  const formatDate = (dateStr, timeStr) => {
    const d = new Date(dateStr)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
    const time = timeStr ? ` · ${timeStr.slice(0, 5)}` : ''
    return `${month}/${day} (${weekday})${time}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider mb-1" style={{ color }}>
              {concert.artist?.name}
            </div>
            <h3 className="text-base font-black text-zinc-900 leading-snug">
              {concert.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">갈 날짜를 선택하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-zinc-400 flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 날짜 선택 */}
        <div className="px-4 pb-3 space-y-2">
          {seriesDates.map(d => {
            const isSelected = selected[d.id]
            return (
              <button
                key={d.id}
                onClick={() => toggleDay(d.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-500'
                    : 'border-2 border-stone-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  {d.day_label && (
                    <div className="text-[10px] font-bold tracking-wider text-pink-500 mb-0.5">
                      {d.day_label}
                    </div>
                  )}
                  <div className={`text-sm font-bold ${isSelected ? 'text-emerald-800' : 'text-zinc-700'}`}>
                    {formatDate(d.date, d.time)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="px-4 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-bold text-zinc-600 hover:bg-stone-50 transition"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
              anySelected
                ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600'
                : 'bg-stone-200 text-stone-400'
            }`}
          >
            {anySelected ? '확인' : '선택 안 함'}
          </button>
        </div>
      </div>
    </div>
  )
}

// useState import 누락 방지
import { useState } from 'react'
