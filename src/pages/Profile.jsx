import { User, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const Profile = () => {
  const { user, signOut } = useAuth();
  // profile page no longer shows license plate here; vehicles are managed separately
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={{ marginBottom: '4px' }}>{user?.email || 'Pengguna'}</h2>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px', paddingLeft: '8px' }}>AKUN SAYA</h3>
        <div className="card" style={{ margin: '0', padding: '8px 16px' }}>
          <ProfileMenuItem icon={<User size={20} />} label="Data Pribadi" />
        </div>
      </div>

      {/* Vehicle management moved to /profile/vehicles */}

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px', paddingLeft: '8px' }}>PENGATURAN</h3>
        <div className="card" style={{ margin: '0', padding: '8px 16px' }}>
          <ProfileMenuItem icon={<Settings size={20} />} label="Preferensi Aplikasi" />
          <ProfileMenuItem icon={<HelpCircle size={20} />} label="Pusat Bantuan" />
        </div>
      </div>

      <button 
        onClick={signOut}
        className="btn btn-outline" 
        style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: '20px' }}
      >
        <LogOut size={20} /> Keluar
      </button>
    </div>
  );
};

const ProfileMenuItem = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      <div style={{ fontWeight: 500 }}>{label}</div>
    </div>
    <ChevronRight size={20} color="var(--text-muted)" />
  </div>
);

export default Profile;
