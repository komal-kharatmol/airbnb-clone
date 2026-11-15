/*
 * Inside Airbnb dataset importer  ->  server/prisma/import_dataset.js
 *
 * Usage (run from the /server folder):
 *   node prisma/import_dataset.js prisma/data/listings.csv --city "Amsterdam" --limit 60 --rate 90 --reset
 *
 * Arguments:
 *   <file>        .csv, .csv.gz or .json (default: looks in prisma/data/ for listings.json / listings.csv / listings.csv.gz)
 *   --limit N     how many listings to import (default 60)
 *   --city NAME   appended to the location so the search bar can find it, e.g. "Amsterdam"
 *   --rate X      price multiplier to convert the dataset currency to INR (default 83 = USD->INR; use 1 if already INR)
 *   --reset       delete existing listings, bookings, reviews and wishlists first (users are kept)
 *
 * Use the DETAILED listings file from insideairbnb.com/get-the-data (listings.csv.gz). The small
 * "summary" file has no picture_url, description or amenities.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const has = (n) => argv.includes('--' + n);

// ---------- fallback interior photos (swap any ID you like) ----------
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const INTERIORS = {
  bedroom: ['photo-1505693416388-ac5ce068fe85', 'photo-1540518614846-7eded433c457', 'photo-1522771739844-6a9f6d5f14af', 'photo-1616594039964-ae9021a400a0'],
  living: ['photo-1502672260266-1c1ef2d93688', 'photo-1513694203232-719a280e022f', 'photo-1493663284031-b7e3aefcae8e', 'photo-1560185007-cde436f6a4d0'],
  kitchen: ['photo-1556909114-f6e7ad7d3136', 'photo-1484154218962-a197022b5858', 'photo-1556911220-bff31c812dba', 'photo-1565538810643-b5bdb714032a'],
  bathroom: ['photo-1584622650111-993a426fbf0a', 'photo-1552321554-5fefe8c9ef14', 'photo-1507652313519-d4e9174996dd', 'photo-1620626011761-996317b8d101'],
};

const COMMENTS = {
  5: [
    'Exactly as described and spotless. {host} replied within minutes and check-in was effortless.',
    'Loved the location. Everything we needed was a short walk away. Would happily stay again.',
    "Comfortable bed, great shower, fast wifi. We didn't want to leave.",
    'Such a warm welcome from {host}. The little extras made the stay feel special.',
    "Beautiful space with lots of natural light. The photos don't do it justice.",
    'Quiet at night but close to cafes and transport. Perfect for a long weekend.',
    'Super clean, a well equipped kitchen and thoughtful touches throughout.',
    'Easy self check-in and clear instructions. Zero stress from start to finish.',
    'Perfect for our family trip. Plenty of space and the neighbourhood felt safe and friendly.',
    "One of the best stays we've had. Highly recommended.",
  ],
  4: [
    'Great place overall. The bed was comfy and the host was helpful. Street noise in the morning was the only downside.',
    'Good value for the area. A couple of small things needed attention but {host} sorted them quickly.',
    'Clean and well located. Smaller than the photos suggest but we had everything we needed.',
    'Lovely stay. Check-in took a little coordination but the place itself was great.',
    'Nice, comfortable and exactly what we needed for a short city break.',
    'Very good stay. Wifi was a bit slow in the evenings, otherwise no complaints.',
  ],
  3: [
    'Decent location and the host was friendly, but the place could have been cleaner.',
    'It was fine for a short stay. Not quite as bright as the photos but okay for the price.',
    'Comfortable enough, though the hot water took a while to warm up.',
    'Average stay. The listing is accurate but a few items in the kitchen were missing.',
  ],
};

const GUEST_NAMES = ['Aarav', 'Maya', 'Liam', 'Sofia', 'Noah', 'Priya', 'Emma', 'Rohan', 'Olivia', 'Karan', 'Mia', 'Ethan', 'Ananya', 'Lucas', 'Isha', 'Daniel', 'Zara', 'Arjun', 'Chloe', 'Vikram', 'Hannah', 'Kabir', 'Grace', 'Tom', 'Neha', 'Jack', 'Sara', 'Dev', 'Ella', 'Sam'];

// ---------- helpers ----------
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const clean = (v) =>
  String(v ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
const isTrue = (v) => ['t', 'true', '1', 'yes'].includes(String(v).toLowerCase());
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
const normRating = (v) => {
  const n = num(v);
  if (n == null || n <= 0) return null;
  return n > 5 ? +(n / 20).toFixed(2) : n; // some datasets use a 0-100 scale
};
const cleanTitle = (v) => {
  let t = clean(v);
  if (t.includes('★')) t = t.replace(/\s*·\s*★.*$/, '');
  return t.slice(0, 90);
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function loadRows(file) {
  let buf = fs.readFileSync(file);
  let name = file;
  if (name.endsWith('.gz')) { buf = zlib.gunzipSync(buf); name = name.slice(0, -3); }
  const text = buf.toString('utf8').replace(/^\uFEFF/, '');
  if (path.extname(name).toLowerCase() === '.json') {
    const j = JSON.parse(text);
    return Array.isArray(j) ? j : j.listings || j.data || j.results || [];
  }
  const [header, ...rest] = parseCSV(text);
  const cols = header.map((h) => h.trim());
  return rest.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}

function resolveFile() {
  if (argv[0] && !argv[0].startsWith('--')) return path.resolve(argv[0]);
  const dir = path.join(__dirname, 'data');
  for (const f of ['listings.json', 'listings.csv', 'listings.csv.gz']) {
    if (fs.existsSync(path.join(dir, f))) return path.join(dir, f);
  }
  return null;
}

const PRIORITY = /wifi|kitchen|pool|parking|air conditioning|washer|tv|heating|gym|hot tub|workspace|balcony|bbq|beach|view|garden/i;
function parseAmenities(v) {
  let arr = [];
  if (Array.isArray(v)) arr = v;
  else {
    const s = String(v || '').trim();
    if (!s) return [];
    try {
      const j = JSON.parse(s);
      arr = Array.isArray(j) ? j : [];
    } catch {
      arr = s.replace(/^[{[]|[}\]]$/g, '').split(',').map((x) => x.replace(/^\s*"|"\s*$/g, ''));
    }
  }
  const uniq = [...new Set(arr.map((x) => String(x).trim()).filter((x) => x && x.length <= 45))];
  return [...uniq.filter((a) => PRIORITY.test(a)), ...uniq.filter((a) => !PRIORITY.test(a))].slice(0, 16);
}

function buildImages(row, seed) {
  const main = String(row.picture_url || row.xl_picture_url || '').trim();
  let extra = [];
  if (Array.isArray(row.images)) extra = row.images;
  else if (typeof row.images === 'string' && row.images.trim().startsWith('[')) {
    try { extra = JSON.parse(row.images); } catch { extra = []; }
  }
  const have = [main, ...extra.map(String)].filter((u) => /^https?:\/\//.test(u));
  const pick = (arr, k) => U(arr[(seed + k) % arr.length]);
  const fallback = [pick(INTERIORS.bedroom, 0), pick(INTERIORS.living, 1), pick(INTERIORS.kitchen, 2), pick(INTERIORS.bathroom, 3)];
  return [...have, ...fallback].slice(0, 5);
}

function categorize(c, p85) {
  const hay = `${c.name} ${c.description} ${c.propertyType} ${c.amenities.join(' ')}`.toLowerCase();
  if (/cabin|cottage|chalet|farm|tiny home|treehouse|hut|bungalow|camper|barn|yurt/.test(c.propertyType.toLowerCase())) return 'Cabins';
  if (/\b(beach|beachfront|seaside|sea view|ocean|oceanfront|waterfront|lakefront)\b/.test(hay)) return 'Beach';
  if (c.price >= p85 || /villa|penthouse|castle|mansion|luxury/.test(hay)) return 'Luxury';
  if (/\b(panoramic|amazing view|stunning view|skyline|view of|rooftop|mountain view|city view|terrace)\b/.test(hay)) return 'Amazing Views';
  return 'City';
}

// ---------- main ----------
async function main() {
  const file = resolveFile();
  if (!file || !fs.existsSync(file)) {
    console.error('No dataset file found.\nDownload listings.csv.gz (detailed) for any city from https://insideairbnb.com/get-the-data/\nand put it in server/prisma/data/, or pass the path:  node prisma/import_dataset.js path/to/listings.csv');
    process.exit(1);
  }
  const limit = parseInt(flag('limit', '60'), 10);
  const rate = Number(flag('rate', '83')) || 1;
  const city = flag('city', '').trim();

  console.log(`Reading ${file} ...`);
  const raw = loadRows(file);
  console.log(`Found ${raw.length} rows`);

  const cands = [];
  for (const r of raw) {
    const picture = String(r.picture_url || r.xl_picture_url || '').trim();
    const lat = num(r.latitude);
    const lng = num(r.longitude);
    const price = num(r.price);
    const name = cleanTitle(r.name);
    if (!/^https?:\/\//.test(picture) || lat == null || lng == null || !(price > 0) || !name) continue;
    cands.push({ r, name, lat, lng, price: Math.max(500, Math.round((price * rate) / 10) * 10), rating: normRating(r.review_scores_rating) });
  }
  cands.sort((a, b) => (b.rating != null) - (a.rating != null));
  const chosen = cands.slice(0, limit);
  if (chosen.length < 50) console.warn(`Only ${chosen.length} usable listings (need picture_url, latitude, longitude, price, name).`);

  const prices = chosen.map((c) => c.price).sort((a, b) => a - b);
  const p85 = prices[Math.floor(prices.length * 0.85)] || Infinity;

  if (has('reset')) {
    await prisma.wishlist.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.listing.deleteMany();
    console.log('Cleared existing listings, bookings, reviews and wishlists');
  }

  const pw = await bcrypt.hash('password123', 10);
  const guests = [];
  for (let i = 0; i < GUEST_NAMES.length; i++) {
    const email = `${GUEST_NAMES[i].toLowerCase()}${i}@guest.demo`;
    guests.push(await prisma.user.upsert({ where: { email }, update: {}, create: { name: GUEST_NAMES[i], email, password: pw } }));
  }

  const hostCache = new Map();
  const getHost = async (name) => {
    const display = clean(name) || 'Airbnb Host';
    const key = slug(display) || `host${Math.abs(hashStr(display))}`;
    if (!hostCache.has(key)) {
      const email = `${key}@host.demo`;
      hostCache.set(key, await prisma.user.upsert({ where: { email }, update: {}, create: { name: display, email, password: pw } }));
    }
    return hostCache.get(key);
  };

  let reviewTotal = 0;
  for (const [idx, c] of chosen.entries()) {
    const r = c.r;
    const rand = mulberry32(hashStr(c.name) + idx);
    const host = await getHost(r.host_name);
    const overview = clean(r.neighborhood_overview);
    const description = [clean(r.description) || `${c.name}. A comfortable place to stay.`, overview && `The neighbourhood\n${overview}`].filter(Boolean).join('\n\n').slice(0, 1800);
    const amenities = parseAmenities(r.amenities);
    const propertyType = String(r.property_type || r.room_type || '').trim();
    const neigh = String(r.neighbourhood_cleansed || r.neighbourhood || '').trim();
    const location = city && !neigh.toLowerCase().includes(city.toLowerCase()) ? [neigh, city].filter(Boolean).join(', ') : neigh || city || 'Unknown location';
    const beds = num(r.beds);
    const bedrooms = Math.max(1, Math.round(num(r.bedrooms) ?? beds ?? 1));
    const base = { name: c.name, description, propertyType, amenities, price: c.price };

    const listing = await prisma.listing.create({
      data: {
        title: c.name,
        description,
        location,
        category: categorize(base, p85),
        price: c.price,
        guests: Math.max(1, Math.round(num(r.accommodates) ?? 2)),
        bedrooms,
        images: JSON.stringify(buildImages(r, idx)),
        amenities: JSON.stringify(amenities),
        latitude: c.lat,
        longitude: c.lng,
        propertyType: propertyType || null,
        neighbourhood: neigh || null,
        beds: beds != null ? Math.round(beds) : null,
        bathrooms: num(String(r.bathrooms_text ?? r.bathrooms ?? '').replace(/half/i, '0.5')),
        isSuperhost: isTrue(r.host_is_superhost),
        hostId: host.id,
      },
    });

    // realistic reviews: 3-8 per listing, scaled by the dataset's number_of_reviews
    const reported = num(r.number_of_reviews);
    const count = reported ? clamp(Math.round(reported / 8), 3, 8) : 4;
    const mean = c.rating ?? 4.6;
    const authors = [...guests].sort(() => rand() - 0.5).slice(0, count);
    const hostFirst = host.name.split(' ')[0];
    for (const g of authors) {
      const rating = clamp(Math.round(mean + (rand() + rand() - 1) * 1.6), 3, 5);
      const pool = COMMENTS[rating];
      const comment = pool[Math.floor(rand() * pool.length)].replace('{host}', hostFirst);
      const sub = () => clamp(Math.round(rating + (rand() + rand() - 1) * 1.2), 3, 5);
      const daysAgo = 14 + Math.floor(rand() * 540);
      await prisma.review.create({
        data: {
          rating,
          comment,
          cleanliness: sub(),
          accuracy: sub(),
          checkIn: sub(),
          communication: sub(),
          locationRating: sub(),
          valueRating: sub(),
          createdAt: new Date(Date.now() - daysAgo * 86400000),
          userId: g.id,
          listingId: listing.id,
        },
      });
      reviewTotal++;
    }
    if ((idx + 1) % 10 === 0) console.log(`  imported ${idx + 1}/${chosen.length}`);
  }

  console.log(`\nDone: ${chosen.length} listings, ${hostCache.size} hosts, ${reviewTotal} reviews.`);
  console.log('Demo hosts and guests all use the password: password123');
  console.log(`Example host login: ${[...hostCache.values()][0]?.email}`);
}

main()
  .catch((e) => {
    console.error('\nImport failed:', e.message);
    console.error('If this mentions an unknown field, run:  npx prisma db push && npx prisma generate');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
