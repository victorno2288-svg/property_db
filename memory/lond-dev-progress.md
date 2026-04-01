# LoanDD Project — Dev Progress Memory
_อัพเดทล่าสุด: 2026-04-01_

## Tech Stack
- **Frontend**: React + Vite (`lond/loandd/src/`) — port 5173
- **Backend**: Express.js + MySQL (`lond/server/`) — port **3001**
- **Auth**: JWT แยก admin/user — admin ใช้ `adminToken`/`adminUser` ใน localStorage
- **OCR**: Gemini 2.5-flash → fallback 1.5-flash — key ใน `GEMINI_API_KEY` env
- **Sharp**: preprocessing รูปก่อนส่ง Gemini (grayscale+normalize+sharpen) → `npm i sharp` ใน lond/server
- **DB**: MySQL — `property_db`
- **Google Maps**: `VITE_GOOGLE_MAPS_KEY=AIzaSyDfpKCStmKwmc2j00nba382zlGJgAtHRq0` (ใน lond/loandd/.env)

## JWT / Auth สำคัญ ✅
- `ADMIN_JWT_SECRET=Admin_Secret_Key_LoanDD_2026` (ใน `.env`)
- `verifyAdmin.js` fallback: `'Admin_Secret_Key_LoanDD_2026'` ← ต้องตรงกัน
- Frontend ต้องส่ง header: `Authorization: Bearer <adminToken>` (ไม่ใช่ `token`)
- AdminProperties.jsx, AdminInquiries.jsx → ใช้ `localStorage.getItem('adminToken')` ✅

## Features ที่ทำเสร็จแล้ว ✅

### Logout Button
- AdminProperties.jsx — ปุ่ม logout ใน header ✅
- AdminInquiries.jsx — ปุ่ม logout ในfilter bar ✅
- Dashboard.jsx — ปุ่ม logout ใน topbar ✅
- ทุกที่ใช้ `handleLogout()` → clear `adminToken`/`adminUser` → navigate `/admin/login`

### OCR v3 (ocrController.js) ✅ — ported จาก adminloandd (2026-03-30)
- **Gemini 2.5-flash** primary → fallback 1.5-flash
- **system_instruction**: "เชี่ยวชาญเอกสารราชการไทย" → แม่นขึ้น
- **Sharp preprocessing**: grayscale→normalize→sharpen→gamma→PNG ก่อนส่ง Gemini
- **Memory storage** (multer) — ไม่เขียนดิสก์
- **temperature: 0**, **maxOutputTokens: 3000**
- Fields ใหม่: `house_no` (บ้านเลขที่), `moo` (หมู่), `road` (ถนน)
- `thaiToArabic` ทั้ง backend + frontend (double safety)
- Response format: `{ success, method, fields: {...}, raw_text, confidence }`
- Fields คงเดิม: `deed_number`, `title_deed_type`, `land_number`, `zone`, `survey_page`, `province`, `district`, `sub_district`, `land_area_rai/ngan/wah`, `owner_name`, `issue_date`

### Google Maps Embed ✅ (PropertyForm.jsx)
- iframe URL: `https://maps.google.com/maps?q={lat},{lng}&z=17&t={m/k/h}&output=embed`
- Toggle 3 แบบ: 🗺 แผนที่ปกติ (t=m), 🛰 ดาวเทียม (t=k), 🏙 Hybrid (t=h)
- ไม่ต้องใช้ API Key พิเศษ

### Deed Image (โฉนด) ✅
- `uploadDeed.js` middleware: เก็บใน `/uploads/deeds/`, limit 15MB
- `POST /api/admin/properties/:id/deed` → uploadDeedImage
- `DELETE /api/admin/properties/:id/deed` → deleteDeedImage
- PropertyForm.jsx: ✕ button ล้างรูป, ปุ่มบันทึกโฉนดลง DB, แสดงโฉนดเก่า
- public propertyController: ซ่อน `deed_image_url` + `internal_notes` ✅

### Audit Trail ✅
- SQL: `add_audit_trail.sql` — columns `created_by_admin`, `updated_by_admin`
- createProperty → บันทึก `req.admin?.username` ลง `created_by_admin` + `updated_by_admin`
- updateProperty → อัพเดท `updated_by_admin`
- AdminProperties table: แสดง column "แก้โดย" (updated_by_admin)

### Input Text Color ✅
- ทุก input/select ใน PropertyForm: `color: '#111827'`, `background: '#ffffff'`
- AdminLogin.jsx: `color: '#111827'`

### Port Fix ✅
- Dashboard.jsx + AdminForm.jsx: `localhost:3000` → `localhost:3001`

## SQL Migrations (รัน 1 ครั้งใน phpMyAdmin)
```
lond/add_deed_image.sql      — เพิ่ม column deed_image_url
lond/add_audit_trail.sql     — เพิ่ม column created_by_admin, updated_by_admin
```
⚠️ **ถ้ายังไม่ได้รัน SQL ทั้ง 2 ไฟล์ → ต้องรันก่อนใช้งาน**

## ขั้นตอนหลัง Session ขาดหาย (ต้องทำทุกครั้ง)
1. **Restart server**: `Ctrl+C` → `node app.js` หรือ `npm start` ใน `lond/server`
2. **Restart Vite**: `Ctrl+C` → `npm run dev` ใน `lond/loandd`
3. **Logout แล้ว login ใหม่**: เพื่อรับ adminToken ที่ถูกต้อง

## Key Files
| ไฟล์ | หน้าที่ |
|------|--------|
| `server/middleware/verifyAdmin.js` | JWT verify สำหรับ admin |
| `server/middleware/uploadDeed.js` | multer สำหรับรูปโฉนด |
| `server/controllers/adminPropertyController.js` | CRUD + deed + audit |
| `server/controllers/ocrController.js` | OCR โฉนด (Thai→Arabic) |
| `server/routes/adminRoutes.js` | routes ทั้งหมดของ admin |
| `loandd/src/pages/admin/PropertyForm.jsx` | Form เพิ่ม/แก้ทรัพย์ (OCR, Map, Deed) |
| `loandd/src/pages/admin/AdminProperties.jsx` | รายการทรัพย์ + logout + audit column |
| `loandd/src/pages/admin/AdminInquiries.jsx` | รายการ inquiries + logout |
| `loandd/src/Dashboard.jsx` | Dashboard + logout |

## Auto-Logout เมื่อ Token หมดอายุ ✅ (2026-03-30)
- สร้าง `loandd/src/utils/adminFetch.js`
  - Wrapper ครอบ fetch ทุก admin API
  - ใส่ `Authorization: Bearer <adminToken>` อัตโนมัติ
  - ถ้า response 401 หรือ 403 → clear token → `window.location.href = '/admin'` ทันที
- อัพเดทไฟล์ทั้งหมดให้ใช้ `adminFetch` แทน `fetch` ปกติ:
  - AdminProperties.jsx ✅
  - AdminInquiries.jsx ✅
  - Dashboard.jsx ✅
  - PropertyForm.jsx ✅ (ครบทุก endpoint รวม deed + OCR)
  - Login.jsx ✅ (แก้ port 3000 → 3001)

## OCR ใช้ Gemini Vision ✅ (2026-03-30)
- **Primary**: Gemini 1.5 Flash Vision → ส่งรูปโดยตรง + prompt ภาษาไทย → ได้ JSON ทันที
  - แม่นกว่า regex มาก (AI เข้าใจบริบทโฉนดไทย)
  - แปลงเลขไทย → อาหรับ, คำนวณเศษส่วนตารางวา
  - `GEMINI_API_KEY` ใน `.env` (ปัจจุบัน = key เดียวกับ Google Vision)
- **Fallback**: Google Vision OCR + regex (ถ้า Gemini fail)
- key ได้ฟรี: https://aistudio.google.com/apikey
- ⚠️ ถ้า key เดียวกัน error → ต้องไป enable "Generative Language API" ใน Google Cloud Console
  หรือสร้าง key ใหม่จาก AI Studio แล้วใส่ใน `GEMINI_API_KEY`

## OCR ย้ายไปอยู่ Step 2 ✅ (2026-03-30)
- Step 1: ไม่มี OCR แล้ว — เหลือแค่ Tips + ข้อมูลพื้นฐาน
- Step 2: OCR card อยู่บนสุด — สแกนแล้วกรอกให้ครบ:
  จังหวัด, อำเภอ, ตำบล, รหัสไปรษณีย์, ประเภทโฉนด, ไร่ งาน ตร.วา, ที่อยู่, notes

## Google Maps Places Autocomplete ✅ (2026-03-30)
- **ไฟล์แก้**: `loandd/src/pages/admin/PropertyForm.jsx`
- **ไฟล์ใหม่**: `loandd/.env` — `VITE_GOOGLE_MAPS_KEY=...`
- Load Google Maps JS API script อัตโนมัติตอน mount (ถ้ามี key)
- Step 2 มี Search Box "ค้นหาที่อยู่ด้วย Google Maps" — Autocomplete จำกัด TH
- เมื่อเลือกสถานที่: กรอก **จังหวัด · อำเภอ/เขต · ตำบล/แขวง · รหัสไปรษณีย์ · lat · lng** ให้ครบอัตโนมัติ
- parse ข้อมูล: `administrative_area_level_1/2`, `sublocality_level_1`, `postal_code`
- ตัด prefix ภาษาไทย: "จังหวัด", "อำเภอ", "เขต", "ตำบล", "แขวง" ออกก่อนกรอก
- ถ้าไม่มี key → input แสดง warning + disabled
- ถ้า Maps โหลดแล้ว → แสดง "✅ Google Maps พร้อมใช้งานแล้ว"
- **ต้องทำก่อนใช้**: ใส่ key จริงใน `loandd/.env` แล้ว `npm run dev` ใหม่
  - Enable: **Maps JavaScript API** + **Places API** ใน Google Cloud Console
  - สร้าง key: https://console.cloud.google.com/apis/credentials

## Provinces Dropdown Sync ✅ (2026-03-30)
- **Bug fix**: ทั้ง `PropertyForm.jsx` และ `PropertySearch.jsx` parse API response ผิด
  - Controller ส่ง `{ success: true, data: [...] }` แต่ทั้ง 2 ไฟล์เช็ค `Array.isArray(d)` ตรงๆ → provinces ว่างตลอด
  - แก้เป็น: `Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])`
- **สร้างใหม่**: `lond/create_provinces.sql`
  - CREATE TABLE `provinces` พร้อม columns: id, name, slug, region, is_popular, sort_order, is_active
  - INSERT IGNORE 77 จังหวัด ครบทุกภาค (กลาง/เหนือ/อีสาน/ตะวันออก/ตะวันตก/ใต้)
  - จังหวัด is_popular=1: กทม, นนทบุรี, ปทุมธานี, สมุทรปราการ, ชลบุรี, ระยอง, เชียงใหม่, เชียงราย, ขอนแก่น, อุดรธานี, นครราชสีมา, ภูเก็ต, สุราษฎร์ธานี, กระบี่
- **Google Maps ↔ province select sync**:
  - Exact match ก่อน → includes fuzzy match → fallback ใช้ค่าจาก Google ตรงๆ
  - เลือกสถานที่แล้วจังหวัดใน `<select>` highlight อัตโนมัติ

## Thai → Arabic Numerals ✅ (2026-03-30)
- **ไฟล์แก้**: `loandd/src/pages/admin/PropertyForm.jsx`
- เพิ่ม `thaiToArabic(str)` function ระดับ module (ก่อน `EMPTY_FORM`)
  - แปลง ๐-๙ → 0-9 ด้วย `charCodeAt - 0x0E50`
- ใช้ใน `scanDeed()` ก่อนกรอกฟิลด์:
  - `postal_code`, `address`, `owner_address`, `deed_number`, `land_number`, `survey_page`

## Auto-Geocode หลัง OCR Scan ✅ (2026-03-30)
- **ไฟล์แก้**: `loandd/src/pages/admin/PropertyForm.jsx`
- เพิ่ม `autoGeocodeFromOCR(province, district, subDistrict)` ข้างใน component
  - ใช้ Geocoding REST API: `https://maps.googleapis.com/maps/api/geocode/json?address=...`
  - ใช้ `VITE_GOOGLE_MAPS_KEY` เดิม — ไม่ต้องรอ Maps JS โหลด
  - ดึง `lat`, `lng`, `postal_code` จาก response
  - กรอก `latitude`/`longitude` ทันที
  - กรอก `postal_code` เฉพาะถ้ายังไม่มีค่า
  - แสดง `📍 พิกัดอัตโนมัติจากโฉนด` ใน saveMsg 3 วินาที
- เรียกต่อท้าย `scanDeed()` อัตโนมัติถ้า OCR ได้ province / district / sub_district

## API Keys สำคัญ
- `GEMINI_API_KEY=AIzaSyDMRpryowbFy6MRIZCTbur_AoxXCLuStrE` ← key ใหม่ (2026-03-30)
  - ใช้ทั้ง: lond/server/.env และ adminloandd/server/.env
  - ⚠️ key เก่า `AIzaSyAC5Om...` ถูก Google ล็อค (leaked) ห้ามใช้แล้ว
- `GOOGLE_VISION_API_KEY=AIzaSyDsg1bEztd7C-xBePiF4LcQu62abRrSsSY` (lond/server/.env)
- `VITE_GOOGLE_MAPS_KEY=AIzaSyDfpKCStmKwmc2j00nba382zlGJgAtHRq0` (lond/loandd/.env)

## Reverse Geocode + บ้านเลขที่ อัตโนมัติ ✅ (2026-03-30)
- วาง Google Maps URL หรือพิมพ์ `lat,lng` ในช่อง → ดึงอัตโนมัติ:
  - lat/lng, จังหวัด, อำเภอ, ตำบล, **รหัสไปรษณีย์**, **บ้านเลขที่/ซอย/ถนน**
- Function `reverseGeocodeLatLng(lat, lng)` ใน PropertyForm.jsx
  - ใช้ Geocoding REST API: `https://maps.googleapis.com/maps/api/geocode/json?latlng=...`
  - ดึง `street_number` + `route` → กรอก `address` field

## Auto Transit Detection ✅ (2026-03-30)
- **ไฟล์ใหม่**: `loandd/src/data/trainStations.js`
  - Database สถานีรถไฟฟ้า **140+ สถานี** ทุกสาย:
    - BTS สายสุขุมวิท (N8–N23, C0, E1–E22) ✅
    - BTS สายสีลม (W1, S1–S12) ✅
    - BTS สายสีทอง (G1–G3) ✅
    - MRT สายสีน้ำเงิน (วงแหวน 36 สถานี) ✅
    - MRT สายสีม่วง (16 สถานี) ✅
    - MRT สายสีเหลือง (19 สถานี) ✅
    - MRT สายสีชมพู (21 สถานี) ✅
    - Airport Rail Link / ARL (8 สถานี) ✅
    - SRT Red Line เหนือ (7 สถานี) + ตะวันออก ✅
  - `haversineKm(lat1,lng1,lat2,lng2)` — คำนวณระยะทาง
  - `findNearbyTransit(lat, lng, maxKm=3)` — หาสถานีในรัศมี + sort ระยะ
  - `findNearestByType(lat, lng)` — แยก nearest BTS / MRT / ARL

- **ไฟล์แก้**: `loandd/src/pages/admin/PropertyForm.jsx`
  - Import `{ findNearbyTransit, findNearestByType }` จาก data/trainStations
  - State ใหม่: `nearbyTransit` — รายชื่อสถานีที่ detect ได้
  - Function `autoFillTransit(lat, lng)`:
    - เรียกจาก `reverseGeocodeLatLng`, `parseMapsLink`, `coordMatch`
    - Auto-fill `bts_station` + `bts_distance_km` กับสถานีที่ใกล้สุด (ถ้ายังไม่มีค่า)
  - Function `addTransitToNearby()`:
    - เพิ่มสถานีทั้งหมดใน nearbyTransit (≤8 สถานี) เข้า nearbyList ผ่าน API
    - คำนวณ travel_time_min จากระยะ (~80m/นาที เดิน)
  - **UI Step 2** (ส่วน 🚇 ใกล้รถไฟฟ้า):
    - แสดง chip ปุ่มสีตามสาย — คลิกเพื่อเลือกสถานีนั้น
    - ถ้า lat/lng มีค่าแต่ไม่มีสถานี → แสดง "ไม่พบ (ต่างจังหวัด)"
    - ถ้ายังไม่มี lat/lng → แสดงคำแนะนำวาง Maps URL
  - **UI Step 5** (สถานที่ใกล้เคียง):
    - Banner แสดงจำนวนสถานีที่ detect + chip สีตามสาย
    - ปุ่ม "เพิ่มทั้งหมดอัตโนมัติ" → เรียก `addTransitToNearby()`

## Fix Duplicate Properties on Home Page ✅ (2026-03-30)
- **ปัญหา**: DB มีทรัพย์ 1 รายการ แต่โชว์ 2 การ์ดบนหน้าหลัก
  - เกิดจาก: `/api/properties/featured` + `/api/properties/latest` ดึงข้อมูลแยก → ทรัพย์ featured โผล่ทั้ง 2 section
- **แก้**: `propertyController.js` → `getLatestProperties`:
  ```sql
  WHERE p.is_active = 1
    AND (p.is_featured = 0 OR p.is_featured IS NULL)
  ```
  ทำให้ featured properties ปรากฏเฉพาะ section "ทรัพย์สินแนะนำ" เท่านั้น

## Property Detail Enhancements ✅ (2026-03-30)
- **ไฟล์แก้**: `loandd/src/pages/PropertyDetail.jsx`

### ❤️ Save / Like Button
- ปุ่ม "บันทึก" ใต้ title → toggle สีแดง/เทา
- เก็บ state ใน `localStorage.loandd_saved` (array of property IDs)
- ไม่ต้องล็อกอิน — ทุกคนใช้ได้ทันที

### 📤 Share Buttons
- **LINE**: `https://line.me/R/share?text=...` (title + URL)
- **Facebook**: `https://facebook.com/sharer/sharer.php?u=...`
- **คัดลอกลิงก์**: `navigator.clipboard.writeText()` → แสดง "คัดลอกแล้ว!" 2 วินาที

### 🚇 BTS/Transit Badge
- แสดงใต้ Specs grid ถ้า `bts_station` มีค่า
- แสดง: สถานี, ระยะกิโล, เวลาเดิน (คำนวณจากระยะ ÷ 80m/นาที)

### 🏠 Similar Properties
- State: `similarProps` — fetch จาก `/api/properties?property_type=...&province=...`
- กรอง: ไม่รวมทรัพย์ปัจจุบัน, limit 4
- แสดง grid การ์ดเล็กใต้แผนที่ → คลิกไปหน้า detail ของทรัพย์นั้น

## SSE Real-Time Notifications ✅ (2026-04-01)
- **ไฟล์ใหม่**: `server/utils/sseManager.js` — registry สำหรับ user + admin SSE connections
  - `addUserClient/removeUserClient` (Map<userId, Set<res>>)
  - `addAdminClient/removeAdminClient` (Set<res>)
  - `pushToUser(userId, event, data)` + `pushToAdmins(event, data)`
  - `initSSE(res)` + `startHeartbeat(res)` (30s interval)
- **User SSE**: `GET /api/users/notifications/stream?token=xxx`
  - Route ใน `userRoutes.js` — ไม่ผ่าน `verifyToken` middleware (auth ใน controller แทน)
  - Controller: `userController.streamNotifications` — JWT verify จาก `?token=`
  - Event `init` → ส่ง unread count
  - Event `notification` → ส่ง notif ใหม่ทันที
- **Admin SSE**: `GET /api/admin/notifications/stream?token=xxx`
  - Route ใน `adminRoutes.js` — ต้องอยู่ก่อน `router.use(verifyAdmin)`
  - Controller: `adminUserController.streamAdminNotifications`
  - Event `init` → ส่ง pending_password count
  - Event `new_inquiry` + `new_password_request` → trigger จาก controller อื่น
- **Frontend UserNotificationBell.jsx** — ใช้ EventSource แทน setInterval
  - Exponential backoff reconnect: 3s → 6s → 12s → ... max 60s
  - `destroyed` flag + `clearTimeout` ป้องกัน leak หลัง unmount
- **Frontend NotificationBell.jsx** (admin) — เหมือนกัน
- ⚠️ **ต้องทำ**: Restart server (`node app.js`) หลังเพิ่ม route ครั้งแรก

## Mobile Navbar Drawer ✅ (2026-04-01)
- **Final state**: Hamburger อยู่ **ขวา**, drawer slide จาก **ขวา**
  - ซ้ายขัดกับ Logo → revert กลับขวา
- **Navbar.jsx** — mobile section:
  - Logo (ซ้าย) | Bell + Avatar + Hamburger (ขวา) บน mobile
  - `mob-backdrop` (z-1055) + `mob-drawer` (z-1060, width: 82vw, max 320px)
  - Drawer header: green gradient + avatar หรือ brand logo
  - Nav items: icon circles สีตามหมวด (home/buy/rent/guide/more)
  - Sub-menu: province chips
  - Bottom: user links (2-col grid) หรือ login/register buttons
- **Navbar.css** additions: `.mob-hamburger`, `.mob-avatar-link`, `.mob-backdrop`, `.mob-drawer`, `.mob-drawer--open`, `.mob-head`, icon classes, `.mob-sub-chip`, `.mob-user-links`, `.mob-logout`

## BTSMapSection Horizontal Scroll Fix ✅ (2026-04-01)
- **ปัญหา**: มือถือเลื่อนซ้าย-ขวาบน BTS station row ไม่ได้
- **แก้ใน `BTSMapSection.jsx`**:
  - scroll container: `WebkitOverflowScrolling: 'touch'`, `scrollbarWidth: 'none'`, `msOverflowStyle: 'none'`
  - inner div: `touchAction: 'pan-x'`
  - CSS: `.bts-scroll-row::-webkit-scrollbar { display: none }`

## Navbar Fix ✅ (2026-03-30)
- **ซื้อ/เช่า dropdown**: เปลี่ยน listingType จาก `"ซื้อ"/"เช่า"` → `"sale"/"rent"` + route ไป `/search?listing_type=...`
- **ลงประกาศ**: ซ่อนสำหรับ non-admin — ปุ่มบน navbar, mobile menu, และ UserMenu dropdown
- **UserMenu**: เพิ่ม "ทรัพย์ที่บันทึก" → `/saved` สำหรับ user ทั่วไป
- **provinces JOIN bug**: แก้ด้วย `LEFT JOIN (SELECT name, MIN(slug), MIN(region) FROM provinces GROUP BY name) pv` + `GROUP BY p.id` ใน controller ทุก endpoint

---

## 🗺 Feature Roadmap — ไอเดียจากเว็บอสังหาชั้นนำ

### Priority 1 — ทำก่อน (High Impact)

#### 🚇 Interactive BTS/MRT Map
- แผนที่รถไฟฟ้า interactive — คลิกสถานีเพื่อ filter ทรัพย์ใกล้เคียง
- รองรับ: BTS สีลม/สุขุมวิท | MRT น้ำเงิน/ม่วง/เหลือง/ชมพู | ARL | SRT แดง
- แสดงบนหน้า home หรือหน้า search แยก tab
- สร้าง component `BTSMapInteractive.jsx` + ใช้ `TRAIN_STATIONS` จาก `data/trainStations.js`

#### 🏷 Niche Badges บน Card
- "ใกล้ BTS" | "เลี้ยงสัตว์ได้" | "พร้อมเฟอร์นิเจอร์" | "พร้อมอยู่" | "ลดราคา" | "ผ่านการตรวจสอบ ✅"
- เพิ่ม field `tags` ใน DB (JSON array หรือ varchar) หรือ derive จาก field ที่มีอยู่
- แสดงบน `PropertyCard.jsx` ใต้ราคา

#### 📌 Live Chat / LINE OA Bubble
- ปุ่ม LINE bubble ลอยติดทุกหน้า (fixed bottom-right)
- แก้ใน `App.jsx` หรือ root layout — เพิ่ม `<LineBubble />` component
- ใช้ LINE OA link: `https://line.me/R/ti/p/@343gpuvp`

#### ✓ Badge "ยังว่างอยู่" + วันที่อัพเดท
- แสดงบนทุก card: "✓ ว่าง — อัพเดท 2 วันที่แล้ว"
- ใช้ `updated_at` field ที่มีอยู่แล้ว + `dayjs` หรือ vanilla date diff

### Priority 2 — ทำต่อ

#### 📊 Stats Strip
- Bar สั้นๆ ใต้ hero หรือบน search page
- ข้อความ: "16 ทรัพย์คัดสรร | เจ้าของขายตรง | ปิดดีลเร็ว"
- อัพเดทตัวเลขจาก `/api/properties/counts` endpoint

#### 🏘 Province Grid + จำนวนทรัพย์
- Grid จังหวัดพร้อมรูป background + ตัวเลขทรัพย์
- Link ไป `/search?province=...`
- ใช้ `/api/properties/counts` ที่มีอยู่แล้ว group by province

#### 💎 Value Prop 4 Icons ใต้ Hero
- เจ้าของขายตรง | โฉนดถูกต้อง 100% | ราคายุติธรรม | ทีมผู้เชี่ยวชาญ
- แทนที่หรือเพิ่มเติมจาก Stats strip ปัจจุบัน

#### 🔍 Quick Tabs บน Search
- Tabs: BTS/MRT | สถานศึกษา | จังหวัด | ทำเลยอดนิยม
- แต่ละ tab แสดง chip links ที่ filter ไปหน้า search โดยตรง

#### 📸 Photo Counter บน Card
- "📷 5" overlay มุมขวาล่างทุก card
- ต้องดึงจำนวนรูปจาก API หรือเพิ่ม `image_count` field

#### 🏷 ราคาตัด + "ประหยัด X บาท"
- เพิ่ม field `original_price` ใน properties table
- ถ้า `original_price > price_requested` → แสดงราคาตัดพร้อม badge "ลดราคา"

### Priority 3 — Feature เสริม

#### 🗺 Google Maps Pin + BTS Layer บน Detail Page
- แสดง Google Maps embed พร้อม marker ทรัพย์ (มีอยู่แล้ว ✅)
- เพิ่ม: แสดงสถานีรถไฟฟ้าใกล้เคียงเป็น marker บน map
- ใช้ custom icon (🚇) บน Google Maps iframe หรือเปลี่ยนเป็น Maps JS API

#### ❓ FAQ / ถามกูรู Section
- หน้า `/faq` หรือ section ใน property detail
- คำถามยอดนิยม: ขายฝากคืออะไร? ใช้เวลานานแค่ไหน? ดอกเบี้ยเท่าไร?

#### 🏷 Badge "ผ่านการตรวจสอบ ✅"
- เพิ่ม field `is_verified` ใน properties
- แสดงบน card + detail page ถ้า `is_verified = 1`

#### 🔎 Search Bar Sticky บน Navbar ทุกหน้า
- Search input ใน navbar ที่ collapse เป็น icon บนมือถือ
- Submit → ไปหน้า `/search?search=...`

---

## Pending (ยังไม่ได้ทำ)
- [x] ~~รัน `create_provinces.sql`~~ — DB มี 96 rows อยู่แล้ว ✅
- [x] ~~ใส่ Google Maps API Key~~ — `VITE_GOOGLE_MAPS_KEY=AIzaSyDfpKCStmKwmc2j00nba382zlGJgAtHRq0` ✅
- [ ] เพิ่มข้อมูลทรัพย์ 16 รายการ
- [ ] ทดสอบ OCR กับโฉนดจริง (ตรวจสอบ auto-geocode + Thai→Arabic)
- [ ] รัน SQL migrations ถ้ายังไม่ได้รัน (`add_deed_image.sql`, `add_audit_trail.sql`)
- [ ] **Interactive BTS/MRT Map** — Priority 1
- [ ] **Niche Badges** บน PropertyCard — Priority 1
- [ ] **LINE OA Bubble** ติดทุกหน้า — Priority 1
- [ ] **Badge "ว่างอยู่"** + วันอัพเดท — Priority 1
- [ ] **Province Grid** + จำนวนทรัพย์ — Priority 2
- [ ] **Photo Counter** บน card — Priority 2
