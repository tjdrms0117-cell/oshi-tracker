import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Ticket, ExternalLink, Check, Clock, X } from 'lucide-react'
import { fetchFestivalById, fetchMyFestivalPicks, toggleFestivalPick } from './lib/api'
import { getProfile } from './lib/auth'
import { supabase } from './lib/supabase'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const TIMETABLE_START = 11
const TIMETABLE_END = 25
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

  useEffect(() => { loadFestival() }, [id])

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user.id).then(p => setIsAdmin(p?.is_admin === true)).catch(() => {})
      fetchMyFestivalPicks(session.user.id, id).then(setPicks).catch(() => {})
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

  const dateKeys = [...new Set(allArtists.map(fa => fa.performance_date).filter(Boolean))].sort()
  const tbaArtists = allArtists.filter(fa => !fa.performance_date)
  const isMultiDay = dateKeys.length > 1

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

  const cols = dateKeys.length > 0 ? dateKeys : ['tba']

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fafaf7 0%, #f0fdfa 100%)' }}>
      <div className="fixed inset-0 -z-10 hidden dark:block" style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #0a1520 100%)' }} />

      <div className="max-w-3xl mx-auto pb-20">
        {/* 헤더 */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
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
          </div>
        </div>

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

        {/* 타임테이블 */}
        <div className="bg-white dark:bg-zinc-900">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">타임테이블</div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <div className="text-[11px] text-amber-500 font-bold">✏️ 블록 클릭 시 시간 편집</div>
              )}
              {picks.length > 0 && (
                <div className="text-[11px] text-cyan-600 font-bold">✓ {picks.length}명 픽</div>
              )}
            </div>
          </div>

          {allArtists.length === 0 ? (
            <div className="px-5 pb-8 text-center text-sm text-zinc-400 py-8">출연진 미정</div>
          ) : (
            <div className="overflow-x-auto px-2">
              {/* 날짜 헤더 */}
              {isMultiDay && (
                <div className="flex border-b border-stone-200 dark:border-zinc-800">
                  <div className="w-10 flex-shrink-0" />
                  {cols.map((key, idx) => {
                    const { day, date } = getDayLabel(key, idx)
                    return (
                      <div key={key} className="flex-1 py-2 text-center border-l border-stone-200 dark:border-zinc-800">
                        <div className="text-xs font-black" style={{ color: '#0e7490' }}>{day}</div>
                        <div className="text-[11px] text-zinc-500">{date}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 그리드 */}
              <div className="flex">
                {/* 시간 축 */}
                <div className="w-10 flex-shrink-0 relative" style={{ height: totalHeight }}>
                  {timeLabels.map((label, i) => (
                    <div key={i} className="absolute right-1 text-[9px] text-zinc-400 font-mono leading-none"
                      style={{ top: i * SLOT_HEIGHT - 5 }}>
                      {label}
                    </div>
                  ))}
                </div>

                {/* 날짜별 열 */}
                {cols.map((key) => {
                    const colArtists = key === 'tba'
                      ? tbaArtists.filter(fa => fa.start_time)
                      : allArtists.filter(fa => fa.performance_date === key && fa.start_time)

                    // 레인 분리 알고리즘
                    const lanes = []
                    const artistLanes = {}
                    colArtists.forEach(fa => {
                      const startH = fa.start_time ? timeToY(fa.start_time) : 0
                      const endH = fa.end_time ? timeToY(fa.end_time) : startH + SLOT_HEIGHT * 0.8
                      let placed = false
                      for (let li = 0; li < lanes.length; li++) {
                        const lastEnd = lanes[li]
                        if (startH >= lastEnd) {
                          lanes[li] = endH
                          artistLanes[fa.artist_id] = { lane: li, total: null }
                          placed = true
                          break
                        }
                      }
                      if (!placed) {
                        artistLanes[fa.artist_id] = { lane: lanes.length, total: null }
                        lanes.push(endH)
                      }
                    })
                    const totalLanes = lanes.length || 1
                    Object.keys(artistLanes).forEach(k => { artistLanes[k].total = totalLanes })

                    return (
                      <div key={key}
                        className="flex-1 border-l border-stone-200 dark:border-zinc-800 relative"
                        style={{ height: totalHeight }}>
                      {/* 가이드 선 */}
                      {timeLabels.map((_, i) => (
                        <div key={i} className="absolute left-0 right-0 border-t border-stone-100 dark:border-zinc-800/50"
                          style={{ top: i * SLOT_HEIGHT }} />
                      ))}

                      {/* 아티스트 블록 */}
                      {colArtists.map(fa => {
                        const artist = fa.artist
                        if (!artist) return null
                        const topY = timeToY(fa.start_time)
                        if (topY === null || topY < 0) return null
                        const endY = fa.end_time ? timeToY(fa.end_time) : topY + SLOT_HEIGHT * 0.8
                        const height = Math.max(endY - topY, 32)
                        const isPicked = picks.includes(fa.artist_id)

                        const laneInfo = artistLanes[fa.artist_id] || { lane: 0, total: 1 }
                          const laneW = 100 / laneInfo.total
                          const laneL = laneW * laneInfo.lane

                          return (
                            <div key={fa.id || fa.artist_id}
                              className="absolute rounded-lg overflow-hidden transition hover:brightness-95"
                              style={{
                                top: topY + 1,
                                height: height - 2,
                                left: `calc(${laneL}% + 2px)`,
                                width: `calc(${laneW}% - 4px)`,
                                cursor: 'pointer',
                              }}
                            onClick={() => handleArtistClick(fa)}
                          >
                            <div className="h-full flex flex-col p-1.5 relative justify-start"
                              style={{
                                background: isPicked ? `${artist.color || '#888'}40` : `${artist.color || '#888'}20`,
                                border: `1.5px solid ${artist.color || '#888'}${isPicked ? 'cc' : '60'}`,
                                borderRadius: '8px',
                              }}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-black leading-tight truncate"
                                    style={{ color: artist.color || '#888' }}>
                                    {artist.name}
                                    {artist.name_jp && (
                                      <span className="font-normal opacity-70 ml-1">{artist.name_jp}</span>
                                    )}
                                  </div>
                                  {height > 44 && (
                                    <div className="text-[11px] text-zinc-500 font-mono font-bold">
                                      {fa.start_time?.slice(0, 5)}{fa.end_time && ` ~ ${fa.end_time.slice(0, 5)}`}
                                    </div>
                                  )}
                                </div>
                                {fa.stage && (
                                  <div className="flex-shrink-0 pl-2 ml-auto"
                                    style={{ borderLeft: `1.5px solid ${artist.color || '#888'}50` }}>
                                    <span className="text-[10px] font-bold whitespace-nowrap"
                                      style={{ color: artist.color || '#888', opacity: 0.8 }}>
                                      {fa.stage}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* 픽 버튼 (유저만) */}
                              {!isAdmin && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleTogglePick(fa.artist_id) }}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: isPicked ? (artist.color || '#06b6d4') : 'rgba(0,0,0,0.15)' }}>
                                  <Check className="w-2.5 h-2.5" style={{ color: isPicked ? 'white' : '#aaa' }} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* 시간 미정 */}
              {(() => {
                const untimedAll = allArtists.filter(fa => !fa.start_time)
                if (untimedAll.length === 0) return null
                return (
                  <div className="border-t-2 border-dashed border-stone-200 dark:border-zinc-700 mt-1">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">시간 미정</span>
                    </div>
                    <div className="flex pb-3">
                      <div className="w-10 flex-shrink-0" />
                      {cols.map(key => {
                        const untimedInCol = key === 'tba'
                          ? tbaArtists.filter(fa => !fa.start_time)
                          : allArtists.filter(fa => fa.performance_date === key && !fa.start_time)
                        return (
                          <div key={key} className="flex-1 border-l border-stone-200 dark:border-zinc-800 p-1 space-y-1">
                            {untimedInCol.map(fa => {
                              const artist = fa.artist
                              if (!artist) return null
                              const isPicked = picks.includes(fa.artist_id)
                              return (
                                <div key={fa.id || fa.artist_id}
                                  className="rounded-lg p-1.5 transition hover:brightness-95 relative cursor-pointer"
                                  style={{
                                    background: isPicked ? `${artist.color || '#888'}35` : `${artist.color || '#888'}18`,
                                    border: `1.5px solid ${artist.color || '#888'}50`,
                                  }}
                                  onClick={() => handleArtistClick(fa)}>
                                  <div className="text-xs font-black truncate pr-4"
                                    style={{ color: artist.color || '#888' }}>
                                    {artist.name}
                                    {artist.name_jp && (
                                      <span className="font-normal opacity-70 ml-1 text-[10px]">{artist.name_jp}</span>
                                    )}
                                  </div>
                                  {!isAdmin && (
                                    <button
                                      onClick={e => { e.stopPropagation(); handleTogglePick(fa.artist_id) }}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                      style={{ background: isPicked ? (artist.color || '#06b6d4') : 'rgba(0,0,0,0.1)' }}>
                                      <Check className="w-2.5 h-2.5" style={{ color: isPicked ? 'white' : '#aaa' }} />
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          <div className="h-4" />
        </div>
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