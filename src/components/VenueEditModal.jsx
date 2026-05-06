import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createVenue, updateVenue } from '../lib/api'

export default function VenueEditModal({ venue, onClose, onDone }) {
  const isNew = !venue

  const [form, setForm] = useState({
    name: '',
    name_local: '',
    country: 'korea',
    city: '',
    address: '',
    subway_info: '',
    parking_info: '',
    tips: '',
    capacity: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name || '',
        name_local: venue.name_local || '',
        country: venue.country || 'korea',
        city: venue.city || '',
        address: venue.address || '',
        subway_info: venue.subway_info || '',
        parking_info: venue.parking_info || '',
        tips: venue.tips || '',
        capacity: venue.capacity || '',
      })
    }
  }, [venue])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('공연장 이름은 필수예요'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        name_local: form.name_local.trim() || null,
        country: form.country,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        subway_info: form.subway_info.trim() || null,
        parking_info: form.parking_info.trim() || null,
        tips: form.tips.trim() || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      }
      if (isNew) {
        await createVenue(payload)
      } else {
        await updateVenue(venue.id, payload)
      }
      onDone()
    } catch (err) {
      alert('저장 중 오류: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="text-base font-black text-zinc-900">
            {isNew ? '공연장 추가' : '공연장 수정'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <Field label="공연장 이름 *">
            <input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="예: YES24 라이브홀"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <Field label="현지 이름">
            <input
              value={form.name_local}
              onChange={e => handleChange('name_local', e.target.value)}
              placeholder="예: Zepp Haneda"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="국가">
              <select
                value={form.country}
                onChange={e => handleChange('country', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
              >
                <option value="korea">🇰🇷 한국</option>
                <option value="japan">🇯🇵 일본</option>
              </select>
            </Field>
            <Field label="도시">
              <input
                value={form.city}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="예: 서울"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>
          </div>

          <Field label="주소">
            <input
              value={form.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="예: 서울 광진구 능동로 90"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <Field label="교통 정보">
            <input
              value={form.subway_info}
              onChange={e => handleChange('subway_info', e.target.value)}
              placeholder="예: 7호선 어린이대공원역 1번 출구"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <Field label="주차 정보">
            <input
              value={form.parking_info}
              onChange={e => handleChange('parking_info', e.target.value)}
              placeholder="예: 공연장 내 유료 주차 가능"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <Field label="꿀팁">
            <textarea
              value={form.tips}
              onChange={e => handleChange('tips', e.target.value)}
              placeholder="입장 꿀팁, 주의사항 등"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400 resize-none"
            />
          </Field>

          <Field label="수용 인원">
            <input
              type="number"
              value={form.capacity}
              onChange={e => handleChange('capacity', e.target.value)}
              placeholder="예: 2000"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 py-4 border-t border-stone-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-stone-200 text-sm font-bold text-zinc-600 hover:bg-stone-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-600 mb-1">{label}</label>
      {children}
    </div>
  )
}