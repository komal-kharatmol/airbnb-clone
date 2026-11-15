import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Globe, Instagram, Twitter } from 'lucide-react';

const INSPIRATION = {
  Popular: [
    ['Goa', 'Beach house rentals'], ['Jaipur', 'Heritage stays'], ['Udaipur', 'Lake view rentals'], ['Manali', 'Mountain cabins'],
    ['Mumbai', 'Sea-facing flats'], ['Pune', 'City apartments'], ['Rishikesh', 'Riverside stays'], ['Ooty', 'Hill station cottages'],
    ['Kochi', 'Backwater homes'], ['Bengaluru', 'Garden apartments'], ['Delhi', 'Boutique stays'], ['Shimla', 'Pine forest cabins'],
  ],
  Beach: [
    ['Goa', 'Beachfront villas'], ['Gokarna', 'Cliffside cottages'], ['Alibaug', 'Weekend villas'], ['Pondicherry', 'French quarter stays'],
    ['Varkala', 'Cliff view rooms'], ['Kovalam', 'Surf stays'], ['Diu', 'Seaside homes'], ['Andaman', 'Island retreats'],
    ['Mandrem', 'Palm grove stays'], ['Marari', 'Quiet beach homes'], ['Ganpatipule', 'Coastal cottages'], ['Digha', 'Budget beach stays'],
  ],
  'Mountains & cabins': [
    ['Manali', 'Apple orchard cabins'], ['Munnar', 'Tea estate stays'], ['Coorg', 'Coffee plantation homes'], ['Kasol', 'Riverside cabins'],
    ['Mussoorie', 'Valley view rooms'], ['Darjeeling', 'Himalayan views'], ['Nainital', 'Lakeside cottages'], ['Landour', 'Woodland cabins'],
    ['Spiti', 'Remote homestays'], ['Wayanad', 'Treehouses'], ['Kodaikanal', 'Misty cottages'], ['Dalhousie', 'Colonial stays'],
  ],
  'Unique stays': [
    ['Jaisalmer', 'Desert camps'], ['Hampi', 'Boulder-side stays'], ['Kutch', 'Bhunga huts'], ['Auroville', 'Eco homes'],
    ['Pushkar', 'Courtyard havelis'], ['Lonavala', 'Glass cabins'], ['Alleppey', 'Houseboats'], ['Jodhpur', 'Blue city rooftops'],
    ['Khajuraho', 'Heritage homes'], ['Sundarbans', 'Riverfront huts'], ['Gir', 'Safari lodges'], ['Orchha', 'Palace stays'],
  ],
};

const COLUMNS = [
  {
    title: 'Support',
    links: ['Help Centre', 'AirCover', 'Anti-discrimination', 'Disability support', 'Cancellation options', 'Report neighbourhood concern'],
  },
  {
    title: 'Hosting',
    links: [
      { label: 'Airbnb your home', to: '/host/new' },
      'AirCover for Hosts',
      'Hosting resources',
      'Community forum',
      'Hosting responsibly',
      'Join a free Hosting class',
    ],
  },
  {
    title: 'Airbnb',
    links: ['Newsroom', 'New features', 'Careers', 'Investors', 'Gift cards', 'Airbnb.org emergency stays'],
  },
];

export default function Footer() {
  const tabs = Object.keys(INSPIRATION);
  const [tab, setTab] = useState(tabs[0]);

  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-100 text-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <h2 className="text-2xl font-semibold">Inspiration for future getaways</h2>

        <div role="tablist" className="mt-4 flex gap-6 overflow-x-auto border-b border-neutral-300">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px flex-none whitespace-nowrap border-b-2 pb-3 text-sm font-medium ${
                tab === t ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {INSPIRATION[tab].map(([place, kind]) => (
            <li key={place}>
              <Link to={`/?location=${encodeURIComponent(place)}`} className="block hover:underline">
                <span className="block text-sm font-medium">{place}</span>
                <span className="block text-sm text-neutral-500">{kind}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-neutral-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((l) => {
                  const label = typeof l === 'string' ? l : l.label;
                  return (
                    <li key={label}>
                      {typeof l === 'object' ? (
                        <Link to={l.to} className="hover:underline">{label}</Link>
                      ) : (
                        <span className="cursor-default hover:underline">{label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© 2026 Airbnb Clone</span>
            <span aria-hidden>·</span>
            <span className="hover:underline">Privacy</span>
            <span aria-hidden>·</span>
            <span className="hover:underline">Terms</span>
            <span aria-hidden>·</span>
            <span className="hover:underline">Sitemap</span>
            <span aria-hidden>·</span>
            <span className="hover:underline">Company details</span>
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <button className="flex items-center gap-2 font-medium hover:underline">
              <Globe size={16} /> English (IN)
            </button>
            <button className="font-medium hover:underline">₹ INR</button>
            <div className="flex items-center gap-4 text-neutral-700">
              <Facebook size={18} aria-label="Facebook" />
              <Twitter size={18} aria-label="Twitter" />
              <Instagram size={18} aria-label="Instagram" />
            </div>
          </div>
        </div>
        <p className="mx-auto max-w-7xl px-4 pb-6 text-xs text-neutral-500 sm:px-8">
          This is a learning project and is not affiliated with Airbnb, Inc.
        </p>
      </div>
    </footer>
  );
}
