import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, Polygon, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

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

const MapComponent = ({ locations }) => {
  const navigate = useNavigate();
  const center = [-7.2655, 112.743];

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

  const congestedRoutes = [
    { id: 1, name: 'Rute Padat Merayap - Darmo', positions: [[-7.25, 112.738], [-7.26, 112.738], [-7.265, 112.742], [-7.27, 112.74]], color: '#EF4444' },
    { id: 2, name: 'Rute Padat Merayap - Pemuda', positions: [[-7.265, 112.742], [-7.265, 112.750], [-7.263, 112.755]], color: '#F59E0B' },
    { id: 3, name: 'Rute Padat Merayap - Ahmad Yani', positions: [[-7.300, 112.735], [-7.310, 112.730], [-7.320, 112.725]], color: '#EF4444' }
  ];

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
      zoom={14} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* GIS Element: Traffic Jam Hotspots */}
      {trafficJamHotspots.map(hotspot => (
        <Circle 
          key={`hotspot-${hotspot.id}`}
          center={hotspot.center}
          pathOptions={{ fillColor: hotspot.color, stroke: false, fillOpacity: 0.25 }}
          radius={hotspot.radius}
        >
          <Tooltip sticky>
            <div style={{ fontWeight: 600, color: hotspot.color, marginBottom: '4px' }}>{hotspot.name}</div>
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 600 }}>Jam Rawan:</span> 07:00 - 09:00 & 16:00 - 18:30
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Hindari area ini pada jam sibuk</div>
          </Tooltip>
        </Circle>
      ))}

      {/* GIS Element: Restricted Zones / Towing Zones */}
      {restrictedZones.map(zone => (
        <Polygon 
          key={`zone-${zone.id}`}
          positions={zone.positions}
          pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.1, weight: 2 }}
        >
          <Tooltip sticky>
            <div style={{ fontWeight: 600, color: zone.color }}>{zone.name}</div>
            <div style={{ fontSize: '0.8rem' }}>Dilarang parkir di bahu jalan 24 Jam</div>
          </Tooltip>
        </Polygon>
      ))}
      
      {locations.map((loc) => (
        <Marker 
          key={loc.id} 
          position={[loc.lat, loc.lng]} 
          icon={getIcon(loc.status)}
          eventHandlers={{
            click: () => {
              // Navigate to details page when marker is clicked
              navigate(`/details/${loc.id}`, { state: { location: loc } });
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
                onClick={() => navigate(`/details/${loc.id}`, { state: { location: loc } })}
              >
                Lihat Detail
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
