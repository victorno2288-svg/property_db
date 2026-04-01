/**
 * ocrController.js — v3 (ported from adminloandd, upgraded)
 * ─────────────────────────────────────────────────────────────
 * Improvements over v2:
 *   • Gemini 2.5 Flash (primary) → 1.5 Flash (fallback)
 *   • system_instruction → Gemini อ่านเอกสารไทยแม่นขึ้น
 *   • Sharp preprocessing: grayscale + normalize + sharpen + gamma → PNG
 *   • Memory storage (ไม่เขียนดิสก์)
 *   • house_no (บ้านเลขที่), moo (หมู่), road (ถนน) fields
 *   • temperature: 0 + maxOutputTokens: 3000 → แม่นขึ้น
 *   • thaiToArabic ทั้ง backend (prompt + normalize) และ frontend
 */
const multer = require('multer');
const path   = require('path');
const https  = require('https');

// ── ลองโหลด sharp (optional) ──
let sharp = null;
try { sharp = require('sharp'); } catch (_) {
  console.warn('[OCR] sharp ไม่พบ — ข้ามขั้นตอน preprocess (ใช้ npm i sharp เพื่อเปิดใช้)');
}

// ── Multer: memory storage ──────────────────────────────────
const storage = multer.memoryStorage();
exports.upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|bmp|tiff|webp/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp, tiff)'));
  },
});

// ── Image Preprocessing ─────────────────────────────────────
// grayscale → normalize → sharpen → gamma(1.2) → PNG
async function preprocessImage(buffer) {
  if (!sharp) return { buffer, mimeType: null };
  try {
    const processed = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.2, m1: 0.5, m2: 3 })
      .gamma(1.2)
      .toFormat('png')
      .toBuffer();
    return { buffer: processed, mimeType: 'image/png' };
  } catch (err) {
    console.warn('[OCR Preprocess] ⚠️ Sharp failed:', err.message);
    return { buffer, mimeType: null };
  }
}

// ── แปลงเลขไทย → อาหรับ ────────────────────────────────────
function thaiToArabic(str) {
  if (!str) return str;
  return String(str).replace(/[๐-๙]/g, d => d.charCodeAt(0) - 3664);
}

function parseNum(s) {
  if (!s && s !== 0) return null;
  const n = parseFloat(thaiToArabic(String(s)));
  return isNaN(n) ? null : n;
}

// ── Gemini Vision API ────────────────────────────────────────
// Model: gemini-2.5-flash → fallback gemini-1.5-flash
function geminiVisionOcr(imageBuffer, mimeType, prompt, model = 'gemini-2.5-flash') {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('ไม่พบ GEMINI_API_KEY ใน .env'));

    const base64 = imageBuffer.toString('base64');

    const body = JSON.stringify({
      system_instruction: {
        parts: [{ text: 'คุณเชี่ยวชาญการอ่านเอกสารราชการไทย (โฉนดที่ดิน บัตรประชาชน ทะเบียนบ้าน)\nตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น ห้ามใส่ markdown code fence' }]
      },
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
      },
    });

    const reqOpt = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(reqOpt, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            // fallback to 1.5-flash ถ้า 2.5 ไม่รองรับ system_instruction
            if (model === 'gemini-2.5-flash' && parsed.error.code === 400) {
              console.warn('[OCR] ⚠️ 2.5-flash error, fallback to 1.5-flash');
              return geminiVisionOcr(imageBuffer, mimeType, prompt, 'gemini-1.5-flash')
                .then(resolve).catch(reject);
            }
            return reject(new Error(`Gemini error: ${parsed.error.message}`));
          }
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return reject(new Error('Gemini ไม่คืนข้อความ — ลองส่งรูปที่ชัดกว่านี้'));
          resolve(text);
        } catch (e) {
          reject(new Error(`Gemini parse error: ${e.message}`));
        }
      });
    });
    req.on('error', e => reject(new Error(`Gemini request error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

// ── Parse JSON จาก response ─────────────────────────────────
function parseResponseJson(text) {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

// ── Prompt โฉนดที่ดิน ────────────────────────────────────────
const DEED_PROMPT = `คุณคือผู้เชี่ยวชาญอ่านโฉนดที่ดินไทย
โปรดอ่านข้อมูลจากโฉนดในรูปภาพนี้อย่างละเอียด แล้วตอบเป็น JSON เท่านั้น

══ กฎสำคัญ ══
1. แปลงเลขไทย (๐๑๒๓๔๕๖๗๘๙) → อารบิก (0123456789) ทุกตัว
2. ห้ามใส่คำนำหน้า "จังหวัด" "อำเภอ" "ตำบล" "ถนน" — ชื่อเปล่าๆ เท่านั้น
3. deed_type: "โฉนดที่ดิน" | "น.ส.4จ" | "น.ส.4ก" | "น.ส.3ก" | "น.ส.3" | "ส.ป.ก." | "อื่นๆ"
4. ถ้าเป็นหน้าหลังโฉนด: ให้ดูที่ "บรรทัดสุดท้าย" ของตารางเนื้อที่ (เนื้อที่คงเหลือจริง)

══ ตอบ JSON นี้เท่านั้น ══
{
  "deed_number":  "เลขที่โฉนด (อารบิก)",
  "deed_type":    "ประเภทโฉนด",
  "zone":         "ระวาง (map sheet)",
  "land_number":  "เลขที่ดิน (อารบิก)",
  "survey_page":  "หน้าสำรวจ (อารบิก)",
  "owner_name":   "ชื่อ-นามสกุลเจ้าของ (รวมคำนำหน้า)",
  "house_no":     "บ้านเลขที่ผู้ถือ (เช่น 123/4, null ถ้าไม่มี)",
  "moo":          "หมู่ที่ (ตัวเลขเท่านั้น, null ถ้าไม่มี)",
  "road":         "ชื่อถนน (null ถ้าไม่มี)",
  "sub_district": "ชื่อตำบล/แขวง",
  "district":     "ชื่ออำเภอ/เขต",
  "province":     "ชื่อจังหวัด",
  "land_area_rai":  "จำนวนไร่ (ตัวเลข, null ถ้าไม่มี)",
  "land_area_ngan": "จำนวนงาน (ตัวเลข)",
  "land_area_wah":  "ตารางวา (รวมทศนิยม เช่น 58.6)",
  "issue_date":   "วันที่ออกโฉนด (null ถ้าอ่านไม่ได้)"
}

ถ้าข้อมูลใดอ่านไม่ออก ให้ใส่ null`;

// ── Main scanDeed handler ────────────────────────────────────
exports.scanDeed = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });

    const fileSize = req.file.size;
    console.log(`[OCR] ════════════════════════════════════`);
    console.log(`[OCR] ไฟล์: ${req.file.originalname} (${(fileSize / 1024).toFixed(0)} KB)`);

    // ── ตรวจ MIME จาก magic bytes ──
    let buf = req.file.buffer;
    let mimeType = 'image/jpeg';
    if (buf[0] === 0xFF && buf[1] === 0xD8)              mimeType = 'image/jpeg';
    else if (buf[0] === 0x89 && buf[1] === 0x50)         mimeType = 'image/png';
    else if (buf[0] === 0x52 && buf[1] === 0x49)         mimeType = 'image/webp';
    else {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
      mimeType = map[ext] || 'image/jpeg';
    }

    // ── Preprocess ──
    console.log('[OCR] 🔧 preprocessing (grayscale+normalize+sharpen)...');
    const prep = await preprocessImage(buf);
    buf = prep.buffer;
    if (prep.mimeType) mimeType = prep.mimeType;
    console.log(`[OCR] ✅ preprocessed (${(buf.length / 1024).toFixed(0)} KB)`);

    // ── Gemini OCR ──
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน .env' });
    }
    console.log('[OCR] กำลังเรียก Gemini 2.5 Flash...');
    const rawResponse = await geminiVisionOcr(buf, mimeType, DEED_PROMPT);
    console.log(`[OCR] ✅ ได้ response (${rawResponse.length} chars)`);
    console.log(`[OCR] ${rawResponse.substring(0, 400)}`);

    const parsed = parseResponseJson(rawResponse);
    if (!parsed) {
      return res.json({ success: false, error: 'parse JSON ไม่สำเร็จ', raw_text: rawResponse });
    }

    // ── Normalize + thaiToArabic ──
    const fields = {
      deed_number:    thaiToArabic(parsed.deed_number)   || null,
      title_deed_type: parsed.deed_type                  || null,
      land_number:    thaiToArabic(parsed.land_number)   || null,
      zone:           thaiToArabic(parsed.zone)          || null,
      survey_page:    thaiToArabic(parsed.survey_page)   || null,
      province:       parsed.province                    || null,
      district:       parsed.district                    || null,
      sub_district:   parsed.sub_district                || null,
      house_no:       thaiToArabic(parsed.house_no)      || null,
      moo:            thaiToArabic(parsed.moo)           || null,
      road:           parsed.road                        || null,
      land_area_rai:  parseNum(parsed.land_area_rai),
      land_area_ngan: parseNum(parsed.land_area_ngan),
      land_area_wah:  parseNum(parsed.land_area_wah),
      owner_name:     parsed.owner_name                  || null,
      issue_date:     parsed.issue_date                  || null,
    };

    // ── Log ──
    console.log('[OCR] ═══ ผลลัพธ์ ═══');
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== null && v !== undefined) console.log(`[OCR]   ${k}: "${v}"`);
    });
    console.log('[OCR] ════════════════════════════════════');

    return res.json({
      success: true,
      method:  'gemini-2.5-flash',
      fields,
      raw_text: rawResponse,
      confidence: 'high',
    });

  } catch (err) {
    console.error('[OCR] ❌ Error:', err.message);
    return res.status(500).json({ error: `OCR ล้มเหลว: ${err.message}` });
  }
};
