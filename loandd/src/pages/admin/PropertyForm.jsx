import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminFetch, { BASE_URL } from '../../utils/adminFetch';
import { findNearbyTransit, findNearestByType } from '../../data/trainStations';
import NotificationBell from '../../components/NotificationBell';
import '../../css/adminMobile.css';

const API = BASE_URL;

// ===== CONFIG =====
const PROPERTY_TYPES = [
 { value: 'house', label: 'บ้านเดี่ยว', icon: 'fa-home' },
 { value: 'townhouse', label: 'ทาวน์เฮ้าส์', icon: 'fa-city' },
 { value: 'townhome', label: 'ทาวน์โฮม', icon: 'fa-house-user' },
 { value: 'condo', label: 'คอนโด', icon: 'fa-building' },
 { value: 'land', label: 'ที่ดิน', icon: 'fa-mountain' },
 { value: 'commercial', label: 'อาคารพาณิชย์', icon: 'fa-store' },
 { value: 'apartment', label: 'อพาร์ทเม้นท์', icon: 'fa-hotel' },
 { value: 'home_office', label: 'โฮมออฟฟิศ', icon: 'fa-briefcase' },
 { value: 'warehouse', label: 'โกดัง/โรงงาน', icon: 'fa-warehouse' },
];

const AMENITY_PRESETS = [
 { name: 'แอร์', icon: 'fa-snowflake' },
 { name: 'เครื่องทำน้ำอุ่น', icon: 'fa-hot-tub' },
 { name: 'เฟอร์นิเจอร์บิ้วอิน', icon: 'fa-couch' },
 { name: 'ตู้เย็น', icon: 'fa-cube' },
 { name: 'เครื่องซักผ้า', icon: 'fa-tshirt' },
 { name: 'สระว่ายน้ำ', icon: 'fa-swimming-pool' },
 { name: 'สวน', icon: 'fa-leaf' },
 { name: 'ที่จอดรถ', icon: 'fa-car' },
 { name: 'ลิฟท์', icon: 'fa-arrow-up' },
 { name: 'ฟิตเนส', icon: 'fa-dumbbell' },
 { name: 'รปภ. 24 ชม.', icon: 'fa-shield-alt' },
 { name: 'กล้องวงจรปิด', icon: 'fa-video' },
 { name: 'สัญญาณกันขโมย', icon: 'fa-bell' },
 { name: 'อินเทอร์เน็ต', icon: 'fa-wifi' },
 { name: 'เลี้ยงสัตว์ได้', icon: 'fa-paw' },
 { name: 'ใกล้ BTS/MRT', icon: 'fa-train' },
];

const NEARBY_TYPES = [
 { value: 'bts', label: 'BTS/สายสีเขียว', color: '#2ea44f' },
 { value: 'bts_gold', label: 'BTS/สายสีทอง', color: '#c9a84c' },
 { value: 'mrt', label: 'MRT/สายสีน้ำเงิน', color: '#1e4d8b' },
 { value: 'mrt_purple', label: 'MRT/สายสีม่วง', color: '#7c3aed' },
 { value: 'mrt_yellow', label: 'MRT/สายสีเหลือง', color: '#f7c600' },
 { value: 'mrt_pink', label: 'MRT/สายสีชมพู', color: '#ec4899' },
 { value: 'mrt_orange', label: 'MRT/สายสีส้ม', color: '#f7941d' },
 { value: 'mrt_brown', label: 'MRT/สายสีน้ำตาล', color: '#8b5a2b' },
 { value: 'lrt_gray', label: 'LRT/สายสีเทา', color: '#6b7280' },
 { value: 'lrt_silver', label: 'LRT/สายสีเงิน', color: '#94a3b8' },
 { value: 'srt_red', label: 'SRT/สายสีแดง', color: '#dc2626' },
 { value: 'arl', label: 'Airport Rail Link', color: '#6b21a8' },
 { value: 'school', label: 'โรงเรียน / มหาวิทยาลัย' },
 { value: 'hospital', label: 'โรงพยาบาล / คลินิก' },
 { value: 'mall', label: 'ห้างสรรพสินค้า' },
 { value: 'market', label: 'ตลาด / ร้านอาหาร' },
 { value: 'airport', label: 'สนามบิน' },
 { value: 'highway', label: 'ทางด่วน / ถนนสายหลัก' },
];

const STEPS = ['ข้อมูลพื้นฐาน', 'ที่ตั้ง', 'รายละเอียด', 'รูปภาพ', 'สิ่งอำนวยฯ'];

// ===== UTILS =====
// แปลงเลขไทย (๐-๙) → เลขอาหรับ (0-9)
const thaiToArabic = (str) => {
 if (!str && str !== 0) return str;
 return String(str).replace(/[๐-๙]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x0E50));
};

const EMPTY_FORM = {
 title: '', listing_type: 'sale', property_type: 'house', sale_status: 'available',
 is_featured: false, is_active: true,
 price_requested: '', original_price: '', is_discounted: false, price_per_sqm: '', monthly_rent: '',
 province: '', district: '', sub_district: '', postal_code: '', address: '', project_name: '',
 latitude: '', longitude: '',
 bts_station: '', bts_distance_km: '',
 mrt_station: '', mrt_distance_km: '',
 bedrooms: 0, bathrooms: 0, floors: 1, parking: 0,
 usable_area: '', land_area_rai: 0, land_area_ngan: 0, land_area_wah: 0,
 condition_status: 'unfurnished',
 property_condition: 'good',
 title_deed_type: '',
 year_built: '',
 pet_friendly: false,
 video_url: '',
 virtual_tour_id: '',
 description: '',
 internal_notes: '',
};

// ===== STYLES =====
const fieldStyle = {
 width: '100%', padding: '9px 12px', border: '1.5px solid #dde3ed', borderRadius: 8,
 fontSize: '0.9rem', fontFamily: "'Sarabun',sans-serif", outline: 'none',
 background: '#ffffff', color: '#111827', boxSizing: 'border-box', transition: 'border-color 0.2s',
};
const errStyle = (e) => e ? { ...fieldStyle, borderColor: '#e53e3e', background: '#fff5f5', color: '#111827' } : fieldStyle;
const prefix = { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '0.9rem', pointerEvents: 'none' };
const chipBtn = (active) => ({
 padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${active ? '#6aab62' : '#dde3ed'}`,
 background: active ? '#6aab62' : '#fff', color: active ? '#1a3a18' : '#555',
 cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: "'Sarabun',sans-serif",
 transition: 'all 0.15s',
});

function FormCard({ title, icon, children, tip }) {
 return (
 <div style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
 <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#6aab62', display: 'flex', alignItems: 'center', gap: 8 }}>
 {icon && <i className={`fas ${icon}`} style={{ color: '#3d7a3a' }} />} {title}
 </h3>
 {tip && (
 <div style={{ background: '#f0faf5', border: '1px solid #c6f0da', borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: '0.82rem', color: '#2d6a4f', display: 'flex', gap: 8 }}>
 <i className="fas fa-lightbulb" style={{ marginTop: 2, flexShrink: 0 }} />
 <span>{tip}</span>
 </div>
 )}
 {children}
 </div>
 );
}

function FieldRow({ label, error, children, hint }) {
 return (
 <div style={{ marginBottom: 14 }}>
 {label && <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 5 }}>{label}</label>}
 {children}
 {error && <span style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: 3, display: 'block' }}>{error}</span>}
 {hint && !error && <span style={{ color: '#888', fontSize: '0.75rem', marginTop: 3, display: 'block' }}>{hint}</span>}
 </div>
 );
}

function Stepper({ label, value, onChange, min = 0, max = 20 }) {
 const n = Number(value) || 0;
 return (
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
 <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>{label}</span>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <button type="button" onClick={() => onChange(Math.max(min, n - 1))}
 style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #dde', background: '#f5f7fa', color: '#444', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
 <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 24, textAlign: 'center', color: '#3d7a3a' }}>{n}</span>
 <button type="button" onClick={() => onChange(Math.min(max, n + 1))}
 style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #dde', background: '#f5f7fa', color: '#444', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
 </div>
 </div>
 );
}

// ===== TIP CARD (ENNXO-inspired) =====
function TipCard({ icon, title, desc }) {
 return (
 <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
 <div style={{ fontSize: '1.4rem' }}>{icon}</div>
 <div>
 <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#6aab62', marginBottom: 2 }}>{title}</div>
 <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>{desc}</div>
 </div>
 </div>
 );
}

// ===== MAIN COMPONENT =====
const G = '#3d7a3a'; const Gl = '#A1D99B';
const N = '#3d7a3a';

function PropertyForm() {
 const { id } = useParams();
 const navigate = useNavigate();
 const isEdit = Boolean(id);
 const adminUser = (() => { try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; } })();

 const [step, setStep] = useState(1);
 const [form, setForm] = useState({ ...EMPTY_FORM });
 const [provinces, setProvinces] = useState([]);
 const [errors, setErrors] = useState({});

 // Images
 const [thumbnail, setThumbnail] = useState(null);
 const [thumbnailPreview, setThumbnailPreview] = useState('');
 const [galleryFiles, setGalleryFiles] = useState([]);
 const [galleryPreviews, setGalleryPreviews] = useState([]);
 const [existingImages, setExistingImages] = useState([]);
 const thumbRef = useRef();
 const galleryRef = useRef();

 // Amenities
 const [existingAmenities, setExistingAmenities] = useState([]);

 // Nearby
 const [nearbyList, setNearbyList] = useState([]);
 const [nearbyForm, setNearbyForm] = useState({ place_type: 'bts', place_name: '', distance_km: '', travel_time_min: '' });

 // Transit auto-detect
 const [nearbyTransit, setNearbyTransit] = useState([]); // สถานีที่ detect ได้จาก lat/lng

 const [saving, setSaving] = useState(false);
 const savedIdRef = useRef(null); // guard against double POST
 const savingLock = useRef(false); // hard mutex — prevents ALL concurrent saves
 const [saveMsg, setSaveMsg] = useState('');
 const [savedId, setSavedId] = useState(null);

 // Multi-deed OCR state
 // deedSlots: [{ slotId, file, preview, scanning, result, saved, savedDeedId }]
 const [deedSlots, setDeedSlots] = useState([{ slotId: 1, file: null, preview: '', scanning: false, result: null, saved: false, savedDeedId: null }]);
 const [existingDeeds, setExistingDeeds] = useState([]); // เดิมใน DB: [{ id, deed_image_url }]
 // legacy compat (kept for loading existing single deed_image_url)
 const [existingDeedUrl, setExistingDeedUrl] = useState('');
 const deedSlotCounter = useRef(2);
 const fileInputRefs = useRef({}); // { slotId: <input ref> }

 // Maps state
 const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite' | 'hybrid'

 // Google Maps Places Autocomplete
 const [mapsLoaded, setMapsLoaded] = useState(false);
 const placesInputRef = useRef(null);

 // โหลด provinces (public API — ไม่ต้องใช้ adminFetch)
 useEffect(() => {
 fetch(`${API}/api/provinces`)
 .then(r => r.json())
 .then(d => {
 // รองรับทั้ง { success, data: [...] } และ array ตรงๆ
 const list = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
 setProvinces(list);
 })
 .catch(() => { });
 }, []);

 // ─── Load Google Maps JS API script (ครั้งเดียว) ───
 useEffect(() => {
 const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
 if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return; // ยังไม่ได้ใส่ key
 if (window.google?.maps?.places) { setMapsLoaded(true); return; } // โหลดแล้ว
 if (document.querySelector('#gmap-script')) return; // กำลังโหลด
 const script = document.createElement('script');
 script.id = 'gmap-script';
 script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=th&region=TH`;
 script.async = true;
 script.onload = () => setMapsLoaded(true);
 document.head.appendChild(script);
 }, []);

 // ─── Init Places Autocomplete เมื่อ script โหลดแล้วและอยู่ step 2 ───
 useEffect(() => {
 if (!mapsLoaded || step !== 2 || !placesInputRef.current) return;
 if (!window.google?.maps?.places) return;

 const autocomplete = new window.google.maps.places.Autocomplete(placesInputRef.current, {
 types: ['geocode', 'establishment'],
 componentRestrictions: { country: 'TH' },
 fields: ['address_components', 'geometry', 'formatted_address', 'name'],
 });

 const listener = autocomplete.addListener('place_changed', () => {
 const place = autocomplete.getPlace();
 if (!place?.geometry?.location) return;

 const lat = place.geometry.location.lat();
 const lng = place.geometry.location.lng();

 // helper — ดึง component ตาม type
 const getComp = (type) => {
 const c = (place.address_components || []).find(a => a.types.includes(type));
 return c ? c.long_name : '';
 };

 // จังหวัด — ตัด prefix + match กับ DB provinces list
 const rawProvince = getComp('administrative_area_level_1').replace(/^จังหวัด/, '').trim();
 // ลอง exact match ก่อน ถ้าไม่เจอลอง includes match
 const matchedProvince = provinces.find(p => p.name === rawProvince)?.name
 || provinces.find(p => rawProvince.includes(p.name) || p.name.includes(rawProvince))?.name
 || rawProvince;
 const province = matchedProvince;

 // อำเภอ/เขต — ตัด prefix
 const district = (getComp('administrative_area_level_2') || getComp('locality'))
 .replace(/^(อำเภอ|เขต)/, '').trim();

 // ตำบล/แขวง — ลอง sublocality_level_1, administrative_area_level_3, sublocality
 const sub_district = (
 getComp('sublocality_level_1') ||
 getComp('administrative_area_level_3') ||
 getComp('sublocality')
 ).replace(/^(ตำบล|แขวง)/, '').trim();

 const postal_code = getComp('postal_code');

 // ที่อยู่ย่อย — เอาชื่อสถานที่ หรือ route
 const streetNum = getComp('street_number');
 const route = getComp('route');
 const addressStr = place.name
 || (streetNum ? `${streetNum} ${route}` : route)
 || '';

 setForm(prev => ({
 ...prev,
 ...(province ? { province } : {}),
 ...(district ? { district } : {}),
 ...(sub_district ? { sub_district } : {}),
 ...(postal_code ? { postal_code } : {}),
 ...(addressStr && !prev.address ? { address: addressStr } : {}),
 latitude: lat.toFixed(7),
 longitude: lng.toFixed(7),
 }));
 });

 return () => {
 if (window.google?.maps?.event) {
 window.google.maps.event.removeListener(listener);
 }
 };
 }, [mapsLoaded, step]);

 // โหลดข้อมูล edit mode
 useEffect(() => {
 if (!isEdit) return;
 adminFetch(`/api/admin/properties/${id}`)
 .then(r => r.json())
 .then(data => {
 // Debug: ดู raw API response สำหรับ floors/parking
 console.log('[LOAD] raw API data:', JSON.stringify({ floors: data.floors, parking: data.parking, bedrooms: data.bedrooms, bathrooms: data.bathrooms }));
 // helper: แปลงค่าเป็น number — ใช้ ?? แทน || เพื่อรองรับค่า 0
 const num = (val, fallback) => (val != null && val !== '' && !isNaN(Number(val))) ? Number(val) : fallback;
 setForm({
 title: data.title || '',
 listing_type: data.listing_type || 'sale',
 property_type: data.property_type || 'house',
 sale_status: data.sale_status || 'available',
 is_featured: Number(data.is_featured) === 1,
 is_active: Number(data.is_active) === 1,
 price_requested: data.price_requested || '',
 original_price: data.original_price || '',
 is_discounted: Number(data.is_discounted) === 1,
 price_per_sqm: data.price_per_sqm || '',
 monthly_rent: data.monthly_rent || '',
 province: data.province || '',
 district: data.district || '',
 sub_district: data.sub_district || '',
 postal_code: data.postal_code || '',
 address: data.address || '',
 project_name: data.project_name || '',
 latitude: data.latitude || '',
 longitude: data.longitude || '',
 bts_station: data.bts_station || '',
 bts_distance_km: data.bts_distance_km || '',
 mrt_station: data.mrt_station || '',
 mrt_distance_km: data.mrt_distance_km || '',
 bedrooms: num(data.bedrooms, 0),
 bathrooms: num(data.bathrooms, 0),
 floors: num(data.floors, 1),
 parking: num(data.parking, 0),
 usable_area: data.usable_area || '',
 land_area_rai: num(data.land_area_rai, 0),
 land_area_ngan: num(data.land_area_ngan, 0),
 land_area_wah: num(data.land_area_wah, 0),
 condition_status: data.condition_status || 'unfurnished',
 property_condition: data.property_condition || 'good',
 title_deed_type: data.title_deed_type || '',
 year_built: data.year_built || '',
 pet_friendly: Number(data.pet_friendly) === 1,
 video_url: data.video_url || '',
 virtual_tour_id: data.virtual_tour_id || '',
 description: data.description || '',
 internal_notes: data.internal_notes || '',
 });
 if (data.thumbnail_url) {
 setThumbnailPreview(data.thumbnail_url.startsWith('http') ? data.thumbnail_url : `${API}${data.thumbnail_url}`);
 }
 setExistingImages(data.images || []);
 setExistingAmenities(data.amenities || []);
 setNearbyList(data.nearby_places || []);
 setSavedId(parseInt(id));
 savedIdRef.current = parseInt(id);
 // โหลดรูปโฉนดเก่า (ถ้ามี)
 if (data.deed_image_url) setExistingDeedUrl(data.deed_image_url);
 // โหลดรายการโฉนดหลายรูป (ถ้ามี)
 adminFetch(`/api/admin/properties/${id}/deeds`)
 .then(r => r.ok ? r.json() : [])
 .then(deeds => { if (Array.isArray(deeds)) setExistingDeeds(deeds); })
 .catch(() => { });
 });
 }, [id, isEdit]);

 const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

 const validate = (s) => {
 const e = {};
 if (s === 1) {
 if (!form.title.trim()) e.title = 'กรุณาระบุชื่อประกาศ';
 if (!form.property_type) e.property_type = 'กรุณาเลือกประเภท';
 if (!form.price_requested && form.listing_type !== 'rent') e.price_requested = 'กรุณาระบุราคาขาย';
 if (!form.monthly_rent && form.listing_type === 'rent') e.monthly_rent = 'กรุณาระบุค่าเช่า';
 }
 if (s === 2) {
 if (!form.province) e.province = 'กรุณาเลือกจังหวัด';
 }
 setErrors(e);
 return Object.keys(e).length === 0;
 };

 const nextStep = () => { setStep(s => Math.min(5, s + 1)); window.scrollTo(0, 0); };
 const prevStep = () => { setStep(s => Math.max(1, s - 1)); window.scrollTo(0, 0); };

 // ===== SAVE BASIC INFO =====
 const saveBasicInfo = async () => {
 // Hard mutex — absolutely no concurrent saves
 if (savingLock.current) {
 console.warn('[SAVE] savingLock ค้าง — กดซ้ำเร็วเกินไป');
 return false;
 }
 savingLock.current = true;
 setSaving(true); setSaveMsg('');
 try {
 const existingId = savedIdRef.current || savedId || (isEdit ? id : null);
 const method = existingId ? 'PUT' : 'POST';
 const url = existingId
 ? `${API}/api/admin/properties/${existingId}`
 : `${API}/api/admin/properties`;

 const payload = { ...form };
 // Ensure numbers are sent as numbers
 ['bedrooms', 'bathrooms', 'floors', 'parking', 'land_area_rai', 'land_area_ngan', 'land_area_wah'].forEach(k => {
 if (payload[k] !== undefined) payload[k] = Number(payload[k]) || 0;
 });
 // Ensure booleans are sent as 1/0 for MySQL TINYINT
 ['is_featured', 'is_active', 'is_discounted', 'pet_friendly'].forEach(k => {
 if (payload[k] !== undefined) payload[k] = payload[k] ? 1 : 0;
 });
 if (!payload.title && !existingId) payload.title = 'ทรัพย์ใหม่ (ร่าง)';

 console.log(`[SAVE] ${method} ${url}`);
 console.log('[SAVE] payload:', JSON.stringify({ floors: payload.floors, parking: payload.parking, bedrooms: payload.bedrooms, bathrooms: payload.bathrooms, title: payload.title?.slice(0, 30) }));

 const res = await adminFetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 });
 const data = await res.json();
 console.log(`[SAVE] response status: ${res.status}`, data);

 if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
 const newId = data.propertyId || data.id || data.insertId;
 if (!savedIdRef.current && newId) {
 savedIdRef.current = newId;
 setSavedId(newId);
 console.log('[SAVE] สร้างใหม่ ID:', newId);
 } else {
 console.log('[SAVE] อัพเดท ID:', existingId);
 }

 // ─── Verify save: refetch & sync form state with DB ───
 const verifyId = savedIdRef.current || newId || existingId;
 if (verifyId) {
 try {
 const vRes = await adminFetch(`/api/admin/properties/${verifyId}`);
 const vData = await vRes.json();
 console.log('[VERIFY] DB values after save:', JSON.stringify({ floors: vData.floors, parking: vData.parking, bedrooms: vData.bedrooms, bathrooms: vData.bathrooms }));
 // Sync numeric fields back from DB to prevent drift
 const numSafe = (val, fallback) => (val != null && val !== '' && !isNaN(Number(val))) ? Number(val) : fallback;
 setForm(prev => ({
 ...prev,
 bedrooms: numSafe(vData.bedrooms, prev.bedrooms),
 bathrooms: numSafe(vData.bathrooms, prev.bathrooms),
 floors: numSafe(vData.floors, prev.floors),
 parking: numSafe(vData.parking, prev.parking),
 land_area_rai: numSafe(vData.land_area_rai, prev.land_area_rai),
 land_area_ngan: numSafe(vData.land_area_ngan, prev.land_area_ngan),
 land_area_wah: numSafe(vData.land_area_wah, prev.land_area_wah),
 }));
 // Warn if DB values don't match what was sent
 if (numSafe(vData.floors, 1) !== (Number(payload.floors) || 0) || numSafe(vData.parking, 0) !== (Number(payload.parking) || 0)) {
 console.warn('[VERIFY] DB ไม่ตรงกับที่ส่ง! sent:', { floors: payload.floors, parking: payload.parking }, 'DB has:', { floors: vData.floors, parking: vData.parking });
 }
 } catch (verifyErr) {
 console.warn('[VERIFY] ไม่สามารถตรวจสอบได้:', verifyErr.message);
 }
 }

 setSaveMsg(' บันทึกแล้ว');
 setTimeout(() => setSaveMsg(''), 2000);
 return true;
 } catch (err) {
 console.error('[SAVE] ERROR:', err.message);
 setSaveMsg(` ${err.message}`);
 return false;
 } finally {
 setSaving(false);
 savingLock.current = false;
 }
 };

 const saveAndNext = async () => {
 const ok = await saveBasicInfo();
 if (ok) nextStep();
 };

 // ===== UPLOAD THUMBNAIL =====
 const uploadThumbnail = async () => {
 if (!thumbnail) return thumbnailPreview || null;
 const fd = new FormData();
 fd.append('image', thumbnail);
 const res = await adminFetch(`/api/admin/upload`, {
 method: 'POST', body: fd,
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error);
 return data.url;
 };

 // ===== SAVE IMAGES =====
 const saveImages = async () => {
 if (savingLock.current) return;
 savingLock.current = true;
 setSaving(true); setSaveMsg('');
 try {
 let pid = savedIdRef.current || savedId || (isEdit ? id : null);
 // Auto-save basic info if not saved yet
 if (!pid) {
 setSaveMsg('⏳ กำลังบันทึกข้อมูลพื้นฐาน...');
 const imgPayload = { ...form, title: form.title || 'ทรัพย์ใหม่ (ร่าง)' };
 ['bedrooms', 'bathrooms', 'floors', 'parking', 'land_area_rai', 'land_area_ngan', 'land_area_wah'].forEach(k => {
 if (imgPayload[k] !== undefined) imgPayload[k] = Number(imgPayload[k]) || 0;
 });
 const res = await adminFetch(`${API}/api/admin/properties`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(imgPayload),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
 const newId = data.propertyId || data.id || data.insertId;
 if (newId) { savedIdRef.current = newId; setSavedId(newId); }
 pid = newId;
 if (!pid) throw new Error('ไม่สามารถสร้างทรัพย์ได้ — กรุณาลองใหม่');
 }

 if (thumbnail) {
 const thumbUrl = await uploadThumbnail();
 await adminFetch(`/api/admin/properties/${pid}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ thumbnail_url: thumbUrl }),
 });
 setThumbnailPreview(`${API}${thumbUrl}`);
 setThumbnail(null);
 }

 for (const file of galleryFiles) {
 const fd = new FormData();
 fd.append('image', file);
 await adminFetch(`/api/admin/properties/${pid}/images`, {
 method: 'POST', body: fd,
 });
 }
 if (galleryFiles.length > 0) {
 setGalleryFiles([]); setGalleryPreviews([]);
 const res = await adminFetch(`/api/admin/properties/${pid}`);
 const data = await res.json();
 setExistingImages(data.images || []);
 }
 setSaveMsg(' บันทึกรูปภาพแล้ว');
 setTimeout(() => setSaveMsg(''), 2000);
 nextStep();
 } catch (err) {
 setSaveMsg(` ${err.message}`);
 } finally {
 setSaving(false);
 savingLock.current = false;
 }
 };

 const deleteExistingImage = async (imgId) => {
 const pid = savedId || id;
 await adminFetch(`/api/admin/properties/${pid}/images/${imgId}`, { method: 'DELETE' });
 setExistingImages(imgs => imgs.filter(i => i.id !== imgId));
 };

 // ===== AMENITIES =====
 const toggleAmenity = async (name, icon) => {
 const pid = savedId || id;
 const exists = existingAmenities.find(a => a.amenity_name === name);
 if (exists) {
 await adminFetch(`/api/admin/properties/${pid}/amenities/${exists.id}`, { method: 'DELETE' });
 setExistingAmenities(prev => prev.filter(a => a.id !== exists.id));
 } else {
 const res = await adminFetch(`/api/admin/properties/${pid}/amenities`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ amenity_name: name, amenity_icon: icon }),
 });
 const data = await res.json();
 setExistingAmenities(prev => [...prev, { id: data.id, amenity_name: name, amenity_icon: icon }]);
 }
 };

 // ===== AUTO TRANSIT DETECT =====
 // เรียกจาก reverseGeocodeLatLng / parseMapsLink / พิมพ์ lat,lng โดยตรง
 const autoFillTransit = (lat, lng) => {
 const latN = parseFloat(lat);
 const lngN = parseFloat(lng);
 if (isNaN(latN) || isNaN(lngN)) return;

 // หาสถานีทั้งหมดในรัศมี 3 กม. (สำหรับ chip list)
 const nearby = findNearbyTransit(latN, lngN, 3);
 setNearbyTransit(nearby);

 // auto-fill แยก BTS / MRT โดยใช้ findNearestByType
 const nearest = findNearestByType(latN, lngN, 3);
 setForm(prev => ({
 ...prev,
 bts_station: prev.bts_station ? prev.bts_station : (nearest.bts?.name || ''),
 bts_distance_km: prev.bts_distance_km ? prev.bts_distance_km : (nearest.bts ? nearest.bts.distance.toFixed(2) : ''),
 mrt_station: prev.mrt_station ? prev.mrt_station : (nearest.mrt?.name || ''),
 mrt_distance_km: prev.mrt_distance_km ? prev.mrt_distance_km : (nearest.mrt ? nearest.mrt.distance.toFixed(2) : ''),
 }));
 };

 // เพิ่มสถานี transit ที่ detect ได้ทั้งหมดลง nearbyList (Step 5) ผ่าน API
 const addTransitToNearby = async () => {
 const pid = savedId || id;
 if (!pid) { setSaveMsg(' กรุณาบันทึกข้อมูลก่อนเพิ่มสถานที่'); setTimeout(() => setSaveMsg(''), 3000); return; }
 if (nearbyTransit.length === 0) return;

 let added = 0;
 for (const s of nearbyTransit.slice(0, 8)) { // จำกัด 8 สถานีแรก
 const type = s.type === 'bts' ? 'bts' : s.type === 'mrt' ? 'mrt' : 'arl';
 const travelMin = Math.round((s.distance / 0.08)); // เดิน ~80m/min
 try {
 const res = await adminFetch(`/api/admin/properties/${pid}/nearby`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 place_type: type,
 place_name: s.name,
 distance_km: s.distance.toFixed(2),
 travel_time_min: travelMin > 60 ? '' : String(travelMin),
 }),
 });
 const data = await res.json();
 setNearbyList(prev => {
 if (prev.some(n => n.place_name === s.name)) return prev;
 return [...prev, { id: data.id, place_type: type, place_name: s.name, distance_km: s.distance.toFixed(2), travel_time_min: travelMin > 60 ? '' : String(travelMin) }];
 });
 added++;
 } catch { /* skip */ }
 }
 setSaveMsg(` เพิ่ม ${added} สถานีอัตโนมัติแล้ว`);
 setTimeout(() => setSaveMsg(''), 3000);
 };

 // ===== NEARBY =====
 const addNearby = async () => {
 if (!nearbyForm.place_name) return;
 const pid = savedId || id;
 const res = await adminFetch(`/api/admin/properties/${pid}/nearby`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(nearbyForm),
 });
 const data = await res.json();
 setNearbyList(prev => [...prev, { id: data.id, ...nearbyForm }]);

 // Auto-populate bts_station (searchable field) when adding transit nearby
 // รูปแบบ: "MRT สายสีม่วง สายฉลองรัชธรรม" — ให้ search "สายสีม่วง" เจอ
 const TRANSIT_TYPES = ['bts', 'bts_gold', 'mrt', 'mrt_purple', 'mrt_yellow', 'mrt_pink', 'mrt_orange', 'mrt_brown', 'lrt_gray', 'lrt_silver', 'srt_red', 'arl'];
 if (TRANSIT_TYPES.includes(nearbyForm.place_type)) {
 const typeObj = NEARBY_TYPES.find(t => t.value === nearbyForm.place_type);
 const lineLabel = (typeObj?.label || '').replace('/', ' '); // "MRT/สายสีม่วง" → "MRT สายสีม่วง"
 const combined = [lineLabel, nearbyForm.place_name].filter(Boolean).join(' ');
 const existing = (form.bts_station || '').trim();
 const newVal = existing
 ? (existing.includes(nearbyForm.place_name) ? existing : `${existing} | ${combined}`)
 : combined;
 set('bts_station', newVal);
 if (nearbyForm.distance_km && !form.bts_distance_km) {
 set('bts_distance_km', nearbyForm.distance_km);
 }
 }

 setNearbyForm({ place_type: 'bts', place_name: '', distance_km: '', travel_time_min: '' });
 };

 const deleteNearby = async (nearbyId) => {
 const pid = savedId || id;
 await adminFetch(`/api/admin/properties/${pid}/nearby/${nearbyId}`, { method: 'DELETE' });
 setNearbyList(prev => prev.filter(n => n.id !== nearbyId));
 };

 const finishAndExit = async () => {
 if (savingLock.current) return;
 savingLock.current = true;
 setSaving(true);
 try {
 const existingId = savedIdRef.current || savedId || (isEdit ? id : null);
 const method = existingId ? 'PUT' : 'POST';
 const url = existingId
 ? `${API}/api/admin/properties/${existingId}`
 : `${API}/api/admin/properties`;
 // ensure numeric fields are numbers (same as saveBasicInfo)
 const exitPayload = { ...form };
 ['bedrooms', 'bathrooms', 'floors', 'parking', 'land_area_rai', 'land_area_ngan', 'land_area_wah'].forEach(k => {
 if (exitPayload[k] !== undefined) exitPayload[k] = Number(exitPayload[k]) || 0;
 });
 // ensure booleans are 1/0
 ['is_featured', 'is_active', 'is_discounted', 'pet_friendly'].forEach(k => {
 if (exitPayload[k] !== undefined) exitPayload[k] = exitPayload[k] ? 1 : 0;
 });
 console.log('[EXIT-SAVE] payload:', JSON.stringify({ floors: exitPayload.floors, parking: exitPayload.parking, bedrooms: exitPayload.bedrooms, bathrooms: exitPayload.bathrooms }));
 const res = await adminFetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(exitPayload),
 });
 const data = await res.json();
 const newId = data.propertyId || data.id || data.insertId;
 if (res.ok && !savedIdRef.current && newId) {
 savedIdRef.current = newId;
 setSavedId(newId);
 }
 } catch (err) {
 // ignore errors — user wants to exit
 } finally {
 setSaving(false);
 savingLock.current = false;
 }
 navigate('/dashboard');
 };

 // extract Maps coords from Google Maps link + auto reverse geocode
 const parseMapsLink = (url) => {
 const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
 if (match) {
 set('latitude', match[1]);
 set('longitude', match[2]);
 reverseGeocodeLatLng(match[1], match[2]); // จะเรียก autoFillTransit ใน callback
 autoFillTransit(match[1], match[2]); // เรียกทันที (ไม่รอ API)
 setSaveMsg(' พิกัดถูกอ่านแล้ว — กำลังดึงที่อยู่...');
 setTimeout(() => setSaveMsg(''), 2000);
 } else {
 setSaveMsg(' ไม่พบพิกัดใน link นี้ — ลองคัดลอก URL จาก Google Maps ตรงๆ');
 setTimeout(() => setSaveMsg(''), 3000);
 }
 };

 // ===== Auto-Geocode จากที่อยู่โฉนด (หลัง OCR) =====
 // ใช้ Geocoding REST API โดยตรง — ไม่ต้องรอ Maps JS โหลด
 const autoGeocodeFromOCR = (province, district, subDistrict) => {
 const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
 if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return;
 const parts = [subDistrict, district, province].filter(Boolean);
 if (parts.length === 0) return;
 const query = encodeURIComponent(parts.join(' ') + ' ประเทศไทย');
 const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}&language=th&region=TH`;
 fetch(url)
 .then(r => r.json())
 .then(data => {
 if (data.status !== 'OK' || !data.results?.[0]) return;
 const result = data.results[0];
 const lat = result.geometry.location.lat;
 const lng = result.geometry.location.lng;
 const getComp = (type) => {
 const c = (result.address_components || []).find(a => a.types.includes(type));
 return c ? c.long_name : '';
 };
 const postal = getComp('postal_code');
 setForm(prev => ({
 ...prev,
 latitude: String(lat.toFixed ? lat.toFixed(7) : lat),
 longitude: String(lng.toFixed ? lng.toFixed(7) : lng),
 ...(postal && !prev.postal_code ? { postal_code: postal } : {}),
 }));
 // แสดงสถานะ
 setSaveMsg(' พิกัดอัตโนมัติจากโฉนด');
 setTimeout(() => setSaveMsg(''), 3000);
 })
 .catch(() => { });
 };

 // ===== Reverse Geocode จาก lat/lng → ที่อยู่ + รหัสไปรษณีย์ =====
 const reverseGeocodeLatLng = (lat, lng) => {
 const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
 if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return;
 const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=th&region=TH`;
 fetch(url)
 .then(r => r.json())
 .then(data => {
 if (data.status !== 'OK' || !data.results?.[0]) return;
 const result = data.results[0];
 const getComp = (type) => {
 const c = (result.address_components || []).find(a => a.types.includes(type));
 return c ? c.long_name : '';
 };
 const postal = getComp('postal_code');
 const rawProv = getComp('administrative_area_level_1').replace(/^จังหวัด/, '').trim();
 const district = (getComp('administrative_area_level_2') || getComp('locality'))
 .replace(/^(อำเภอ|เขต)/, '').trim();
 const sub_district = (
 getComp('sublocality_level_1') ||
 getComp('administrative_area_level_3') ||
 getComp('sublocality')
 ).replace(/^(ตำบล|แขวง)/, '').trim();
 const matchedProvince = provinces.find(p => p.name === rawProv)?.name
 || provinces.find(p => rawProv.includes(p.name) || p.name.includes(rawProv))?.name
 || rawProv;

 // บ้านเลขที่ + ถนน — แปลงเลขไทยด้วย
 const streetNum = thaiToArabic(getComp('street_number'));
 const route = getComp('route').replace(/^ถนน/, '').trim();
 const addressStr = streetNum
 ? (route ? `${streetNum} ${route}` : streetNum)
 : route;

 setForm(prev => ({
 ...prev,
 ...(postal && !prev.postal_code ? { postal_code: postal } : {}),
 ...(matchedProvince && !prev.province ? { province: matchedProvince } : {}),
 ...(district && !prev.district ? { district } : {}),
 ...(sub_district && !prev.sub_district ? { sub_district } : {}),
 ...(addressStr && !prev.address ? { address: addressStr } : {}),
 }));
 setSaveMsg(' กรอกที่อยู่ + รหัสไปรษณีย์ + บ้านเลขที่อัตโนมัติ');
 setTimeout(() => setSaveMsg(''), 3000);
 // auto-detect สถานีรถไฟฟ้าใกล้เคียง
 autoFillTransit(lat, lng);
 })
 .catch(() => { });
 };

 // ===== Multi-Deed: เพิ่ม slot ใหม่ =====
 const addDeedSlot = () => {
 if (deedSlots.length >= 5) return; // max 5 รูป
 const slotId = deedSlotCounter.current++;
 setDeedSlots(prev => [...prev, { slotId, file: null, preview: '', scanning: false, result: null, saved: false, savedDeedId: null }]);
 };

 // ===== Multi-Deed: ลบ slot =====
 const removeDeedSlot = (slotId) => {
 setDeedSlots(prev => {
 const slot = prev.find(s => s.slotId === slotId);
 if (slot?.preview) URL.revokeObjectURL(slot.preview);
 const remaining = prev.filter(s => s.slotId !== slotId);
 return remaining.length === 0
 ? [{ slotId: deedSlotCounter.current++, file: null, preview: '', scanning: false, result: null, saved: false, savedDeedId: null }]
 : remaining;
 });
 if (fileInputRefs.current[slotId]) fileInputRefs.current[slotId].value = '';
 };

 // ===== Multi-Deed: เลือกไฟล์ =====
 const handleDeedFile = (slotId, e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setDeedSlots(prev => prev.map(s =>
 s.slotId === slotId ? { ...s, file, preview: URL.createObjectURL(file), result: null, saved: false } : s
 ));
 };

 // ===== Multi-Deed: สแกน OCR slot เดียว =====
 const scanDeedSlot = async (slotId) => {
 const slot = deedSlots.find(s => s.slotId === slotId);
 if (!slot?.file) return;
 setDeedSlots(prev => prev.map(s => s.slotId === slotId ? { ...s, scanning: true, result: null } : s));
 try {
 const fd = new FormData();
 fd.append('deed_image', slot.file);
 const res = await adminFetch('/api/admin/ocr/scan', { method: 'POST', body: fd });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'OCR ล้มเหลว');

 const f = data.fields || {};
 const filled = [];

 // แปลงเลขไทย → อารบิก
 if (f.postal_code) f.postal_code = thaiToArabic(f.postal_code).trim();
 if (f.deed_number) f.deed_number = thaiToArabic(f.deed_number).trim();
 if (f.land_number) f.land_number = thaiToArabic(f.land_number).trim();
 if (f.survey_page) f.survey_page = thaiToArabic(f.survey_page).trim();
 if (f.house_no) f.house_no = thaiToArabic(f.house_no).trim();
 if (f.moo) f.moo = thaiToArabic(f.moo).trim();

 // ── กรอก fields หลักอัตโนมัติ (ทับค่าเดิมถ้ามี) ──
 if (f.province) { set('province', f.province); filled.push('จังหวัด'); }
 if (f.district) { set('district', f.district); filled.push('อำเภอ/เขต'); }
 if (f.sub_district) { set('sub_district', f.sub_district); filled.push('ตำบล/แขวง'); }
 if (f.postal_code) { set('postal_code', f.postal_code); filled.push('รหัสไปรษณีย์'); }
 if (f.title_deed_type) { set('title_deed_type', f.title_deed_type); filled.push('ประเภทโฉนด'); }
 if (f.land_area_rai != null) { set('land_area_rai', Number(f.land_area_rai)); filled.push(`ที่ดิน ${f.land_area_rai} ไร่`); }
 if (f.land_area_ngan != null) { set('land_area_ngan', Number(f.land_area_ngan)); filled.push(`${f.land_area_ngan} งาน`); }
 if (f.land_area_wah != null) { set('land_area_wah', Number(f.land_area_wah)); filled.push(`${f.land_area_wah} ตร.วา`); }

 // ── บ้านเลขที่ + หมู่ + ถนน ──
 const addrParts = [];
 if (f.house_no) addrParts.push(f.house_no);
 if (f.moo) addrParts.push(`หมู่ ${f.moo}`);
 if (f.road) addrParts.push(`ถ.${f.road}`);
 const deedAddress = addrParts.join(' ');
 if (deedAddress) { set('address', deedAddress); filled.push(`บ้านเลขที่: ${deedAddress}`); }

 // ── บันทึก metadata ลง internal_notes ──
 const deedMeta = [];
 if (f.deed_number) deedMeta.push(`เลขที่โฉนด: ${f.deed_number}`);
 if (f.land_number) deedMeta.push(`เลขที่ดิน: ${f.land_number}`);
 if (f.zone) deedMeta.push(`ระวาง: ${f.zone}`);
 if (f.survey_page) deedMeta.push(`หน้าสำรวจ: ${f.survey_page}`);
 if (f.owner_name) deedMeta.push(`ชื่อผู้ถือ: ${f.owner_name}`);
 if (f.issue_date) deedMeta.push(`วันออกโฉนด: ${f.issue_date}`);
 if (deedAddress) deedMeta.push(`บ้านเลขที่: ${deedAddress}`);

 if (deedMeta.length > 0) {
 const slotNum = deedSlots.findIndex(s => s.slotId === slotId) + 1;
 const noteText = `[OCR โฉนด #${slotNum}]\n${deedMeta.join('\n')}`;
 setForm(prev => ({
 ...prev,
 internal_notes: prev.internal_notes ? `${prev.internal_notes}\n\n${noteText}` : noteText,
 }));
 filled.push('บันทึกใน Notes');
 }

 setDeedSlots(prev => prev.map(s =>
 s.slotId === slotId ? { ...s, scanning: false, result: { filled, fields: f, error: null } } : s
 ));

 // Auto-geocode จากโฉนด
 if (f.province || f.district || f.sub_district) {
 autoGeocodeFromOCR(f.province || '', f.district || '', f.sub_district || '');
 }
 } catch (err) {
 setDeedSlots(prev => prev.map(s =>
 s.slotId === slotId ? { ...s, scanning: false, result: { filled: [], error: err.message } } : s
 ));
 }
 };

 // ===== Multi-Deed: บันทึกรูปโฉนดลง DB =====
 const saveDeedSlot = async (slotId) => {
 const propertyId = savedId || (isEdit ? id : null);
 const slot = deedSlots.find(s => s.slotId === slotId);
 if (!slot?.file || !propertyId) return;
 setDeedSlots(prev => prev.map(s => s.slotId === slotId ? { ...s, saving: true } : s));
 try {
 const fd = new FormData();
 fd.append('deed_image', slot.file);
 const res = await adminFetch(`/api/admin/properties/${propertyId}/deeds`, { method: 'POST', body: fd });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
 setDeedSlots(prev => prev.map(s =>
 s.slotId === slotId ? { ...s, saving: false, saved: true, savedDeedId: data.deed?.id } : s
 ));
 setExistingDeeds(prev => [...prev, data.deed]);
 } catch (err) {
 setDeedSlots(prev => prev.map(s => s.slotId === slotId ? { ...s, saving: false } : s));
 alert(` ${err.message}`);
 }
 };

 // ===== Multi-Deed: ลบโฉนดเก่าจาก DB =====
 const deleteExistingDeed = async (deedId) => {
 const propertyId = savedId || (isEdit ? id : null);
 if (!propertyId) return;
 if (!window.confirm('ลบรูปโฉนดนี้ออกจากฐานข้อมูล?')) return;
 try {
 const res = await adminFetch(`/api/admin/properties/${propertyId}/deeds/${deedId}`, { method: 'DELETE' });
 if (res.ok) setExistingDeeds(prev => prev.filter(d => d.id !== deedId));
 } catch (_) { }
 };

 // ===== RENDER =====
 return (
 <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun',sans-serif" }}>

 {/* Navbar — consistent with Dashboard / AdminProperties / AdminInquiries */}
 <div style={{ background: `linear-gradient(135deg,${N},#6aab62)`, height: 60, position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16 }}>
 {/* Logo */}
 <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
 <div style={{ width: 34, height: 34, borderRadius: 8, background: Gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1a3a18', fontSize: '1rem', letterSpacing: -1 }}>L</div>
 <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: 0.5 }}>LOANDD</span>
 <span style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)', fontSize: '0.62rem', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Admin</span>
 </Link>

 {/* Right side: save msg + preview btn + avatar + logout */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
 {saveMsg && (
 <span style={{ fontSize: '0.82rem', color: saveMsg.startsWith('') ? '#a8f0c6' : '#f9a8a8', transition: 'opacity 0.3s' }}>{saveMsg}</span>
 )}
 {(savedId || isEdit) && (
 <button onClick={() => window.open(`/property/${savedId || id}`, '_blank')}
 style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
 <i className="fas fa-eye" style={{ marginRight: 5 }} />ดูหน้าจริง
 </button>
 )}
 <NotificationBell />
 <div style={{ width: 32, height: 32, borderRadius: '50%', background: Gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1a3a18', fontSize: '0.85rem', cursor: 'default', flexShrink: 0 }}>
 {(adminUser?.username || adminUser?.name || 'A')[0].toUpperCase()}
 </div>
 <button onClick={() => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); navigate('/admin'); }}
 style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
 ออกจากระบบ
 </button>
 </div>
 </div>

 {/* Page title strip + pill tab nav */}
 <div style={{ background: '#fff', borderBottom: '1px solid #e8edf2', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <Link to="/dashboard" style={{ color: '#6b7280', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>← ภาพรวม</Link>
 <span style={{ color: '#d1d5db' }}>›</span>
 <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6aab62' }}>
 {isEdit ? ' แก้ไขทรัพย์สิน' : ' เพิ่มทรัพย์ใหม่'}
 </span>
 </div>
 {/* Pill tab nav */}
 <div className="admin-pill-nav" style={{ position: 'relative', display: 'inline-flex', background: '#e2e8f0', borderRadius: 14, padding: 4, gap: 0 }}>
 <div style={{ position: 'absolute', top: 4, bottom: 4, width: 'calc(25% - 4px)', left: 'calc(25% + 2px)', background: '#fff', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.12)', zIndex: 0 }} />
 {[
 { label: 'ภาพรวม', path: '/dashboard' },
 { label: 'ทรัพย์', path: '/admin/properties' },
 { label: 'ข้อความ', path: '/admin/inquiries' },
 { label: 'ผู้ใช้', path: '/admin/users' },
 ].map((t) => {
 const active = t.path === '/admin/properties';
 return (
 <Link key={t.path} to={t.path} style={{ position: 'relative', zIndex: 1, textDecoration: 'none', padding: '7px 18px', borderRadius: 10, fontWeight: active ? 800 : 500, color: active ? N : '#94a3b8', fontSize: '0.8rem', fontFamily: "'Sarabun',sans-serif", transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
 {t.label}
 </Link>
 );
 })}
 </div>
 </div>

 {/* Step Indicator */}
 <div style={{ background: '#fff', borderBottom: '1px solid #e8edf2', padding: '12px 24px', overflowX: 'auto' }}>
 <div style={{ display: 'flex', maxWidth: 820, margin: '0 auto' }}>
 {STEPS.map((label, i) => {
 const n = i + 1;
 const done = n < step;
 const active = n === step;
 return (
 <React.Fragment key={n}>
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, cursor: done ? 'pointer' : 'default' }}
 onClick={() => done && setStep(n)}>
 <div style={{
 width: 30, height: 30, borderRadius: '50%',
 background: done ? '#A1D99B' : active ? '#6aab62' : '#e8edf2',
 color: (done || active) ? '#1a3a18' : '#aaa',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s',
 }}>
 {done ? '' : n}
 </div>
 <span style={{ fontSize: '0.68rem', marginTop: 4, color: active ? '#6aab62' : done ? '#A1D99B' : '#aaa', fontWeight: active ? 700 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
 </div>
 {i < STEPS.length - 1 && (
 <div style={{ flex: 1, height: 2, background: done ? '#A1D99B' : '#e8edf2', marginTop: 14, transition: 'background 0.2s' }} />
 )}
 </React.Fragment>
 );
 })}
 </div>
 </div>

 <div style={{ maxWidth: 820, margin: '24px auto', padding: '0 16px' }}>

 {/* ===================== STEP 1: ข้อมูลพื้นฐาน ===================== */}
 {step === 1 && (
 <>
 {/* Tips (ENNXO-inspired) */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10, marginBottom: 16 }}>
 <TipCard icon="" title="รูปภาพดีเพิ่มยอดชม 3 เท่า" desc="ใช้รูปสว่าง ชัด มองเห็นทุกมุม ทั้งภายนอกและภายใน" />
 <TipCard icon="" title="ชื่อประกาศที่ดี" desc="ระบุ: ประเภท + จำนวนห้อง + ทำเล เช่น 'บ้านเดี่ยว 3 นอน ลาดพร้าว พร้อมโอน'" />
 <TipCard icon="" title="ราคายุติธรรม = ติดต่อเร็วกว่า" desc="ระบุราคาจริงชัดเจน มีราคาลดช่วยสร้าง urgency" />
 </div>

 <FormCard title="ข้อมูลพื้นฐาน" icon="fa-info-circle">
 <FieldRow label="ชื่อประกาศ *" error={errors.title} hint="ตัวอย่าง: บ้านเดี่ยว 2 ชั้น 3 ห้องนอน ย่านลาดพร้าว พร้อมโอน">
 <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
 placeholder="ชื่อที่ระบุประเภท + ทำเล + จุดเด่น" style={errStyle(errors.title)} maxLength={200} />
 <span style={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'right', display: 'block', marginTop: 3 }}>{form.title.length}/200</span>
 </FieldRow>

 <FieldRow label="ประเภทธุรกรรม">
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 {[{ v: 'sale', l: ' ขาย' }, { v: 'rent', l: ' ให้เช่า' }, { v: 'sale_rent', l: ' ขาย/เช่า' }].map(o => (
 <button key={o.v} type="button" onClick={() => set('listing_type', o.v)} style={chipBtn(form.listing_type === o.v)}>{o.l}</button>
 ))}
 </div>
 </FieldRow>

 <FieldRow label="ประเภทอสังหาริมทรัพย์ *" error={errors.property_type}>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
 {PROPERTY_TYPES.map(pt => (
 <button key={pt.value} type="button" onClick={() => set('property_type', pt.value)}
 style={{ ...chipBtn(form.property_type === pt.value), display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px', gap: 5, height: 'auto', borderRadius: 10 }}>
 <i className={`fas ${pt.icon}`} style={{ fontSize: '1.2rem' }} />
 <span style={{ fontSize: '0.76rem' }}>{pt.label}</span>
 </button>
 ))}
 </div>
 </FieldRow>

 <FieldRow label="สถานะการขาย">
 <div style={{ display: 'flex', gap: 8 }}>
 {[{ v: 'available', l: ' ว่างอยู่', c: '#A1D99B' }, { v: 'reserved', l: ' จองแล้ว', c: '#d4890a' }, { v: 'sold', l: ' ขายแล้ว', c: '#c0392b' }].map(s => (
 <button key={s.v} type="button" onClick={() => set('sale_status', s.v)}
 style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${form.sale_status === s.v ? s.c : '#dde'}`, background: form.sale_status === s.v ? s.c : '#fff', color: form.sale_status === s.v ? '#1a3a18' : '#555', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s' }}>
 {s.l}
 </button>
 ))}
 </div>
 </FieldRow>
 </FormCard>

 <FormCard title="ราคา" icon="fa-tag">
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 {(form.listing_type === 'sale' || form.listing_type === 'sale_rent') && (
 <FieldRow label="ราคาขาย (บาท) *" error={errors.price_requested}>
 <div style={{ position: 'relative' }}>
 <span style={prefix}>฿</span>
 <input type="number" value={form.price_requested} onChange={e => set('price_requested', e.target.value)}
 placeholder="3500000" style={{ ...errStyle(errors.price_requested), paddingLeft: 28 }} />
 </div>
 </FieldRow>
 )}
 {(form.listing_type === 'rent' || form.listing_type === 'sale_rent') && (
 <FieldRow label="ค่าเช่า/เดือน (บาท)" error={errors.monthly_rent}>
 <div style={{ position: 'relative' }}>
 <span style={prefix}>฿</span>
 <input type="number" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)}
 placeholder="15000" style={{ ...errStyle(errors.monthly_rent), paddingLeft: 28 }} />
 </div>
 </FieldRow>
 )}
 <FieldRow label="ราคา/ตร.ม. (บาท)" hint="ระบุหรือปล่อยว่างให้คำนวณอัตโนมัติ">
 <div style={{ position: 'relative' }}>
 <span style={prefix}>฿</span>
 <input type="number" value={form.price_per_sqm} onChange={e => set('price_per_sqm', e.target.value)}
 placeholder="คำนวณอัตโนมัติ" style={{ ...fieldStyle, paddingLeft: 28 }} />
 </div>
 </FieldRow>
 </div>

 {/* ราคาลด (PropertyScout style) */}
 <div style={{ marginTop: 8 }}>
 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginBottom: 10 }}>
 <input type="checkbox" checked={form.is_discounted} onChange={e => set('is_discounted', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#e8a020' }} />
 <span> มีการลดราคา (แสดงป้าย "ราคาลด" บนหน้าเว็บ)</span>
 </label>
 {form.is_discounted && (
 <FieldRow label="ราคาเดิม (บาท)" hint="ราคาก่อนลด จะแสดงขีดทับคู่กับราคาใหม่">
 <div style={{ position: 'relative' }}>
 <span style={prefix}>฿</span>
 <input type="number" value={form.original_price} onChange={e => set('original_price', e.target.value)}
 placeholder="ราคาก่อนลด เช่น 4200000" style={{ ...fieldStyle, paddingLeft: 28 }} />
 </div>
 </FieldRow>
 )}
 </div>

 <div style={{ display: 'flex', gap: 20, marginTop: 4, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
 <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#6aab62' }} />
 <span> ตั้งเป็นทรัพย์แนะนำ</span>
 </label>
 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
 <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#A1D99B' }} />
 <span> แสดงบนเว็บ</span>
 </label>
 </div>
 </FormCard>
 </>
 )}

 {/* ===================== STEP 2: ที่ตั้ง ===================== */}
 {step === 2 && (
 <>
 {/* ===== MULTI-DEED OCR CARD ===== */}
 <div style={{ background: '#f0f9e8', border: '1.5px solid #A1D99B', borderRadius: 14, padding: '18px 20px', marginBottom: 16, color: '#1a3a18' }}>
 {/* Header */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 36, height: 36, borderRadius: 10, background: '#A1D99B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}></div>
 <div>
 <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a3a18' }}>สแกนโฉนดอัตโนมัติ</div>
 <div style={{ fontSize: '0.72rem', color: '#3d7a3a', fontWeight: 500 }}>อัพโหลดได้สูงสุด 5 รูป · AI กรอกที่ตั้ง · เนื้อที่ · ประเภทโฉนด ลง Notes อัตโนมัติ</div>
 </div>
 </div>
 {/* + เพิ่มรูป button */}
 {deedSlots.length < 5 && (
 <button type="button" onClick={addDeedSlot}
 style={{ background: '#1a3a18', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(26,58,24,0.2)' }}>
 <i className="fas fa-plus" /> เพิ่มรูป
 </button>
 )}
 </div>

 {/* โฉนดที่บันทึกไว้ใน DB แล้ว (existingDeeds) */}
 {existingDeeds.length > 0 && (
 <div style={{ marginBottom: 12 }}>
 <div style={{ fontSize: '0.75rem', color: '#1a3a18', marginBottom: 6, fontWeight: 600 }}> รูปโฉนดที่บันทึกไว้แล้ว ({existingDeeds.length} รูป):</div>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
 {existingDeeds.map((d, i) => (
 <div key={d.id} style={{ position: 'relative' }}>
 <a href={`${API}${d.deed_image_url}`} target="_blank" rel="noreferrer">
 <img src={`${API}${d.deed_image_url}`} alt={`deed-${i + 1}`}
 style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #A1D99B', display: 'block' }} />
 </a>
 <button type="button" onClick={() => deleteExistingDeed(d.id)}
 title="ลบรูปโฉนด"
 style={{ position: 'absolute', top: -8, right: -8, width: 30, height: 30, borderRadius: '50%', background: '#ef4444', border: '2.5px solid #fff', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 3px 10px rgba(229,62,62,0.5)', lineHeight: 1, zIndex: 2 }}><i className="fas fa-times" /></button>
 </div>
 ))}
 </div>
 </div>
 )}
 {/* legacy deed_image_url (single old-style) */}
 {existingDeedUrl && existingDeeds.length === 0 && (
 <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', border: '1px solid #d4e8c8' }}>
 <a href={`${API}${existingDeedUrl}`} target="_blank" rel="noreferrer" style={{ color: '#1a6040', textDecoration: 'none', fontWeight: 600 }}>
 <i className="fas fa-file-image" /> ดูโฉนดเดิม (legacy)
 </a>
 </div>
 )}

 {/* Deed Slots */}
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
 {deedSlots.map((slot, idx) => (
 <div key={slot.slotId} style={{ background: '#fff', borderRadius: 12, padding: '12px', width: 'calc(50% - 6px)', minWidth: 220, boxSizing: 'border-box', border: '1px solid #d4e8c8' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
 <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3d7a3a' }}>โฉนด #{idx + 1}</span>
 {deedSlots.length > 1 && (
 <button type="button" onClick={() => removeDeedSlot(slot.slotId)}
 style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', padding: 0, fontWeight: 600 }}>
 <i className="fas fa-times" /> ลบ
 </button>
 )}
 </div>

 {/* Upload zone */}
 <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
 <div style={{ position: 'relative', flexShrink: 0 }}>
 <div onClick={() => fileInputRefs.current[slot.slotId]?.click()}
 style={{ width: 88, height: 88, borderRadius: 8, border: '2px dashed #A1D99B', cursor: 'pointer', overflow: 'hidden', background: slot.preview ? 'transparent' : '#f0f9e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
 {slot.preview
 ? <img src={slot.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 : <><i className="fas fa-camera" style={{ fontSize: '1.4rem', color: '#3d7a3a', marginBottom: 3 }} /><span style={{ fontSize: '0.62rem', color: '#3d7a3a', textAlign: 'center', fontWeight: 600 }}>คลิกเลือก<br />รูปโฉนด</span></>
 }
 </div>
 {slot.preview && (
 <button type="button" onClick={e => { e.stopPropagation(); removeDeedSlot(slot.slotId); }}
 title="ลบรูปโฉนด"
 style={{ position: 'absolute', top: -8, right: -8, width: 30, height: 30, borderRadius: '50%', background: '#ef4444', border: '2.5px solid #fff', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 3px 10px rgba(229,62,62,0.5)', lineHeight: 1, zIndex: 2 }}><i className="fas fa-times" /></button>
 )}
 <input ref={el => { fileInputRefs.current[slot.slotId] = el; }} type="file" accept="image/*"
 onChange={e => handleDeedFile(slot.slotId, e)} style={{ display: 'none' }} />
 </div>

 {/* Buttons + result */}
 <div style={{ flex: 1 }}>
 {/* Scan button */}
 <button type="button" onClick={() => scanDeedSlot(slot.slotId)} disabled={!slot.file || slot.scanning}
 style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: (!slot.file || slot.scanning) ? 'rgba(26,58,24,0.1)' : G, color: (!slot.file || slot.scanning) ? '#1a3a18' : '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: (!slot.file || slot.scanning) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 5 }}>
 {slot.scanning ? <><i className="fas fa-circle-notch fa-spin" />สแกน...</> : <><i className="fas fa-magic" />สแกน OCR</>}
 </button>

 {/* Save button */}
 {slot.file && (savedId || isEdit) && (
 <button type="button" onClick={() => saveDeedSlot(slot.slotId)} disabled={slot.saving || slot.saved}
 style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(26,58,24,0.15)', background: slot.saved ? 'rgba(4,170,109,0.3)' : 'rgba(26,58,24,0.08)', color: slot.saved ? '#2d6a2e' : '#1a3a18', fontWeight: 600, fontSize: '0.76rem', cursor: (slot.saving || slot.saved) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 5 }}>
 {slot.saving ? <><i className="fas fa-circle-notch fa-spin" />บันทึก...</> : slot.saved ? <><i className="fas fa-check" />บันทึกแล้ว</> : <><i className="fas fa-save" />บันทึกโฉนด</>}
 </button>
 )}
 {slot.file && !savedId && !isEdit && (
 <div style={{ fontSize: '0.65rem', color: 'rgba(255,165,0,0.8)' }}> บันทึก Step 1 ก่อน</div>
 )}

 {/* OCR Result */}
 {slot.result && !slot.result.error && slot.result.filled.length > 0 && (
 <div style={{ background: '#e8f5e0', border: '1px solid #A1D99B', borderRadius: 6, padding: '6px 8px' }}>
 <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a6040', marginBottom: 4 }}> {slot.result.filled.length} รายการ:</div>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
 {slot.result.filled.map((item, i) => (
 <span key={i} style={{ background: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: '0.62rem', color: '#1a3a18', border: '1px solid rgba(161,217,155,0.5)' }}> {item}</span>
 ))}
 </div>
 {slot.result.fields && (
 <div style={{ marginTop: 5, fontSize: '0.62rem', color: '#3d7a3a', lineHeight: 1.7 }}>
 {slot.result.fields.deed_number && <span> {slot.result.fields.deed_number} </span>}
 {slot.result.fields.owner_name && <span> {slot.result.fields.owner_name}</span>}
 </div>
 )}
 </div>
 )}
 {slot.result && !slot.result.error && slot.result.filled.length === 0 && (
 <div style={{ fontSize: '0.68rem', color: '#c25a00', fontWeight: 600 }}> ไม่พบข้อมูล — ถ่ายให้ชัดขึ้น</div>
 )}
 {slot.result?.error && (
 <div style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}> {slot.result.error}</div>
 )}
 {!slot.file && (
 <div style={{ fontSize: '0.63rem', color: '#88a580', lineHeight: 1.6, fontWeight: 500 }}>
 JPG · PNG · WEBP<br />สูงสุด 15 MB
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* ═══ Google Maps Places Autocomplete Search ═══ */}
 <div style={{
 background: 'linear-gradient(135deg,#fff8e1,#fffde7)',
 border: '1.5px solid #ffc107',
 borderRadius: 14, padding: '14px 16px', marginBottom: 14,
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
 <div style={{ fontSize: '1.3rem' }}></div>
 <div>
 <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7a5200' }}>
 ค้นหาที่อยู่ด้วย Google Maps
 </div>
 <div style={{ fontSize: '0.72rem', color: '#a07000' }}>
 พิมพ์ที่อยู่ → เลือกสถานที่ → กรอก จังหวัด · อำเภอ · ตำบล · รหัสไปรษณีย์ · พิกัด อัตโนมัติ
 </div>
 </div>
 </div>
 <div style={{ position: 'relative' }}>
 <i className="fas fa-search" style={{
 position: 'absolute', left: 11, top: '50%',
 transform: 'translateY(-50%)', color: '#f59e0b', fontSize: '0.85rem',
 pointerEvents: 'none',
 }} />
 <input
 ref={placesInputRef}
 type="text"
 placeholder={
 !import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
 ? ' ยังไม่ได้ใส่ VITE_GOOGLE_MAPS_KEY ใน .env'
 : 'พิมพ์ชื่อสถานที่ บ้านเลขที่ ซอย หรือชื่อย่าน...'
 }
 disabled={
 !import.meta.env.VITE_GOOGLE_MAPS_KEY ||
 import.meta.env.VITE_GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
 }
 style={{
 ...fieldStyle,
 paddingLeft: 32,
 background: (
 !import.meta.env.VITE_GOOGLE_MAPS_KEY ||
 import.meta.env.VITE_GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
 ) ? '#f5f5f5' : '#fff',
 }}
 />
 </div>
 {mapsLoaded && (
 <p style={{ fontSize: '0.7rem', color: '#28a745', margin: '5px 0 0', fontWeight: 600 }}>
 Google Maps พร้อมใช้งานแล้ว
 </p>
 )}
 </div>

 <FormCard title="ที่ตั้งทรัพย์สิน" icon="fa-map-marker-alt"
 tip="ระบุที่อยู่ให้ครบถ้วน ช่วยให้ผู้ซื้อค้นหาเจอและตัดสินใจได้เร็วขึ้น">

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <FieldRow label="จังหวัด *" error={errors.province}>
 <select value={form.province} onChange={e => set('province', e.target.value)} style={errStyle(errors.province)}>
 <option value="">-- เลือกจังหวัด --</option>
 {provinces.map(p => (
 <option key={p.id || p.name} value={p.name}>{p.name}</option>
 ))}
 </select>
 </FieldRow>
 <FieldRow label="อำเภอ/เขต">
 <input type="text" value={form.district} onChange={e => set('district', e.target.value)}
 placeholder="เช่น ลาดพร้าว" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="ตำบล/แขวง">
 <input type="text" value={form.sub_district} onChange={e => set('sub_district', e.target.value)}
 placeholder="เช่น จรเข้บัว" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="รหัสไปรษณีย์">
 <input type="text" value={form.postal_code} onChange={e => set('postal_code', e.target.value)}
 placeholder="10230" maxLength={5} style={fieldStyle} />
 </FieldRow>
 </div>

 <FieldRow label="ชื่อโครงการ/หมู่บ้าน" hint="ถ้ามี เช่น หมู่บ้านเดอะวิลเลจ / ลลิล ทาวน์วิลล์">
 <input type="text" value={form.project_name} onChange={e => set('project_name', e.target.value)}
 placeholder="ชื่อโครงการ (ถ้ามี)" style={fieldStyle} />
 </FieldRow>

 <FieldRow label=" บ้านเลขที่ / ซอย / ถนน" hint="กรอกเองหรือกรอกอัตโนมัติจาก Google Maps URL ด้านล่าง">
 <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
 placeholder="เช่น 123 ซอยสุขุมวิท 11 ถนนสุขุมวิท" style={fieldStyle} />
 </FieldRow>

 {/* ===== Google Maps Pin + Embedded Preview ===== */}
 <div style={{ background: '#f0f7ff', border: '1px solid #cce0ff', borderRadius: 10, padding: 14, marginBottom: 14 }}>
 <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#6aab62', marginBottom: 8 }}>
 ปักหมุดบนแผนที่ (Google Maps)
 </div>
 <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 10px', lineHeight: 1.5 }}>
 วาง URL จาก Google Maps หรือใส่พิกัด Lat, Lng แล้วระบบจะแสดงแผนที่ให้ตรวจสอบ
 </p>

 {/* URL input + เปิดแผนที่ */}
 <FieldRow label="วาง Google Maps URL หรือพิกัด (lat,lng)">
 <div style={{ display: 'flex', gap: 8 }}>
 <input
 type="text"
 placeholder="https://maps.google.com/... หรือ 13.7563,100.5018"
 style={{ ...fieldStyle, flex: 1 }}
 onBlur={e => {
 const v = e.target.value.trim();
 if (!v) return;
 // พิกัดตรง: "13.7563,100.5018"
 const coordMatch = v.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
 if (coordMatch) {
 set('latitude', coordMatch[1]);
 set('longitude', coordMatch[2]);
 reverseGeocodeLatLng(coordMatch[1], coordMatch[2]);
 return;
 }
 // Google Maps URL
 if (v.includes('maps.google') || v.includes('goo.gl/maps') || v.includes('@')) {
 parseMapsLink(v);
 }
 }}
 />
 <button type="button" onClick={() => window.open('https://maps.google.com', '_blank')}
 style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
 <i className="fas fa-map" /> เปิด Maps
 </button>
 </div>
 </FieldRow>

 {/* Lat / Lng inputs */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <FieldRow label="Latitude">
 <input type="number" step="0.0000001" value={form.latitude} onChange={e => set('latitude', e.target.value)}
 placeholder="13.7563" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="Longitude">
 <input type="number" step="0.0000001" value={form.longitude} onChange={e => set('longitude', e.target.value)}
 placeholder="100.5018" style={fieldStyle} />
 </FieldRow>
 </div>

 {/* ─── Embedded Map Preview ─── */}
 {form.latitude && form.longitude && (
 <div style={{ marginTop: 12 }}>
 {/* Toggle buttons */}
 <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
 {[
 { key: 'roadmap', label: ' แผนที่', t: 'm' },
 { key: 'satellite', label: ' ดาวเทียม', t: 'k' },
 { key: 'hybrid', label: ' Hybrid', t: 'h' },
 ].map(({ key, label }) => (
 <button key={key} type="button" onClick={() => setMapType(key)}
 style={{
 padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
 fontFamily: "'Sarabun',sans-serif", fontSize: '0.8rem', fontWeight: 600,
 background: mapType === key ? '#6aab62' : '#e8edf2',
 color: mapType === key ? '#1a3a18' : '#555',
 transition: 'all 0.15s',
 }}>
 {label}
 </button>
 ))}
 <a
 href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
 target="_blank" rel="noreferrer"
 style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#4285F4', fontWeight: 600, alignSelf: 'center', textDecoration: 'none' }}>
 <i className="fas fa-external-link-alt" style={{ marginRight: 4 }} />เปิดใน Maps
 </a>
 </div>

 {/* Iframe */}
 <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #cce0ff', lineHeight: 0 }}>
 <iframe
 key={`${form.latitude}-${form.longitude}-${mapType}`}
 title="map-preview"
 width="100%"
 height="300"
 frameBorder="0"
 style={{ display: 'block' }}
 src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=17&t=${mapType === 'roadmap' ? 'm' : mapType === 'satellite' ? 'k' : 'h'
 }&output=embed`}
 allowFullScreen
 />
 </div>
 <p style={{ fontSize: '0.73rem', color: '#888', margin: '5px 0 0' }}>
 พิกัด: {parseFloat(form.latitude).toFixed(6)}, {parseFloat(form.longitude).toFixed(6)}
 </p>
 </div>
 )}
 </div>

 {/* BTS/MRT shortcut + auto-detect */}
 <div style={{ background: '#fff8f0', border: '1px solid #ffdcb0', borderRadius: 10, padding: 14 }}>
 <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c05621', marginBottom: 10 }}>
 ใกล้รถไฟฟ้า
 </div>
 {/* BTS */}
 <div style={{ marginBottom: 8 }}>
 <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
 <span style={{ background: '#A1D99B', color: '#1a3a18', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem' }}>BTS</span>
 BTS / สายสีเขียว
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <FieldRow label="ชื่อสถานี BTS">
 <input type="text" value={form.bts_station} onChange={e => set('bts_station', e.target.value)}
 placeholder="เช่น BTS อ่อนนุช" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="ระยะทาง BTS (กม.)">
 <input type="number" step="0.01" value={form.bts_distance_km} onChange={e => set('bts_distance_km', e.target.value)}
 placeholder="0.5" style={fieldStyle} />
 </FieldRow>
 </div>
 </div>
 {/* MRT */}
 <div>
 <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
 <span style={{ background: '#3b5bdb', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem' }}>MRT</span>
 MRT / สายสีน้ำเงิน
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <FieldRow label="ชื่อสถานี MRT">
 <input type="text" value={form.mrt_station} onChange={e => set('mrt_station', e.target.value)}
 placeholder="เช่น MRT ลาดพร้าว" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="ระยะทาง MRT (กม.)">
 <input type="number" step="0.01" value={form.mrt_distance_km} onChange={e => set('mrt_distance_km', e.target.value)}
 placeholder="0.8" style={fieldStyle} />
 </FieldRow>
 </div>
 </div>

 {/* Auto-detected nearby stations */}
 {nearbyTransit.length > 0 && (
 <div style={{ marginTop: 12 }}>
 <div style={{ fontSize: '0.78rem', color: '#c05621', fontWeight: 700, marginBottom: 6 }}>
 สถานีที่ตรวจพบอัตโนมัติ (รัศมี 3 กม.)
 </div>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
 {nearbyTransit.slice(0, 10).map(s => (
 <button
 key={s.id}
 type="button"
 title={`${s.lineLabel} — ${s.distance.toFixed(2)} กม.`}
 onClick={() => {
 if (s.type === 'mrt') {
 set('mrt_station', s.name);
 set('mrt_distance_km', s.distance.toFixed(2));
 } else {
 // bts หรือ arl → ใส่ BTS field
 set('bts_station', s.name);
 set('bts_distance_km', s.distance.toFixed(2));
 }
 }}
 style={{
 background: s.lineColor, color: '#fff',
 border: 'none', borderRadius: 16,
 padding: '4px 10px', fontSize: '0.75rem',
 cursor: 'pointer', fontFamily: "'Sarabun',sans-serif",
 fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
 }}
 >
 <span>{s.name}</span>
 <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>{s.distance.toFixed(2)} กม.</span>
 </button>
 ))}
 </div>
 <p style={{ fontSize: '0.73rem', color: '#888', margin: '0 0 6px' }}>
 คลิกสถานีเพื่อเลือก • ไปที่ Step 5 เพื่อเพิ่มทั้งหมดลงรายการสถานที่ใกล้เคียง
 </p>
 </div>
 )}
 {form.latitude && form.longitude && nearbyTransit.length === 0 && (
 <p style={{ fontSize: '0.76rem', color: '#aaa', margin: '8px 0 0' }}>
 ℹ ไม่พบสถานีรถไฟฟ้าในรัศมี 3 กม. (พื้นที่ต่างจังหวัดหรือนอกเส้นทาง)
 </p>
 )}
 {!form.latitude && (
 <p style={{ fontSize: '0.76rem', color: '#aaa', margin: '8px 0 0' }}>
 วาง Google Maps URL ด้านบนเพื่อให้กรอกสถานีใกล้เคียงอัตโนมัติ
 </p>
 )}
 </div>
 </FormCard>
 </>
 )}

 {/* ===================== STEP 3: รายละเอียด ===================== */}
 {step === 3 && (
 <>
 <FormCard title="ขนาดและห้อง" icon="fa-ruler-combined">
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
 <Stepper label=" ห้องนอน" value={form.bedrooms} onChange={v => set('bedrooms', v)} />
 <Stepper label=" ห้องน้ำ" value={form.bathrooms} onChange={v => set('bathrooms', v)} />
 <Stepper label=" ชั้น" value={form.floors} onChange={v => set('floors', v)} min={1} />
 <Stepper label=" จอดรถ" value={form.parking} onChange={v => set('parking', v)} />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <FieldRow label="พื้นที่ใช้สอย (ตร.ม.)">
 <input type="number" value={form.usable_area} onChange={e => set('usable_area', e.target.value)}
 placeholder="120" style={fieldStyle} />
 </FieldRow>
 <div />
 <div style={{ gridColumn: '1 / -1' }}>
 <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>ขนาดที่ดิน</label>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 {[{ k: 'land_area_rai', l: 'ไร่' }, { k: 'land_area_ngan', l: 'งาน' }, { k: 'land_area_wah', l: 'ตร.วา' }].map(f => (
 <div key={f.k} style={{ flex: 1, position: 'relative' }}>
 <input type="number" value={form[f.k]} onChange={e => set(f.k, parseFloat(e.target.value) || 0)}
 placeholder="0" style={{ ...fieldStyle, paddingRight: 36, textAlign: 'center' }} />
 <span style={{ ...prefix, left: 'auto', right: 8, fontSize: '0.72rem', color: '#999' }}>{f.l}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </FormCard>

 <FormCard title="รายละเอียดทรัพย์" icon="fa-list-alt">
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 {/* เฟอร์นิเจอร์ */}
 <FieldRow label="เฟอร์นิเจอร์">
 <select value={form.condition_status} onChange={e => set('condition_status', e.target.value)} style={fieldStyle}>
 <option value="unfurnished">เปล่า (ไม่มีเฟอร์)</option>
 <option value="semi_furnished">บางส่วน</option>
 <option value="furnished">ครบชุด (Fully Furnished)</option>
 </select>
 </FieldRow>

 {/* สภาพทรัพย์ (Tperty) */}
 <FieldRow label="สภาพทรัพย์">
 <select value={form.property_condition} onChange={e => set('property_condition', e.target.value)} style={fieldStyle}>
 <option value="excellent"> ดีมาก (พร้อมเข้าอยู่)</option>
 <option value="good"> ดี</option>
 <option value="fair"> พอใช้</option>
 <option value="needs_renovation"> ต้องปรับปรุง</option>
 </select>
 </FieldRow>

 {/* ประเภทโฉนด (Tperty) */}
 <FieldRow label="ประเภทโฉนด">
 <select value={form.title_deed_type} onChange={e => set('title_deed_type', e.target.value)} style={fieldStyle}>
 <option value="">-- เลือกประเภทโฉนด --</option>
 <option value="นส.4">น.ส.4 (โฉนดที่ดิน)</option>
 <option value="นส.3ก">น.ส.3ก</option>
 <option value="นส.3">น.ส.3</option>
 <option value="สทก.">ส.ท.ก.</option>
 <option value="นค.3">น.ค.3</option>
 <option value="อื่นๆ">อื่นๆ</option>
 </select>
 </FieldRow>

 {/* ปีที่สร้าง */}
 <FieldRow label="ปีที่สร้าง (พ.ศ.)" hint="เช่น 2558">
 <input type="number" value={form.year_built} onChange={e => set('year_built', e.target.value)}
 placeholder="2558" min="2500" max="2570" style={fieldStyle} />
 </FieldRow>
 </div>

 {/* เลี้ยงสัตว์ */}
 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, margin: '8px 0 14px' }}>
 <input type="checkbox" checked={form.pet_friendly} onChange={e => set('pet_friendly', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#A1D99B' }} />
 <span> อนุญาตให้เลี้ยงสัตว์</span>
 </label>

 {/* VDO Tour */}
 <FieldRow label="VDO Tour" hint="รองรับ YouTube, Facebook Video, Reels หรือ URL ตรงของไฟล์วิดีโอ (.mp4)">
 <div style={{ position: 'relative' }}>
 <i className="fas fa-video" style={{ ...prefix, color: '#e8a020' }} />
 <input type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)}
 placeholder="วาง URL: YouTube / Facebook video / Reels / .mp4 file" style={{ ...fieldStyle, paddingLeft: 28 }} />
 </div>
 {form.video_url && (
 <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
 {/youtube\.com|youtu\.be/.test(form.video_url) && <><i className="fab fa-youtube" style={{ color: '#FF0000' }} /> YouTube</>}
 {/facebook\.com|fb\.watch/.test(form.video_url) && <><i className="fab fa-facebook" style={{ color: '#1877F2' }} /> Facebook</>}
 {/\.(mp4|webm|mov)(\?|$)/i.test(form.video_url) && <><i className="fas fa-file-video" style={{ color: '#6aab62' }} /> ไฟล์วิดีโอตรง</>}
 </div>
 )}
 </FieldRow>

 {/* Matterport 3D Tour */}
 <FieldRow label="3D Virtual Tour (Matterport)" hint="วาง Matterport Space ID เช่น YscKkc6oP5c เพื่อแสดง 3D Tour หมุน 360 องศา">
 <div style={{ position: 'relative' }}>
 <i className="fas fa-cube" style={{ ...prefix, color: '#E44D7B' }} />
 <input type="text" value={form.virtual_tour_id} onChange={e => set('virtual_tour_id', e.target.value)}
 placeholder="Matterport Space ID เช่น YscKkc6oP5c" style={{ ...fieldStyle, paddingLeft: 28 }} />
 </div>
 {form.virtual_tour_id && (
 <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
 <iframe
 src={`https://my.matterport.com/show/?m=${form.virtual_tour_id}&play=1`}
 width="100%" height="280" frameBorder="0" allowFullScreen
 style={{ display: 'block' }}
 title="Matterport 3D Tour Preview"
 />
 </div>
 )}
 </FieldRow>
 </FormCard>

 <FormCard title="คำอธิบายทรัพย์" icon="fa-align-left"
 tip="อธิบายจุดเด่น สภาพแวดล้อม ใกล้อะไร มีอะไรพิเศษ ยิ่งละเอียดยิ่งดี">
 <FieldRow>
 <textarea value={form.description} onChange={e => set('description', e.target.value)}
 rows={6} placeholder="อธิบายรายละเอียดทรัพย์สิน จุดเด่น สภาพแวดล้อม เงื่อนไขการขาย ฯลฯ"
 style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }} />
 <span style={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'right', display: 'block', marginTop: 3 }}>{form.description.length} ตัวอักษร</span>
 </FieldRow>
 </FormCard>

 <FormCard title="หมายเหตุภายใน (Admin Only)" icon="fa-lock">
 <FieldRow hint="ข้อมูลนี้จะไม่แสดงให้ผู้ซื้อเห็น — ใช้บันทึกข้อมูลภายในทีม">
 <textarea value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)}
 rows={3} placeholder="เช่น: เจ้าของต้องการปิดด่วน / มีภาระธนาคารต้องไถ่ถอน / นัดดูได้เสาร์-อาทิตย์เท่านั้น"
 style={{ ...fieldStyle, resize: 'vertical', background: '#fffbeb', lineHeight: 1.6 }} />
 </FieldRow>
 </FormCard>
 </>
 )}

 {/* ===================== STEP 4: รูปภาพ ===================== */}
 {step === 4 && (
 <>
 <FormCard title="รูปหน้าปก (Thumbnail)" icon="fa-image"
 tip="รูปหน้าปกสำคัญมาก — ใช้รูปภายนอกบ้านที่ดูดีที่สุด ขนาดแนะนำ 1200×800px">
 <div
 style={{ border: '2px dashed #c8d5e8', borderRadius: 12, padding: 20, textAlign: 'center', background: '#f8faff', cursor: 'pointer', position: 'relative' }}
 onClick={() => thumbRef.current?.click()}>
 {thumbnailPreview ? (
 <div style={{ position: 'relative', display: 'inline-block' }}>
 <img src={thumbnailPreview} alt="thumbnail" style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }} />
 <button type="button" onClick={e => { e.stopPropagation(); setThumbnail(null); setThumbnailPreview(''); }}
 style={{ position: 'absolute', top: -8, right: -8, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 
 </button>
 </div>
 ) : (
 <>
 <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2.5rem', color: '#93a8c4', marginBottom: 10, display: 'block' }} />
 <div style={{ fontWeight: 700, color: '#4a6fa5', marginBottom: 4 }}>คลิกเพื่อเลือกรูปหน้าปก</div>
 <div style={{ fontSize: '0.78rem', color: '#999' }}>JPG, PNG, WEBP — ขนาดสูงสุด 10MB</div>
 </>
 )}
 <input ref={thumbRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
 onChange={e => {
 const f = e.target.files[0];
 if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); }
 }} />
 </div>
 </FormCard>

 <FormCard title="อัลบั้มรูปภาพ" icon="fa-images"
 tip="อัพโหลดรูปเพิ่มเติม เช่น ห้องนอน ห้องน้ำ ห้องครัว สวน ทางเข้า — แนะนำ 8-15 รูป">
 {/* Existing images */}
 {existingImages.length > 0 && (
 <div style={{ marginBottom: 14 }}>
 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: 8 }}>รูปที่บันทึกแล้ว ({existingImages.length} รูป)</div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
 {existingImages.map(img => (
 <div key={img.id} style={{ position: 'relative' }}>
 <img src={img.image_url?.startsWith('http') ? img.image_url : `${API}${img.image_url}`}
 alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
 <button type="button" onClick={() => deleteExistingImage(img.id)}
 title="ลบรูปนี้"
 style={{ position: 'absolute', top: -8, right: -8, background: '#e53e3e', color: '#fff', border: '2.5px solid #fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(229,62,62,0.5)', fontWeight: 900, lineHeight: 1, zIndex: 2 }}>
 <i className="fas fa-times" />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* New gallery upload */}
 <div
 style={{ border: '2px dashed #c8d5e8', borderRadius: 12, padding: 18, textAlign: 'center', background: '#f8faff', cursor: 'pointer' }}
 onClick={() => galleryRef.current?.click()}>
 {galleryPreviews.length > 0 ? (
 <div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8, marginBottom: 10 }}>
 {galleryPreviews.map((url, i) => (
 <div key={i} style={{ position: 'relative' }}>
 <img src={url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
 <button type="button" onClick={(e) => {
 e.stopPropagation();
 setGalleryFiles(prev => prev.filter((_, idx) => idx !== i));
 setGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
 }}
 title="ลบรูปนี้"
 style={{ position: 'absolute', top: -8, right: -8, background: '#e53e3e', color: '#fff', border: '2.5px solid #fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(229,62,62,0.5)', fontWeight: 900, lineHeight: 1, zIndex: 2 }}>
 <i className="fas fa-times" />
 </button>
 </div>
 ))}
 </div>
 <span style={{ fontSize: '0.78rem', color: '#3d7a3a', fontWeight: 600 }}>+ เพิ่มรูปอีก คลิกที่นี่</span>
 </div>
 ) : (
 <>
 <i className="fas fa-plus-circle" style={{ fontSize: '2rem', color: '#93a8c4', marginBottom: 8, display: 'block' }} />
 <div style={{ fontWeight: 700, color: '#4a6fa5', marginBottom: 4 }}>คลิกเพื่อเลือกรูปอัลบั้ม</div>
 <div style={{ fontSize: '0.78rem', color: '#999' }}>เลือกได้หลายรูปพร้อมกัน — JPG, PNG, WEBP, ขนาดสูงสุด 10MB/รูป</div>
 </>
 )}
 <input ref={galleryRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }}
 onChange={e => {
 const files = Array.from(e.target.files);
 setGalleryFiles(prev => [...prev, ...files]);
 setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
 }} />
 </div>
 {galleryFiles.length > 0 && (
 <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#3d7a3a', fontWeight: 600 }}>
 <i className="fas fa-check-circle" style={{ marginRight: 5 }} />เลือก {galleryFiles.length} รูปใหม่ — กด "บันทึกรูป" เพื่ออัพโหลด
 </div>
 )}
 </FormCard>
 </>
 )}

 {/* ===================== STEP 5: สิ่งอำนวยความสะดวก ===================== */}
 {step === 5 && (
 <>
 <FormCard title="สิ่งอำนวยความสะดวก" icon="fa-check-circle"
 tip="เลือกสิ่งที่มีในทรัพย์จริง จะแสดงเป็น icons บนหน้ารายละเอียด">
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 8 }}>
 {AMENITY_PRESETS.map(a => {
 const active = existingAmenities.some(x => x.amenity_name === a.name);
 return (
 <button key={a.name} type="button" onClick={() => toggleAmenity(a.name, a.icon)}
 style={{
 display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8,
 border: `1.5px solid ${active ? '#A1D99B' : '#dde3ed'}`,
 background: active ? '#f0faf5' : '#fff',
 color: active ? '#A1D99B' : '#555',
 cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: '0.82rem',
 fontFamily: "'Sarabun',sans-serif", transition: 'all 0.15s',
 }}>
 <i className={`fas ${a.icon}`} style={{ fontSize: '0.9rem', width: 16, textAlign: 'center' }} />
 {a.name}
 {active && <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: '#3d7a3a', fontSize: '0.85rem' }} />}
 </button>
 );
 })}
 </div>
 {existingAmenities.length > 0 && (
 <p style={{ fontSize: '0.78rem', color: '#3d7a3a', fontWeight: 600, marginTop: 10, marginBottom: 0 }}>
 <i className="fas fa-check-circle" style={{ marginRight: 5 }} />เลือกแล้ว {existingAmenities.length} รายการ
 </p>
 )}
 </FormCard>

 <FormCard title="สถานที่ใกล้เคียง" icon="fa-map-signs"
 tip="ระบุสถานที่ใกล้เคียงที่สำคัญ เช่น BTS, โรงเรียน, ห้างสรรพสินค้า พร้อมระยะทาง">

 {/* Auto-add transit button */}
 {nearbyTransit.length > 0 && (
 <div style={{ background: '#f0f9ff', border: '1px solid #bee3f8', borderRadius: 10, padding: 12, marginBottom: 14 }}>
 <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1a5276', marginBottom: 8 }}>
 พบ {nearbyTransit.length} สถานีรถไฟฟ้าในรัศมี 3 กม. จากพิกัดทรัพย์
 </div>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
 {nearbyTransit.slice(0, 8).map(s => (
 <span key={s.id} style={{
 background: s.lineColor, color: '#fff',
 borderRadius: 14, padding: '3px 9px',
 fontSize: '0.73rem', fontWeight: 600,
 fontFamily: "'Sarabun',sans-serif",
 }}>
 {s.name} <span style={{ opacity: 0.85 }}>{s.distance.toFixed(2)} กม.</span>
 </span>
 ))}
 </div>
 <button type="button" onClick={addTransitToNearby}
 style={{ background: '#6aab62', color: '#1a3a18', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, fontFamily: "'Sarabun',sans-serif" }}>
 <i className="fas fa-magic" style={{ marginRight: 6 }} />เพิ่มทั้งหมดอัตโนมัติ
 </button>
 <span style={{ fontSize: '0.73rem', color: '#666', marginLeft: 10 }}>หรือเพิ่มทีละสถานีด้านล่าง</span>
 </div>
 )}

 {/* Add nearby form */}
 <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px 80px', gap: 8, marginBottom: 10, alignItems: 'end' }}>
 <FieldRow label="ประเภท">
 <select value={nearbyForm.place_type} onChange={e => setNearbyForm(f => ({ ...f, place_type: e.target.value }))} style={{ ...fieldStyle, fontSize: '0.8rem' }}>
 {NEARBY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
 </select>
 </FieldRow>
 <FieldRow label="ชื่อสถานที่">
 <input type="text" value={nearbyForm.place_name} onChange={e => setNearbyForm(f => ({ ...f, place_name: e.target.value }))}
 placeholder="เช่น BTS อ่อนนุช" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="กม.">
 <input type="number" step="0.1" value={nearbyForm.distance_km} onChange={e => setNearbyForm(f => ({ ...f, distance_km: e.target.value }))}
 placeholder="0.5" style={fieldStyle} />
 </FieldRow>
 <FieldRow label="นาที">
 <input type="number" value={nearbyForm.travel_time_min} onChange={e => setNearbyForm(f => ({ ...f, travel_time_min: e.target.value }))}
 placeholder="5" style={fieldStyle} />
 </FieldRow>
 </div>
 <button type="button" onClick={addNearby}
 style={{ background: '#6aab62', color: '#1a3a18', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: 14 }}>
 <i className="fas fa-plus" style={{ marginRight: 6 }} />เพิ่มสถานที่
 </button>

 {nearbyList.length > 0 && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
 {nearbyList.map(n => {
 const typeLabel = NEARBY_TYPES.find(t => t.value === n.place_type)?.label || n.place_type;
 return (
 <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 8, padding: '8px 12px' }}>
 <div>
 <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6aab62' }}>{n.place_name}</span>
 <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 8 }}>({typeLabel})</span>
 {n.distance_km && <span style={{ fontSize: '0.75rem', color: '#3d7a3a', marginLeft: 8, fontWeight: 600 }}>{n.distance_km} กม.</span>}
 {n.travel_time_min && <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 4 }}>• {n.travel_time_min} นาที</span>}
 </div>
 <button type="button" onClick={() => deleteNearby(n.id)}
 style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}>
 <i className="fas fa-trash-alt" />
 </button>
 </div>
 );
 })}
 </div>
 )}
 {nearbyList.length === 0 && (
 <p style={{ textAlign: 'center', color: '#ccc', fontSize: '0.82rem', padding: '16px 0' }}>ยังไม่ได้เพิ่มสถานที่ใกล้เคียง</p>
 )}
 </FormCard>
 </>
 )}

 {/* ===== NAVIGATION BUTTONS ===== */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
 <div>
 {step > 1 && (
 <button type="button" onClick={prevStep} disabled={saving}
 style={{ background: '#fff', color: '#555', border: '1.5px solid #dde', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
 ← ย้อนกลับ
 </button>
 )}
 </div>
 <div style={{ display: 'flex', gap: 10 }}>
 {/* Save & Exit — always visible */}
 <button type="button" onClick={finishAndExit} disabled={saving}
 style={{ background: '#fff', color: '#3d7a3a', border: '1.5px solid #A1D99B', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
 บันทึก & ออก
 </button>
 {/* Step-specific next button */}
 {step < 4 && (
 <button type="button" onClick={saveAndNext} disabled={saving}
 style={{ background: '#A1D99B', color: '#1a3a18', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', opacity: saving ? 0.7 : 1 }}>
 {saving ? '⏳ กำลังบันทึก...' : 'บันทึก & ถัดไป →'}
 </button>
 )}
 {step === 4 && (
 <button type="button" onClick={saveImages} disabled={saving}
 style={{ background: '#A1D99B', color: '#1a3a18', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', opacity: saving ? 0.7 : 1 }}>
 {saving ? '⏳ กำลังอัพโหลด...' : ' บันทึกรูป & ถัดไป →'}
 </button>
 )}
 {step === 5 && (
 <button type="button" onClick={finishAndExit} disabled={saving}
 style={{ background: '#6aab62', color: '#1a3a18', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
 เสร็จสิ้น — กลับหน้ารายการ
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}

export default PropertyForm;
