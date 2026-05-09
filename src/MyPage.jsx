import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, User, Edit2, Check, X, LogOut, 
  Calendar, Star, Music, MessageCircle, Mail, Loader, Share2,
} from 'lucide-react'
import { 
  fetchMyProfile,
  updateMyNickname,
  fetchMyOshiList,
  fetchMyAttendingList,
  fetchMySubmissions,
  fetchMyArtistSubmissions,
  fetchMyFestivalSubmissions,
  fetchMyInquiries,
} from './lib/api'
import { signOut } from './lib/auth'
import ConcertCard from './components/ConcertCard'
import ArtistCard from './components/ArtistCard'
import ShareImageModal from './components/ShareImageModal'

export default function MyPage({ session }) {
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState(null)
  const [oshiList, setOshiList] = useState([])
  const [attendingList, setAttendingList] = useState([])
  const [concertSubs, setConcertSubs] = useState([])
  const [artistSubs, setArtistSubs] = useState([])
  const [festivalSubs, setFestivalSubs] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 닉네임 편집
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  
  // 제보 탭
  const [submissionTab, setSubmissionTab] = useState('concert') // concert | artist | festival
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      navigate('/login')
      return
    }
    loadAll()
  }, [session])
  
  const loadAll = async () => {
    setLoading(true)
    try {
      const userId = session.user.id
      const [
        profileData,
        oshi,
        attending,
        concertSubsData,
        artistSubsData,
        festivalSubsData,
        inquiriesData,
      ] = await Promise.all([
        fetchMyProfile(userId).catch(() => null),
        fetchMyOshiList(userId).catch(() => []),
        fetchMyAttendingList(userId).catch(() => []),
        fetchMySubmissions(userId).catch(() => []),
        fetchMyArtistSubmissions(userId).catch(() => []),
        fetchMyFestivalSubmissions(userId).catch(() => []),
        fetchMyInquiries(userId).catch(() => []),
      ])
      setProfile(profileData)
      setNicknameInput(profileData?.nickname || '')
      setOshiList(oshi)
      setAttendingList(attending)
      setConcertSubs(concertSubsData)
      setArtistSubs(artistSubsData)
      setFestivalSubs(festivalSubsData)
      setInquiries(inquiriesData)
    } catch (err) {
      console.error('마이페이지 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSaveNickname = async () => {
    const newNickname = nicknameInput.trim()
    if (!newNickname) {
      alert('닉네임을 입력해주세요')
      return
    }
    if (newNickname === profile?.nickname) {
      setEditingNickname(false)
      return
    }
    setSavingNickname(true)
    try {
      await updateMyNickname(session.user.id, newNickname)
      setProfile({ ...profile, nickname: newNickname })
      setEditingNickname(false)
    } catch (err) {
      alert('닉네임 변경 실패: ' + err.message)
    } finally {
      setSavingNickname(false)
    }
  }
  
  const handleLogout = async () => {
    if (!confirm('로그아웃 할까요?')) return
    await signOut()
    navigate('/')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="text-pink-500 text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    )
  }
  
  // 답변 받은 문의 (읽지 않음 표시용)
  const repliedInquiries = inquiries.filter(i => i.admin_reply)
  const unrepliedInquiries = inquiries.filter(i => !i.admin_reply)
  
  // 갈거예요 - 미래 공연만
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingAttending = attendingList
  .filter(a => a.concert && new Date(a.concert.date) >= today)
  .map(a => a.concert)
  .sort((a, b) => new Date(a.date) - new Date(b.date))

// 다녀온 공연 (이미지 공유용)
const pastAttending = attendingList
  .filter(a => a.concert && new Date(a.concert.date) < today)
  .map(a => a.concert)
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  
  // 오시 아티스트
  const oshiArtists = oshiList.map(o => o.artist).filter(Boolean)
  const oshiArtistIds = oshiList.map(o => o.artist_id)
  const attendingConcertIds = attendingList.map(a => a.concert_id)
  
  // 제보 카운트
  const submissionCounts = {
    concert: concertSubs.length,
    artist: artistSubs.length,
    festival: festivalSubs.length,
  }
  
  const currentSubs = 
    submissionTab === 'concert' ? concertSubs :
    submissionTab === 'artist' ? artistSubs :
    festivalSubs
  
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
      
      <div className="max-w-3xl mx-auto px-5 space-y-6">
        
        {/* 프로필 섹션 */}
        <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-cyan-400 flex items-center justify-center shadow-md">
              <User className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* 닉네임 (편집 가능) */}
              {editingNickname ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    autoFocus
                    maxLength={20}
                    className="flex-1 px-2 py-1 text-base font-bold rounded-lg bg-stone-50 dark:bg-zinc-800 border border-pink-300 dark:border-pink-700 outline-none text-zinc-900 dark:text-zinc-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNickname()
                      if (e.key === 'Escape') {
                        setEditingNickname(false)
                        setNicknameInput(profile?.nickname || '')
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={savingNickname}
                    className="p-1.5 rounded-lg bg-pink-500 text-white disabled:opacity-50"
                  >
                    {savingNickname ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNickname(false)
                      setNicknameInput(profile?.nickname || '')
                    }}
                    className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {profile?.nickname || 'guest'}
                  </h1>
                  <button
                    onClick={() => setEditingNickname(true)}
                    className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400"
                    title="닉네임 변경"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {session?.user?.email}
              </p>
              
              {/* 통계 */}
              <div className="flex items-center gap-3 mt-3 text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-400">
                  ⭐ <span className="font-bold">{oshiArtists.length}</span> 오시
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  ✓ <span className="font-bold">{upcomingAttending.length}</span> 갈거예요
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  📝 <span className="font-bold">{concertSubs.length + artistSubs.length + festivalSubs.length}</span> 제보
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          {/* 내 문의 버튼 */}
          <button
            onClick={() => navigate('/mypage/inquiries')}
            className="mt-4 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-50 to-cyan-50 dark:from-pink-950/30 dark:to-cyan-950/30 border border-pink-200/60 dark:border-pink-800/40 hover:border-pink-300 dark:hover:border-pink-700 transition"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                내 문의
              </span>
              {inquiries.length > 0 && (
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  {inquiries.length}
                </span>
              )}
              {repliedInquiries.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500 text-white font-bold">
                  답변 {repliedInquiries.length}
                </span>
              )}
            </div>
            <span className="text-zinc-400">→</span>
          </button>
        </section>
        
        
        {/* 갈 거예요 */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              <Calendar className="w-4 h-4 text-emerald-500" />
              갈 거예요 ({upcomingAttending.length})
            </h2>
            {(upcomingAttending.length > 0 || oshiArtists.length > 0) && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-sm hover:shadow-md transition"
              >
                <Share2 className="w-3 h-3" />
                이미지로 공유
              </button>
            )}
          </div>
          {upcomingAttending.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {upcomingAttending.map(concert => (
                <ConcertCard
                  key={concert.id}
                  concert={concert}
                  isOshi={oshiArtistIds.includes(concert.artist_id)}
                  isAttending={true}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-8 text-center">
              <div className="text-3xl mb-2 opacity-30">🎤</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                아직 등록한 공연이 없어요
              </p>
            </div>
          )}
        </section>
        
        {/* 내 오시 */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 px-1">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            내 오시 ({oshiArtists.length})
          </h2>
          {oshiArtists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {oshiArtists.map(artist => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  isOshi={true}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-8 text-center">
              <div className="text-3xl mb-2 opacity-30">⭐</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                아직 등록한 오시가 없어요
              </p>
            </div>
          )}
        </section>
        
        {/* 내 제보 */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 px-1">
            <Music className="w-4 h-4 text-pink-500" />
            내 제보
          </h2>
          
          {/* 제보 탭 */}
<div className="flex gap-1.5 mb-3">
  <button
    onClick={() => setSubmissionTab('concert')}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
      submissionTab === 'concert'
        ? 'bg-pink-500 text-white'
        : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
    }`}
  >
    공연 {submissionCounts.concert}
  </button>
  <button
    onClick={() => setSubmissionTab('artist')}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
      submissionTab === 'artist'
        ? 'bg-pink-500 text-white'
        : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
    }`}
  >
    가수 {submissionCounts.artist}
  </button>
  <button
    onClick={() => setSubmissionTab('festival')}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
      submissionTab === 'festival'
        ? 'bg-cyan-500 text-white'
        : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800'
    }`}
  >
    🎪 페스 {submissionCounts.festival}
  </button>
</div>

{/* 상태별 카운트 */}
{currentSubs.length > 0 && (
  <div className="flex items-center gap-3 mb-3 px-1 text-[11px]">
    {(() => {
      const pending = currentSubs.filter(s => (s.status || 'pending') === 'pending').length
      const approved = currentSubs.filter(s => s.status === 'approved').length
      const rejected = currentSubs.filter(s => s.status === 'rejected').length
      return (
        <>
          {pending > 0 && (
            <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              검수중 {pending}
            </span>
          )}
          {approved > 0 && (
            <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              승인 {approved}
            </span>
          )}
          {rejected > 0 && (
            <span className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              반려 {rejected}
            </span>
          )}
        </>
      )
    })()}
  </div>
)}

{/* 제보 목록 */}
{currentSubs.length > 0 ? (
            <div className="space-y-2">
              {currentSubs.map(sub => (
                <SubmissionRow key={sub.id} submission={sub} type={submissionTab} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-8 text-center">
              <div className="text-3xl mb-2 opacity-30">📝</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {submissionTab === 'concert' ? '아직 공연 제보가 없어요' :
                 submissionTab === 'artist' ? '아직 가수 제보가 없어요' :
                 '아직 페스 제보가 없어요'}
              </p>
            </div>
          )}
        </section>
      </div>
      
      {/* 이미지 공유 모달 */}
      {showShareModal && (
  <ShareImageModal
    nickname={profile?.nickname || 'guest'}
    upcomingConcerts={upcomingAttending}
    pastConcerts={pastAttending}
    oshiArtists={oshiArtists}
    onClose={() => setShowShareModal(false)}
  />
)}
    </div>
  )
}

// 제보 행 컴포넌트
function SubmissionRow({ submission, type }) {
  const status = submission.status || 'pending'
  
  const statusConfig = {
    pending: { label: '검수 중', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30' },
    approved: { label: '승인됨', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' },
    rejected: { label: '반려됨', color: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30' },
  }
  const cfg = statusConfig[status] || statusConfig.pending
  
  // 타입별 제목 추출
  let title = ''
  let subtitle = ''
  if (type === 'concert') {
    title = submission.title || '(제목 없음)'
    subtitle = submission.artist?.name || submission.artist_name || ''
  } else if (type === 'artist') {
    title = submission.name || '(이름 없음)'
    subtitle = submission.name_jp || ''
  } else {
    title = submission.name || '(이름 없음)'
    subtitle = submission.venue || submission.city || ''
  }
  
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {subtitle}
            </div>
          )}
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      
      <div className="text-[10px] text-zinc-400">
        {new Date(submission.created_at).toLocaleDateString('ko', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </div>
      
      {status === 'rejected' && submission.reject_reason && (
        <div className="mt-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
          <div className="text-[10px] text-red-600 dark:text-red-400 font-bold mb-0.5">반려 사유</div>
          <div className="text-xs text-zinc-700 dark:text-zinc-300">
            {submission.reject_reason}
          </div>
        </div>
      )}
    </div>
  )
}