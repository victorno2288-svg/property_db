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
  // Dark bubble with white text — pops off any map color
  // Active = gold brand accent for selected
  const bg = active ? '#C9A84C' : '#1a2b22';
  const color = active ? '#1a2b22' : '#ffffff';
  const haloColor = active ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.95)';
  // estimate width: ~10px per char + 26px padding + 4px border
  const estWidth = Math.max(60, `฿${priceLabel}`.length * 8 + 30);
  return L.divIcon({
    className: 'search-pin',
    html: `
      <div style="
        position: absolute;
        left: 50%; bottom: 0;
        transform: translateX(-50%) ${active ? 'scale(1.18)' : 'scale(1)'};
        transform-origin: bottom center;
        background: ${bg}; color: ${color};
        border: 2px solid #ffffff;
        border-radius: 999px;
        padding: 6px 13px;
        font-weight: 800; font-size: 12.5px;
        font-family: 'Manrope', system-ui, sans-serif;
        box-shadow: 0 0 0 3px ${haloColor}, 0 4px 12px rgba(0,0,0,0.3);
        white-space: nowrap;
        letter-spacing: -0.01em;
        transition: transform 0.2s;
        z-index: ${active ? 1000 : 1};
      ">
        ฿${priceLabel}
        <div style="
          position: absolute; bottom: -7px; left: 50%;
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${bg};
          transform: translateX(-50%);
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.18));
        "></div>
      </div>
    `,
    iconSize: [estWidth, 40],
    iconAnchor: [estWidth / 2, 40],
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
        <div style="font-family: 'Prompt', 'Sarabun', sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-weight: 800; color: #1f3a2e; font-size: 17px; font-family: 'Manrope', sans-serif; letter-spacing: -0.02em; line-height: 1; margin-bottom: 6px;">
            ฿${priceLabel}${p.listing_type === 'rent' ? '<span style="font-size:11px;font-weight:600;color:#6b7a86;margin-left:3px;">/เดือน</span>' : ''}
          </div>
          <div style="font-weight: 700; color: #1a2b22; font-size: 13px; line-height: 1.3; margin-bottom: 4px;">
            ${p.title || 'ทรัพย์สิน'}
          </div>
          <div style="font-size: 12px; color: #6a737d; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
            <span style="color:#3d7a3a;">📍</span> ${[p.district, p.province].filter(Boolean).join(', ') || ''}
          </div>
          <a href="/property/${p.id}" style="
            display: inline-block;
            padding: 6px 14px; background: #1a3a18; color: #fff !important;
            border-radius: 999px; font-size: 11px; font-weight: 700;
            text-decoration: none; letter-spacing: 0.04em;
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
      <style>{`
        .search-pin { background: transparent !important; border: none !important; overflow: visible !important; }
        .search-pin > div { overflow: visible !important; }
      `}</style>
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
