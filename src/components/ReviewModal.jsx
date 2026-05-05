import { useEffect, useState } from 'react'
import { X, Check, AlertTriangle, ExternalLink, User, Music, Calendar, MapPin, Ticket, MessageSquare, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { searchSimilarArtists, approveSubmissionFull, rejectSubmissionWithReason, fetchVenues } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function ReviewModal({ submission, session, onClose, onDone }) {
  const [editedData, setEditedData] = useState({})
  const [editedRounds, setEditedRounds] = useState([])
  const [similarArtists, setSimilarArtists] = useState([])
  const [venues, setVenues] = useState([])
  const [showVenueDetails, setShowVenueDetails] = useState(false)
  const [showSongDetails, setShowSongDetails] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  
  useEffect(() => {
    if (submission) {
      setEditedData({
        title: submission.title,
        country: submission.country,
        venue_id: submission.venue_id,
        venue: submission.venue,
        city: submission.city,
        date: submission.date,
        time: submission.time,
        duration_minutes: submission.duration_minutes,
        seat_type: submission.seat_type,
        ticket_price: submission.ticket_price,
        memo: submission.memo,
        source_url: submission.source_url,
        artist_id: submission.artist_id,
        create_new_artist: !submission.artist_id,
        new_artist_name: submission.new_artist_name,
        new_artist_name_jp: submission.new_artist_name_jp,
        new_artist_color: submission.new_artist_color,
      })
      setEditedRounds(submission.submission_ticket_rounds || [])
      
      // 새 가수면 유사 가수 검색
      if (!submission.artist_id && submission.new_artist_name) {
        searchSimilarArtists(submission.new_artist_name).then(setSimilarArtists)
      }
      
      // 공연장 목록 로드
      fetchVenues({ country: submission.country })
        .then(setVenues)
        .catch(() => setVenues([]))
    }
  }, [submission])
  
  if (!submission) return null
  
  const isNewArtist = !submission.artist_id
  
  const handleApprove = async () => {
    const dates = submission.dates || []
    const hasMultipleDates = dates.length > 1
    
    const confirmMsg = hasMultipleDates
      ? `이 제보를 승인할까요? ${dates.length}일치 공연(${dates.length}개)이 등록됩니다.`
      : '이 제보를 승인할까요? 공개되어 모두에게 보입니다.'
    
    if (!confirm(confirmMsg)) return
    
    setProcessing(true)
    try {
      if (hasMultipleDates) {
        // 양일 공연: series_id로 묶어서 N개 등록
        const seriesId = crypto.randomUUID()
        let artistId = editedData.artist_id
        
        // 새 가수면 먼저 생성 (대표곡 포함)
        if (editedData.create_new_artist) {
          const { data: newArtist, error: artistError } = await supabase
            .from('artists')
            .insert({
              name: editedData.new_artist_name,
              name_jp: editedData.new_artist_name_jp,
              color: editedData.new_artist_color || '#e91e63',
              top_song_title: editedData.top_song_title || null,
              top_song_title_jp: editedData.top_song_title_jp || null,
              top_song_youtube_url: editedData.top_song_youtube_url || null,
            })
            .select()
            .single()
          
          if (artistError) throw artistError
          artistId = newArtist.id
        }
        
        // 공연장 처리 (양일 공연도)
        let venueId = editedData.venue_id
        if (!venueId && editedData.venue && (editedData.venue_address || editedData.venue_subway_info || editedData.venue_capacity)) {
          const { data: newVenue } = await supabase
            .from('venues')
            .insert({
              name: editedData.venue,
              name_local: editedData.venue_name_local || null,
              country: editedData.country,
              city: editedData.city || null,
              address: editedData.venue_address || null,
              subway_info: editedData.venue_subway_info || null,
              parking_info: editedData.venue_parking_info || null,
              tips: editedData.venue_tips || null,
              capacity: editedData.venue_capacity ? parseInt(editedData.venue_capacity) : null,
            })
            .select()
            .single()
          
          if (newVenue) venueId = newVenue.id
        }
        
        // 각 날짜별로 concert 생성
        for (let i = 0; i < dates.length; i++) {
          const d = dates[i]
          const dayLabel = d.label || `DAY${i + 1}`
          
          const concertPayload = {
            artist_id: artistId,
            venue_id: venueId || null,
            title: editedData.title,
            country: editedData.country,
            venue: editedData.venue,
            city: editedData.city,
            date: d.date,
            time: d.time || null,
            duration_minutes: editedData.duration_minutes,
            seat_type: editedData.seat_type,
            ticket_price: editedData.ticket_price,
            memo: editedData.memo,
            source_url: editedData.source_url,
            series_id: seriesId,
            day_label: dayLabel,
          }
          
          const { data: newConcert, error: cErr } = await supabase
            .from('concerts')
            .insert(concertPayload)
            .select()
            .single()
          
          if (cErr) throw cErr
          
          // 첫 번째 날짜에만 티켓팅 라운드 등록 (양일 공통이라고 가정)
          if (i === 0 && editedRounds.length > 0) {
            const roundsPayload = editedRounds.map((r, idx) => ({
              concert_id: newConcert.id,
              round_name: r.round_name,
              open_at: r.open_at,
              close_at: r.close_at || null,
              method: r.method,
              ticket_site: r.ticket_site,
              price_info: r.price_info,
              note: r.note,
              display_order: idx + 1,
            }))
            
            await supabase.from('ticket_rounds').insert(roundsPayload)
          }
        }
        
        // submission 상태 업데이트
        await supabase
          .from('submissions')
          .update({
            status: 'approved',
            reviewed_by: session.user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submission.id)
        
        alert(`승인 완료! ${dates.length}일치 공연이 등록되었어요.`)
      } else {
        // 일반 단일 공연
        await approveSubmissionFull(submission.id, editedData, editedRounds, session.user.id)
        alert('승인 완료!')
      }
      
      onDone()
    } catch (err) {
      console.error(err)
      alert('승인 중 오류: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }
  
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요')
      return
    }
    
    setProcessing(true)
    try {
      await rejectSubmissionWithReason(submission.id, rejectReason.trim(), session.user.id)
      alert('반려 완료')
      onDone()
    } catch (err) {
      alert('반려 중 오류: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }
  
  const useSimilarArtist = (artist) => {
    setEditedData({
      ...editedData,
      artist_id: artist.id,
      create_new_artist: false,
    })
    alert(`"${artist.name}"(으)로 연결됨. 새 가수 추가 안 함.`)
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
            제보 검수
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 콘텐츠 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* 제보자 + 출처 */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {submission.submitter?.nickname || '익명'}
              <span className="mx-1">·</span>
              {new Date(submission.created_at).toLocaleString('ko', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            {submission.source_url && (
              <a
                href={submission.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-pink-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                출처
              </a>
            )}
          </div>
          
          {submission.submitter_note && (
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{submission.submitter_note}</span>
            </div>
          )}
          
          {/* 가수 섹션 */}
          <Section icon={Music} title="가수">
            {isNewArtist ? (
              <div>
                <div className="rounded-lg p-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-700 dark:text-pink-300 mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    새 가수 제안
                  </div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {submission.new_artist_name}
                  </div>
                  {submission.new_artist_name_jp && (
                    <div className="text-xs text-zinc-500">{submission.new_artist_name_jp}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500">컬러:</span>
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ background: submission.new_artist_color }}
                    />
                    <span className="text-[10px] font-mono">{submission.new_artist_color}</span>
                  </div>
                </div>
                
                {/* 대표곡 정보 입력 (새 가수일 때) */}
                <div className="rounded-lg border border-stone-200 dark:border-zinc-800 mb-3 overflow-hidden">
                  <button
                    onClick={() => setShowSongDetails(!showSongDetails)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50"
                  >
                    <span className="flex items-center gap-1.5">
                      <Music className="w-3 h-3" />
                      대표곡 정보 추가 (선택)
                      {(editedData.top_song_title || editedData.top_song_youtube_url) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                          입력됨
                        </span>
                      )}
                    </span>
                    {showSongDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  
                  {showSongDetails && (
                    <div className="p-3 pt-0 space-y-2 border-t border-stone-200 dark:border-zinc-800">
                      <Input 
                        label="대표곡 한국어" 
                        value={editedData.top_song_title} 
                        onChange={v => setEditedData({...editedData, top_song_title: v})}
                      />
                      <Input 
                        label="대표곡 원어" 
                        value={editedData.top_song_title_jp} 
                        onChange={v => setEditedData({...editedData, top_song_title_jp: v})}
                      />
                      <Input 
                        label="YouTube URL" 
                        value={editedData.top_song_youtube_url} 
                        onChange={v => setEditedData({...editedData, top_song_youtube_url: v})}
                      />
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400 italic">
                        💡 예: https://youtu.be/abc123
                      </p>
                    </div>
                  )}
                </div>
                {/* 중복 후보 */}
                {similarArtists.length > 0 && (
                  <div className="rounded-lg p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      비슷한 가수가 이미 있어요
                    </div>
                    <div className="space-y-1">
                      {similarArtists.map(a => (
                        <button
                          key={a.id}
                          onClick={() => useSimilarArtist(a)}
                          className="w-full flex items-center gap-2 p-2 rounded bg-white dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-left"
                        >
                          <div 
                            className="w-5 h-5 rounded flex-shrink-0"
                            style={{ background: a.color }}
                          />
                          <div className="flex-1 text-xs">
                            <div className="font-bold">{a.name}</div>
                            <div className="text-zinc-500">{a.name_jp}</div>
                          </div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">→ 이걸로</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  {submission.artist?.name}
                </div>
                {submission.artist?.name_jp && (
                  <div className="text-xs text-zinc-500">{submission.artist.name_jp}</div>
                )}
              </div>
            )}
          </Section>
          
          {/* 공연 정보 (수정 가능) */}
          <Section icon={Calendar} title="공연 정보 (수정 가능)">
            <div className="space-y-2">
              <Input label="제목" value={editedData.title} onChange={v => setEditedData({...editedData, title: v})} />
              {/* 양일 공연이면 모든 날짜 표시 */}
              {submission.dates && submission.dates.length > 1 ? (
                <div className="rounded-lg p-2 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900">
                  <div className="text-[10px] font-bold text-pink-600 dark:text-pink-400 mb-1">
                    📅 {submission.dates.length}일 공연
                  </div>
                  {submission.dates.map((d, i) => (
                    <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 py-0.5">
                      <span className="font-bold mr-1">[{d.label || `DAY${i + 1}`}]</span>
                      {d.date} {d.time && `· ${d.time}`}
                    </div>
                  ))}
                  <p className="text-[9px] text-pink-500 dark:text-pink-400 mt-1 italic">
                    승인 시 {submission.dates.length}개 공연으로 등록됨
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input label="날짜" type="date" value={editedData.date} onChange={v => setEditedData({...editedData, date: v})} />
                  <Input label="시간" type="time" value={editedData.time} onChange={v => setEditedData({...editedData, time: v})} />
                </div>
              )}
              {/* 공연장 선택 또는 직접 입력 */}
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 block">
                  공연장
                </label>
                <select
                  value={editedData.venue_id || ''}
                  onChange={(e) => {
                    const v = venues.find(x => x.id === e.target.value)
                    if (e.target.value === '__new__') {
                      // 직접 입력 모드
                      setEditedData({
                        ...editedData,
                        venue_id: null,
                        // venue, city는 그대로 유지
                      })
                    } else if (v) {
                      // 기존 공연장 선택
                      setEditedData({
                        ...editedData,
                        venue_id: v.id,
                        venue: v.name,
                        city: v.city || editedData.city,
                      })
                    } else {
                      // 빈 값
                      setEditedData({
                        ...editedData,
                        venue_id: null,
                      })
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
                
                {/* venue_id가 없으면 직접 입력 필드 표시 */}
                {!editedData.venue_id && (
                  <div className="mt-2 pl-2 border-l-2 border-pink-300 dark:border-pink-700 space-y-1.5">
                    <Input 
                      label="공연장 이름 (직접 입력)" 
                      value={editedData.venue} 
                      onChange={v => setEditedData({...editedData, venue: v})} 
                    />
                    <p className="text-[9px] text-pink-600 dark:text-pink-400 italic">
                      💡 아래 [공연장 상세 정보]도 함께 입력하면 venues 테이블에 자동 등록
                    </p>
                  </div>
                )}
                
                {/* 기존 공연장 선택 시 정보 미리보기 */}
                {editedData.venue_id && (
                  <div className="mt-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-[10px] text-emerald-700 dark:text-emerald-400">
                    <span className="font-bold">✓ 기존 공연장 사용:</span>
                    {' '}{venues.find(v => v.id === editedData.venue_id)?.name}
                    {venues.find(v => v.id === editedData.venue_id)?.city && (
                      <span className="opacity-70"> · {venues.find(v => v.id === editedData.venue_id)?.city}</span>
                    )}
                  </div>
                )}
              </div>
              
              <Input label="도시" value={editedData.city} onChange={v => setEditedData({...editedData, city: v})} />
              
              {/* 공연장 상세 정보 */}
              <div className="rounded-lg border border-stone-200 dark:border-zinc-800 overflow-hidden mt-2">
                <button
                  onClick={() => setShowVenueDetails(!showVenueDetails)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    공연장 상세 정보 (선택)
                    {(editedData.venue_address || editedData.venue_subway_info || editedData.venue_capacity) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        입력됨
                      </span>
                    )}
                  </span>
                  {showVenueDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                {showVenueDetails && (
                  <div className="p-3 pt-0 space-y-2 border-t border-stone-200 dark:border-zinc-800">
                    <Input 
                      label="원어 이름" 
                      value={editedData.venue_name_local} 
                      onChange={v => setEditedData({...editedData, venue_name_local: v})}
                    />
                    <Input 
                      label="주소" 
                      value={editedData.venue_address} 
                      onChange={v => setEditedData({...editedData, venue_address: v})}
                    />
                    <Input 
                      label="교통 (지하철)" 
                      value={editedData.venue_subway_info} 
                      onChange={v => setEditedData({...editedData, venue_subway_info: v})}
                    />
                    <Input 
                      label="주차" 
                      value={editedData.venue_parking_info} 
                      onChange={v => setEditedData({...editedData, venue_parking_info: v})}
                    />
                    <Input 
                      label="꿀팁" 
                      value={editedData.venue_tips} 
                      onChange={v => setEditedData({...editedData, venue_tips: v})}
                    />
                    <Input 
                      label="수용 인원" 
                      type="number"
                      value={editedData.venue_capacity} 
                      onChange={v => setEditedData({...editedData, venue_capacity: v})}
                    />
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 italic">
                      💡 입력하면 venues 테이블에 자동 등록/업데이트
                    </p>
                  </div>
                )}
              </div>
              <Input label="가격" value={editedData.ticket_price} onChange={v => setEditedData({...editedData, ticket_price: v})} />
              <Input label="좌석" value={editedData.seat_type} onChange={v => setEditedData({...editedData, seat_type: v})} />
              <Input label="메모" value={editedData.memo} onChange={v => setEditedData({...editedData, memo: v})} />
            </div>
          </Section>
          
          {/* 티켓팅 라운드 */}
          {editedRounds.length > 0 && (
            <Section icon={Ticket} title={`티켓팅 (${editedRounds.length}회)`}>
              <div className="space-y-2">
                {editedRounds.map((round, idx) => (
                  <div key={idx} className="rounded-lg p-2 bg-stone-50 dark:bg-zinc-800/50 text-xs">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                      {idx + 1}. {round.round_name}
                    </div>
                    <div className="text-zinc-500 dark:text-zinc-400">
                      {new Date(round.open_at).toLocaleString('ko')}
                      {round.method && ` · ${round.method}`}
                      {round.ticket_site && ` · ${round.ticket_site}`}
                    </div>
                    {round.note && (
                      <div className="italic text-zinc-500 mt-0.5">{round.note}</div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
        
        {/* 하단 액션 */}
        <div className="border-t border-stone-200 dark:border-zinc-800 p-4">
          {showRejectForm ? (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유 (사용자에게 전달됨)"
                className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-red-200 dark:border-red-900 outline-none focus:border-red-400"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                  className="flex-1 py-2 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  취소
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 py-2 rounded-lg text-sm font-bold bg-red-500 text-white disabled:opacity-50"
                >
                  반려 확정
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={processing}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                반려
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-emerald-500 text-white flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {processing ? '처리중...' : '승인'}
              </button>
            </div>
          )}
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

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
      />
    </div>
  )
}
