import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './AuthContext';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import Auth from './pages/Auth';
import MyTrips from './pages/MyTrips';
import HostDashboard from './pages/HostDashboard';
import Wishlists from './pages/Wishlists';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <p className="p-10 text-center text-gray-500">Loading...</p>;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <Routes>
          
          <Route path="/wishlists" element={<Wishlists />} />
<Route path="/" element={<Home />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/trips" element={<Protected><MyTrips /></Protected>} />
          <Route path="/host" element={<Navigate to="/host/listings" replace />} />
          <Route path="/host/listings" element={<Protected><HostDashboard /></Protected>} />
          <Route path="/host/new" element={<Protected><HostDashboard /></Protected>} />
          <Route path="/host/edit/:id" element={<Protected><HostDashboard /></Protected>} />
          <Route path="*" element={<p className="py-20 text-center text-gray-500">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}

