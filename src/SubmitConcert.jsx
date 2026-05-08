import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import { fetchArtists, createSubmissionWithRounds, fetchMySubmissions, createFestivalSubmission } from './lib/api'
import Step1Artist from './components/submit/Step1Artist'
import Step2Concert from './components/submit/Step2Concert'
import Step3Ticketing from './components/submit/Step3Ticketing'
import Step4Confirm from './components/submit/Step4Confirm'
import MySubmissions from './components/submit/MySubmissions'
import ArtistSubmitForm from './components/submit/ArtistSubmitForm'
import StepFestival1Info from './components/submit/StepFestival1Info'
import StepFestival2Artists from './components/submit/StepFestival2Artists'
import StepFestival3Confirm from './components/submit/StepFestival3Confirm'

const clearLocalStorage = () => {
  localStorage.removeItem('submit_step')
  localStorage.removeItem('submit_artist')
  localStorage.removeItem('submit_concert')
  localStorage.removeItem('submit_tickets')
  localStorage.removeItem('submit_source')
  localStorage.removeItem('submit_festival')
  localStorage.removeItem('submit_festival_artists')
}

export default function SubmitConcert({ session }) {
  const navigate = useNavigate()

  const [step, setStep] = useState(() => {
    try { return JSON.parse(localStorage.getItem('submit_step') || '"0"') } catch { return 0 }
  })
  const [artists, setArtists] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // 공연 제보 상태
  const [artistData, setArtistData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('submit_artist') || 'null') } catch { return null }
  })
  const [concertData, setConcertData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('submit_concert') || 'null') ||
        { country: 'korea', dates: [{ date: '', time: '', label: '' }] }
    } catch {
      return { country: 'korea', dates: [{ date: '', time: '', label: '' }] }
    }
  })
  const [ticketRounds, setTicketRounds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('submit_tickets') || '[]') } catch { return [] }
  })
  const [sourceData, setSourceData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('submit_source') || 'null') ||
        { source_url: '', submitter_note: '' }
    } catch {
      return { source_url: '', submitter_note: '' }
    }
  })

  // 페스티벌 제보 상태
  const [festivalData, setFestivalData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('submit_festival') || 'null') ||
        { country: 'japan', name: '', name_jp: '', dates: [{ date: '', label: '' }], venue: '', city: '', ticket_price: '' }
    } catch {
      return { country: 'japan', name: '', name_jp: '', dates: [{ date: '', label: '' }], venue: '', city: '', ticket_price: '' }
    }
  })
  const [festivalArtists, setFestivalArtists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('submit_festival_artists') || '[]') } catch { return [] }
  })
  const [festivalTickets, setFestivalTickets] = useState([])
  const [festivalSource, setFestivalSource] = useState({ source_url: '', submitter_note: '' })

  // localStorage 동기화
  const updateStep = (newStep) => {
    setStep(newStep)
    localStorage.setItem('submit_step', JSON.stringify(newStep))
  }

  useEffect(() => {
    try { localStorage.setItem('submit_artist', JSON.stringify(artistData)) } catch {}
  }, [artistData])
  useEffect(() => {
    try { localStorage.setItem('submit_concert', JSON.stringify(concertData)) } catch {}
  }, [concertData])
  useEffect(() => {
    try { localStorage.setItem('submit_tickets', JSON.stringify(ticketRounds)) } catch {}
  }, [ticketRounds])
  useEffect(() => {
    try { localStorage.setItem('submit_source', JSON.stringify(sourceData)) } catch {}
  }, [sourceData])
  useEffect(() => {
    try { localStorage.setItem('submit_festival', JSON.stringify(festivalData)) } catch {}
  }, [festivalData])
  useEffect(() => {
    try { localStorage.setItem('submit_festival_artists', JSON.stringify(festivalArtists)) } catch {}
  }, [festivalArtists])

  useEffect(() => { loadData() }, [session])

  const loadData = async () => {
    try {
      const [artistsData, mySubData] = await Promise.all([
        fetchArtists(),
        session?.user ? fetchMySubmissions(session.user.id).catch(() => []) : Promise.resolve([]),
      ])
      setArtists(artistsData)
      setSubmissions(mySubData)
    } catch (err) {
      console.error('데이터 로드 실패:', err)
    }
  }

  const startNew = () => {
    if (!session?.user) { alert('제보는 로그인 후 이용할 수 있어요'); return }
    clearLocalStorage()
    setArtistData(null)
    setConcertData({ country: 'korea', dates: [{ date: '', time: '', label: '' }] })
    setTicketRounds([])
    setSourceData({ source_url: '', submitter_note: '' })
    updateStep(1)
  }

  const startFestival = (mode = 'new') => {
    if (!session?.user) { alert('제보는 로그인 후 이용할 수 있어요'); return }
    clearLocalStorage()
    setFestivalData({ country: 'japan', name: '', name_jp: '', dates: [{ date: '', label: '' }], venue: '', city: '', ticket_price: '', festival_id: null })
    setFestivalArtists([])
    setFestivalTickets([])
    setFestivalSource({ source_url: '', submitter_note: '' })
    updateStep(mode === 'add_artist' ? 'festival_add_1' : 'festival_new_1')
  }

  // 공연 제보 canProceed
  const canProceedConcert = () => {
    if (step === 1) return !!artistData
    if (step === 2) {
      const hasValidDate = (concertData.dates || []).some(d => d.date)
      return !!(concertData.title && hasValidDate && concertData.country)
    }
    if (step === 3) return true
    if (step === 4) return !!sourceData.source_url
    return false
  }

  // 페스티벌 제보 canProceed
  const canProceedFestival = () => {
    if (step === 'festival_new_1') {
      const hasDate = (festivalData.dates || []).some(d => d.date)
      return !!(festivalData.name && hasDate)
    }
    if (step === 'festival_add_1') return !!festivalData.festival_id
    if (step === 'festival_new_2' || step === 'festival_add_2') return true
    if (step === 'festival_new_3' || step === 'festival_add_3') return true
    if (step === 'festival_new_4' || step === 'festival_add_4') return !!festivalSource.source_url
    return false
  }

  // 공연 제보 제출
  const handleSubmitConcert = async () => {
    if (!sourceData.source_url) { alert('출처 URL은 필수예요'); return }
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
      clearLocalStorage()
      alert('제보 완료! 검수 후 등록될 거예요.')
      updateStep(0)
      loadData()
    } catch (err) {
      console.error('제보 실패:', err)
      alert('제보 중 오류가 발생했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 페스티벌 제보 제출
  const handleSubmitFestival = async () => {
    if (!festivalSource.source_url) { alert('출처 URL은 필수예요'); return }
    setSubmitting(true)
    try {
      const isAddMode = String(step).includes('add')
      await createFestivalSubmission({
        submitted_by: session.user.id,
        status: 'pending',
        festival_id: isAddMode ? festivalData.festival_id : null,
        name: isAddMode ? null : festivalData.name,
        name_jp: isAddMode ? null : (festivalData.name_jp || null),
        dates: isAddMode ? null : festivalData.dates,
        venue_id: isAddMode ? null : (festivalData.venue_id || null),
        venue: isAddMode ? null : (festivalData.venue || null),
        city: isAddMode ? null : (festivalData.city || null),
        country: isAddMode ? null : festivalData.country,
        ticket_price: isAddMode ? null : (festivalData.ticket_price || null),
        artists: festivalArtists.map(a => ({ artist_id: a.artist_id, name: a.name })),
        source_url: festivalSource.source_url,
        submitter_note: festivalSource.submitter_note || null,
      })
      clearLocalStorage()
      alert('페스티벌 제보 완료! 검수 후 등록될 거예요.')
      updateStep(0)
      loadData()
    } catch (err) {
      console.error('페스티벌 제보 실패:', err)
      alert('제보 중 오류가 발생했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  // 아티스트 제보 화면
  if (step === 'artist') {
    return (
      <div className="space-y-5">
        <button onClick={() => updateStep(0)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700">
          ← 뒤로
        </button>
        <ArtistSubmitForm session={session} onDone={() => { updateStep(0); loadData() }} />
      </div>
    )
  }

  // 시작 화면
  if (step === 0) {
    const pendingCount = submissions.filter(s => s.status === 'pending').length
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startNew}
            className="p-4 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition"
            style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}
          >
            🎵 공연 제보
          </button>
          <button
            onClick={() => { if (!session?.user) { alert('로그인 후 이용할 수 있어요'); return } updateStep('artist') }}
            className="p-4 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition"
            style={{ background: 'linear-gradient(135deg, #7e57c2, #e91e63)' }}
          >
            🎤 아티스트 제보
          </button>
        </div>

        {/* 페스티벌 제보 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => startFestival('new')}
            className="p-4 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition"
            style={{ background: 'linear-gradient(135deg, #f57c00, #ffa726)' }}
          >
            🎪 페스티벌 제보
          </button>
          <button
            onClick={() => startFestival('add_artist')}
            className="p-4 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition"
            style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
          >
            ➕ 페스 아티스트 추가
          </button>
        </div>

        <div className="rounded-xl p-3 bg-pink-50 border border-pink-200 text-xs text-pink-700">
          💡 제보된 정보는 관리자 검수 후 공개돼요. 정확한 출처와 함께 알려주세요!
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
            내 제보 현황
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                대기 {pendingCount}
              </span>
            )}
          </h3>
          <MySubmissions submissions={submissions} />
        </div>
      </div>
    )
  }

  // 페스티벌 제보 플로우
  const isFestivalFlow = String(step).startsWith('festival')
  if (isFestivalFlow) {
    const isAddMode = String(step).includes('add')
    const stepNum = parseInt(String(step).split('_').pop())
    const totalSteps = 4
    const mode = isAddMode ? 'add_artist' : 'new'

    const getNextStep = () => {
      if (stepNum < totalSteps) return `festival_${isAddMode ? 'add' : 'new'}_${stepNum + 1}`
      return null
    }
    const getPrevStep = () => {
      if (stepNum <= 1) return 0
      return `festival_${isAddMode ? 'add' : 'new'}_${stepNum - 1}`
    }

    return (
      <div className="space-y-5">
        {/* 헤더 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => updateStep(getPrevStep())}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
            >
              <ArrowLeft className="w-3 h-3" />
              {stepNum === 1 ? '취소' : '이전'}
            </button>
            <span className="text-xs text-zinc-500">STEP {stepNum} / {totalSteps}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded ${i < stepNum ? 'bg-orange-400' : 'bg-stone-200 dark:bg-zinc-800'}`}
              />
            ))}
          </div>
          <div className="mt-1.5 text-[10px] font-bold text-orange-500 text-center">
            🎪 {isAddMode ? '페스티벌 아티스트 추가' : '새 페스티벌 제보'}
          </div>
        </div>

        {/* 단계별 컨텐츠 */}
        {stepNum === 1 && (
          <StepFestival1Info
            value={festivalData}
            onChange={setFestivalData}
            mode={mode}
          />
        )}
        {stepNum === 2 && (
          <StepFestival2Artists
            artists={artists}
            value={festivalArtists}
            onChange={setFestivalArtists}
            startDate={festivalData.dates?.[0]?.date || ''}
            endDate={festivalData.dates?.[festivalData.dates.length - 1]?.date || ''}
          />
        )}
        {stepNum === 3 && (
          <Step3Ticketing
            rounds={festivalTickets}
            onChange={setFestivalTickets}
          />
        )}
        {stepNum === 4 && (
          <StepFestival3Confirm
            festivalData={festivalData}
            artistData={festivalArtists}
            ticketRounds={festivalTickets}
            sourceData={festivalSource}
            onSourceChange={setFestivalSource}
            mode={mode}
          />
        )}

        {/* 하단 버튼 */}
        <div className="pt-2">
          {stepNum < totalSteps ? (
            <button
              onClick={() => updateStep(getNextStep())}
              disabled={!canProceedFestival()}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 transition"
              style={{ background: 'linear-gradient(135deg, #f57c00, #ffa726)' }}
            >
              다음 <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitFestival}
              disabled={!canProceedFestival() || submitting}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 transition"
              style={{ background: 'linear-gradient(135deg, #f57c00, #ffa726)' }}
            >
              {submitting ? '제보 중...' : <><Send className="w-4 h-4" /> 페스티벌 제보 제출</>}
            </button>
          )}
        </div>
      </div>
    )
  }

  // 공연 제보 플로우 (step 1~4)
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => step === 1 ? updateStep(0) : updateStep(step - 1)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
          >
            <ArrowLeft className="w-3 h-3" />
            {step === 1 ? '취소' : '이전'}
          </button>
          <span className="text-xs text-zinc-500">STEP {step} / 4</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1 rounded ${s <= step ? 'bg-pink-500' : 'bg-stone-200 dark:bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      {step === 1 && <Step1Artist artists={artists} value={artistData} onChange={setArtistData} />}
      {step === 2 && <Step2Concert value={concertData} onChange={setConcertData} />}
      {step === 3 && <Step3Ticketing rounds={ticketRounds} onChange={setTicketRounds} />}
      {step === 4 && (
        <Step4Confirm
          artistData={artistData}
          concertData={concertData}
          ticketRounds={ticketRounds}
          sourceData={sourceData}
          onSourceChange={setSourceData}
        />
      )}

      <div className="pt-2">
        {step < 4 ? (
          <button
            onClick={() => updateStep(step + 1)}
            disabled={!canProceedConcert()}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 transition"
            style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}
          >
            다음 <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmitConcert}
            disabled={!canProceedConcert() || submitting}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 transition"
            style={{ background: 'linear-gradient(135deg, #e91e63, #00acc1)' }}
          >
            {submitting ? '제보 중...' : <><Send className="w-4 h-4" /> 제보 제출</>}
          </button>
        )}
      </div>
    </div>
  )
}
