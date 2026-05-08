import ConcertCard from './ConcertCard'

export default function ConcertList({ 
  concerts, 
  oshiArtistIds = [],
  attendingConcertIds = [],
  isAdmin = false,
  onToggleAttending,
  onToggleAttendingDays,  
  onEdit,
  onDelete,
  emptyMessage = '공연이 없어요',
  emptySubMessage = '',
}) {
  if (concerts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 opacity-20">🎤</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
          {emptyMessage}
        </p>
        {emptySubMessage && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {emptySubMessage}
          </p>
        )}
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      {concerts.map((concert) => (
        <ConcertCard
          key={concert.id}
          concert={concert}
          isOshi={oshiArtistIds.includes(concert.artist_id)}
          isAttending={
            attendingConcertIds.includes(concert.id) ||
            (concert.is_series && concert.series_dates?.some(d => attendingConcertIds.includes(d.id)))
          }
          attendingConcertIds={attendingConcertIds}
          isAdmin={isAdmin}
          onToggleAttending={onToggleAttending}
          onToggleAttendingDays={onToggleAttendingDays}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}