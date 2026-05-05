import { Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react'

export default function MySubmissions({ submissions }) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2 opacity-20">📬</div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          아직 제보한 공연이 없어요
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {submissions.map((sub) => {
        const statusConfig = {
          pending: {
            icon: Clock,
            label: '검수 대기',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            border: 'border-amber-200 dark:border-amber-900',
            text: 'text-amber-700 dark:text-amber-300',
          },
          approved: {
            icon: CheckCircle2,
            label: '승인됨',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-900',
            text: 'text-emerald-700 dark:text-emerald-300',
          },
          rejected: {
            icon: XCircle,
            label: '반려됨',
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-900',
            text: 'text-red-700 dark:text-red-300',
          },
        }
        
        const cfg = statusConfig[sub.status] || statusConfig.pending
        const Icon = cfg.icon
        
        return (
          <div 
            key={sub.id}
            className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}
          >
            <div className="flex items-start gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.text}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold tracking-wider ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(sub.created_at).toLocaleDateString('ko', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  {sub.title}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <span>{sub.artist?.name || sub.new_artist_name}</span>
                  <span>·</span>
                  <Calendar className="w-3 h-3" />
                  <span>{sub.date}</span>
                </div>
                
                {sub.status === 'rejected' && sub.reject_reason && (
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                    <strong>사유:</strong> {sub.reject_reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
