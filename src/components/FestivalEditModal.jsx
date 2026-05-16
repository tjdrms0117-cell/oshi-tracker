import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Search, Upload, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function FestivalEditModal({ festival, artists = [], onClose, onDone }) {
  const isNew = !festival?.id
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: festival?.name || '',
    name_jp: festival?.name_jp || '',
    date: festival?.date || '',
    end_date: festival?.end_date || '',
    venue: festival?.venue || '',
    city: festival?.city || '',
    country: festival?.country || 'japan',
    ticket_price: festival?.ticket_price || '',
    source_url: festival?.source_url || '',
    poster_url: festival?.poster_url || '',
    timetable_image_url: festival?.timetable_image_url || '',
  })

  const [festivalArtists, setFestivalArtists] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingTimetable, setUploadingTimetable] = useState(false)
  const timetableFileInputRef = useRef(null)

  useEffect(() => {
    if (festival?.festival_artists) {
      setFestivalArtists(festival.festival_artists.map(fa => ({
        artist_id: fa.artist_id,
        name: fa.artist?.name || fa.name || '',
        color: fa.artist?.color || '#888',
        performance_date: fa.performance_date || '',
      })))
    }
  }, [festival])

  const filteredArtists = artists.filter(a => {
    const q = searchQuery.toLowerCase()
    return (
      !q ||
      a.name?.toLowerCase().includes(q) ||
      a.name_jp?.toLowerCase().includes(q)
    ) && !festivalArtists.find(fa => fa.artist_id === a.id)
  })

  const addArtist = (artist) => {
    setFestivalArtists(prev => [...prev, {
      artist_id: artist.id,
      name: artist.name,
      color: artist.color || '#888',
      performance_date: '',
    }])
    setSearchQuery('')
  }

  const removeArtist = (artistId) => {
    setFestivalArtists(prev => prev.filter(fa => fa.artist_id !== artistId))
  }

  const updateArtistDate = (artistId, date) => {
    setFestivalArtists(prev => prev.map(fa =>
      fa.artist_id === artistId ? { ...fa, performance_date: date } : fa
    ))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `festival_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('concert-posters')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('concert-posters')
        .getPublicUrl(fileName)
      setForm(f => ({ ...f, poster_url: publicUrl }))
    } catch (err) {
      alert('업로드 실패: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleTimetableUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingTimetable(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `festival_timetable_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('concert-posters')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('concert-posters')
        .getPublicUrl(fileName)
      setForm(f => ({ ...f, timetable_image_url: publicUrl }))
    } catch (err) {
      alert('업로드 실패: ' + err.message)
    } finally {
      setUploadingTimetable(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('페스티벌 이름을 입력하세요'); return }
    if (!form.date) { alert('시작 날짜를 입력하세요'); return }
    setSaving(true)
    try {
      let festivalId = festival?.id

      if (isNew) {
        const { data, error } = await supabase
          .from('festivals')
          .insert([{ ...form }])
          .select('id')
          .single()
        if (error) throw error
        festivalId = data.id
      } else {
        const { error } = await supabase
          .from('festivals')
          .update({ ...form })
          .eq('id', festivalId)
        if (error) throw error
        await supabase.from('festival_artists').delete().eq('festival_id', festivalId)
      }

      if (festivalArtists.length > 0) {
        const { error } = await supabase.from('festival_artists').insert(
          festivalArtists.map(fa => ({
            festival_id: festivalId,
            artist_id: fa.artist_id,
            performance_date: fa.performance_date || null,
          }))
        )
        if (error) throw error
      }

      onDone?.()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const isMultiDay = form.end_date && form.end_date !== form.date

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
            {isNew ? '페스티벌 추가' : '페스티벌 수정'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* 포스터 */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">포스터</label>
            <div className="flex gap-2">
              {/* 미리보기 */}
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-stone-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-stone-200 dark:border-zinc-700">
                {form.poster_url ? (
                  <img src={form.poster_url} alt="포스터" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  value={form.poster_url}
                  onChange={e => setForm(f => ({ ...f, poster_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-xs outline-none focus:border-cyan-400"
                  placeholder="https://... (URL 직접 입력)"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-2 rounded-lg border border-dashed border-stone-300 dark:border-zinc-600 text-xs text-zinc-500 hover:border-cyan-400 hover:text-cyan-500 flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? '업로드 중...' : '파일 업로드'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">페스티벌 이름 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
                placeholder="예: SUMMER SONIC 2026" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">일본어 이름</label>
              <input value={form.name_jp} onChange={e => setForm(f => ({ ...f, name_jp: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
                placeholder="예: サマーソニック2026" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">시작일 *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">종료일</label>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">장소</label>
                <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
                  placeholder="예: 幕張メッセ" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">도시</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
                  placeholder="예: 千葉" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">국가</label>
              <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400">
                <option value="japan">🇯🇵 일본</option>
                <option value="korea">🇰🇷 한국</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">티켓 가격</label>
              <input value={form.ticket_price} onChange={e => setForm(f => ({ ...f, ticket_price: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
                placeholder="예: ¥13,800" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">출처 URL</label>
              <input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
                placeholder="https://..." />
            </div>

            {/* 타임테이블 이미지 */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">타임테이블 이미지</label>
              <div className="flex gap-2">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-stone-200 dark:border-zinc-700">
                  {form.timetable_image_url ? (
                    <img src={form.timetable_image_url} alt="타임테이블" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    value={form.timetable_image_url}
                    onChange={e => setForm(f => ({ ...f, timetable_image_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-xs outline-none focus:border-cyan-400"
                    placeholder="https://... (URL 직접 입력)"
                  />
                  <button
                    type="button"
                    onClick={() => timetableFileInputRef.current?.click()}
                    disabled={uploadingTimetable}
                    className="w-full py-2 rounded-lg border border-dashed border-stone-300 dark:border-zinc-600 text-xs text-zinc-500 hover:border-cyan-400 hover:text-cyan-500 flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingTimetable ? '업로드 중...' : '파일 업로드'}
                  </button>
                  <input ref={timetableFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleTimetableUpload} />
                  {form.timetable_image_url && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, timetable_image_url: '' }))}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      이미지 제거
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 출연진 */}
          <div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">출연 아티스트</div>
            {festivalArtists.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {festivalArtists.map(fa => (
                  <div key={fa.artist_id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: fa.color }} />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1">{fa.name}</span>
                    {isMultiDay && (
                      <input
                        type="date"
                        value={fa.performance_date || ''}
                        min={form.date}
                        max={form.end_date}
                        onChange={e => updateArtistDate(fa.artist_id, e.target.value)}
                        className="text-[11px] px-2 py-1 rounded border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-cyan-400"
                      />
                    )}
                    <button onClick={() => removeArtist(fa.artist_id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="아티스트 추가..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400"
              />
            </div>
            {searchQuery && (
              <div className="max-h-40 overflow-y-auto space-y-1 border border-stone-200 dark:border-zinc-700 rounded-lg p-1">
                {filteredArtists.length === 0 ? (
                  <div className="text-xs text-zinc-400 text-center py-2">검색 결과 없음</div>
                ) : filteredArtists.slice(0, 8).map(a => (
                  <button key={a.id} onClick={() => addArtist(a)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-zinc-700 text-left">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.color || '#888' }} />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{a.name}</span>
                    {a.name_jp && <span className="text-[10px] text-zinc-500">{a.name_jp}</span>}
                    <Plus className="w-3 h-3 text-cyan-500 ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {isMultiDay && festivalArtists.length > 0 && (
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                * 다일 페스티벌: 각 아티스트의 출연 날짜를 지정하세요
              </p>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-stone-200 dark:border-zinc-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800">
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)' }}>
            {saving ? '저장 중...' : (isNew ? '추가' : '저장')}
          </button>
        </div>
      </div>
    </div>
  )
}