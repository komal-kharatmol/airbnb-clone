require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const SECRET = process.env.JWT_SECRET || 'dev_secret';
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// ---------- helpers ----------
const h = (fn) => (req, res) =>
  fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: 'Server error' }); });

const auth = (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in to continue' });
  }
};

const token = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email });
const toArr = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\n,]/)).map((s) => String(s).trim()).filter(Boolean);

const out = (l) => {
  const r = l.reviews || [];
  return {
    ...l,
    images: JSON.parse(l.images),
    amenities: JSON.parse(l.amenities),
    reviewCount: r.length,
    rating: r.length ? +(r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(2) : null,
  };
};

const clean = (b) => {
  const price = parseInt(b.price, 10);
  const images = toArr(b.images);
  if (!b.title || !b.description || !b.location || !(price > 0) || !images.length) return null;
  return {
    title: String(b.title).trim(),
    description: String(b.description).trim(),
    location: String(b.location).trim(),
    category: b.category || 'City',
    price,
    guests: parseInt(b.guests, 10) || 1,
    bedrooms: parseInt(b.bedrooms, 10) || 1,
    images: JSON.stringify(images),
    amenities: JSON.stringify(toArr(b.amenities)),
  };
};

const withMeta = { host: { select: { id: true, name: true, createdAt: true } }, reviews: { select: { rating: true } } };

// ---------- auth ----------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/signup', h(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: 'Email is already registered' });
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: await bcrypt.hash(password, 10) },
  });
  res.status(201).json({ token: token(user), user: pub(user) });
}));

app.post('/api/auth/login', h(async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await prisma.user.findUnique({ where: { email: email.toLowerCase() } }));
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: token(user), user: pub(user) });
}));

app.get('/api/auth/me', auth, h(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user: pub(user) });
}));

// ---------- listings ----------
app.get('/api/listings', h(async (req, res) => {
  const { category, location, minPrice, maxPrice, guests, bedrooms, amenities, checkIn, checkOut } = req.query;
  const and = [];

  if (category && category !== 'All') and.push({ category: String(category) });
  if (location) {
    and.push({ OR: [{ location: { contains: String(location) } }, { title: { contains: String(location) } }] });
  }
  if (minPrice && Number(minPrice) > 0) and.push({ price: { gte: parseInt(minPrice, 10) } });
  if (maxPrice && Number(maxPrice) > 0) and.push({ price: { lte: parseInt(maxPrice, 10) } });
  if (guests && Number(guests) > 0) and.push({ guests: { gte: parseInt(guests, 10) } });
  if (bedrooms && Number(bedrooms) > 0) and.push({ bedrooms: { gte: parseInt(bedrooms, 10) } });

  // every selected amenity must be present (amenities are stored as a JSON string)
  String(amenities || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .forEach((a) => and.push({ amenities: { contains: a } }));

  // hide stays that already have a confirmed booking overlapping the chosen dates
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (checkIn && checkOut && !isNaN(start) && !isNaN(end) && end > start) {
    const booked = await prisma.booking.findMany({
      where: { status: 'CONFIRMED', startDate: { lt: end }, endDate: { gt: start } },
      select: { listingId: true },
    });
    if (booked.length) and.push({ id: { notIn: [...new Set(booked.map((b) => b.listingId))] } });
  }

  const rows = await prisma.listing.findMany({
    where: and.length ? { AND: and } : {},
    include: withMeta,
    orderBy: { id: 'asc' },
  });
  res.json(rows.map(out));
}));

app.get('/api/listings/mine', auth, h(async (req, res) => {
  const rows = await prisma.listing.findMany({ where: { hostId: req.user.id }, include: withMeta, orderBy: { id: 'desc' } });
  res.json(rows.map(out));
}));

app.get('/api/listings/:id', h(async (req, res) => {
  const l = await prisma.listing.findUnique({
    where: { id: +req.params.id },
    include: {
      host: withMeta.host,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      bookings: { where: { status: 'CONFIRMED' }, select: { startDate: true, endDate: true } },
    },
  });
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  res.json({ ...out(l), reviews: l.reviews });
}));

app.post('/api/listings', auth, h(async (req, res) => {
  const data = clean(req.body);
  if (!data) return res.status(400).json({ error: 'Title, description, location, price and at least one image are required' });
  const l = await prisma.listing.create({ data: { ...data, hostId: req.user.id }, include: withMeta });
  res.status(201).json(out(l));
}));

app.put('/api/listings/:id', auth, h(async (req, res) => {
  const l = await prisma.listing.findUnique({ where: { id: +req.params.id } });
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  if (l.hostId !== req.user.id) return res.status(403).json({ error: 'You can only edit your own listings' });
  const data = clean(req.body);
  if (!data) return res.status(400).json({ error: 'Title, description, location, price and at least one image are required' });
  const up = await prisma.listing.update({ where: { id: l.id }, data, include: withMeta });
  res.json(out(up));
}));

app.delete('/api/listings/:id', auth, h(async (req, res) => {
  const l = await prisma.listing.findUnique({ where: { id: +req.params.id } });
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  if (l.hostId !== req.user.id) return res.status(403).json({ error: 'You can only delete your own listings' });
  await prisma.listing.delete({ where: { id: l.id } });
  res.json({ ok: true });
}));

// ---------- bookings ----------
app.post('/api/bookings', auth, h(async (req, res) => {
  const { listingId, startDate, endDate } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) return res.status(400).json({ error: 'Please choose valid dates' });
  if (end <= start) return res.status(400).json({ error: 'Check-out must be after check-in' });
  const today = new Date(new Date().toISOString().slice(0, 10));
  if (start < today) return res.status(400).json({ error: 'Check-in cannot be in the past' });

  const l = await prisma.listing.findUnique({ where: { id: +listingId } });
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  if (l.hostId === req.user.id) return res.status(400).json({ error: 'You cannot book your own listing' });

  const clash = await prisma.booking.findFirst({
    where: { listingId: l.id, status: 'CONFIRMED', startDate: { lt: end }, endDate: { gt: start } },
  });
  if (clash) return res.status(409).json({ error: 'Those dates are already booked. Please pick different dates.' });

  const nights = Math.round((end - start) / 86400000);
  const b = await prisma.booking.create({
    data: { listingId: l.id, userId: req.user.id, startDate: start, endDate: end, totalPrice: nights * l.price },
  });
  res.status(201).json(b);
}));

app.get('/api/bookings/mine', auth, h(async (req, res) => {
  const rows = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { listing: true, review: true },
    orderBy: { startDate: 'desc' },
  });
  res.json(rows.map((b) => ({ ...b, listing: { ...b.listing, images: JSON.parse(b.listing.images), amenities: JSON.parse(b.listing.amenities) } })));
}));

app.delete('/api/bookings/:id', auth, h(async (req, res) => {
  const b = await prisma.booking.findUnique({ where: { id: +req.params.id } });
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (b.userId !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
  const up = await prisma.booking.update({ where: { id: b.id }, data: { status: 'CANCELLED' } });
  res.json(up);
}));

// ---------- reviews ----------
app.post('/api/reviews', auth, h(async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const r = parseInt(rating, 10);
  if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  const b = await prisma.booking.findUnique({ where: { id: +bookingId }, include: { review: true } });
  if (!b || b.userId !== req.user.id) return res.status(404).json({ error: 'Booking not found' });
  if (b.status !== 'CONFIRMED') return res.status(400).json({ error: 'Cancelled stays cannot be reviewed' });
  if (b.review) return res.status(409).json({ error: 'You already reviewed this stay' });
  const review = await prisma.review.create({
    data: { rating: r, comment: (comment || '').trim() || 'Great stay!', userId: req.user.id, listingId: b.listingId, bookingId: b.id },
  });
  res.status(201).json(review);
}));

require('./extras')({ app, prisma, auth, h, out, withMeta });

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));