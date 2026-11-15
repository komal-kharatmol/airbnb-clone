import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, SearchX, X } from 'lucide-react';
import { api } from '../api';
import CategoryBar from '../components/CategoryBar';
import FilterModal, { DEFAULT_FILTERS, activeFilterCount, buildQuery } from '../components/FilterModal';
import ListingCard, { ListingCardSkeleton } from '../components/ListingCard';

const shortDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function Home() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const location = params.get('location') || '';
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = params.get('guests') || '';

  const [category, setCategory] = useState('All');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const base = useMemo(() => ({ category, location, checkIn, checkOut, guests }), [category, location, checkIn, checkOut, guests]);
  const query = useMemo(() => buildQuery({ ...base, filters }), [base, filters]);
  const filterCount = activeFilterCount(filters);
  const nights = checkIn && checkOut ? Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5) : 0;
  const hasSearch = location || (checkIn && checkOut) || guests;

  useEffect(() => {
    let dead = false;
    setLoading(true);
    setError('');
    api('/listings?' + query)
      .then((r) => !dead && setListings(r))
      .catch((e) => !dead && setError(e.message || 'Something went wrong'))
      .finally(() => !dead && setLoading(false));
    return () => { dead = true; };
  }, [query, retry]);

  const clearAll = () => { setCategory('All'); setFilters(DEFAULT_FILTERS); nav('/'); };

  const chips = [
    location && { key: 'loc', label: location },
    checkIn && checkOut && { key: 'dates', label: `${shortDate(checkIn)} – ${shortDate(checkOut)}` },
    guests && { key: 'guests', label: `${guests} guest${guests > 1 ? 's' : ''}` },
  ].filter(Boolean);

  return (
    <div>
      <CategoryBar value={category} onChange={setCategory} filterCount={filterCount} onOpenFilters={() => setShowFilters(true)} />

      {/* search summary */}
      {(hasSearch || filterCount > 0) && (
        <div className="mb-6 mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c.key} className="rounded-full border border-[#DDDDDD] px-4 py-1.5 text-sm font-medium">{c.label}</span>
          ))}
          <button onClick={clearAll} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold underline hover:bg-[#F7F7F7]">
            <X size={14} /> Clear all
          </button>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <p className="mb-4 mt-2 text-sm text-[#717171]">{listings.length} stay{listings.length > 1 ? 's' : ''}{category !== 'All' ? ` in ${category}` : ''}</p>
      )}

      {error ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <AlertCircle size={40} className="mx-auto text-[#C13515]" />
          <h2 className="mt-4 text-xl font-semibold">We couldn't load stays</h2>
          <p className="mt-2 text-[#717171]">{error}. Make sure the backend is running on port 5000.</p>
          <button onClick={() => setRetry((n) => n + 1)} className="mt-6 rounded-lg bg-[#222222] px-6 py-3 font-semibold text-white hover:bg-black">Try again</button>
        </div>
      ) : loading ? (
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <SearchX size={44} className="mx-auto text-[#717171]" />
          <h2 className="mt-4 text-xl font-semibold">No exact matches</h2>
          <p className="mt-2 text-[#717171]">Try changing or removing some of your filters, or search a different place.</p>
          <button onClick={clearAll} className="mt-6 rounded-lg border border-[#222222] px-6 py-3 font-semibold hover:bg-[#F7F7F7]">Remove all filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {listings.map((l) => <ListingCard key={l.id} l={l} nights={nights} />)}
        </div>
      )}

      <FilterModal open={showFilters} onClose={() => setShowFilters(false)} filters={filters} onApply={setFilters} base={base} />
    </div>
  );
}
