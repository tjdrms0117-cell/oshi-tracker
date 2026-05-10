import { useEffect, useState, useRef } from 'react'
import { X, Save, Plus, Calendar, MapPin, Ticket, Image, Upload, Link } from 'lucide-react'
import { 
  fetchVenues, 
  updateConcert, 
  replaceTicketRounds,
  updateVenue,
  fetchConcertById,
  fetchArtists,
} from '../lib/api'
import { supabase } from '../lib/supabase'

export default function ConcertEditModal({ concertId, onClose, onDone }) {
  const [concert, setConcert] = useState(null)
  const [venues, setVenues] = useState([])
  const [editedData, setEditedData] = useState({})
  const [editedRounds, setEditedRounds] = useState([])
  const [editedVenue, setEditedVenue] = useState({})
  const [showVenueDetails, setShowVenueDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [artists, setArtists] = useState([])
  
  const [day2Concert, setDay2Concert] = useState(null)
  const [day2Date, setDay2Date] = useState('')
  const [day2Time, setDay2Time] = useState('')

  const [posterTab, setPosterTab] = useState('url')
  const [posterUploading, setPosterUploading] = useState(false)
  const [posterPreview, setPosterPreview] = useState('')
  const fileInputRef = useRef(null)
  
  useEffect(() => { loadData() }, [concertId])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const c = await fetchConcertById(concertId)
      setConcert(c)
      setEditedData({
        title: c.title || '',
        country: c.country,
        venue_id: c.venue_id,
        venue: c.venue || '',
        city: c.city || '',
        date: c.date || '',
        time: c.time?.slice(0, 5) || '',
        duration_minutes: c.duration_minutes || '',
        seat_type: c.seat_type || '',
        ticket_price: c.ticket_price || '',
        memo: c.memo || '',
        source_url: c.source_url || '',
        poster_url: c.poster_url || '',
        organizer: c.organizer || '',
        max_tickets_per_person: c.max_tickets_per_person || '',
        co_artist_id: c.co_artist_id || '',
        co_artist_id_2: c.co_artist_id_2 || '',
        co_artist_id_3: c.co_artist_id_3 || '',
      })
      setPosterPreview(c.poster_url || '')
      setEditedRounds((c.ticket_rounds || [])
        .filter(r => !r._day_label || r._day_label === c.day_label || !c.day_label)
        .map(r => ({
          id: r.id,
          concert_id: r.concert_id,
          round_name: r.round_name,
          open_at: r.open_at ? new Date(r.open_at).toLocaleString('sv', { timeZone: 'Asia/Seoul' }).slice(0, 16) : '',
          method: r.method || '',
          ticket_site: r.ticket_site || '',
          price_info: r.price_info || '',
          note: r.note || '',
          ticket_url: r.ticket_url || '',
          close_at: r.close_at ? new Date(r.close_at).toLocaleString('sv', { timeZone: 'Asia/Seoul' }).slice(0, 16) : '',
          result_at: r.result_at ? new Date(r.result_at).toLocaleString('sv', { timeZone: 'Asia/Seoul' }).slice(0, 16) : '',
        })))
      
      if (c.venue) {
        setEditedVenue({
          name_local: c.venue.name_local || '',
          address: c.venue.address || '',
          subway_info: c.venue.subway_info || '',
          parking_info: c.venue.parking_info || '',
          tips: c.venue.tips || '',
          capacity: c.venue.capacity || '',
        })
      }
      
      const v = await fetchVenues({ country: c.country })
      setVenues(v)

      const allArtists = await fetchArtists()
      setArtists(allArtists)

      if (c.series_id && c.day_label === 'DAY1') {
        const { data: day2 } = await supabase
          .from('concerts')
          .select('id, date, time')
          .eq('series_id', c.series_id)
          .eq('day_label', 'DAY2')
          .single()
        if (day2) {
          setDay2Concert(day2)
          setDay2Date(day2.date || '')
          setDay2Time(day2.time?.slice(0, 5) || '')
        }
      }
    } catch (err) {
      console.error('로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterPreview(URL.createObjectURL(file))
    setPosterUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${concertId}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('concert-posters')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('concert-posters').getPublicUrl(fileName)
      setEditedData(prev => ({ ...prev, poster_url: publicUrl }))
      setPosterPreview(publicUrl)
    } catch (err) {
      alert('업로드 실패: ' + err.message)
      setPosterPreview(editedData.poster_url || '')
    } finally {
      setPosterUploading(false)
    }
  }

  const handlePosterRemove = () => {
    setEditedData(prev => ({ ...prev, poster_url: '' }))
    setPosterPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await updateConcert(concertId, {
        title: editedData.title,
        venue_id: editedData.venue_id || null,
        venue: editedData.venue,
        city: editedData.city,
        date: editedData.date,
        time: editedData.time || null,
        duration_minutes: editedData.duration_minutes ? parseInt(editedData.duration_minutes) : null,
        seat_type: editedData.seat_type || null,
        ticket_price: editedData.ticket_price || null,
        memo: editedData.memo || null,
        source_url: editedData.source_url || null,
        poster_url: editedData.poster_url || null,
        organizer: editedData.organizer || null,
        max_tickets_per_person: editedData.max_tickets_per_person ? parseInt(editedData.max_tickets_per_person) : null,
        co_artist_id: editedData.co_artist_id || null,
        co_artist_id_2: editedData.co_artist_id_2 || null,
        co_artist_id_3: editedData.co_artist_id_3 || null,
      })

      if (day2Concert) {
        await updateConcert(day2Concert.id, {
          date: day2Date || null,
          time: day2Time || null,
        })
      }
      
      const validRounds = editedRounds
        .filter(r => r.round_name && (!r.concert_id || r.concert_id === concertId))
        .map(r => ({
          ...r,
          open_at: r.open_at || null,
          close_at: r.close_at && r.close_at.trim() !== '' ? r.close_at : null,
        }))
      await replaceTicketRounds(concertId, validRounds)
      
      if (editedData.venue_id && (editedVenue.address || editedVenue.subway_info || editedVenue.capacity)) {
        const venueUpdates = {}
        if (editedVenue.name_local) venueUpdates.name_local = editedVenue.name_local
        if (editedVenue.address) venueUpdates.address = editedVenue.address
        if (editedVenue.subway_info) venueUpdates.subway_info = editedVenue.subway_info
        if (editedVenue.parking_info) venueUpdates.parking_info = editedVenue.parking_info
        if (editedVenue.tips) venueUpdates.tips = editedVenue.tips
        if (editedVenue.capacity) venueUpdates.capacity = parseInt(editedVenue.capacity)
        if (Object.keys(venueUpdates).length > 0) await updateVenue(editedData.venue_id, venueUpdates)
      }
      
      alert('수정 완료!')
      onDone()
    } catch (err) {
      console.error(err)
      alert('수정 중 오류: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const addRound = () => setEditedRounds([...editedRounds, { round_name: '', open_at: '', close_at: '', result_at: '', method: 'first-come', ticket_site: '', price_info: '', note: '', ticket_url: '' }])
  const removeRound = (idx) => setEditedRounds(editedRounds.filter((_, i) => i !== idx))
  const updateRound = (idx, key, val) => setEditedRounds(editedRounds.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  
  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="text-white text-sm">불러오는 중...</div>
    </div>
  )
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">공연 수정</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* 포스터 */}
          <Section icon={Image} title="포스터 이미지">
            <div className="space-y-3">
              <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-lg">
                <button onClick={() => setPosterTab('url')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition ${posterTab === 'url' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'}`}>
                  <Link className="w-3 h-3" /> URL 입력
                </button>
                <button onClick={() => setPosterTab('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition ${posterTab === 'upload' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'}`}>
                  <Upload className="w-3 h-3" /> 파일 업로드
                </button>
              </div>
              {posterTab === 'url' && (
                <div className="space-y-2">
                  <Input label="이미지 URL" value={editedData.poster_url} onChange={v => { setEditedData(prev => ({ ...prev, poster_url: v })); setPosterPreview(v) }} placeholder="https://..." />
                  <p className="text-[10px] text-zinc-400">이미지 우클릭 → "이미지 주소 복사" 후 붙여넣기</p>
                </div>
              )}
              {posterTab === 'upload' && (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={posterUploading} className="w-full py-3 rounded-lg border-2 border-dashed border-stone-300 dark:border-zinc-700 text-xs text-zinc-500 hover:border-pink-300 hover:text-pink-500 transition flex items-center justify-center gap-2 disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {posterUploading ? '업로드 중...' : '이미지 파일 선택'}
                  </button>
                </div>
              )}
              {posterPreview && (
                <div className="relative">
                  <img src={posterPreview} alt="미리보기" className="w-full max-h-48 object-contain rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700" onError={() => setPosterPreview('')} />
                  <button onClick={handlePosterRemove} className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </Section>
          
          <Section icon={Calendar} title="공연 정보">
            <div className="space-y-2">
              <Input label="제목" value={editedData.title} onChange={v => setEditedData({...editedData, title: v})} />
              {/* 공동 아티스트 */}
              <div className="space-y-1.5 p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">공동 아티스트 (투맨/합동)</p>
                {['co_artist_id', 'co_artist_id_2', 'co_artist_id_3'].map((field, i) => (
                  <select
                    key={field}
                    value={editedData[field] || ''}
                    onChange={e => setEditedData({...editedData, [field]: e.target.value})}
                    className="w-full px-2.5 py-1.5 rounded text-xs bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 outline-none focus:border-purple-400"
                  >
                    <option value="">— {i === 0 ? '2번째' : i === 1 ? '3번째' : '4번째'} 아티스트 (선택) —</option>
                    {artists.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label={day2Concert ? 'DAY1 날짜' : '날짜'} type="date" value={editedData.date} onChange={v => setEditedData({...editedData, date: v})} />
                <Input label={day2Concert ? 'DAY1 시간' : '시간'} type="time" value={editedData.time} onChange={v => setEditedData({...editedData, time: v})} />
              </div>
              {day2Concert && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-900">
                  <Input label="DAY2 날짜" type="date" value={day2Date} onChange={v => setDay2Date(v)} />
                  <Input label="DAY2 시간" type="time" value={day2Time} onChange={v => setDay2Time(v)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input label="공연 시간 (분)" type="number" value={editedData.duration_minutes} onChange={v => setEditedData({...editedData, duration_minutes: v})} />
                <Input label="좌석" value={editedData.seat_type} onChange={v => setEditedData({...editedData, seat_type: v})} />
              </div>
              <Input label="가격" value={editedData.ticket_price} onChange={v => setEditedData({...editedData, ticket_price: v})} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="주최사" value={editedData.organizer} onChange={v => setEditedData({...editedData, organizer: v})} placeholder="(주)이릴레반트" />
                <Input label="1인 매수 제한" type="number" value={editedData.max_tickets_per_person} onChange={v => setEditedData({...editedData, max_tickets_per_person: v})} placeholder="2" />
              </div>
              <Input label="메모 (VIP 특전, 게스트 등 짧게)" value={editedData.memo} onChange={v => setEditedData({...editedData, memo: v})} placeholder="VIP특전 친필사인 포스터" />
              <Input label="출처 URL" value={editedData.source_url} onChange={v => setEditedData({...editedData, source_url: v})} />
            </div>
          </Section>
          
          <Section icon={MapPin} title="공연장">
            <div className="space-y-2">
              <select value={editedData.venue_id || ''} onChange={(e) => {
                const v = venues.find(x => x.id === e.target.value)
                if (e.target.value === '__new__') setEditedData({...editedData, venue_id: null})
                else if (v) setEditedData({...editedData, venue_id: v.id, venue: v.name, city: v.city || editedData.city})
                else setEditedData({...editedData, venue_id: null})
              }} className="w-full px-2.5 py-1.5 rounded text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300">
                <option value="">— 공연장 선택 —</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name} {v.city && `· ${v.city}`}</option>)}
                <option value="__new__">+ 새 공연장 직접 입력</option>
              </select>
              {!editedData.venue_id && <Input label="공연장 이름 (직접 입력)" value={editedData.venue} onChange={v => setEditedData({...editedData, venue: v})} />}
              <Input label="도시" value={editedData.city} onChange={v => setEditedData({...editedData, city: v})} />
              <button onClick={() => setShowVenueDetails(!showVenueDetails)} className="w-full text-left px-2 py-1.5 rounded text-xs font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition">
                {showVenueDetails ? '▲' : '▼'} 공연장 상세 정보
              </button>
              {showVenueDetails && (
                <div className="space-y-1.5 pl-2 border-l-2 border-pink-200 dark:border-pink-900">
                  <Input label="원어 이름" value={editedVenue.name_local} onChange={v => setEditedVenue({...editedVenue, name_local: v})} />
                  <Input label="주소" value={editedVenue.address} onChange={v => setEditedVenue({...editedVenue, address: v})} />
                  <Input label="교통" value={editedVenue.subway_info} onChange={v => setEditedVenue({...editedVenue, subway_info: v})} />
                  <Input label="주차" value={editedVenue.parking_info} onChange={v => setEditedVenue({...editedVenue, parking_info: v})} />
                  <Input label="꿀팁" value={editedVenue.tips} onChange={v => setEditedVenue({...editedVenue, tips: v})} />
                  <Input label="수용 인원" type="number" value={editedVenue.capacity} onChange={v => setEditedVenue({...editedVenue, capacity: v})} />
                </div>
              )}
            </div>
          </Section>
          
          <Section icon={Ticket} title={`티켓팅 (${editedRounds.length}회)`}>
            <div className="space-y-2">
              {editedRounds.map((round, idx) => (
                <div key={idx} className="rounded-lg p-2.5 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 relative">
                  <button onClick={() => removeRound(idx)} className="absolute top-1 right-1 p-1 rounded text-zinc-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                  <div className="space-y-1.5 pr-6">
                    <Input label="라운드 이름" value={round.round_name} onChange={v => updateRound(idx, 'round_name', v)} />
                    <Input label="접수 시작" type="datetime-local" value={round.open_at} onChange={v => updateRound(idx, 'open_at', v)} />
                    <Input label="접수 마감 (선택)" type="datetime-local" value={round.close_at || ''} onChange={v => updateRound(idx, 'close_at', v)} />
                    <Input label="결과 발표 (선택)" type="datetime-local" value={round.result_at || ''} onChange={v => updateRound(idx, 'result_at', v)} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <select value={round.method} onChange={(e) => updateRound(idx, 'method', e.target.value)} className="w-full px-2 py-1 rounded text-[11px] bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 outline-none">
                        <option value="">방식</option>
                        <option value="first-come">선착순</option>
                        <option value="lottery">추첨</option>
                        <option value="fanclub">FC선예매</option>
                      </select>
                      <Input label="" value={round.ticket_site} onChange={v => updateRound(idx, 'ticket_site', v)} placeholder="사이트" />
                    </div>
                    <Input label="" value={round.price_info} onChange={v => updateRound(idx, 'price_info', v)} placeholder="가격 정보" />
                    <Input label="" value={round.note} onChange={v => updateRound(idx, 'note', v)} placeholder="메모" />
                    <Input label="" value={round.ticket_url} onChange={v => updateRound(idx, 'ticket_url', v)} placeholder="티켓 링크 URL" />
                  </div>
                </div>
              ))}
              <button onClick={addRound} className="w-full py-2 rounded text-xs font-bold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> 티켓팅 추가
              </button>
            </div>
          </Section>
        </div>
        
        <div className="border-t border-stone-200 dark:border-zinc-800 p-4 flex gap-2">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">취소</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-500 text-white flex items-center justify-center gap-1 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {children}
    </section>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      {label && <label className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 block">{label}</label>}
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-2.5 py-1.5 rounded text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300" />
    </div>
  )
}
