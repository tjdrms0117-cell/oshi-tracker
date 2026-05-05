import { useState } from 'react'
import { X, Save, Music } from 'lucide-react'
import { updateArtist } from '../lib/api'

export default function ArtistEditModal({ artist, onClose, onDone }) {
  const [name, setName] = useState(artist.name || '')
  const [nameJp, setNameJp] = useState(artist.name_jp || '')
  const [color, setColor] = useState(artist.color || '#e91e63')
  const [topSongTitle, setTopSongTitle] = useState(artist.top_song_title || '')
  const [topSongTitleJp, setTopSongTitleJp] = useState(artist.top_song_title_jp || '')
  const [topSongUrl, setTopSongUrl] = useState(artist.top_song_youtube_url || '')
  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    if (!name.trim()) {
      alert('이름은 필수예요')
      return
    }
    
    setSaving(true)
    try {
      await updateArtist(artist.id, {
        name: name.trim(),
        name_jp: nameJp.trim() || null,
        color,
        top_song_title: topSongTitle.trim() || null,
        top_song_title_jp: topSongTitleJp.trim() || null,
        top_song_youtube_url: topSongUrl.trim() || null,
      })
      alert('수정 완료')
      onDone()
    } catch (err) {
      alert('수정 중 오류: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const colorOptions = [
    { color: '#e91e63', label: 'J-POP 핑크' },
    { color: '#9c27b0', label: '시티팝 보라' },
    { color: '#00acc1', label: '록 시안' },
    { color: '#5c6bc0', label: '우타이테 인디고' },
    { color: '#f57c00', label: '싱송 오렌지' },
    { color: '#10b981', label: '인디 그린' },
    { color: '#ffa726', label: '판타지 노랑' },
    { color: '#7e57c2', label: '몽환 보라' },
  ]
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-5"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            가수 수정
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">
              한국어 이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">
              원어 이름 (영어/일본어)
            </label>
            <input
              type="text"
              value={nameJp}
              onChange={(e) => setNameJp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 block">
              컬러
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((c) => (
                <button
                  key={c.color}
                  onClick={() => setColor(c.color)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border-2 transition"
                  style={{
                    backgroundColor: color === c.color ? c.color : 'transparent',
                    color: color === c.color ? 'white' : c.color,
                    borderColor: c.color,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-3 border-t border-stone-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
              <Music className="w-3 h-3" />
              대표곡 정보
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-zinc-500 mb-1 block">대표곡 한국어</label>
                <input
                  type="text"
                  value={topSongTitle}
                  onChange={(e) => setTopSongTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-zinc-500 mb-1 block">대표곡 원어</label>
                <input
                  type="text"
                  value={topSongTitleJp}
                  onChange={(e) => setTopSongTitleJp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-zinc-500 mb-1 block">YouTube URL</label>
                <input
                  type="text"
                  value={topSongUrl}
                  onChange={(e) => setTopSongUrl(e.target.value)}
                  placeholder="https://youtu.be/abc123"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 outline-none focus:border-pink-300"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-stone-200 dark:border-zinc-800 p-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-500 text-white flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
