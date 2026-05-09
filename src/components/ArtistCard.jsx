import { Star, Music, Edit3, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function ArtistCard({ 
  artist, 
  isOshi = false,
  onToggleOshi,
  isAdmin = false,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate()
  const [oshiLoading, setOshiLoading] = useState(false)
  
  const color = artist.color || '#888'
  const [profileImg, setProfileImg] = useState(null)

  useEffect(() => {
    if (!artist.youtube_channel_id) return
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
    if (!apiKey) return
    fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${artist.youtube_channel_id}&key=${apiKey}`)
      .then(r => r.json())
      .then(data => {
        const thumb = data.items?.[0]?.snippet?.thumbnails?.medium?.url
        if (thumb) setProfileImg(thumb)
      })
      .catch(() => {})
  }, [artist.youtube_channel_id])
  
  const handleCardClick = () => {
    navigate(`/artists/${artist.id}`)
  }
  
  const handleOshiClick = async (e) => {
    e.stopPropagation()
    if (oshiLoading) return
    setOshiLoading(true)
    try {
      await onToggleOshi(artist.id, isOshi)
    } finally {
      setOshiLoading(false)
    }
  }
  
  return (
    <div 
      onClick={handleCardClick}
      className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* 우측 상단 글로우 효과 */}
      <div 
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: color }}
      />
      
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* 프로필 이미지 또는 컬러 도트 */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
            {profileImg ? (
              <img src={profileImg} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          
          {/* 가수 정보 */}
          <div className="flex-1 min-w-0">
            <div 
              className="font-bold text-sm truncate"
              style={{ color }}
            >
              {artist.name}
            </div>
            {artist.name_jp && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {artist.name_jp}
              </div>
            )}
            
            {/* 공연 개수 */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {artist.upcoming_kr > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400">
                  🇰🇷 <span className="text-[10px]">{artist.upcoming_kr}</span>
                </span>
              )}
              {artist.upcoming_jp > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400">
                  🇯🇵 <span className="text-[10px]">{artist.upcoming_jp}</span>
                </span>
              )}
              {(artist.upcoming_festivals || []).some(f => f.country === 'korea') && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400">
                  🇰🇷 <span style={{ fontFamily: 'Georgia, serif', fontSize: '9px', fontStyle: 'italic' }}>Fes.</span>
                </span>
              )}
              {(artist.upcoming_festivals || []).some(f => f.country === 'japan') && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400">
                  🇯🇵 <span style={{ fontFamily: 'Georgia, serif', fontSize: '9px', fontStyle: 'italic' }}>Fes.</span>
                </span>
              )}
              {artist.upcoming_concerts === 0 && (artist.upcoming_festivals || []).length === 0 && (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">예정 없음</span>
              )}
              {artist.past_concerts > 0 && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">지난 {artist.past_concerts}</span>
              )}
            </div>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {onToggleOshi && (
              <button
                onClick={handleOshiClick}
                disabled={oshiLoading}
                className={`p-2 rounded-lg transition ${
                  isOshi
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500'
                    : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <Star className="w-4 h-4" fill={isOshi ? 'currentColor' : 'none'} />
              </button>
            )}
            
            {isAdmin && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(artist) }}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400"
                title="수정"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            
            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(artist) }}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
