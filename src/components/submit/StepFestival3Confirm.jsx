import { Calendar, MapPin, Music, Ticket, Link as LinkIcon } from 'lucide-react'

export default function StepFestival3Confirm({ festivalData, artistData, ticketRounds, sourceData, onSourceChange, mode }) {
  const formatDateTime = (dt) => {
    if (!dt) return ''
    return new Date(dt).toLocaleString('ko', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">
        제보 내용 확인
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
        출처와 메모는 검수자에게 도움이 돼요
      </p>

      <div className="space-y-3 mb-6">
        {/* 페스티벌 정보 */}
        <div className="rounded-xl p-3 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            페스티벌
          </div>
          {mode === 'add_artist' ? (
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              기존 페스티벌에 아티스트 추가
            </div>
          ) : (
            <>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {festivalData?.name}
                {festivalData?.name_jp && <span className="text-zinc-500 font-normal ml-1">· {festivalData.name_jp}</span>}
              </div>
              <div className="text-xs text-zinc-500 space-y-0.5">
                <div>{festivalData?.country === 'korea' ? '🇰🇷 내한' : '🇯🇵 원정'}</div>
                {(festivalData?.dates || []).map((d, idx) => (
                  <div key={idx}>
                    📅 {d.date}
                    {festivalData.dates.length > 1 && (
                      <span className="text-pink-600 ml-1 font-bold">[{d.label || `DAY${idx + 1}`}]</span>
                    )}
                  </div>
                ))}
                {festivalData?.venue && (
                  <div>📍 {festivalData.venue} {festivalData?.city && `· ${festivalData.city}`}</div>
                )}
                {festivalData?.ticket_price && <div>💰 {festivalData.ticket_price}</div>}
              </div>
            </>
          )}
        </div>

        {/* 출연진 */}
        {artistData?.length > 0 && (
          <div className="rounded-xl p-3 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Music className="w-3.5 h-3.5" />
              출연진 ({artistData.length}팀)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {artistData.map(a => (
                <span
                  key={a.artist_id}
                  className="px-2 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: a.color || '#888' }}
                >
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 티켓팅 */}
        {ticketRounds?.length > 0 && (
          <div className="rounded-xl p-3 bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Ticket className="w-3.5 h-3.5" />
              티켓팅 ({ticketRounds.length}회)
            </div>
            <div className="space-y-1">
              {ticketRounds.map((r, idx) => (
                <div key={idx} className="text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="font-bold">{idx + 1}. {r.round_name}</span>
                  <span className="text-zinc-500"> · {formatDateTime(r.open_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 출처 + 메모 */}
      <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-zinc-800">
        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 block flex items-center gap-1">
            <LinkIcon className="w-3 h-3" />
            출처 URL <span className="text-pink-500">*</span>
          </label>
          <input
            type="url"
            value={sourceData.source_url || ''}
            onChange={e => onSourceChange({ ...sourceData, source_url: e.target.value })}
            placeholder="https://summersonic.com/..."
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
            추가 설명 (선택)
          </label>
          <textarea
            value={sourceData.submitter_note || ''}
            onChange={e => onSourceChange({ ...sourceData, submitter_note: e.target.value })}
            placeholder="검수자에게 전달할 메모"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300 resize-none"
          />
        </div>
      </div>
    </div>
  )
}
