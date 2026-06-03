import { useEffect } from "react";
import { useMap } from "react-leaflet";

// ====================================
// MAP CONTROLLER
// ====================================

export const MapController = ({ target, onMark }) => {
  const map = useMap();

  useEffect(() => {
    if (!target || !map) return;

    const { lat, lng, zoom } = target;

    map.flyTo([lat, lng], zoom || 16, {
      duration: 1,
    });

    if (target.mark && typeof onMark === "function") {
      onMark(target);
    }
  }, [target, map, onMark]);

  return null;
};

// ====================================
// FLOATING LOCATE BUTTON
// ====================================

export const FloatingLocate = ({
  setUserLocation,
}) => {
  const map = useMap();

  // Auto get location saat map dibuka
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
        });
      },
      (err) => {
        console.error("GPS ERROR:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, [setUserLocation]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
        });

        map.flyTo([latitude, longitude], 18, {
          duration: 1,
        });
      },
      (err) => {
        console.error(err);
        alert("Gagal mendapatkan lokasi");
      },
      {
        enableHighAccuracy: true,
      }
    );
  };

  return (
    <div
      className="leaflet-top leaflet-right"
      style={{
        marginTop: "80px",
        marginRight: "10px",
      }}
    >
      <div className="leaflet-control">
        <button
          onClick={handleLocate}
          title="Lokasi Saya"
          style={{
            width: "44px",
            height: "44px",
            background: "#fff",
            border: "2px solid #ddd",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          📍
        </button>
      </div>
    </div>
  );
};

export default null;