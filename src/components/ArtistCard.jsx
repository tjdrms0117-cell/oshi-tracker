import { Star, Music, Edit3, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

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
          {/* 컬러 도트 */}
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
          >
            <Music className="w-5 h-5 text-white" />
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
            <div className="flex items-center gap-2 mt-1.5 text-[10px]">
              {artist.upcoming_concerts > 0 && (
                <span className="font-bold text-pink-600 dark:text-pink-400">
                  예정 {artist.upcoming_concerts}
                </span>
              )}
              {artist.past_concerts > 0 && (
                <span className="text-zinc-400 dark:text-zinc-500">
                  지난 {artist.past_concerts}
                </span>
              )}
              {artist.total_concerts === 0 && (
                <span className="text-zinc-400 dark:text-zinc-500 italic">
                  공연 없음
                </span>
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
