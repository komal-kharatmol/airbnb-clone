import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../api';

export const PRICE_MAX = 25000;
const STEP = 500;
export const DEFAULT_FILTERS = { minPrice: 0, maxPrice: PRICE_MAX, bedrooms: 0, amenities: [] };
export const AMENITIES = ['Wifi', 'Pool', 'Kitchen', 'Air conditioning', 'Heating', 'Free parking', 'Gym', 'Breakfast included', 'Fireplace', 'Balcony'];
const BEDROOMS = [0, 1, 2, 3, 4];

/* Build the /api/listings query string from search + filters */
export function buildQuery({ category, location, checkIn, checkOut, guests, filters = DEFAULT_FILTERS }) {
  const p = new URLSearchParams();
  if (category && category !== 'All') p.set('category', category);
  if (location) p.set('location', location);
  if (checkIn && checkOut) { p.set('checkIn', checkIn); p.set('checkOut', checkOut); }
  if (guests) p.set('guests', guests);
  if (filters.minPrice > 0) p.set('minPrice', filters.minPrice);
  if (filters.maxPrice < PRICE_MAX) p.set('maxPrice', filters.maxPrice);
  if (filters.bedrooms > 0) p.set('bedrooms', filters.bedrooms);
  if (filters.amenities.length) p.set('amenities', filters.amenities.join(','));
  return p.toString();
}

export const activeFilterCount = (f) =>
  (f.minPrice > 0 || f.maxPrice < PRICE_MAX ? 1 : 0) + (f.bedrooms > 0 ? 1 : 0) + f.amenities.length;

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

function PriceInput({ label, value, onCommit }) {
  const [t, setT] = useState(String(value));
  useEffect(() => setT(String(value)), [value]);
  const commit = () => { const n = parseInt(t, 10); onCommit(Number.isNaN(n) ? value : n); };
  return (
    <label className="flex-1 cursor-text rounded-xl border border-[#B0B0B0] px-3 py-2 transition-all duration-200 focus-within:border-2 focus-within:border-[#222222] focus-within:px-[11px] focus-within:py-[7px] hover:border-[#222222]">
      <span className="block text-xs text-[#717171]">{label}</span>
      <span className="flex items-center gap-1 text-base">
        <span>₹</span>
        <input
          inputMode="numeric"
          value={t}
          onChange={(e) => setT(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-full bg-transparent outline-none"
        />
      </span>
    </label>
  );
}

export default function FilterModal({ open, onClose, filters, onApply, base }) {
  const [d, setD] = useState(filters);
  const [count, setCount] = useState(null); // null = loading, -1 = error

  useEffect(() => { if (open) setD(filters); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* scroll lock + Esc */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* live "Show N places" count (debounced) */
  useEffect(() => {
    if (!open) return undefined;
    setCount(null);
    let dead = false;
    const t = setTimeout(() => {
      api('/listings?' + buildQuery({ ...base, filters: d }))
        .then((r) => !dead && setCount(r.length))
        .catch(() => !dead && setCount(-1));
    }, 350);
    return () => { dead = true; clearTimeout(t); };
  }, [open, d]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const toggleAmenity = (a) =>
    setD((p) => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a] }));

  const pct = (v) => (v / PRICE_MAX) * 100;
  const dirty = activeFilterCount(d) > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      <style>{`
        .range-thumb{position:absolute;inset:0;width:100%;height:100%;margin:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none}
        .range-thumb::-webkit-slider-runnable-track{background:transparent;height:100%}
        .range-thumb::-moz-range-track{background:transparent}
        .range-thumb::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;height:28px;width:28px;border-radius:50%;background:#fff;border:1px solid #B0B0B0;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:grab;transition:transform .15s,border-color .15s;margin-top:0}
        .range-thumb::-moz-range-thumb{pointer-events:auto;height:26px;width:26px;border-radius:50%;background:#fff;border:1px solid #B0B0B0;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:grab}
        .range-thumb::-webkit-slider-thumb:hover{border-color:#222;transform:scale(1.08)}
        .range-thumb:active::-webkit-slider-thumb{cursor:grabbing;transform:scale(1.12);border-color:#222}
      `}</style>

      <div className="flex max-h-[92vh] w-full max-w-[780px] animate-pop flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* header */}
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-[#DDDDDD]">
          <button onClick={onClose} aria-label="Close filters" className="absolute left-4 grid h-8 w-8 place-items-center rounded-full hover:bg-[#F7F7F7]">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-base font-semibold">Filters</h2>
        </div>

        {/* body */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 sm:px-8">
          {/* price */}
          <section>
            <h3 className="text-[22px] font-semibold">Price range</h3>
            <p className="mb-6 mt-1 text-sm text-[#717171]">Nightly prices before fees and taxes</p>
            <div className="relative mx-3.5 h-7">
              <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-[#DDDDDD]" />
              <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#222222]" style={{ left: `${pct(d.minPrice)}%`, right: `${100 - pct(d.maxPrice)}%` }} />
              <input type="range" className="range-thumb" aria-label="Minimum price" min={0} max={PRICE_MAX} step={STEP} value={d.minPrice}
                onChange={(e) => setD((p) => ({ ...p, minPrice: Math.min(+e.target.value, p.maxPrice - STEP) }))} />
              <input type="range" className="range-thumb" aria-label="Maximum price" min={0} max={PRICE_MAX} step={STEP} value={d.maxPrice}
                onChange={(e) => setD((p) => ({ ...p, maxPrice: Math.max(+e.target.value, p.minPrice + STEP) }))} />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <PriceInput label="Minimum" value={d.minPrice} onCommit={(n) => setD((p) => ({ ...p, minPrice: clamp(n, 0, p.maxPrice - STEP) }))} />
              <span className="text-[#717171]">–</span>
              <PriceInput label="Maximum" value={d.maxPrice} onCommit={(n) => setD((p) => ({ ...p, maxPrice: clamp(n, p.minPrice + STEP, PRICE_MAX) }))} />
            </div>
          </section>

          <hr className="border-[#DDDDDD]" />

          {/* bedrooms */}
          <section>
            <h3 className="mb-4 text-[22px] font-semibold">Bedrooms</h3>
            <div className="flex flex-wrap gap-3">
              {BEDROOMS.map((n) => {
                const on = d.bedrooms === n;
                return (
                  <button key={n} type="button" onClick={() => setD((p) => ({ ...p, bedrooms: n }))} aria-pressed={on}
                    className={`min-w-[64px] rounded-full border px-5 py-2.5 text-sm font-medium ${on ? 'border-[#222222] bg-[#222222] text-white' : 'border-[#B0B0B0] hover:border-[#222222]'}`}>
                    {n === 0 ? 'Any' : n === 4 ? '4+' : n}
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="border-[#DDDDDD]" />

          {/* amenities */}
          <section>
            <h3 className="mb-4 text-[22px] font-semibold">Amenities</h3>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {AMENITIES.map((a) => {
                const on = d.amenities.includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} role="checkbox" aria-checked={on}
                    className="flex items-center gap-4 text-left text-base active:scale-100">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-all duration-200 ${on ? 'border-[#222222] bg-[#222222]' : 'border-[#B0B0B0] hover:border-[#222222]'}`}>
                      {on && <Check size={14} strokeWidth={3} className="text-white" />}
                    </span>
                    {a}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#DDDDDD] px-6 py-4 sm:px-8">
          <button type="button" onClick={() => setD(DEFAULT_FILTERS)} disabled={!dirty}
            className="rounded-lg px-3 py-2 text-base font-semibold underline hover:bg-[#F7F7F7] disabled:no-underline disabled:opacity-40 disabled:hover:bg-transparent">
            Clear all
          </button>
          <button type="button" onClick={() => { onApply(d); onClose(); }}
            className="flex h-12 min-w-[170px] items-center justify-center rounded-lg bg-[#222222] px-6 text-base font-semibold text-white hover:bg-black">
            {count === null ? <span className="skeleton !bg-white/20 h-4 w-28" /> : count === -1 ? 'Show places' : count === 0 ? 'No exact matches' : `Show ${count} place${count > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
