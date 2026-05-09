import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'
import { fetchMyInquiries } from './lib/api'

export default function MyInquiriesPage({ session }) {
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!session?.user) {
      navigate('/login')
      return
    }
    load()
  }, [session])
  
  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchMyInquiries(session.user.id)
      setInquiries(data)
    } catch (err) {
      console.error('문의 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }
  
  const repliedCount = inquiries.filter(i => i.admin_reply).length
  
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 pb-20">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로
        </button>
      </div>
      
      <div className="max-w-3xl mx-auto px-5">
        {/* 타이틀 */}
        <div className="flex items-center gap-2 mb-5">
          <Mail className="w-5 h-5 text-pink-500" />
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            내 문의
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">
            {inquiries.length}
          </span>
          {repliedCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold">
              답변 {repliedCount}
            </span>
          )}
        </div>
        
        {/* 문의 목록 */}
        {inquiries.length > 0 ? (
          <div className="space-y-3">
            {inquiries.map(inq => (
              <div 
                key={inq.id} 
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-4"
              >
                {/* 내 문의 */}
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                      {inq.content}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {new Date(inq.created_at).toLocaleDateString('ko', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                
                {/* 관리자 답변 */}
                {inq.admin_reply ? (
                  <div className="mt-3 pl-5 border-l-2 border-pink-300 dark:border-pink-700">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-pink-600 dark:text-pink-400 mb-1">
                      <span>💬 운영자 답변</span>
                    </div>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                      {inq.admin_reply}
                    </div>
                    {inq.replied_at && (
                      <div className="text-[10px] text-zinc-400 mt-1">
                        {new Date(inq.replied_at).toLocaleDateString('ko', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-zinc-400 italic">
                    답변 대기 중...
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-8 text-center">
            <div className="text-3xl mb-2 opacity-30">📬</div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
              아직 문의 내역이 없어요
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              제보 탭에서 문의/건의 버튼으로 보내실 수 있어요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}