import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import { supabase } from '../lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [parkingLocations, setParkingLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();

    const subscription = supabase
      .channel('public:parking_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_locations' }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchLocations = async () => {
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
  };

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
          <MapComponent locations={filteredLocations} />
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

    </div>
  );
};

export default Home;
