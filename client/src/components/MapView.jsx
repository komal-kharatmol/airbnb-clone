import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { List, Map as MapIcon, Star } from 'lucide-react';

const css = `
.price-pin-wrap{background:transparent;border:0}
.price-pin{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;padding:7px 11px;border-radius:999px;
  background:#fff;color:#222;font:600 13px/1 system-ui,sans-serif;border:1px solid rgba(0,0,0,.1);
  box-shadow:0 2px 8px rgba(0,0,0,.28);cursor:pointer;transition:transform .12s ease,background .12s ease,color .12s ease}
.price-pin:hover,.price-pin.active{background:#222222;color:#fff;transform:translate(-50%,-50%) scale(1.07)}
.airbnb-popup .leaflet-popup-content-wrapper{padding:0;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.28)}
.airbnb-popup .leaflet-popup-content{margin:0;width:260px!important}
.airbnb-popup a.leaflet-popup-close-button{top:8px;right:8px;width:26px;height:26px;line-height:24px;border-radius:50%;
  background:#fff;color:#222;font-size:18px;text-align:center;padding:0;box-shadow:0 1px 4px rgba(0,0,0,.3)}
`;

const iconCache = {};
function pinIcon(price, active) {
  const key = `${price}-${active}`;
  if (!iconCache[key]) {
    iconCache[key] = L.divIcon({
      className: 'price-pin-wrap',
      html: `<div class="price-pin${active ? ' active' : ''}">₹${Number(price).toLocaleString('en-IN')}</div>`,
      iconSize: [0, 0],
    });
  }
  return iconCache[key];
}

const hasCoords = (l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude);

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [60, 60], maxZoom: 15 });
  }, [points, map]);
  return null;
}

export default function MapView({ listings = [] }) {
  const [activeId, setActiveId] = useState(null);
  const points = useMemo(() => listings.filter(hasCoords), [listings]);

  if (!points.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-center text-sm text-neutral-500">
        None of these places have a map location yet.
        <br />
        Import the dataset, or switch back to the list.
      </div>
    );
  }

  return (
    <div className="relative isolate h-[72vh] min-h-[420px] overflow-hidden rounded-2xl border border-neutral-200">
      <style>{css}</style>
      <MapContainer center={[points[0].latitude, points[0].longitude]} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />
        {points.map((l) => (
          <Marker
            key={l.id}
            position={[l.latitude, l.longitude]}
            icon={pinIcon(l.price, activeId === l.id)}
            riseOnHover
            zIndexOffset={activeId === l.id ? 1000 : 0}
            eventHandlers={{ click: () => setActiveId(l.id), popupclose: () => setActiveId((a) => (a === l.id ? null : a)) }}
          >
            <Popup className="airbnb-popup" closeButton autoPanPadding={[40, 40]}>
              <Link to={`/listings/${l.id}`} className="block text-neutral-900 no-underline">
                <img src={l.images?.[0]} alt={l.title} className="h-40 w-full bg-neutral-100 object-cover" />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold">{l.title}</p>
                    {l.rating && (
                      <span className="flex flex-none items-center gap-1 text-sm">
                        <Star size={12} className="fill-current" /> {l.rating}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">{l.location}</p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">₹{l.price.toLocaleString('en-IN')}</span> night
                  </p>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/**
 * Wrap the listing grid in Home.jsx:
 *   <MapToggle listings={listings} loading={loading}> ...your existing grid... </MapToggle>
 * Shows the grid by default, the map when the pill is pressed.
 */
export function MapToggle({ listings = [], loading = false, children }) {
  const [showMap, setShowMap] = useState(false);

  const toggle = () => {
    setShowMap((s) => !s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {showMap ? <MapView listings={listings} /> : children}
      {!loading && (
        <button
          onClick={toggle}
          className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#222222] px-5 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:scale-105"
        >
          {showMap ? (
            <>
              Show list <List size={16} />
            </>
          ) : (
            <>
              Show map <MapIcon size={16} />
            </>
          )}
        </button>
      )}
    </>
  );
}
