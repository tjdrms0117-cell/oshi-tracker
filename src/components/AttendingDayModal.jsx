import { useState } from 'react'
import { X, Check } from 'lucide-react'

export default function AttendingDayModal({ concert, attendingConcertIds, onConfirm, onClose }) {
  const isTour = concert.is_tour && concert.tour_concerts?.length > 0
  const seriesDates = concert.series_dates || []

  // 투어 모달: step1 = 회전 선택, step2 = 날짜 선택 (양일인 경우)
  const [step, setStep] = useState(isTour ? 1 : 2)
  const [selectedTourConcert, setSelectedTourConcert] = useState(null)

  // 양일 날짜 선택 상태
  const [selected, setSelected] = useState(() => {
    const init = {}
    seriesDates.forEach(d => {
      init[d.id] = attendingConcertIds.includes(d.id)
    })
    return init
  })

  // 투어 회전 선택 시
  const handleSelectTourConcert = (tc) => {
    setSelectedTourConcert(tc)
    if (tc.series_dates?.length > 1) {
      // 양일 공연이면 step2로
      const init = {}
      tc.series_dates.forEach(d => {
        init[d.id] = attendingConcertIds.includes(d.id)
      })
      setSelected(init)
      setStep(2)
    } else {
      // 단일 공연이면 바로 confirm
      const isCurrentlyAttending = attendingConcertIds.includes(tc.id)
      if (isCurrentlyAttending) {
        onConfirm([], [tc.id])
      } else {
        onConfirm([tc.id], [])
      }
    }
  }

  const toggleDay = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleConfirm = () => {
    const dates = selectedTourConcert?.series_dates || seriesDates
    const toAdd = dates
      .filter(d => selected[d.id] && !attendingConcertIds.includes(d.id))
      .map(d => d.id)
    const toRemove = dates
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

  // 투어 회전별 attending 여부
  const isTourConcertAttending = (tc) => {
    if (tc.series_dates?.length > 1) {
      return tc.series_dates.some(d => attendingConcertIds.includes(d.id))
    }
    return attendingConcertIds.includes(tc.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-wider mb-1" style={{ color }}>
              {concert.artist?.name}
            </div>
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-snug">
              {isTour ? concert.tour_name : concert.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {step === 1 ? '어느 일정에 가시나요?' : '갈 날짜를 선택하세요'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400 flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: 투어 회전 선택 */}
        {step === 1 && isTour && (
          <div className="px-4 pb-5 space-y-2 max-h-80 overflow-y-auto">
            {concert.tour_concerts.map(tc => {
              const isAttending = isTourConcertAttending(tc)
              const dates = tc.series_dates?.length > 1
                ? `${new Date(tc.series_dates[0].date).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })} ~ ${new Date(tc.series_dates[tc.series_dates.length - 1].date).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}`
                : new Date(tc.date).toLocaleDateString('ko', { month: 'numeric', day: 'numeric', weekday: 'short' })

              return (
                <button
                  key={tc.id}
                  onClick={() => handleSelectTourConcert(tc)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    isAttending
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 hover:border-violet-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAttending ? 'bg-emerald-500' : 'border-2 border-stone-300 dark:border-zinc-600'
                  }`}>
                    {isAttending && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${isAttending ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {dates}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {tc.venue_obj?.name || tc.venue || tc.city || ''}
                    </div>
                  </div>
                  {tc.series_dates?.length > 1 && (
                    <span className="text-[10px] text-violet-500 font-bold flex-shrink-0">
                      {tc.series_dates.length}일 →
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2: 양일 날짜 선택 */}
        {step === 2 && (
          <>
            {isTour && (
              <button
                onClick={() => setStep(1)}
                className="mx-4 mb-2 text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1"
              >
                ← 일정 다시 선택
              </button>
            )}
            <div className="px-4 pb-3 space-y-2">
              {(selectedTourConcert?.series_dates || seriesDates).map(d => {
                const isSelected = selected[d.id]
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDay(d.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-emerald-500' : 'border-2 border-stone-300 dark:border-zinc-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {d.day_label && (
                        <div className="text-[10px] font-bold tracking-wider text-pink-500 mb-0.5">
                          {d.day_label}
                        </div>
                      )}
                      <div className={`text-sm font-bold ${isSelected ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {formatDate(d.date, d.time)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="px-4 pb-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                  anySelected
                    ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600'
                    : 'bg-stone-200 dark:bg-zinc-700 text-stone-400 dark:text-zinc-500'
                }`}
              >
                {anySelected ? '확인' : '선택 안 함'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}