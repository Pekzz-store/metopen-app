import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import { supabase } from '../lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [parkingLocations, setParkingLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panTo, setPanTo] = useState(null);
  const [routeTarget, setRouteTarget] = useState(null);
  const locationRouter = useLocation();

  async function fetchLocations() {
    try {
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*');
      
      if (error) throw error;
      
      const formattedData = data.map(item => {
        let computedStatus = 'available';
        if (item.available_slots <= 0) {
          computedStatus = 'full';
        } else if (item.available_slots <= (item.total_slots / 2)) {
          computedStatus = 'almost-full';
        }

        return {
          id: item.id,
          name: item.name,
          lat: item.lat,
          lng: item.lng,
          status: computedStatus,
          availableSlots: item.available_slots,
          totalSlots: item.total_slots,
          type: item.type,
          rate: item.rate
        };
      });
      
      setParkingLocations(formattedData);
    } catch (error) {
      console.error('Error fetching parking locations:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // parse route target from query params (e.g. ?routeLat=..&routeLng=..)
    const params = new URLSearchParams(locationRouter.search);
    const rLat = params.get('routeLat');
    const rLng = params.get('routeLng');
    if (rLat && rLng) {
      setRouteTarget({ lat: Number(rLat), lng: Number(rLng) });
      // remove params from url to avoid re-triggering on refresh
      // keep history clean by replacing state
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // defer initial fetch to microtask to avoid set-state-in-effect lint warning
    Promise.resolve().then(() => fetchLocations());

    const subscription = supabase
      .channel('public:parking_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_locations' }, () => {
        void fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredLocations = parkingLocations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    loc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      
      {/* Peta Full Screen */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', backgroundColor: '#F8FAFC' }}>
            <div style={{ padding: '10px 20px', background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow-md)', color: '#64748B' }}>
              Memuat Peta GIS...
            </div>
          </div>
        ) : (
          <MapComponent locations={filteredLocations} panTo={panTo} routeTarget={routeTarget} />
        )}
      </div>

      {/* Floating Search Bar */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000, 
        width: '90%', 
        maxWidth: '400px' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'white', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
        }}>
          <Search size={20} color="#6B7280" />
          <input 
            type="text" 
            placeholder="Cari lokasi parkir..." 
            style={{ 
              border: 'none', outline: 'none', width: '100%', marginLeft: '12px', 
              fontSize: '1rem', backgroundColor: 'transparent'
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Temukan Saya button removed from below search bar; moved to floating control */}

        {/* Hasil Pencarian (Hanya Muncul Jika Sedang Mengetik) */}
        {searchQuery.trim() !== '' && (
          <div style={{ 
            marginTop: '8px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {filteredLocations.length > 0 ? (
              <div style={{ padding: '8px' }}>
                {filteredLocations.map(loc => (
                  <div 
                    key={loc.id} 
                    style={{ padding: '12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} 
                    className="hover:bg-gray-50"
                    onClick={() => navigate(`/details/${loc.id}`, { state: { location: loc } })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1E293B' }}>{loc.name}</h4>
                      <span className={`badge ${loc.status}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                        {loc.status === 'available' ? 'Tersedia' : loc.status === 'full' ? 'Penuh' : 'Padat'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Sisa: <strong style={{ color: '#1E293B' }}>{loc.availableSlots}</strong>/{loc.totalSlots} Slot
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
                Lokasi tidak ditemukan
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating 'Temukan Saya' control in map corner */}
      <div style={{ position: 'absolute', right: 20, bottom: 24, zIndex: 1100 }}>
        <button
          aria-label="Temukan Saya"
          title="Temukan Saya"
          onClick={() => {
            if (!navigator.geolocation) return alert('Geolocation tidak didukung.');
            navigator.geolocation.getCurrentPosition(pos => {
              const { latitude, longitude } = pos.coords;
              // include mark:true so MapComponent will also render the user marker
              setPanTo({ lat: latitude, lng: longitude, zoom: 16, mark: true });
              setTimeout(() => setPanTo(null), 1500);
            }, err => {
              console.error('Geolocation error', err);
              alert('Gagal mendapatkan lokasi. Periksa izin browser.');
            }, { enableHighAccuracy: true, timeout: 5000 });
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: 'white',
            border: '1px solid #E6EAF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 12px rgba(16,24,40,0.08)',
            cursor: 'pointer'
          }}
        >
          {/* simple location icon similar to Google Maps */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="#2563EB" strokeWidth="1.5" fill="#2563EB" />
            <path d="M12 2v2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 20v2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 12h2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 12h2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

    </div>
  );
};

export default Home;
