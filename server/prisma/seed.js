require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const P = {
  beach1: 'photo-1507525428034-b723cf961d3e',
  beach2: 'photo-1499793983690-e29da59ef1c2',
  beach3: 'photo-1582268611958-ebfd161ef9cf',
  cabin1: 'photo-1449158743715-0a90ebb6d2d8',
  cabin2: 'photo-1510798831971-661eb04b3739',
  living: 'photo-1505691938895-1758d7feb511',
  view1: 'photo-1470071459604-3b5ec3a7fe05',
  view2: 'photo-1506905925346-21bda4d32df4',
  view3: 'photo-1464822759023-fed622ff2c3b',
  city1: 'photo-1502672260266-1c1ef2d93688',
  city2: 'photo-1493809842364-78817add7ffb',
  city3: 'photo-1522708323590-d24dbb6b0267',
  lux1: 'photo-1512917774080-9991f1c4c750',
  lux2: 'photo-1566073771259-6a8506099945',
  bed: 'photo-1560448204-e02f11c3d0e2',
  house: 'photo-1564013799919-ab600027ffc6',
};

const listings = [
  { title: 'Beachfront Villa with Private Pool', location: 'Calangute, Goa', category: 'Beach', price: 8500, guests: 6, bedrooms: 3,
    description: 'Wake up to the sound of waves in this airy villa just steps from the sand. Enjoy a private pool, a shaded terrace and sunset dinners with the whole group.',
    images: [P.beach1, P.beach3, P.bed], amenities: ['Wifi', 'Private pool', 'Air conditioning', 'Kitchen', 'Beach access', 'Free parking'] },
  { title: 'Cozy Pine Cabin by the River', location: 'Manali, Himachal Pradesh', category: 'Cabins', price: 4200, guests: 4, bedrooms: 2,
    description: 'A warm wooden cabin tucked into the pine forest with a crackling fireplace, river sounds and snow-capped peaks on the horizon.',
    images: [P.cabin1, P.cabin2, P.living], amenities: ['Wifi', 'Fireplace', 'Kitchen', 'Heating', 'Mountain view', 'Free parking'] },
  { title: 'Cliffside Retreat with Valley Views', location: 'Mussoorie, Uttarakhand', category: 'Amazing Views', price: 6100, guests: 4, bedrooms: 2,
    description: 'Perched on the edge of the hills, this retreat has floor-to-ceiling windows that frame misty valleys at dawn and a sky full of stars at night.',
    images: [P.view1, P.view2, P.bed], amenities: ['Wifi', 'Balcony', 'Heating', 'Breakfast included', 'Mountain view', 'TV'] },
  { title: 'Modern Loft in the Heart of the City', location: 'Bandra, Mumbai', category: 'City', price: 5200, guests: 3, bedrooms: 1,
    description: 'A bright, stylish loft within walking distance of cafes, the sea link and nightlife. Perfect for business trips and city weekends.',
    images: [P.city1, P.city2, P.living], amenities: ['Wifi', 'Air conditioning', 'Kitchen', 'Washer', 'Workspace', 'Gym access'] },
  { title: 'Royal Lake Palace Suite', location: 'Udaipur, Rajasthan', category: 'Luxury', price: 18500, guests: 2, bedrooms: 1,
    description: 'Live like royalty in a heritage suite overlooking the lake, with a butler, private dining and a rooftop terrace made for golden hour.',
    images: [P.lux1, P.lux2, P.bed], amenities: ['Wifi', 'Pool', 'Spa', 'Butler service', 'Breakfast included', 'Airport pickup'] },
  { title: 'Seaside Bungalow on the Cliffs', location: 'Varkala, Kerala', category: 'Beach', price: 3900, guests: 4, bedrooms: 2,
    description: 'A breezy bungalow above the red cliffs of Varkala with sea views from every room, fresh seafood nearby and a hammock on the porch.',
    images: [P.beach2, P.beach1, P.house], amenities: ['Wifi', 'Sea view', 'Kitchen', 'Fan', 'Hammock', 'Bike rental'] },
  { title: 'A-Frame Cabin in the Coffee Hills', location: 'Coorg, Karnataka', category: 'Cabins', price: 4700, guests: 3, bedrooms: 1,
    description: 'Sleep among coffee plantations in a handcrafted A-frame cabin with a loft bedroom, outdoor bath and morning mist rolling past the porch.',
    images: [P.cabin2, P.cabin1, P.view3], amenities: ['Wifi', 'Outdoor bath', 'Breakfast included', 'Bonfire', 'Garden', 'Free parking'] },
  { title: 'Skyline Apartment with Rooftop Pool', location: 'Koregaon Park, Pune', category: 'City', price: 3600, guests: 4, bedrooms: 2,
    description: 'A sleek high-rise apartment with skyline views, a rooftop pool and gym, close to the best restaurants and live music in Pune.',
    images: [P.city3, P.city2, P.bed], amenities: ['Wifi', 'Pool', 'Gym', 'Air conditioning', 'Kitchen', 'Elevator'] },
];

async function main() {
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);
  const host = await prisma.user.create({ data: { name: 'Aarav Host', email: 'host@demo.com', password } });
  await prisma.user.create({ data: { name: 'Demo Guest', email: 'guest@demo.com', password } });

  for (const l of listings) {
    await prisma.listing.create({
      data: { ...l, images: JSON.stringify(l.images.map(u)), amenities: JSON.stringify(l.amenities), hostId: host.id },
    });
  }
  console.log(`Seeded ${listings.length} listings.`);
  console.log('Demo logins -> host@demo.com / password123  |  guest@demo.com / password123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
