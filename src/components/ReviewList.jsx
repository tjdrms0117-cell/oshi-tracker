import { useEffect, useState } from 'react'
import { Clock, User, ExternalLink, Music } from 'lucide-react'
import { fetchPendingSubmissions, fetchPendingArtistSubmissions, approveArtistSubmission, rejectArtistSubmission } from '../lib/api'
import ReviewModal from './ReviewModal'

export default function ReviewList({ session }) {
  const [tab, setTab] = useState('concert') // concert | artist
  const [submissions, setSubmissions] = useState([])
  const [artistSubmissions, setArtistSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  if (session?.user) loadData()
}, [session])

  const loadData = async () => {
    setLoading(true)
    try {
      const [concertData, artistData] = await Promise.all([
        fetchPendingSubmissions(),
        fetchPendingArtistSubmissions(),
      ])
      setSubmissions(concertData)
      setArtistSubmissions(artistData)
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

  if (loading) {
    return <div className="text-center py-12 text-sm text-zinc-500">불러오는 중...</div>
  }

  return (
    <>
      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('concert')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'concert' ? 'bg-zinc-900 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          공연 제보 {submissions.length > 0 && `(${submissions.length})`}
        </button>
        <button
          onClick={() => setTab('artist')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition ${
            tab === 'artist' ? 'bg-zinc-900 text-white' : 'bg-white border border-stone-200 text-zinc-500'
          }`}
        >
          아티스트 제보 {artistSubmissions.length > 0 && `(${artistSubmissions.length})`}
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
                <div
                  key={sub.id}
                  className="rounded-xl p-4 bg-white border border-stone-200"
                >
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
                      🎵 {sub.top_song_title}
                      {sub.top_song_title_jp && ` (${sub.top_song_title_jp})`}
                    </div>
                  )}
                  {sub.top_song_youtube_url && (
                    <div className="text-xs text-pink-500 mb-1">
                      🔗 {sub.top_song_youtube_url}
                    </div>
                  )}
                  {sub.note && (
                    <div className="text-xs text-zinc-500 italic mb-2">📝 {sub.note}</div>
                  )}

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