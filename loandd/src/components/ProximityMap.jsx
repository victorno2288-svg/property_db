/**
 * ProximityMap — แผนที่แสดงทรัพย์ที่ใกล้กับสถานี BTS/MRT หรือสถานศึกษา
 * ใช้ Leaflet + OpenStreetMap (ฟรี ไม่ต้อง API key)
 *
 * Props:
 *   centerLat    {number}  — latitude ของจุดอ้างอิง (สถานี / โรงเรียน)
 *   centerLng    {number}  — longitude ของจุดอ้างอิง
 *   centerLabel  {string}  — ชื่อที่แสดงใน popup
 *   centerIcon   {string}  — emoji ไอคอนของจุดอ้างอิง
 *   centerColor  {string}  — สีพื้นหลัง marker จุดกลาง
 *   properties   {Array}   — รายการทรัพย์ (ต้องมี id, title, latitude, longitude, price_requested)
 *   mapHeight    {number}  — ความสูง px (default 380)
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ───── Utility ────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distColor(km) {
  if (km <= 1) return '#A1D99B';
  if (km <= 3) return '#f59e0b';
  return '#ef4444';
}

function distLabel(km) {
  if (km <= 0.5) return '🚶 เดินได้';
  if (km <= 1.5) return '🛵 ใกล้มาก';
  if (km <= 5) return '🚗 ไม่ไกล';
  return '🚗 ขับรถ';
}

function fmtDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} ม.` : `${km.toFixed(1)} กม.`;
}

function fmtPrice(p) {
  if (!p) return 'ติดต่อสอบถาม';
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)} ล้าน฿`;
  return p.toLocaleString() + ' ฿';
}

// ───── Component ──────────────────────────────────────────────
export default function ProximityMap({
  centerLat,
  centerLng,
  centerLabel = 'จุดอ้างอิง',
  centerIcon = '📍',
  centerColor = '#6aab62',
  properties = [],
  mapHeight = 380,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!centerLat || !centerLng) return;
    if (!containerRef.current) return;

    // ─ destroy หากมี instance เดิม ─
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // ─ สร้าง map ─
    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false, // ป้องกัน accidental scroll
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // ─ วงกลมระยะทาง ─
    const rings = [
      { r: 500,  fill: 'rgba(26,60,110,0.07)',  stroke: '#6aab62', dash: null },
      { r: 1000, fill: 'rgba(4,170,109,0.06)',   stroke: '#A1D99B', dash: null },
      { r: 2000, fill: 'rgba(245,158,11,0.05)',  stroke: '#f59e0b', dash: '6 4' },
    ];
    rings.forEach(({ r, fill, stroke, dash }) => {
      L.circle([centerLat, centerLng], {
        radius: r,
        color: stroke,
        weight: 1.5,
        fillColor: fill,
        fillOpacity: 1,
        dashArray: dash,
      }).addTo(map);
    });

    // ─ Marker จุดอ้างอิง (สถานี / โรงเรียน) ─
    const centerDivIcon = L.divIcon({
      className: '',
      html: `<div style="
        background:${centerColor};
        color:#fff;
        border-radius:50%;
        width:46px;height:46px;
        display:flex;align-items:center;justify-content:center;
        font-size:1.35rem;
        border:3px solid #fff;
        box-shadow:0 3px 10px rgba(0,0,0,0.4);
        cursor:default;
      ">${centerIcon}</div>`,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });

    L.marker([centerLat, centerLng], { icon: centerDivIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:Sarabun,sans-serif;text-align:center;padding:2px 4px">
          <div style="font-size:1.4rem;margin-bottom:4px">${centerIcon}</div>
          <div style="font-weight:800;color:#6aab62;font-size:0.9rem">${centerLabel}</div>
          <div style="color:#888;font-size:0.72rem;margin-top:2px">จุดอ้างอิง</div>
        </div>`,
        { maxWidth: 200 }
      )
      .openPopup();

    // ─ Property markers ─
    const propsWithCoords = properties.filter(
      (p) => p.latitude && p.longitude
    );
    const boundsCoords = [[centerLat, centerLng]];

    propsWithCoords.forEach((prop) => {
      const km = haversine(
        centerLat, centerLng,
        parseFloat(prop.latitude), parseFloat(prop.longitude)
      );
      const color = distColor(km);
      const distText = fmtDist(km);

      // Label pill เป็น marker icon
      const propIcon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color};
          color:#fff;
          border-radius:20px;
          padding:4px 10px;
          font-size:0.68rem;
          font-weight:800;
          border:2px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          white-space:nowrap;
          cursor:pointer;
          line-height:1.3;
          text-align:center;
        ">
          ${distText}
        </div>`,
        iconAnchor: [24, 12],
      });

      const typeLabels = {
        house: 'บ้านเดี่ยว', condo: 'คอนโด', townhouse: 'ทาวน์เฮ้าส์', townhome: 'ทาวน์โฮม',
        land: 'ที่ดิน', commercial: 'อาคารพาณิชย์', apartment: 'อพาร์ทเม้นท์',
        home_office: 'โฮมออฟฟิศ', warehouse: 'โกดัง/โรงงาน',
      };
      const typeLabel = typeLabels[prop.property_type] || prop.property_type || '';
      const listingIcon = prop.listing_type === 'rent' ? '🔑 เช่า' : '🏠 ขาย';

      const popupHtml = `
        <div style="font-family:Sarabun,sans-serif;min-width:190px;max-width:220px">
          <div style="font-weight:800;color:#3d7a3a;font-size:0.88rem;line-height:1.3;margin-bottom:5px">
            ${prop.title || 'ทรัพย์สิน'}
          </div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">
            <span style="background:#f0f4f8;color:#555;padding:2px 7px;border-radius:8px;font-size:0.7rem">${typeLabel}</span>
            <span style="background:#e8f5e9;color:#2e7d32;padding:2px 7px;border-radius:8px;font-size:0.7rem">${listingIcon}</span>
          </div>
          <div style="color:#3d7a3a;font-weight:800;font-size:0.92rem;margin-bottom:6px">
            ${fmtPrice(prop.price_requested || prop.monthly_rent)}
          </div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
            <span style="background:${color};color:#fff;padding:3px 9px;border-radius:12px;font-size:0.72rem;font-weight:800">
              ${distText}
            </span>
            <span style="color:#666;font-size:0.72rem">${distLabel(km)}</span>
          </div>
          <a href="/property/${prop.id}" target="_blank"
            style="display:block;background:#6aab62;color:#fff;text-align:center;
              padding:6px;border-radius:7px;font-size:0.78rem;font-weight:700;
              text-decoration:none;">
            ดูรายละเอียด →
          </a>
        </div>
      `;

      L.marker(
        [parseFloat(prop.latitude), parseFloat(prop.longitude)],
        { icon: propIcon }
      )
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 240 });

      boundsCoords.push([parseFloat(prop.latitude), parseFloat(prop.longitude)]);
    });

    // ─ Fit bounds ให้เห็นทุก pin ─
    if (boundsCoords.length > 1) {
      try {
        map.fitBounds(boundsCoords, { padding: [50, 50], maxZoom: 15 });
      } catch (_) {
        // fallback: ไม่ทำอะไร
      }
    }

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [centerLat, centerLng, centerLabel, centerColor, properties]);

  if (!centerLat || !centerLng) return null;

  return (
    <div
      ref={containerRef}
      style={{
        height: mapHeight,
        width: '100%',
        borderRadius: '0 0 12px 12px',
        zIndex: 1,
      }}
    />
  );
}
