import { NavLink } from 'react-router-dom';
import { Map as MapIcon, Navigation, User, LogOut, Car } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import AppBrand from './AppBrand';

const Sidebar = () => {
  const { signOut, user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <AppBrand compact={true} />
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MapIcon size={20} />
          <span>
            <span className="desktop-text">Peta Parkir GIS</span>
            <span className="mobile-text">Peta</span>
          </span>
        </NavLink>
        <NavLink to="/navigation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Navigation size={20} />
          <span>
            <span className="desktop-text">Rekomendasi Parkir Tempat Surabaya</span>
            <span className="mobile-text">Rekomendasi</span>
          </span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Profil</span>
        </NavLink>
        <NavLink to="/profile/vehicles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Car size={20} />
          <span>Kendaraan</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user?.email?.[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pengguna</div>
          </div>
        </div>
        <button onClick={signOut} className="btn btn-outline" style={{ width: '100%', padding: '8px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
