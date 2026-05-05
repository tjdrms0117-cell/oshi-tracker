import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import { fetchArtists, createSubmissionWithRounds, fetchMySubmissions } from './lib/api'
import Step1Artist from './components/submit/Step1Artist'
import Step2Concert from './components/submit/Step2Concert'
import Step3Ticketing from './components/submit/Step3Ticketing'
import Step4Confirm from './components/submit/Step4Confirm'
import MySubmissions from './components/submit/MySubmissions'

export default function SubmitConcert({ session }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0: 시작화면, 1-4: 단계
  const [artists, setArtists] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  
  // 폼 데이터
  const [artistData, setArtistData] = useState(null)
  const [concertData, setConcertData] = useState({ 
    country: 'korea',
    dates: [{ date: '', time: '', label: '' }],
  })
  const [ticketRounds, setTicketRounds] = useState([])
  const [sourceData, setSourceData] = useState({ source_url: '', submitter_note: '' })
  
  useEffect(() => {
    loadData()
  }, [session])
  
  const loadData = async () => {
    try {
      const [artistsData, mySubData] = await Promise.all([
        fetchArtists(),
        fetchMySubmissions(session.user.id).catch(() => []),
      ])
      setArtists(artistsData)
      setSubmissions(mySubData)
    } catch (err) {
      console.error('데이터 로드 실패:', err)
    }
  }
  
  const startNew = () => {
    if (!session?.user) {
      alert('제보는 로그인 후 이용할 수 있어요')
      return
    }
    // 초기화
    setArtistData(null)
   setConcertData({ 
      country: 'korea',
      dates: [{ date: '', time: '', label: '' }],
    })
    setTicketRounds([])
    setSourceData({ source_url: '', submitter_note: '' })
    setStep(1)
  }
  
  const canProceed = () => {
    if (step === 1) return !!artistData
    if (step === 2) {
      const hasValidDate = (concertData.dates || []).some(d => d.date)
      return !!(concertData.title && hasValidDate && concertData.country)
    }
    if (step === 3) return true // 티켓팅은 선택사항
    if (step === 4) return !!sourceData.source_url
    return false
  }
  
  const handleSubmit = async () => {
    if (!sourceData.source_url) {
      alert('출처 URL은 필수예요')
      return
    }
    
    setSubmitting(true)
    try {
      const submissionPayload = {
        submitted_by: session.user.id,
        status: 'pending',
        artist_id: artistData.type === 'existing' ? artistData.artist_id : null,
        new_artist_name: artistData.type === 'new' ? artistData.new_artist_name : null,
        new_artist_name_jp: artistData.type === 'new' ? artistData.new_artist_name_jp : null,
        new_artist_color: artistData.type === 'new' ? artistData.new_artist_color : null,
        title: concertData.title,
        country: concertData.country,
        venue_id: concertData.venue_id || null,
        venue: concertData.venue || null,
        city: concertData.city || null,
        date: concertData.dates[0]?.date || null,
        time: concertData.dates[0]?.time || null,
        dates: concertData.dates || [],
        duration_minutes: concertData.duration_minutes || null,
        seat_type: concertData.seat_type || null,
        ticket_price: concertData.ticket_price || null,
        source_url: sourceData.source_url,
        submitter_note: sourceData.submitter_note || null,
      }
      
      const cleanRounds = ticketRounds
        .filter(r => r.open_at && r.round_name)
        .map(r => ({
          round_name: r.round_name,
          open_at: r.open_at,
          method: r.method || null,
          ticket_site: r.ticket_site || null,
          price_info: r.price_info || null,
          note: r.note || null,
        }))
      
      await createSubmissionWithRounds(submissionPayload, cleanRounds)
      
      alert('제보 완료! 검수 후 등록될 거예요.')
      setStep(0)
      loadData()
    } catch (err) {
      console.error('제보 실패:', err)
      alert('제보 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }
  
  // 시작 화면 (제보 메인)
  if (step === 0) {
    const pendingCount = submissions.filter(s => s.status === 'pending').length
    
    return (
      <div className="space-y-5">
        {/* 새 제보 버튼 */}
        <button
          onClick={startNew}
          className="w-full p-5 rounded-2xl text-white font-bold text-base shadow-md hover:shadow-lg transition"
          style={{
            background: 'linear-gradient(135deg, #e91e63, #00acc1)',
          }}
        >
          ✏️ 새 공연 제보하기
        </button>
        
        {/* 안내 */}
        <div className="rounded-xl p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900 text-xs text-pink-700 dark:text-pink-300">
          💡 제보된 정보는 관리자 검수 후 공개돼요. 정확한 출처와 함께 알려주세요!
        </div>
        
        {/* 내 제보 현황 */}
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            내 제보 현황
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                대기 {pendingCount}
              </span>
            )}
          </h3>
          <MySubmissions submissions={submissions} />
        </div>
      </div>
    )
  }
  
  // 단계별 화면
  return (
    <div className="space-y-5">
      {/* 진행 표시 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => step === 1 ? setStep(0) : setStep(step - 1)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft className="w-3 h-3" />
            {step === 1 ? '취소' : '이전'}
          </button>
          <span className="text-xs text-zinc-500">
            STEP {step} / 4
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`flex-1 h-1 rounded ${
                s <= step ? 'bg-pink-500' : 'bg-stone-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* 단계별 컴포넌트 */}
      {step === 1 && (
        <Step1Artist 
          artists={artists}
          value={artistData}
          onChange={setArtistData}
        />
      )}
      {step === 2 && (
        <Step2Concert 
          value={concertData}
          onChange={setConcertData}
        />
      )}
      {step === 3 && (
        <Step3Ticketing 
          rounds={ticketRounds}
          onChange={setTicketRounds}
        />
      )}
      {step === 4 && (
        <Step4Confirm 
          artistData={artistData}
          concertData={concertData}
          ticketRounds={ticketRounds}
          sourceData={sourceData}
          onSourceChange={setSourceData}
        />
      )}
      
      {/* 다음/제출 버튼 */}
      <div className="pt-2">
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{
              background: 'linear-gradient(135deg, #e91e63, #00acc1)',
            }}
          >
            다음
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 transition"
            style={{
              background: 'linear-gradient(135deg, #e91e63, #00acc1)',
            }}
          >
            {submitting ? '제보 중...' : (
              <>
                <Send className="w-4 h-4" />
                제보 제출
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
