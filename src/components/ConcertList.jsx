import ConcertCard from './ConcertCard'

export default function ConcertList({ 
  concerts, 
  oshiArtistIds = [],
  attendingConcertIds = [],
  isAdmin = false,
  onToggleAttending,
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {concerts.map((concert) => (
        <ConcertCard
          key={concert.id}
          concert={concert}
          isOshi={oshiArtistIds.includes(concert.artist_id)}
          isAttending={attendingConcertIds.includes(concert.id)}
          isAdmin={isAdmin}
          onToggleAttending={onToggleAttending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
