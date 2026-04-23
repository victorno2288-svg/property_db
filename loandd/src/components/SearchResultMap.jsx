/**
 * SearchResultMap — แผนที่แสดงทรัพย์ทุกหลังในผลการค้นหา
 * ใช้ Leaflet + OpenStreetMap (ฟรี ไม่ต้อง API key)
 *
 * Props:
 *   properties {Array}  — รายการทรัพย์ (id, title, latitude, longitude, price_requested, ...)
 *   onSelect   {fn}     — callback เมื่อคลิก marker (ส่งคืน property)
 *   activeId   {number} — id ทรัพย์ที่ highlight
 *   height     {number} — px (default 780)
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function fmtPrice(p) {
  if (!p) return '—';
  const n = Number(p);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}ล้าน`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function makePinIcon(priceLabel, active = false) {
  const bg = active ? '#1a3a18' : '#2d5e2b';
  const border = active ? '#C9A84C' : '#fff';
  return L.divIcon({
    className: 'search-pin',
    html: `
      <div style="
        background: ${bg}; color: #fff;
        border: 2.5px solid ${border};
        border-radius: 999px;
        padding: 5px 12px;
        font-weight: 800; font-size: 12px;
        font-family: 'Manrope', system-ui, sans-serif;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        white-space: nowrap;
        position: relative;
        transform: ${active ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.2s;
      ">
        ฿${priceLabel}
        <div style="
          position: absolute; bottom: -6px; left: 50%;
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid ${bg};
          transform: translateX(-50%);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [40, 30],
  });
}

export default function SearchResultMap({ properties = [], onSelect, activeId, height = 780 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());

  // Filter only geo-located properties
  const geoProps = properties.filter(p => p.latitude && p.longitude);

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([13.7563, 100.5018], 7); // Bangkok default

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    if (geoProps.length === 0) {
      map.setView([13.7563, 100.5018], 6);
      return;
    }

    // Add new markers
    const bounds = L.latLngBounds([]);
    geoProps.forEach(p => {
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      const priceLabel = fmtPrice(p.listing_type === 'rent' ? p.monthly_rent : p.price_requested);
      const icon = makePinIcon(priceLabel, p.id === activeId);
      const marker = L.marker([lat, lng], { icon }).addTo(map);

      const popup = `
        <div style="font-family: 'Prompt', sans-serif; min-width: 180px;">
          <div style="font-weight: 700; color: #1a3a18; margin-bottom: 4px; font-size: 14px;">
            ${p.title || 'ทรัพย์สิน'}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
            ${[p.district, p.province].filter(Boolean).join(', ') || ''}
          </div>
          <div style="font-weight: 800; color: #2d5e2b; font-size: 15px;">
            ฿${priceLabel}${p.listing_type === 'rent' ? '/เดือน' : ''}
          </div>
          <a href="/property/${p.id}" style="
            display: inline-block; margin-top: 8px;
            padding: 5px 12px; background: #1a3a18; color: #fff !important;
            border-radius: 999px; font-size: 11px; font-weight: 700;
            text-decoration: none; letter-spacing: 0.05em;
          ">ดูรายละเอียด →</a>
        </div>
      `;
      marker.bindPopup(popup);
      marker.on('click', () => onSelect && onSelect(p));

      markersRef.current.set(p.id, marker);
      bounds.extend([lat, lng]);
    });

    // Fit bounds with padding
    if (geoProps.length === 1) {
      map.setView([parseFloat(geoProps[0].latitude), parseFloat(geoProps[0].longitude)], 14);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [properties, activeId, onSelect]);

  // Highlight active marker
  useEffect(() => {
    if (!activeId) return;
    const m = markersRef.current.get(activeId);
    if (m) {
      const p = geoProps.find(x => x.id === activeId);
      if (p) {
        const priceLabel = fmtPrice(p.listing_type === 'rent' ? p.monthly_rent : p.price_requested);
        m.setIcon(makePinIcon(priceLabel, true));
        m.openPopup();
      }
    }
  }, [activeId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: height, borderRadius: 0 }} />
      {geoProps.length === 0 && properties.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 500,
          background: 'rgba(255,255,255,0.95)', padding: '10px 14px',
          borderRadius: 10, fontSize: '0.8rem', color: '#555',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontFamily: "'Prompt', sans-serif",
        }}>
          <i className="fas fa-info-circle" style={{ color: '#C9A84C', marginRight: 6 }} />
          ทรัพย์ในผลลัพธ์ยังไม่มีพิกัด GPS — ไม่สามารถแสดงบนแผนที่ได้
        </div>
      )}
    </div>
  );
}
