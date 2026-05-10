import { useState } from 'react'
import { fetchArtists, fetchConcerts, createConcert, fetchVenues } from '../lib/api'
import { RefreshCw, Check, Plus } from 'lucide-react'

const SUPABASE_URL = 'https://edrhvbdbpmntfgavtacp.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_URL = `${SUPABASE_URL}/functions/v1/kopis-proxy`

function parseXML(xmlStr) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'text/xml')
  return Array.from(doc.querySelectorAll('db')).map(db => ({
    id: db.querySelector('mt20id')?.textContent,
    name: db.querySelector('prfnm')?.textContent,
    from: db.querySelector('prfpdfrom')?.textContent,
    to: db.querySelector('prfpdto')?.textContent,
    venue: db.querySelector('fcltynm')?.textContent,
    area: db.querySelector('area')?.textContent,
    poster: db.querySelector('poster')?.textContent,
    state: db.querySelector('prfstate')?.textContent,
    genre: db.querySelector('genrenm')?.textContent,
  }))
}

async function searchKopis(shprfnm) {
  const r = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      stdate: '20240101',
      eddate: '20261231',
      page: 1,
      rows: 100,
      shprfnm,
    })
  })
  const text = await r.text()
  return parseXML(text).filter(p => p.genre === '대중음악')
}

export default function KopisMatcher({ session }) {
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState(null)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [statusMsg, setStatusMsg] = useState('')

  const handleFetch = async () => {
    setLoading(true)
    setMatches([])
    setStats(null)
    setStatusMsg('')

    try {
      const [artists, existingConcerts] = await Promise.all([
        fetchArtists(),
        fetchConcerts(),
      ])

      const results = []
      const seen = new Set()

      for (const artist of artists) {
        const searchTerms = []
        if (artist.name_jp && artist.name_jp.trim()) {
          searchTerms.push(artist.name_jp.trim())
        }

        for (const term of searchTerms) {
          setStatusMsg(`검색 중: ${artist.name} (${term})`)
          try {
            const perfs = await searchKopis(term)

            for (const perf of perfs) {
              if (seen.has(perf.id)) continue
              seen.add(perf.id)

              const fromDate = perf.from?.replace(/\./g, '-')
              const alreadyExists = existingConcerts.some(c =>
                c.artist_id === artist.id && c.date === fromDate
              )
              results.push({ ...perf, matchedArtist: artist, alreadyExists, fromDate })
            }
          } catch (e) {
            console.error(`검색 실패 (${term}):`, e)
          }
          await new Promise(r => setTimeout(r, 200))
        }
      }

      setMatches(results)
      setStats({
        total: artists.length,
        matched: results.length,
        newCount: results.filter(r => !r.alreadyExists).length,
      })
      setStatusMsg('')
    } catch (e) {
      setStatusMsg('오류: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (match) => {
    setSaving(prev => ({ ...prev, [match.id]: true }))
    try {
      const venues = await fetchVenues({ country: 'korea' })
      const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/[()（）\[\]·\-\.]/g, '')
      const venueMatch = venues.find(v =>
        normalize(match.venue).includes(normalize(v.name)) ||
        normalize(v.name).includes(normalize(match.venue)) ||
        (v.name_local && normalize(match.venue).includes(normalize(v.name_local)))
      )
      await createConcert({
        artist_id: match.matchedArtist.id,
        title: match.name,
        country: 'korea',
        date: match.fromDate,
        venue: match.venue,
        venue_id: venueMatch?.id || null,
        poster_url: match.poster || null,
      })
      setSaved(prev => ({ ...prev, [match.id]: true }))
      setMatches(prev => prev.map(m =>
        m.id === match.id ? { ...m, alreadyExists: true } : m
      ))
    } catch (e) {
      alert('저장 실패: ' + e.message)
    } finally {
      setSaving(prev => ({ ...prev, [match.id]: false }))
    }
  }

  const newMatches = matches.filter(m => !m.alreadyExists)
  const existsMatches = matches.filter(m => m.alreadyExists)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-zinc-700">KOPIS 내한 공연 자동 매칭</div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '조회 중...' : '조회 시작'}
        </button>
      </div>

      {statusMsg && (
        <div className="text-xs text-zinc-500 text-center py-2 animate-pulse">{statusMsg}</div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '검색한 아티스트', value: stats.total },
            { label: '매칭된 공연', value: stats.matched },
            { label: '신규', value: stats.newCount },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-center">
              <div className="text-[10px] text-zinc-500 mb-1">{s.label}</div>
              <div className="text-lg font-bold text-zinc-900">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {newMatches.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-pink-600">신규 {newMatches.length}건</div>
          {newMatches.map(m => (
            <div key={m.id} className="rounded-xl border-l-2 border-l-pink-400 border border-stone-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="text-sm font-bold text-zinc-900 leading-tight">{m.name}</div>
                <button
                  onClick={() => handleSave(m)}
                  disabled={saving[m.id] || saved[m.id]}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50 transition"
                >
                  {saved[m.id] ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {saving[m.id] ? '저장 중' : saved[m.id] ? '저장됨' : '추가'}
                </button>
              </div>
              <div className="text-[11px] text-zinc-500 flex flex-wrap gap-2">
                <span>📅 {m.from === m.to ? m.from : `${m.from} ~ ${m.to}`}</span>
                <span>📍 {m.venue}</span>
                <span>📌 {m.area}</span>
                <span>🎫 {m.state}</span>
              </div>
              <div className="mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${m.matchedArtist.color}20`, color: m.matchedArtist.color }}>
                  {m.matchedArtist.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {existsMatches.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-600">이미 등록됨 {existsMatches.length}건</div>
          {existsMatches.map(m => (
            <div key={m.id} className="rounded-xl border-l-2 border-l-emerald-400 border border-stone-200 bg-white p-3 opacity-60">
              <div className="text-sm font-bold text-zinc-900 leading-tight mb-1">{m.name}</div>
              <div className="text-[11px] text-zinc-500 flex flex-wrap gap-2">
                <span>📅 {m.from}</span>
                <span>📍 {m.venue}</span>
              </div>
              <div className="mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${m.matchedArtist.color}20`, color: m.matchedArtist.color }}>
                  {m.matchedArtist.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && matches.length === 0 && stats && (
        <div className="text-center py-12 text-sm text-zinc-400">매칭된 공연이 없어요</div>
      )}
    </div>
  )
}
