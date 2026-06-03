import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Navigation = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function fetchRecommendations() {
    try {
      // Fetch all parking locations once; we'll compute nearest on-demand
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*');

      if (error) throw error;
      setLocations(data || []);

      // default recommendations (top 3 available)
      const top = (data || []).filter(d => d.status === 'available').sort((a,b) => b.available_slots - a.available_slots).slice(0,3);
      setRecommendations(top);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  // Haversine distance in meters
  function distanceMeters(a, b) {
    const toRad = v => v * Math.PI / 180;
    const R = 6371000; // earth radius meters
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDlat = Math.sin(dLat/2);
    const sinDlon = Math.sin(dLon/2);
    const aa = sinDlat*sinDlat + Math.cos(lat1)*Math.cos(lat2)*sinDlon*sinDlon;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
    return R * c;
  }

  // Find nearest parking locations to a coordinate
  function findNearest(lat, lng, limit = 3) {
    const dest = { lat: Number(lat), lng: Number(lng) };
    const list = (locations || []).map(loc => ({
      ...loc,
      _distance: distanceMeters(dest, { lat: Number(loc.lat), lng: Number(loc.lng) })
    }));
    return list.sort((a,b) => a._distance - b._distance).slice(0, limit);
  }

  async function handleSearch(e) {
    e?.preventDefault?.();
    if (!searchQuery || searchQuery.trim().length === 0) return;
    setSearching(true);
    try {
      // try to find a parking location matching the query (by name or address)
      const { data: matches } = await supabase.from('parking_locations').select('*').ilike('name', `%${searchQuery}%`).limit(5);
      if (matches && matches.length > 0) {
        // use first match as destination and find nearest parking to it
        const dest = matches[0];
        const nearest = findNearest(dest.lat, dest.lng, 5);
        // annotate distance in km with one decimal
        setSearchResults(nearest.map(n => ({ ...n, distance_km: (n._distance/1000).toFixed(1) })));
      } else {
        // no match by name; prompt user to use their current location
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function searchByMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const nearest = findNearest(latitude, longitude, 5);
      setSearchResults(nearest.map(n => ({ ...n, distance_km: (n._distance/1000).toFixed(1) })));
      setSearching(false);
    }, (err) => {
      console.error('Geolocation error', err);
      alert('Gagal mendapatkan lokasi Anda. Periksa izin browser.');
      setSearching(false);
    });
  }

  useEffect(() => {
    // defer to microtask to avoid calling setState synchronously in effect
    Promise.resolve().then(() => fetchRecommendations());
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            aria-label="Cari tujuan atau nama lokasi"
            placeholder="Cari tempat tujuan (mis. Pakuwon Mall, Tugu Pahlawan)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 14 }}
          />
          <button className="btn btn-primary" style={{ padding: '10px 16px' }} onClick={handleSearch} disabled={searching}>{searching ? 'Mencari...' : 'Cari'}</button>
        </form>
        <button className="btn btn-outline" onClick={searchByMyLocation} style={{ padding: '10px 16px' }}>Cari di Sekitarku</button>
      </div>

      {/* Results: if user searched or used location, show searchResults; otherwise show recommendations */}
      {searching ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Mencari lokasi terdekat...</p>
      ) : (searchResults && searchResults.length > 0) ? (
        searchResults.map((loc) => (
          <div key={loc.id} className="card" style={{ margin: '0 0 16px 0', border: '1px solid var(--border-color)', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{loc.name}</div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--muted)' }}>{loc.distance_km} km</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Tipe: {loc.type === 'gedung' ? 'Gedung / Mall' : 'Tepi Jalan'} • Tarif: Rp {loc.rate?.toLocaleString()}/jam</div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 12, fontSize: '0.88rem' }}>
                  <div><strong style={{ color: 'var(--primary)' }}>Ketersediaan:</strong> {loc.available_slots} / {loc.total_slots} Slot</div>
                  <div><strong style={{ color: 'var(--muted)' }}>Status:</strong> {loc.status}</div>
                </div>
              </div>
              <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                <button className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: 10 }} onClick={() => navigate(`/details/${loc.id}`, { state: { location: loc } })}>Lihat Detail & Rute</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        // fallback: show recommendations
        (loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Menganalisa rute dan ketersediaan data...</p>
        ) : recommendations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Tidak ada lokasi parkir yang tersedia saat ini.</p>
        ) : (
          recommendations.map((loc, index) => (
            <div
              key={loc.id}
              className="card"
              onClick={() => setSelectedId(loc.id)}
              style={{
                margin: '0 0 16px 0',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 18,
                cursor: 'pointer',
                boxShadow: selectedId === loc.id ? '0 6px 18px rgba(20, 80, 210, 0.08)' : 'none',
                borderLeft: selectedId === loc.id ? '6px solid var(--primary)' : undefined
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{loc.name} {index === 0 ? '(Prioritas Utama)' : '(Alternatif)'}</div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ display: 'inline-block', background: '#ECFDF5', color: '#065F46', padding: '6px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>OPTIMAL</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Tipe: {loc.type === 'gedung' ? 'Gedung / Mall' : 'Tepi Jalan'} • Tarif: Rp {loc.rate?.toLocaleString()}/jam
                  </div>

                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 12, fontSize: '0.88rem' }}>
                    <div><strong style={{ color: 'var(--primary)' }}>Ketersediaan:</strong> {loc.available_slots} / {loc.total_slots} Slot</div>
                    <div><strong style={{ color: 'var(--muted)' }}>Status:</strong> Tersedia</div>
                    <div><strong style={{ color: 'var(--muted)' }}>Lalu Lintas:</strong> Lancar</div>
                  </div>
                </div>

                <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                  <button 
                    className={index === 0 ? "btn btn-primary" : "btn btn-outline"} 
                    style={{ padding: '10px 16px', borderRadius: 10 }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/details/${loc.id}`, { state: { location: {
                      id: loc.id, name: loc.name, lat: loc.lat, lng: loc.lng,
                      status: loc.status, availableSlots: loc.available_slots, totalSlots: loc.total_slots,
                      type: loc.type, rate: loc.rate
                    }}}); }}
                  >
                    Lihat Detail & Rute
                  </button>
                  {index === 0 && (
                    <div style={{ height: 8, width: '100%', background: 'var(--primary)', borderRadius: 6 }}></div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) )
      )}

      
    </div>
  );
};

export default Navigation;
