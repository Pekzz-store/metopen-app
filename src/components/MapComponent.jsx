import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, Polygon } from 'react-leaflet';
import { MapController, FloatingLocate } from './MapHelpers';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import RoutingMachine from './RoutingMachine';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons based on status
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const iconAvailable = createIcon('#10B981'); // Green
const iconFull = createIcon('#EF4444');      // Red
const iconAlmostFull = createIcon('#F59E0B'); // Orange

const MapComponent = ({ locations, isAdmin = false, panTo = null, routeTarget = null }) => {
  const navigate = useNavigate();

  // User location state (for non-admin views)
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const center = userLocation
  ? [userLocation.lat, userLocation.lng]
  : [-7.2655, 112.743];
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef(null);

  // inject pulse keyframes for user marker
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('map-user-pulse-style')) return;
    const style = document.createElement('style');
    style.id = 'map-user-pulse-style';
    style.innerHTML = `@keyframes pulse { 0% { transform: scale(0.6); opacity: 0.6 } 70% { transform: scale(1.6); opacity: 0 } 100% { transform: scale(1.6); opacity: 0 } }`;
    document.head.appendChild(style);
  }, []);

  // cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Effect to automatically get user location if routing is requested
  useEffect(() => {
    if (routeTarget && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        },
        err => console.error("Geolocation error for routing", err),
        { enableHighAccuracy: true }
      );
    }
  }, [routeTarget, userLocation]);

  // Controller component to access map instance and pan when requested

  // FloatingLocate moved to MapHelpers to avoid creating components during render

  // Mock GIS Data for Smart Parking context
  const trafficJamHotspots = [
    { id: 1, center: [-7.265, 112.742], radius: 400, name: 'Titik Rawan Macet: Jl. Basuki Rahmat', color: '#EF4444' },
    { id: 2, center: [-7.275, 112.738], radius: 300, name: 'Antrean Panjang: Jl. Raya Darmo', color: '#F59E0B' },
    { id: 3, center: [-7.250, 112.735], radius: 350, name: 'Rawan Macet: Area Tugu Pahlawan', color: '#EF4444' },
    { id: 4, center: [-7.285, 112.745], radius: 450, name: 'Kepadatan Tinggi: Kebun Binatang Surabaya', color: '#EF4444' },
    { id: 5, center: [-7.260, 112.750], radius: 250, name: 'Antrean Panjang: Stasiun Gubeng', color: '#F59E0B' },
    { id: 6, center: [-7.240, 112.740], radius: 300, name: 'Rawan Macet: Pasar Turi', color: '#EF4444' }
  ];

  const restrictedZones = [
    { id: 1, name: 'Kawasan Bebas Parkir Liar (Towing Zone) - Pusat', positions: [[-7.258, 112.735], [-7.258, 112.745], [-7.262, 112.745], [-7.262, 112.735]], color: '#3B82F6' },
    { id: 2, name: 'Kawasan Bebas Parkir Liar - Tunjungan', positions: [[-7.260, 112.738], [-7.260, 112.742], [-7.265, 112.742], [-7.265, 112.738]], color: '#3B82F6' },
    { id: 3, name: 'Zona Khusus Pejalan Kaki - Kenjeran', positions: [[-7.245, 112.755], [-7.245, 112.765], [-7.250, 112.765], [-7.250, 112.755]], color: '#3B82F6' }
  ];

  // congestedRoutes intentionally omitted to avoid unused variable (visual-only mock data)

  const getIcon = (status) => {
    switch(status) {
      case 'available': return iconAvailable;
      case 'full': return iconFull;
      case 'almost-full': return iconAlmostFull;
      default: return iconAvailable;
    }
  };

  return (
          <MapContainer
        center={center}
        zoom={16}
        style={{
          height: "100%",
          width: "100%",
          position: "relative"
        }}
        zoomControl={false}
      >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* GIS Elements Removed as requested */}
      
      {locations.map((loc) => (
        <Marker 
          key={loc.id} 
          position={[loc.lat, loc.lng]} 
          icon={getIcon(loc.status)}
          eventHandlers={{
            click: () => {
              // If admin view, open admin management for this location; otherwise go to user details
              if (isAdmin) {
                navigate('/admin', { state: { openEditId: loc.id } });
              } else {
                navigate(`/details/${loc.id}`, { state: { location: loc } });
              }
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{loc.name}</span>
          </Tooltip>
          <Popup>
            <div style={{ padding: '4px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{loc.name}</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Sisa: {loc.availableSlots} / {loc.totalSlots}</p>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 8px', fontSize: '12px', width: '100%' }}
                onClick={() => isAdmin ? navigate('/admin', { state: { openEditId: loc.id } }) : navigate(`/details/${loc.id}`, { state: { location: loc } })}
              >
                {isAdmin ? 'Kelola Lokasi' : 'Lihat Detail'}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User current location marker (non-admin) */}
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            pathOptions={{ color: '#2563EB', fillColor: '#BFDBFE', fillOpacity: 0.25, weight: 1 }}
            radius={userLocation.accuracy || 30}
          />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-location-icon',
              html: (watching
                ? `<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                     <span style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.15);animation:pulse 1.8s infinite;"></span>
                     <span style="width:18px;height:18px;background:#2563EB;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);position:relative;z-index:2;"></span>
                   </div>`
                : `<div style="background:#2563EB;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`),
              iconSize: watching ? [36, 36] : [24, 24],
              iconAnchor: watching ? [18, 18] : [12, 12]
            })}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <span style={{ fontWeight: 600 }}>Anda di sini</span>
            </Tooltip>
          </Marker>
        </>
      )}

      {/* Pan to requested coordinates when `panTo` prop changes */}
      {panTo && <MapController target={panTo} onMark={(t) => setUserLocation({ lat: t.lat, lng: t.lng, accuracy: null })} />}
      <FloatingLocate watching={watching} setWatching={setWatching} setUserLocation={setUserLocation} watchIdRef={watchIdRef} />
      
      {userLocation && routeTarget && (
        <RoutingMachine start={userLocation} end={routeTarget} />
      )}
    </MapContainer>
  );
};

export default MapComponent;
