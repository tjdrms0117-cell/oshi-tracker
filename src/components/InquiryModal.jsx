import { useState } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'
import { createInquiry } from '../lib/api'

export default function InquiryModal({ session, profile, onClose }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) { alert('내용을 입력해주세요'); return }
    setSubmitting(true)
    try {
      await createInquiry({
        submitted_by: session?.user?.id || null,
        nickname: profile?.nickname || null,
        content: content.trim(),
      })
      setDone(true)
    } catch (err) {
      alert('전송 실패: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-pink-500" />
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">관리자에게 문의</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">✉️</div>
            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">전송 완료!</div>
            <div className="text-sm text-zinc-500 mb-4">관리자가 확인 후 처리할게요</div>
            <button onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}>
              닫기
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                건의사항, 오류 제보, 아티스트 추가 요청 등 자유롭게 적어주세요
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="내용을 입력하세요..."
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-sm outline-none focus:border-pink-300 dark:focus:border-pink-700 resize-none text-zinc-900 dark:text-zinc-100"
              />
              <div className="text-right text-[10px] text-zinc-400 mt-0.5">{content.length}자</div>
            </div>
            {!session?.user && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                비로그인 상태예요. 로그인하면 답변 받기가 더 쉬워요
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-400">
                취소
              </button>
              <button onClick={handleSubmit} disabled={submitting || !content.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}>
                <Send className="w-3.5 h-3.5" />
                {submitting ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}