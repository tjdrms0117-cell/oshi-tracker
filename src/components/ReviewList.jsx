import { useEffect, useState } from 'react'
import { Clock, ExternalLink, User } from 'lucide-react'
import { fetchPendingSubmissions } from '../lib/api'
import ReviewModal from './ReviewModal'

export default function ReviewList({ session }) {
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchPendingSubmissions()
      setSubmissions(data)
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
  
  if (loading) {
    return (
      <div className="text-center py-12 text-sm text-zinc-500">
        불러오는 중...
      </div>
    )
  }
  
  if (submissions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-20">✨</div>
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
          검수 대기 중인 제보가 없어요
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          모든 제보가 처리되었어요!
        </p>
      </div>
    )
  }
  
  return (
    <>
      <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
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
              className="w-full text-left rounded-xl p-3 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${
                    sub.country === 'korea' 
                      ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300'
                      : 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300'
                  }`}>
                    {sub.country === 'korea' ? '내한' : '원정'}
                  </span>
                  {isNewArtist && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                      새 가수
                    </span>
                  )}
                  {roundCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      티켓팅 {roundCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400">
                  {new Date(sub.created_at).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
              
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                {sub.artist?.name || sub.new_artist_name}
              </div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {sub.title}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span>📅 {sub.date} {sub.time && `· ${sub.time.slice(0, 5)}`}</span>
                {sub.venue && <span>📍 {sub.venue}</span>}
              </div>
              
              <div className="mt-2 pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
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
