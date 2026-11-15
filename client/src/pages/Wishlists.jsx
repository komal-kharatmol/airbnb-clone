import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../WishlistContext';
import ListingCard from '../components/ListingCard';

export default function Wishlists() {
  const { isSaved } = useWishlist();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/listings')
      .then(r => r.json())
      .then(data => setListings(Array.isArray(data) ? data : data.listings || []))
      .catch(() => setListings([]));
  }, []);

  const saved = listings.filter(l => isSaved(l.id));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-semibold">Wishlists</h1>
      {saved.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {saved.map(l => <ListingCard key={l.id} l={l} />)}
        </div>
      ) : (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
          <p className="mt-2 text-gray-500">Save homes you love to find them here.</p>
          <Link to="/" className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-white">Explore stays</Link>
        </div>
      )}
    </main>
  );
}
