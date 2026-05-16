import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Ticket, ExternalLink, Check, Clock, X, Music } from 'lucide-react'
import { fetchFestivalById, fetchMyFestivalPicks, toggleFestivalPick, fetchMyFestivalAttending, addToFestivalAttending, removeFromFestivalAttending } from './lib/api'
import { getProfile } from './lib/auth'
import { supabase } from './lib/supabase'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const TIMETABLE_START = 12
const TIMETABLE_END = 23
const SLOT_HEIGHT = 60

export default function FestivalDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [festival, setFestival] = useState(null)
  const [loading, setLoading] = useState(true)
  const [picks, setPicks] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingArtist, setEditingArtist] = useState(null) // { fa, mode: 'time' }
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '', stage: '' })
  const [saving, setSaving] = useState(false)
  const [isAttending, setIsAttending] = useState(false)
  const [attendingDates, setAttendingDates] = useState([])
  const [attendingLoading, setAttendingLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => { loadFestival() }, [id])

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user.id).then(p => setIsAdmin(p?.is_admin === true)).catch(() => {})
      fetchMyFestivalPicks(session.user.id, id).then(setPicks).catch(() => {})
      fetchMyFestivalAttending(session.user.id).then(list => {
        const myDates = list.filter(a => a.festival_id === id).map(a => a.date)
        setAttendingDates(myDates)
        setIsAttending(myDates.length > 0)
      }).catch(() => {})
    }
  }, [session, id])

  const loadFestival = async () => {
    try {
      const data = await fetchFestivalById(id)
      setFestival(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePick = async (artistId) => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    const currentlyPicked = picks.includes(artistId)
    setPicks(prev => currentlyPicked ? prev.filter(i => i !== artistId) : [...prev, artistId])
    try {
      await toggleFestivalPick(session.user.id, id, artistId, currentlyPicked)
    } catch {
      setPicks(prev => currentlyPicked ? [...prev, artistId] : prev.filter(i => i !== artistId))
    }
  }

  const handleToggleAttending = async (dateStr) => {
    if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return }
    if (attendingLoading) return
    // 다일 페스티벌인데 날짜 없이 호출된 경우 → 날짜 선택 모달로 위임
    const isMultiDayFest = festival.end_date && festival.end_date !== festival.date
    if (isMultiDayFest && !dateStr) {
      setShowDatePicker(true)
      return
    }
    const targetDate = dateStr || festival.date
    if (!targetDate) { alert('공연 날짜 정보가 없어요'); return }
    setAttendingLoading(true)
    try {
      const alreadyGoing = attendingDates.includes(targetDate)
      if (alreadyGoing) {
        await removeFromFestivalAttending(session.user.id, id, targetDate)
        setAttendingDates(prev => prev.filter(d => d !== targetDate))
      } else {
        await addToFestivalAttending(session.user.id, id, targetDate)
        setAttendingDates(prev => [...prev, targetDate])
      }
      setIsAttending(attendingDates.filter(d => d !== targetDate).length > 0 || !alreadyGoing)
    } catch (err) {
      alert('오류: ' + err.message)
    } finally {
      setAttendingLoading(false)
    }
  }
  const handleArtistClick = (fa) => {
    if (isAdmin) {
      setEditingArtist(fa)
      setEditForm({
        start_time: fa.start_time?.slice(0, 5) || '',
        end_time: fa.end_time?.slice(0, 5) || '',
        stage: fa.stage || '',
      })
    } else {
      navigate(`/artists/${fa.artist_id}`)
    }
  }

  const handleSaveTime = async () => {
    if (!editingArtist) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('festival_artists')
        .update({
          start_time: editForm.start_time || null,
          end_time: editForm.end_time || null,
          stage: editForm.stage || null,
        })
        .eq('id', editingArtist.id)
      if (error) throw error
      await loadFestival()
      setEditingArtist(null)
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
      <div className="text-cyan-500 text-sm tracking-widest animate-pulse">LOADING...</div>
    </div>
  )

  if (!festival) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-500">페스티벌을 찾을 수 없어요</p>
    </div>
  )

  const allArtists = festival.festival_artists || []
  const now = new Date()
  const tickets = festival.ticket_rounds || []

  const dateKeys = (() => {
    const fromArtists = [...new Set(allArtists.map(fa => fa.performance_date).filter(Boolean))].sort()
    if (fromArtists.length > 0) return fromArtists
    if (festival.date && festival.end_date && festival.end_date !== festival.date) {
      const dates = []
      const cur = new Date(festival.date)
      const end = new Date(festival.end_date)
      while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
      }
      return dates
    }
    return fromArtists
  })()
  const tbaArtists = allArtists.filter(fa => !fa.performance_date)
  const isMultiDay = dateKeys.length > 1 || 
    (festival.date && festival.end_date && festival.end_date !== festival.date)

  const getDayLabel = (key, idx) => {
    const d = new Date(key)
    return { day: `DAY${idx + 1}`, date: `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})` }
  }

  const timeToY = (timeStr) => {
    if (!timeStr) return null
    const [h, m] = timeStr.split(':').map(Number)
    return (h + m / 60 - TIMETABLE_START) * SLOT_HEIGHT
  }

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`
  }

  const dateStr = festival.end_date && festival.end_date !== festival.date
    ? `${formatDate(festival.date)} ~ ${formatDate(festival.end_date)}`
    : formatDate(festival.date)

  const totalHeight = (TIMETABLE_END - TIMETABLE_START) * SLOT_HEIGHT
  const timeLabels = Array.from({ length: TIMETABLE_END - TIMETABLE_START + 1 }, (_, i) => {
    const h = TIMETABLE_START + i
    return h >= 24 ? `${h - 24}:00` : `${h}:00`
  })

  const cols = (() => {
    if (festival.date && festival.end_date && festival.end_date !== festival.date) {
      const dates = []
      const cur = new Date(festival.date)
      const end = new Date(festival.end_date)
      while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
      }
      return dates
    }
    return dateKeys.length > 0 ? dateKeys : ['tba']
  })()

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fafaf7 0%, #f0fdfa 100%)' }}>
      <div className="fixed inset-0 -z-10 hidden dark:block" style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #0a1520 100%)' }} />

      <div className="max-w-3xl mx-auto pb-20">
        {/* 헤더 */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(`/?tab=concerts&country=${festival?.country === 'korea' ? 'korea' : 'japan'}&filter=festival`)} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">🎪 페스티벌{isAdmin && ' · 관리자'}</div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{festival.name}</div>
            </div>
          </div>
        </div>

        <div className="h-1" style={{ background: 'linear-gradient(90deg, #06b6d4, #0e7490)' }} />

        {/* 기본 정보 */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{festival.name}</h1>
          {festival.name_jp && <div className="text-sm text-zinc-500 mb-3">{festival.name_jp}</div>}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span>📅</span><span>{dateStr}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-500">
                {festival.country === 'korea' ? '🇰🇷 내한' : '🇯🇵 일본'}
              </span>
            </div>
            {(festival.venue || festival.city) && (
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>{[festival.venue, festival.city].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {festival.ticket_price && (
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Ticket className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>{festival.ticket_price}</span>
              </div>
            )}
            {festival.source_url && (
              <a href={festival.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-cyan-600 hover:underline mt-1">
                <ExternalLink className="w-3.5 h-3.5" />공식 페이지
              </a>
            )}
          <button
              onClick={() => {
                const isMultiDayFest = festival.end_date && festival.end_date !== festival.date
                if (isMultiDayFest) {
                  setShowDatePicker(true)
                } else {
                  handleToggleAttending(festival.date)
                }
              }}
              disabled={attendingLoading}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition ${
                isAttending
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Check className="w-4 h-4" />
              {isAttending ? `${attendingDates.length}일 갈게요 ✓` : '갈게요'}
            </button>
          </div>
        </div>

        {/* 날짜 선택 모달 (다일 페스티벌) */}
        {showDatePicker && (() => {
          const dates = []
          if (festival.date && festival.end_date && festival.end_date !== festival.date) {
            const cur = new Date(festival.date)
            const end = new Date(festival.end_date)
            while (cur <= end) {
              dates.push(cur.toISOString().slice(0, 10))
              cur.setDate(cur.getDate() + 1)
            }
          } else if (festival.date) {
            dates.push(festival.date)
          }
          const DAY_NAMES = ['일','월','화','수','목','금','토']
          return (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center backdrop-blur-sm"
              onClick={() => setShowDatePicker(false)}>
              <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-sm shadow-2xl p-4"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{festival.name}</div>
                  <button onClick={() => setShowDatePicker(false)} className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">✕</button>
                </div>
                <div className="text-xs text-zinc-500 mb-3">가는 날짜를 선택하세요</div>
                <div className="space-y-2">
                  {dates.map((d, idx) => {
                    const dateObj = new Date(d)
                    const label = `DAY${idx + 1} · ${dateObj.getMonth() + 1}/${dateObj.getDate()}(${DAY_NAMES[dateObj.getDay()]})`
                    const going = attendingDates.includes(d)
                    return (
                      <button key={d}
                        onClick={() => handleToggleAttending(d)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                          going ? 'bg-emerald-500 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700'
                        }`}>
                        <span>{label}</span>
                        <span>{going ? '✓ 갈게요' : '갈게요'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

        {/* 티켓팅 */}
        {tickets.length > 0 && (
          <div className="px-5 py-4 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">티켓팅</div>
            <div className="space-y-2">
              {tickets.map((r, i) => {
                const isActive = r.open_at && new Date(r.open_at) <= now && (!r.close_at || new Date(r.close_at) > now)
                const isUpcoming = r.open_at && new Date(r.open_at) > now
                return (
                  <div key={i}
                    onClick={() => r.ticket_url && window.open(r.ticket_url, '_blank')}
                    className={`rounded-xl p-3 border flex items-center justify-between transition ${
                      r.ticket_url ? 'cursor-pointer hover:shadow-md' : ''
                    } ${
                      isActive ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/30' :
                      isUpcoming ? 'border-stone-200 dark:border-zinc-700' :
                      'border-stone-100 dark:border-zinc-800 opacity-50'
                    }`}>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.round_name}</div>
                      {r.open_at && (
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {new Date(r.open_at).toLocaleDateString('ko')} {new Date(r.open_at).toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-cyan-200 text-cyan-800' :
                      isUpcoming ? 'bg-stone-200 text-stone-600 dark:bg-zinc-700 dark:text-zinc-300' :
                      'bg-stone-100 text-stone-400'
                    }`}>
                      {isActive ? '접수중' : isUpcoming ? '예정' : '종료'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* 타임테이블 이미지 (있을 때만 표시) */}
        {festival.timetable_image_url && (
          <div className="bg-white dark:bg-zinc-900">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">타임테이블</div>
            </div>
            <div className="px-5 pb-4">
              <img src={festival.timetable_image_url} alt="타임테이블"
                className="w-full rounded-xl border border-stone-200 dark:border-zinc-800" />
            </div>
          </div>
        )}

        {/* 출연 아티스트 */}
        {allArtists.length > 0 && (
          <div className="bg-white dark:bg-zinc-900">
            <div className="px-5 pt-4 pb-2">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">출연 아티스트 ({allArtists.length})</div>
            </div>
            <div className="px-5 pb-4">
              {isMultiDay ? (
                <div className="space-y-4">
                  {dateKeys.map((key, idx) => {
                    if (key === 'tba') return null
                    const { day, date } = getDayLabel(key, idx)
                    const dayArtists = allArtists.filter(fa => fa.performance_date === key)
                    if (dayArtists.length === 0) return null
                    return (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: '#06b6d420', color: '#0e7490' }}>
                            {day} · {date}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {dayArtists.map(fa => {
                            const artist = fa.artist
                            if (!artist) return null
                            const isPicked = picks.includes(fa.artist_id)
                            return (
                              <button key={fa.id}
                                onClick={() => handleArtistClick(fa)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-left bg-white dark:bg-zinc-900"
                                style={{ borderLeftColor: artist.color || '#888', borderLeftWidth: 3 }}>
                                {artist.youtube_thumbnail_url ? (
                                  <img src={artist.youtube_thumbnail_url} alt={artist.name}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${artist.color || '#888'}20` }}>
                                    <Music className="w-4 h-4" style={{ color: artist.color || '#888' }} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm" style={{ color: artist.color || '#888' }}>
                                    {artist.name}
                                  </div>
                                  {artist.name_jp && <div className="text-xs text-zinc-500 truncate">{artist.name_jp}</div>}
                                </div>
                                {!isAdmin && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleTogglePick(fa.artist_id) }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: isPicked ? (artist.color || '#06b6d4') : 'rgba(0,0,0,0.08)' }}>
                                    <Check className="w-3 h-3" style={{ color: isPicked ? 'white' : '#aaa' }} strokeWidth={3} />
                                  </button>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {allArtists.map(fa => {
                    const artist = fa.artist
                    if (!artist) return null
                    const isPicked = picks.includes(fa.artist_id)
                    return (
                      <button key={fa.id}
                        onClick={() => handleArtistClick(fa)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-left bg-white dark:bg-zinc-900"
                        style={{ borderLeftColor: artist.color || '#888', borderLeftWidth: 3 }}>
                        {artist.youtube_thumbnail_url ? (
                          <img src={artist.youtube_thumbnail_url} alt={artist.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: `${artist.color || '#888'}20` }}>
                            <Music className="w-4 h-4" style={{ color: artist.color || '#888' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm" style={{ color: artist.color || '#888' }}>
                            {artist.name}
                          </div>
                          {artist.name_jp && <div className="text-xs text-zinc-500 truncate">{artist.name_jp}</div>}
                        </div>
                        {!isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); handleTogglePick(fa.artist_id) }}
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: isPicked ? (artist.color || '#06b6d4') : 'rgba(0,0,0,0.08)' }}>
                            <Check className="w-3 h-3" style={{ color: isPicked ? 'white' : '#aaa' }} strokeWidth={3} />
                          </button>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 시간 편집 모달 (관리자) */}
      {editingArtist && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5 backdrop-blur-sm"
          onClick={() => setEditingArtist(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
              <div>
                <div className="text-xs text-zinc-500">시간 편집</div>
                <div className="font-bold text-sm" style={{ color: editingArtist.artist?.color }}>
                  {editingArtist.artist?.name}
                </div>
              </div>
              <button onClick={() => setEditingArtist(null)} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">시작 시간</label>
                  <div className="relative">
                    <input type="time" value={editForm.start_time}
                      onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400" />
                    {editForm.start_time && (
                      <button onClick={() => setEditForm(f => ({ ...f, start_time: '', end_time: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">종료 시간</label>
                  <div className="relative">
                    <input type="time" value={editForm.end_time}
                      onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400" />
                    {editForm.end_time && (
                      <button onClick={() => setEditForm(f => ({ ...f, end_time: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">스테이지</label>
                <input type="text" value={editForm.stage}
                  onChange={e => setEditForm(f => ({ ...f, stage: e.target.value }))}
                  placeholder="예: MAIN STAGE, SONIC STAGE"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-cyan-400" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingArtist(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-zinc-600">
                  취소
                </button>
                <button onClick={handleSaveTime} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)' }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}