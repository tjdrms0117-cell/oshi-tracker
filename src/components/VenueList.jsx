import { useState } from 'react'
import VenueCard from './VenueCard'

export default function VenueList({ venues, isAdmin, onEdit, onDelete, onAdd }) {
  const [country, setCountry] = useState('korea')

  const filtered = venues.filter(v => v.country === country)

  return (
    <div className="space-y-4">
      {/* 한국/일본 탭 */}
      <div className="flex gap-2 items-center justify-between">
        {[
          { id: 'korea', label: '🇰🇷 한국' },
          { id: 'japan', label: '🇯🇵 일본' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCountry(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition ${
              country === tab.id
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-stone-200 text-zinc-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      {isAdmin && (
          <button
            onClick={onAdd}
            className="px-3 py-2 rounded-full text-sm font-bold bg-pink-500 text-white hover:bg-pink-600 transition"
          >
            + 추가
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-20">🏟️</div>
          <p className="text-sm text-zinc-500">등록된 공연장이 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(venue => (
            <VenueCard
              key={venue.id}
              venue={venue}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
