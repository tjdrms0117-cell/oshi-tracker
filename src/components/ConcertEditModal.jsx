import { useEffect, useState } from 'react'
import { X, Save, Plus, Trash2, Calendar, MapPin, Music, Ticket } from 'lucide-react'
import { 
  fetchVenues, 
  updateConcert, 
  replaceTicketRounds,
  updateVenue,
  fetchConcertById,
} from '../lib/api'

export default function ConcertEditModal({ concertId, onClose, onDone }) {
  const [concert, setConcert] = useState(null)
  const [venues, setVenues] = useState([])
  const [editedData, setEditedData] = useState({})
  const [editedRounds, setEditedRounds] = useState([])
  const [editedVenue, setEditedVenue] = useState({})
  const [showVenueDetails, setShowVenueDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [concertId])
  
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
      })
      setEditedRounds((c.ticket_rounds || []).map(r => ({
        round_name: r.round_name,
        open_at: r.open_at ? new Date(r.open_at).toLocaleString('sv', { timeZone: 'Asia/Seoul' }).slice(0, 16) : '',
        method: r.method || '',
        ticket_site: r.ticket_site || '',
        price_info: r.price_info || '',
        note: r.note || '',
      })))
      
      // venue 정보
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
      
      // venues 목록
      const v = await fetchVenues({ country: c.country })
      setVenues(v)
    } catch (err) {
      console.error('로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      // 1. 공연 업데이트
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
      })
      
      // 2. 티켓팅 라운드 교체
      const validRounds = editedRounds
        .filter(r => r.round_name)
        .map(r => ({ ...r, open_at: r.open_at || null }))
      await replaceTicketRounds(concertId, validRounds)
      
      // 3. venue 정보 업데이트 (있으면)
      if (editedData.venue_id && (editedVenue.address || editedVenue.subway_info || editedVenue.capacity)) {
        const venueUpdates = {}
        if (editedVenue.name_local) venueUpdates.name_local = editedVenue.name_local
        if (editedVenue.address) venueUpdates.address = editedVenue.address
        if (editedVenue.subway_info) venueUpdates.subway_info = editedVenue.subway_info
        if (editedVenue.parking_info) venueUpdates.parking_info = editedVenue.parking_info
        if (editedVenue.tips) venueUpdates.tips = editedVenue.tips
        if (editedVenue.capacity) venueUpdates.capacity = parseInt(editedVenue.capacity)
        
        if (Object.keys(venueUpdates).length > 0) {
          await updateVenue(editedData.venue_id, venueUpdates)
        }
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
  
  const addRound = () => {
    setEditedRounds([
      ...editedRounds,
      { round_name: '', open_at: '', method: 'first-come', ticket_site: '', price_info: '', note: '' }
    ])
  }
  
  const removeRound = (idx) => {
    setEditedRounds(editedRounds.filter((_, i) => i !== idx))
  }
  
  const updateRound = (idx, key, val) => {
    setEditedRounds(editedRounds.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="text-white text-sm">불러오는 중...</div>
      </div>
    )
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            공연 수정
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          <Section icon={Calendar} title="공연 정보">
            <div className="space-y-2">
              <Input label="제목" value={editedData.title} onChange={v => setEditedData({...editedData, title: v})} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="날짜" type="date" value={editedData.date} onChange={v => setEditedData({...editedData, date: v})} />
                <Input label="시간" type="time" value={editedData.time} onChange={v => setEditedData({...editedData, time: v})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="공연 시간 (분)" type="number" value={editedData.duration_minutes} onChange={v => setEditedData({...editedData, duration_minutes: v})} />
                <Input label="좌석" value={editedData.seat_type} onChange={v => setEditedData({...editedData, seat_type: v})} />
              </div>
              <Input label="가격" value={editedData.ticket_price} onChange={v => setEditedData({...editedData, ticket_price: v})} />
              <Input label="메모" value={editedData.memo} onChange={v => setEditedData({...editedData, memo: v})} />
              <Input label="출처 URL" value={editedData.source_url} onChange={v => setEditedData({...editedData, source_url: v})} />
            </div>
          </Section>
          
          {/* 공연장 */}
          <Section icon={MapPin} title="공연장">
            <div className="space-y-2">
              <select
                value={editedData.venue_id || ''}
                onChange={(e) => {
                  const v = venues.find(x => x.id === e.target.value)
                  if (e.target.value === '__new__') {
                    setEditedData({...editedData, venue_id: null})
                  } else if (v) {
                    setEditedData({...editedData, venue_id: v.id, venue: v.name, city: v.city || editedData.city})
                  } else {
                    setEditedData({...editedData, venue_id: null})
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
              >
                <option value="">— 공연장 선택 —</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.city && `· ${v.city}`}
                  </option>
                ))}
                <option value="__new__">+ 새 공연장 직접 입력</option>
              </select>
              
              {!editedData.venue_id && (
                <Input label="공연장 이름 (직접 입력)" value={editedData.venue} onChange={v => setEditedData({...editedData, venue: v})} />
              )}
              
              <Input label="도시" value={editedData.city} onChange={v => setEditedData({...editedData, city: v})} />
              
              {/* 공연장 상세 */}
              <button
                onClick={() => setShowVenueDetails(!showVenueDetails)}
                className="w-full text-left px-2 py-1.5 rounded text-xs font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition"
              >
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
          
          {/* 티켓팅 라운드 */}
          <Section icon={Ticket} title={`티켓팅 (${editedRounds.length}회)`}>
            <div className="space-y-2">
              {editedRounds.map((round, idx) => (
                <div key={idx} className="rounded-lg p-2.5 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 relative">
                  <button
                    onClick={() => removeRound(idx)}
                    className="absolute top-1 right-1 p-1 rounded text-zinc-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="space-y-1.5 pr-6">
                    <Input label="라운드 이름" value={round.round_name} onChange={v => updateRound(idx, 'round_name', v)} />
                    <Input label="오픈 일시" type="datetime-local" value={round.open_at} onChange={v => updateRound(idx, 'open_at', v)} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={round.method}
                        onChange={(e) => updateRound(idx, 'method', e.target.value)}
                        className="w-full px-2 py-1 rounded text-[11px] bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 outline-none"
                      >
                        <option value="">방식</option>
                        <option value="first-come">선착순</option>
                        <option value="lottery">추첨</option>
                        <option value="fanclub">FC선예매</option>
                      </select>
                      <Input label="" value={round.ticket_site} onChange={v => updateRound(idx, 'ticket_site', v)} placeholder="사이트" />
                    </div>
                    <Input label="" value={round.price_info} onChange={v => updateRound(idx, 'price_info', v)} placeholder="가격 정보" />
                    <Input label="" value={round.note} onChange={v => updateRound(idx, 'note', v)} placeholder="메모" />
                  </div>
                </div>
              ))}
              
              <button
                onClick={addRound}
                className="w-full py-2 rounded text-xs font-bold bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900 border-dashed flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                티켓팅 추가
              </button>
            </div>
          </Section>
        </div>
        
        {/* 하단 액션 */}
        <div className="border-t border-stone-200 dark:border-zinc-800 p-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-500 text-white flex items-center justify-center gap-1 disabled:opacity-50"
          >
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
      {label && (
        <label className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 block">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
      />
    </div>
  )
}
