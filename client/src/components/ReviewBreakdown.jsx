import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, MapPin, MessageSquare, Sparkles, Star, Tag } from 'lucide-react';
import { api } from '../api';

const CATS = [
  { key: 'cleanliness', label: 'Cleanliness', Icon: Sparkles },
  { key: 'accuracy', label: 'Accuracy', Icon: CheckCircle2 },
  { key: 'checkIn', label: 'Check-in', Icon: KeyRound },
  { key: 'communication', label: 'Communication', Icon: MessageSquare },
  { key: 'location', label: 'Location', Icon: MapPin },
  { key: 'value', label: 'Value', Icon: Tag },
];

export default function ReviewBreakdown({ listingId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let live = true;
    setData(null);
    api(`/listings/${listingId}/breakdown`)
      .then((d) => live && setData(d))
      .catch(() => live && setData({ count: 0 }));
    return () => {
      live = false;
    };
  }, [listingId]);

  if (!data || !data.count) return null;

  return (
    <section className="py-8">
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Star size={22} className="fill-current" />
        {data.overall.toFixed(2)} · {data.count} {data.count === 1 ? 'review' : 'reviews'}
      </h2>

      <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
        {CATS.map(({ key, label, Icon }) => {
          const v = data.categories[key];
          return (
            <div key={key} className="border-neutral-200 lg:border-r lg:pr-6 last:lg:border-r-0">
              <p className="text-sm font-medium text-neutral-800">{label}</p>
              <p className="mt-1 text-lg font-semibold">{v.toFixed(1)}</p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-200" role="img" aria-label={`${label} ${v.toFixed(1)} out of 5`}>
                <div className="h-full rounded-full bg-neutral-900" style={{ width: `${(v / 5) * 100}%` }} />
              </div>
              <Icon size={24} className="mt-4 text-neutral-700" strokeWidth={1.5} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
