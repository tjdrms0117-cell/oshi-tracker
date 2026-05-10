import { useEffect, useState } from 'react'
import { Clock, User, ExternalLink, Music, Calendar, MessageCircle, Check, X } from 'lucide-react'
import { 
  fetchPendingSubmissions, 
  fetchPendingArtistSubmissions, 
  approveArtistSubmission, 
  rejectArtistSubmission,
  fetchPendingFestivalSubmissions,
  approveFestivalSubmission,
  rejectFestivalSubmission,
  fetchInquiries,
  updateInquiryStatus,
} from '../lib/api'
import ReviewModal from './ReviewModal'
import KopisMatcher from './KopisMatcher'

export default function ReviewList({ session }) {
  const [tab, setTab] = useState('concert') // concert | artist | festival | inquiry | kopis
  const [submissions, setSubmissions] = useState([])
  const [artistSubmissions, setArtistSubmissions] = useState([])
  const [festivalSubmissions, setFestivalSubmissions] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) loadData()
  }, [session])

  const loadData = async () => {
    setLoading(true)
    try {
      const [concertData, artistData, festivalData, inquiryData] = await Promise.all([
        fetchPendingSubmissions(),
        fetchPendingArtistSubmissions(),
        fetchPendingFestivalSubmissions(),
        fetchInquiries().catch(() => []),
      ])
      setSubmissions(concertData)
      setArtistSubmissions(artistData)
      setFestivalSubmissions(festivalData)
      setInquiries(inquiryData)
    } catch (err) {
      console.error('검수 목록 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    setSelectedSubmission(null)
    loadData()
  }

  const handleApproveArtist = async (sub) => {
    if (!confirm(`"${sub.name}" 아티스트를 승인할까요?`)) return
    try {
      await approveArtistSubmission(sub.id, session.user.id)
      alert('승인 완료!')
      loadData()
    } catch (err) {
      alert('오류: ' + err.message)
    }
  }

  const handleRejectArtist = async (sub) => {
    const reason = prompt('반려 사유를 입력해주세요')
    if (!reason) return
    try {
      await rejectArtistSubmission(sub.id, reason, session.user.id)
      alert('반려 완료')
      loadData()
    } catch (err) {
      alert('오류: ' + err.message)
    }
  }

  const handleApproveFestival = async (sub) => {
    const label = sub.festival_id ? '아티스트 추가' : `"${sub.name}" 페스티벌 등록`
    if (!confirm(`${label}을 승인할까요?`)) return
    try {
      await approveFestivalSubmission(sub.id, session.user.id)
      alert('승인 완료!')
      loadData()
    } catch (err) {
      alert('오류: ' + err.message)
    }
  }

  const handleRejectFestival = async (sub) => {
    const reason = prompt('반려 사유를 입력해주세요')
    if (!reason) return
    try {
      await rejectFestivalSubmission(sub.id, reason, session.user.id)
      alert('반려 완료')
      loadData()
    } catch (err) {
      alert('오류: ' + err.message)
    }
  }

  const totalCount = submissions.length + artistSubmissions.length + festivalSubmissions.length

  if (loading) {
    return <div className="text-center py-12 text-sm text-zinc-500">불러오는 중...</div>
  }

  return (
    <>
      {/* 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('concert')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'concert' ? 'bg-zinc-900 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          공연 {submissions.length > 0 && `(${submissions.length})`}
        </button>
        <button
          onClick={() => setTab('artist')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'artist' ? 'bg-zinc-900 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          아티스트 {artistSubmissions.length > 0 && `(${artistSubmissions.length})`}
        </button>
        <button
          onClick={() => setTab('festival')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'festival' ? 'bg-zinc-900 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          페스티벌 {festivalSubmissions.length > 0 && `(${festivalSubmissions.length})`}
        </button>
        <button
          onClick={() => setTab('kopis')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'kopis' ? 'bg-cyan-500 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          KOPIS 자동입력
        </button>
        <button
          onClick={() => setTab('inquiry')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'inquiry' ? 'bg-pink-500 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          문의 {inquiries.filter(i => i.status === 'pending').length > 0 && `(${inquiries.filter(i => i.status === 'pending').length})`}
        </button>
      </div>

      {/* 공연 제보 */}
      {tab === 'concert' && (
        <>
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3 opacity-20">✨</div>
              <p className="text-sm font-bold text-zinc-700">검수 대기 중인 공연 제보가 없어요</p>
            </div>
          ) : (
            <>
              <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                검수 대기 {submissions.length}건 · 클릭해서 검토하세요
              </div>
              <div className="space-y-2">
                {submissions.map((sub) => {
                  const isNewArtist = !sub.artist_id
                  const roundCount = sub.submission_ticket_rounds?.length || 0
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="w-full text-left rounded-xl p-3 bg-white border border-stone-200 hover:shadow-md hover:border-pink-300 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${
                            sub.country === 'korea'
                              ? 'bg-cyan-50 text-cyan-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}>
                            {sub.country === 'korea' ? '내한' : '원정'}
                          </span>
                          {isNewArtist && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                              새 가수
                            </span>
                          )}
                          {roundCount > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-zinc-600">
                              티켓팅 {roundCount}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(sub.created_at).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-500 mb-1">
                        {sub.artist?.name || sub.new_artist_name}
                      </div>
                      <div className="text-sm font-bold text-zinc-900 mb-1">{sub.title}</div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                        <span>📅 {sub.date} {sub.time && `· ${sub.time.slice(0, 5)}`}</span>
                        {sub.venue && <span>📍 {sub.venue}</span>}
                      </div>
                      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-zinc-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {sub.submitter?.nickname || '익명'}
                        </div>
                        {sub.source_url && (
                          <span className="flex items-center gap-1 text-pink-500">
                            <ExternalLink className="w-3 h-3" />
                            출처 있음
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* 아티스트 제보 */}
      {tab === 'artist' && (
        <>
          {artistSubmissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3 opacity-20">🎤</div>
              <p className="text-sm font-bold text-zinc-700">검수 대기 중인 아티스트 제보가 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {artistSubmissions.map((sub) => (
                <div key={sub.id} className="rounded-xl p-4 bg-white border border-stone-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: sub.color || '#e91e63' }}
                      >
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">{sub.name}</div>
                        {sub.name_jp && <div className="text-xs text-zinc-500">{sub.name_jp}</div>}
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(sub.created_at).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                  {sub.top_song_title && (
                    <div className="text-xs text-zinc-600 mb-1">
                      🎵 {sub.top_song_title}{sub.top_song_title_jp && ` (${sub.top_song_title_jp})`}
                    </div>
                  )}
                  {sub.top_song_youtube_url && (
                    <div className="text-xs text-pink-500 mb-1">🔗 {sub.top_song_youtube_url}</div>
                  )}
                  {sub.note && <div className="text-xs text-zinc-500 italic mb-2">📝 {sub.note}</div>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <User className="w-3 h-3" />
                      {sub.submitter?.nickname || '익명'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectArtist(sub)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-zinc-600 hover:bg-stone-200 transition"
                      >
                        반려
                      </button>
                      <button
                        onClick={() => handleApproveArtist(sub)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-500 text-white hover:bg-pink-600 transition"
                      >
                        승인
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 페스티벌 제보 */}
      {tab === 'festival' && (
        <>
          {festivalSubmissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3 opacity-20">🎪</div>
              <p className="text-sm font-bold text-zinc-700">검수 대기 중인 페스티벌 제보가 없어요</p>
            </div>
          ) : (
            <>
              <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                검수 대기 {festivalSubmissions.length}건
              </div>
              <div className="space-y-3">
                {festivalSubmissions.map((sub) => {
                  const isAddMode = !!sub.festival_id
                  const artists = sub.artists || []
                  const dates = sub.dates || []

                  return (
                    <div key={sub.id} className="rounded-xl p-4 bg-white border border-stone-200">
                      {/* 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isAddMode
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            {isAddMode ? '아티스트 추가' : '새 페스티벌'}
                          </span>
                          {sub.country && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              sub.country === 'korea'
                                ? 'bg-cyan-50 text-cyan-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}>
                              {sub.country === 'korea' ? '내한' : '원정'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(sub.created_at).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>

                      {/* 페스티벌 정보 */}
                      {isAddMode ? (
                        <div className="text-sm font-bold text-zinc-900 mb-2">
                          기존 페스티벌 (id: {sub.festival_id.slice(0, 8)}...)에 아티스트 추가
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-zinc-900 mb-0.5">{sub.name}</div>
                          {sub.name_jp && <div className="text-xs text-zinc-500 mb-1">{sub.name_jp}</div>}
                          {dates.length > 0 && (
                            <div className="text-xs text-zinc-500 mb-1">
                              📅 {dates.map(d => d.date).join(' ~ ')}
                            </div>
                          )}
                          {sub.venue && (
                            <div className="text-xs text-zinc-500 mb-1">📍 {sub.venue} {sub.city && `· ${sub.city}`}</div>
                          )}
                          {sub.ticket_price && (
                            <div className="text-xs text-zinc-500 mb-1">💰 {sub.ticket_price}</div>
                          )}
                        </>
                      )}

                      {/* 출연진 */}
                      {artists.length > 0 && (
                        <div className="mt-2 mb-2">
                          <div className="text-[10px] text-zinc-500 mb-1">출연진 ({artists.length}팀)</div>
                          <div className="flex flex-wrap gap-1">
                            {artists.map((a, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 font-bold">
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 하단 */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {sub.submitter?.nickname || '익명'}
                          </div>
                          {sub.source_url && (
                            <a
                              href={sub.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-pink-500"
                            >
                              <ExternalLink className="w-3 h-3" />
                              출처
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectFestival(sub)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-zinc-600 hover:bg-stone-200 transition"
                          >
                            반려
                          </button>
                          <button
                            onClick={() => handleApproveFestival(sub)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-400 text-white hover:bg-orange-500 transition"
                          >
                            승인
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
{/* 문의 탭 */}
      {tab === 'inquiry' && (
        <>
          {inquiries.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3 opacity-20">💬</div>
              <p className="text-sm font-bold text-zinc-700">문의가 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map(inq => (
                <div key={inq.id} className={`rounded-xl p-4 bg-white border transition ${
                  inq.status === 'pending' ? 'border-pink-200' : 'border-stone-200 opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-pink-500" />
                      <span className="text-xs font-bold text-zinc-700">
                        {inq.nickname || '익명'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inq.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {inq.status === 'pending' ? '미확인' : '확인됨'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(inq.created_at).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-800 whitespace-pre-wrap mb-3">{inq.content}</div>
                  {/* 답변 있으면 표시 */}
                  {inq.admin_reply && (
                    <div className="mt-2 p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
                      <div className="text-[10px] font-bold text-zinc-500 mb-1">관리자 답변</div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{inq.admin_reply}</div>
                    </div>
                  )}

                  {/* 답변 입력 */}
                  <ReplyBox inq={inq} onDone={loadData} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {tab === 'kopis' && (
        <KopisMatcher session={session} />
      )}
      {selectedSubmission && (
        <ReviewModal
          submission={selectedSubmission}
          session={session}
          onClose={() => setSelectedSubmission(null)}
          onDone={handleDone}
        />
      )}
    </>
  )
}

function ReplyBox({ inq, onDone }) {
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState(inq.admin_reply || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { supabase } = await import('../lib/supabase')
      await supabase.from('inquiries').update({
        admin_reply: reply || null,
        replied_at: reply ? new Date().toISOString() : null,
        status: 'checked',
      }).eq('id', inq.id)
      setOpen(false)
      onDone()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-1">
        <Check className="w-3.5 h-3.5" />
        {inq.admin_reply ? '답변 수정' : '답변 작성'}
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        placeholder="답변을 입력하세요..."
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-xs outline-none focus:border-emerald-400 resize-none"
      />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)}
          className="flex-1 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-zinc-500">
          취소
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">
          {saving ? '저장 중...' : '답변 저장'}
        </button>
      </div>
    </div>
  )
}
