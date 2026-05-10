import { MapPin, Train, Users, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function VenueCard({ venue, isAdmin, onEdit, onDelete }) {
  const navigate = useNavigate()

  const handleClick = () => navigate(`/venues/${venue.id}`)

  const isJapan = venue.country === 'japan'
  const mapUrl = venue.address
    ? isJapan
      ? `https://www.google.com/maps/search/${encodeURIComponent((venue.name_local || venue.name) + ' ' + venue.address)}`
      : `https://map.naver.com/v5/search/${encodeURIComponent(venue.address)}`
    : null

  return (
    <div
      onClick={handleClick}
      className="relative rounded-2xl overflow-hidden bg-white border border-stone-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-900 leading-snug">
              {venue.name}
            </h3>
            {venue.name_local && (
              <p className="text-xs text-zinc-500 mt-0.5">{venue.name_local}</p>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-1 ml-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(venue) }}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-zinc-400 text-xs"
              >
                ✏️
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(venue) }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 text-xs"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-zinc-600">
          {venue.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <span>{venue.address}</span>
            </div>
          )}
          {venue.subway_info && (
            <div className="flex items-start gap-2">
              <Train className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <span>{venue.subway_info}</span>
            </div>
          )}
          {venue.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <span>{venue.capacity.toLocaleString()}명</span>
            </div>
          )}
        </div>

        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-3 text-[11px] text-cyan-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {isJapan ? 'Google 지도' : '네이버 지도'}
          </a>
        )}
      </div>
    </div>
  )
}