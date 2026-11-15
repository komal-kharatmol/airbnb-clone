import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Gem, LayoutGrid, Mountain, SlidersHorizontal, TreePine, Umbrella } from 'lucide-react';

export const CATEGORIES = [
  { name: 'All', Icon: LayoutGrid },
  { name: 'Beach', Icon: Umbrella },
  { name: 'Cabins', Icon: TreePine },
  { name: 'Amazing Views', Icon: Mountain },
  { name: 'City', Icon: Building2 },
  { name: 'Luxury', Icon: Gem },
];

export default function CategoryBar({ value, onChange, filterCount = 0, onOpenFilters }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const check = () => {
      if (!el) return;
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    const onScroll = () => setStuck(window.scrollY > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  const arrow = 'absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[#DDDDDD] bg-white shadow-md hover:scale-105 hover:shadow-lg sm:grid';

  return (
    <div className={`sticky top-20 z-20 -mx-4 bg-white px-4 sm:-mx-8 sm:px-8 ${stuck ? 'shadow-[0_1px_0_#DDDDDD]' : ''} transition-shadow duration-200`}>
      <div className="flex items-center gap-4 py-3">
        <div className="relative min-w-0 flex-1">
          {canLeft && (
            <>
              <span className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-16 bg-gradient-to-r from-white to-transparent" />
              <button type="button" aria-label="Scroll categories left" onClick={() => scrollBy(-1)} className={`${arrow} left-0`}>
                <ChevronLeft size={16} />
              </button>
            </>
          )}

          <div ref={ref} className="no-scrollbar flex gap-8 overflow-x-auto scroll-smooth px-1 sm:gap-10">
            {CATEGORIES.map(({ name, Icon }) => {
              const on = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange(name)}
                  aria-pressed={on}
                  className={`group flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 pt-2 text-xs font-semibold ${
                    on ? 'border-[#222222] text-[#222222]' : 'border-transparent text-[#717171] hover:border-[#DDDDDD] hover:text-[#222222]'
                  }`}
                >
                  <Icon size={24} strokeWidth={on ? 2.2 : 1.8} className="transition-transform duration-200 group-hover:scale-110" />
                  <span className="whitespace-nowrap">{name}</span>
                </button>
              );
            })}
          </div>

          {canRight && (
            <>
              <span className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-16 bg-gradient-to-l from-white to-transparent" />
              <button type="button" aria-label="Scroll categories right" onClick={() => scrollBy(1)} className={`${arrow} right-0`}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          className="relative flex shrink-0 items-center gap-2 rounded-xl border border-[#DDDDDD] px-4 py-3 text-xs font-semibold hover:border-[#222222] hover:bg-[#F7F7F7]"
        >
          <SlidersHorizontal size={16} />
          Filters
          {filterCount > 0 && (
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#222222] px-1 text-[11px] text-white">{filterCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
