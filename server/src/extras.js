// server/src/extras.js
// Wishlists, host reservations and the review breakdown.
// Mounted from index.js with ONE line (see instructions).

module.exports = function mountExtras({ app, prisma, auth, h, out, withMeta }) {
  // ---------- wishlists ----------
  // GET /api/wishlists -> the logged-in user's saved listings (newest first)
  app.get('/api/wishlists', auth, h(async (req, res) => {
    const rows = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { listing: { include: withMeta } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows.map((w) => out(w.listing)));
  }));

  // POST /api/wishlists  { listingId } -> toggles saved / unsaved
  app.post('/api/wishlists', auth, h(async (req, res) => {
    const listingId = parseInt(req.body.listingId, 10);
    if (!listingId) return res.status(400).json({ error: 'listingId is required' });
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const where = { userId_listingId: { userId: req.user.id, listingId } };
    const existing = await prisma.wishlist.findUnique({ where });
    if (existing) {
      await prisma.wishlist.delete({ where });
      return res.json({ saved: false, listingId });
    }
    await prisma.wishlist.create({ data: { userId: req.user.id, listingId } });
    res.status(201).json({ saved: true, listingId });
  }));

  // ---------- host reservations ----------
  app.get('/api/host/reservations', auth, h(async (req, res) => {
    const rows = await prisma.booking.findMany({
      where: { listing: { hostId: req.user.id } },
      include: {
        listing: { select: { id: true, title: true, location: true, images: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(rows.map((b) => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      nights: Math.max(1, Math.round((b.endDate - b.startDate) / 86400000)),
      totalPrice: b.totalPrice,
      status: b.status,
      createdAt: b.createdAt,
      guest: b.user,
      listing: { id: b.listing.id, title: b.listing.title, location: b.listing.location, image: JSON.parse(b.listing.images)[0] },
    })));
  }));

  app.patch('/api/host/bookings/:id/cancel', auth, h(async (req, res) => {
    const b = await prisma.booking.findUnique({ where: { id: +req.params.id }, include: { listing: true } });
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    if (b.listing.hostId !== req.user.id) return res.status(403).json({ error: 'This is not a booking on your place' });
    if (b.status === 'CANCELLED') return res.status(400).json({ error: 'This booking is already cancelled' });
    const up = await prisma.booking.update({ where: { id: b.id }, data: { status: 'CANCELLED' } });
    res.json(up);
  }));

  // ---------- review breakdown (6 Airbnb categories) ----------
  app.get('/api/listings/:id/breakdown', h(async (req, res) => {
    const rows = await prisma.review.findMany({
      where: { listingId: +req.params.id },
      select: { rating: true, cleanliness: true, accuracy: true, checkIn: true, communication: true, locationRating: true, valueRating: true },
    });
    if (!rows.length) return res.json({ count: 0, overall: null, categories: null });
    const avg = (pick) => +(rows.reduce((s, r) => s + pick(r), 0) / rows.length).toFixed(1);
    res.json({
      count: rows.length,
      overall: +(rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(2),
      // a missing sub-rating falls back to that review's overall rating
      categories: {
        cleanliness: avg((r) => r.cleanliness ?? r.rating),
        accuracy: avg((r) => r.accuracy ?? r.rating),
        checkIn: avg((r) => r.checkIn ?? r.rating),
        communication: avg((r) => r.communication ?? r.rating),
        location: avg((r) => r.locationRating ?? r.rating),
        value: avg((r) => r.valueRating ?? r.rating),
      },
    });
  }));
};
