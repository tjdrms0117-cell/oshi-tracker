import { useState } from 'react'
import { createArtistSubmission } from '../../lib/api'

const COLORS = [
  { label: 'J-POP 핑크', value: '#e91e63' },
  { label: '시티팝 보라', value: '#9c27b0' },
  { label: '록 시안', value: '#00acc1' },
  { label: '우타이테 인디고', value: '#5c6bc0' },
  { label: '싱송 오렌지', value: '#f57c00' },
  { label: '인디 그린', value: '#10b981' },
  { label: '판타지 노랑', value: '#ffa726' },
  { label: '몽환 보라', value: '#7e57c2' },
  { label: '레드', value: '#ef4444' },
  { label: '민트', value: '#14b8a6' },
]

export default function ArtistSubmitForm({ session, onDone }) {
  const [form, setForm] = useState({
    name: '',
    name_jp: '',
    color: '#e91e63',
    top_song_title: '',
    top_song_title_jp: '',
    top_song_youtube_url: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('가수명은 필수예요'); return }
    setSubmitting(true)
    try {
      await createArtistSubmission({
        ...form,
        submitted_by: session.user.id,
        status: 'pending',
      })
      alert('제보 완료! 검수 후 등록될 거예요.')
      onDone()
    } catch (err) {
      alert('제보 중 오류가 발생했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-zinc-900">아티스트 제보</h2>

      {/* 가수명 */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">가수명 (한국어) *</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="예: 로쿠데나시"
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-stone-200 outline-none focus:border-pink-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">가수명 (원어/영어)</label>
        <input
          value={form.name_jp}
          onChange={e => set('name_jp', e.target.value)}
          placeholder="예: Rokudenashi"
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-stone-200 outline-none focus:border-pink-400"
        />
      </div>

      {/* 컬러 */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-700">컬러</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => set('color', c.value)}
              className={`w-7 h-7 rounded-full border-2 transition ${
                form.color === c.value ? 'border-zinc-900 scale-110' : 'border-transparent'
              }`}
              style={{ background: c.value }}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-4 h-4 rounded-full" style={{ background: form.color }} />
          선택된 컬러
        </div>
      </div>

      {/* 대표곡 */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">대표곡 (한국어)</label>
        <input
          value={form.top_song_title}
          onChange={e => set('top_song_title', e.target.value)}
          placeholder="예: 그저 목소리 하나"
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-stone-200 outline-none focus:border-pink-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">대표곡 (원어)</label>
        <input
          value={form.top_song_title_jp}
          onChange={e => set('top_song_title_jp', e.target.value)}
          placeholder="예: ただ声一つ"
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-stone-200 outline-none focus:border-pink-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">유튜브 URL</label>
        <input
          value={form.top_song_youtube_url}
          onChange={e => set('top_song_youtube_url', e.target.value)}
          placeholder="https://youtu.be/..."
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-stone-200 outline-none focus:border-pink-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">메모 (선택)</label>
        <textarea
          value={form.note}
          onChange={e => set('note', e.target.value)}
          placeholder="추가로 알려주실 내용이 있으면 적어주세요"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-stone-200 outline-none focus:border-pink-400 resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !form.name.trim()}
        className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
        style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}
      >
        {submitting ? '제보 중...' : '아티스트 제보하기'}
      </button>
    </div>
  )
}
