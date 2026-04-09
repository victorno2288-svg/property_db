import React, { useState, useMemo } from 'react';
import Navbar from './Navbar';

const brandGreen = '#1A8C6E';
const navy = '#1A8C6E';

// ============================================================
//  FAQ DATA — grouped by category
// ============================================================
const FAQ_DATA = [
  {
    category: 'การซื้ออสังหาริมทรัพย์',
    icon: 'fa-home',
    items: [
      {
        q: 'ซื้อบ้านครั้งแรก ต้องเตรียมตัวอย่างไร?',
        a: 'เตรียมตัวใน 4 ขั้นตอนหลัก:\n\n1. กำหนดงบประมาณ — รวมเงินดาวน์ (10–20%) + ค่าโอน + ค่าตกแต่ง\n2. เลือกทำเลที่เหมาะสม — พิจารณาระยะทางจากที่ทำงาน โรงเรียน ห้างสรรพสินค้า\n3. เปรียบเทียบทรัพย์ — ดูอย่างน้อย 3–5 รายการก่อนตัดสินใจ\n4. ตรวจสอบโฉนดและภาระผูกพัน — ขอดูโฉนดตัวจริง ตรวจสอบที่กรมที่ดิน',
      },
      {
        q: 'ค่าใช้จ่ายในการซื้อบ้านมีอะไรบ้าง นอกจากราคาบ้าน?',
        a: '• ค่าธรรมเนียมโอนกรรมสิทธิ์ — 2% ของราคาประเมินกรมธนารักษ์\n• ภาษีธุรกิจเฉพาะ — 3.3% (กรณีผู้ขายถือครองน้อยกว่า 5 ปี)\n• อากรแสตมป์ — 0.5% (กรณีได้รับยกเว้นภาษีธุรกิจเฉพาะ)\n• ภาษีเงินได้หัก ณ ที่จ่าย — คำนวณตามเกณฑ์กรมสรรพากร\n• ค่าจดทะเบียนกู้ยืม — 1% (ถ้ากู้ผ่านธนาคาร)\n\nโดยทั่วไปรวมแล้วประมาณ 3–6% ของราคาบ้าน',
      },
      {
        q: 'ควรซื้อบ้านมือหนึ่งหรือมือสอง อะไรดีกว่ากัน?',
        a: 'บ้านมือหนึ่ง:\n+ ได้บ้านใหม่ สภาพดี มีประกันจากผู้พัฒนา\n+ บางโครงการมีโปรโมชันช่วยออกค่าโอน\n- ราคาสูงกว่า ทำเลอาจอยู่ชานเมือง\n\nบ้านมือสอง:\n+ ราคาต่ำกว่า ทำเลดีกว่า ย่านใจกลางเมือง\n+ เห็นสภาพจริงก่อนตัดสินใจ\n- ต้องตรวจสอบสภาพและเอกสารอย่างละเอียด',
      },
      {
        q: 'ซื้อบ้านแล้วพบปัญหาซ่อนเร้น ผู้ขายต้องรับผิดชอบหรือไม่?',
        a: 'ตามกฎหมายแพ่งและพาณิชย์มาตรา 472 ผู้ขายต้องรับผิดในความชำรุดบกพร่องที่ซ่อนเร้นอยู่ในทรัพย์ที่ขาย ซึ่งผู้ซื้อไม่ทราบในขณะซื้อ และหากทราบแล้วจะไม่ซื้อหรือซื้อในราคาต่ำกว่า\n\nแนะนำจ้างผู้ตรวจสอบบ้าน (Home Inspector) ก่อนโอนกรรมสิทธิ์ทุกครั้ง',
      },
    ],
  },
  {
    category: 'เอกสาร & การตรวจสอบ',
    icon: 'fa-file-alt',
    items: [
      {
        q: 'ตรวจสอบโฉนดก่อนซื้อได้อย่างไร?',
        a: 'วิธีตรวจสอบโฉนดด้วยตนเอง:\n\n1. ขอดูโฉนดตัวจริงจากผู้ขาย ตรวจชื่อเจ้าของ เลขที่ดิน และรูปแผนที่\n2. ไปตรวจสอบที่กรมที่ดินหรือสำนักงานที่ดินในพื้นที่ (ค่าธรรมเนียมเล็กน้อย)\n3. ตรวจภาระผูกพัน: ภาระหนี้สิน, ภาระติดพัน, ข้อห้ามโอน\n4. ยืนยันขนาดที่ดินตรงกับโฉนดหรือไม่ด้วยการรังวัด',
      },
      {
        q: 'โฉนดที่ดินแต่ละประเภทต่างกันอย่างไร?',
        a: '• น.ส.4 จ. (โฉนดที่ดิน) — สิทธิ์สมบูรณ์ที่สุด ซื้อขาย/โอนกรรมสิทธิ์ได้อย่างเสรี +\n• น.ส.3 ก. — มีการรังวัดแล้ว ซื้อขายได้แต่ต้องรอ 30 วัน\n• น.ส.3 — ยังไม่ได้รังวัดด้วยระบบพิกัด ซื้อขายได้ แต่ความเสี่ยงสูงกว่า\n• ส.ป.ก. — ห้ามซื้อขายโดยเด็ดขาด มีบทลงโทษทางกฎหมาย -\n\nบ้าน D มีเชง รับเฉพาะโฉนด น.ส.4 จ. เท่านั้น',
      },
      {
        q: 'สัญญาซื้อขายต้องมีอะไรบ้างจึงจะถูกกฎหมาย?',
        a: 'สัญญาซื้อขายอสังหาริมทรัพย์ที่ดีควรมี:\n\n• ชื่อและที่อยู่ผู้ซื้อ-ผู้ขายครบถ้วน\n• รายละเอียดทรัพย์: เลขที่โฉนด, ขนาด, ที่ตั้ง\n• ราคาซื้อขายและเงื่อนไขการชำระ\n• กำหนดวันโอนกรรมสิทธิ์\n• เงื่อนไขผิดนัด และค่าปรับ\n• ลายมือชื่อผู้ซื้อ ผู้ขาย และพยานอย่างน้อย 2 คน',
      },
    ],
  },
  {
    category: 'ราคา & การประเมิน',
    icon: 'fa-chart-bar',
    items: [
      {
        q: 'ราคาประเมินกรมธนารักษ์กับราคาตลาดต่างกันอย่างไร?',
        a: 'ราคาประเมินกรมธนารักษ์:\n• กำหนดโดยรัฐ อัพเดตทุก 4 ปี\n• ใช้เป็นฐานคำนวณค่าธรรมเนียมโอน และภาษีต่างๆ\n• มักต่ำกว่าราคาตลาด 20–40%\n\nราคาตลาด:\n• ราคาซื้อขายจริงที่ตกลงกันระหว่างผู้ซื้อ-ผู้ขาย\n• ขึ้นอยู่กับอุปสงค์-อุปทาน ทำเล สภาพทรัพย์\n• ใช้เป็นฐานในการตัดสินใจซื้อขายจริง',
      },
      {
        q: 'ค่าใช้จ่ายส่วนกลางคอนโด คำนวณอย่างไร?',
        a: 'ค่าส่วนกลาง = อัตราค่าส่วนกลาง (บาท/ตร.ม./ปี) × ขนาดห้อง (ตร.ม.)\n\nตัวอย่าง: ห้อง 35 ตร.ม. อัตรา 50 บาท/ตร.ม./เดือน = 1,750 บาท/เดือน\n\nสิ่งที่ต้องตรวจก่อนซื้อคอนโด:\n• ยอดค้างชำระค่าส่วนกลาง (ผู้ซื้อต้องรับผิดชอบ)\n• งบสำรอง (Sinking Fund) ของนิติบุคคล\n• สถานะหนี้ของโครงการ',
      },
    ],
  },
  {
    category: 'ทำไมต้อง บ้าน D มีเชง',
    icon: 'fa-star',
    items: [
      {
        q: 'บ้าน D มีเชง คืออะไร และช่วยผู้ซื้อได้อย่างไร?',
        a: 'บ้าน D มีเชง คือบริษัทที่ซื้อทรัพย์มารีโนเวทเองทุกหลัง แล้วจำหน่ายตรงถึงผู้ซื้อ — ไม่รับฝากขายจากบุคคลภายนอก\n\nสิ่งที่ได้รับเมื่อซื้อกับ บ้าน D มีเชง:\n• ทรัพย์ทุกรายการผ่านการรีโนเวทและตรวจสอบโฉนดแล้ว\n• ราคาเป็นธรรม ซื้อตรงจาก บ้าน D มีเชง ไม่ผ่านคนกลาง\n• ทีมงานดูแลตลอดกระบวนการตั้งแต่ชมทรัพย์จนโอนกรรมสิทธิ์',
      },
      {
        q: 'ทรัพย์ของ บ้าน D มีเชง ผ่านกระบวนการอะไรบ้างก่อนขาย?',
        a: 'ทุกหลังที่ บ้าน D มีเชง นำออกจำหน่ายผ่านกระบวนการครบถ้วน:\n\nรีโนเวทโดยทีม บ้าน D มีเชง — ปรับปรุงสภาพพร้อมเข้าอยู่\nตรวจสอบโฉนด — เลขที่ดิน เนื้อที่ ชื่อเจ้าของถูกต้อง\nตรวจภาระผูกพัน — ไม่มีหนี้ค้างชำระ ไม่ถูกอายัด\nตรวจสิ่งปลูกสร้าง — ใบอนุญาตก่อสร้างถูกกฎหมาย\nราคาเป็นธรรม — เทียบเคียงราคาตลาดในทำเลเดียวกัน',
      },
      {
        q: 'ติดต่อ บ้าน D มีเชง เพื่อขอคำปรึกษาได้อย่างไร?',
        a: 'โทร: 081-638-6966\nLINE: @loan_dd\nเปิดทำการ จันทร์–อาทิตย์ 09:00–17:00 น.\n\nปรึกษาฟรี ไม่มีข้อผูกมัด ทีมงานพร้อมตอบทุกคำถามเรื่องอสังหาริมทรัพย์',
      },
    ],
  },
];

// ============================================================
//  Accordion Item
// ============================================================
function AccordionItem({ faq, index, isOpen, onToggle }) {
  return (
    <div style={{
      marginBottom: 10,
      borderRadius: 12,
      overflow: 'hidden',
      border: isOpen ? `1.5px solid ${brandGreen}` : '1.5px solid #e8ecef',
      transition: 'border-color 0.2s',
      boxShadow: isOpen ? '0 4px 16px rgba(4,170,109,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Question row */}
      <button
        onClick={() => onToggle(index)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 20px',
          background: isOpen ? '#e8f8f2' : '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.2s', gap: 12,
        }}
      >
        <span style={{
          fontWeight: 700, fontSize: '0.95rem',
          color: isOpen ? brandGreen : navy, lineHeight: 1.5,
        }}>
          <span style={{ color: brandGreen, marginRight: 8, fontWeight: 900 }}>
            {isOpen ? '−' : '+'}
          </span>
          {faq.q}
        </span>
        <span style={{
          minWidth: 22, height: 22, borderRadius: '50%',
          background: isOpen ? brandGreen : '#e8ecef',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', color: isOpen ? '#fff' : '#999',
          fontSize: '0.7rem', flexShrink: 0,
        }}>
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} />
        </span>
      </button>

      {/* Answer — simple show/hide with maxHeight */}
      <div style={{
        maxHeight: isOpen ? 800 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{
          padding: '14px 20px 18px 44px',
          background: '#fff',
          borderTop: `1px solid #f0f0f0`,
          color: '#555', lineHeight: 1.9, fontSize: '0.9rem',
          whiteSpace: 'pre-line',
        }}>
          {faq.a}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  Main Page
// ============================================================
const FaqPage = () => {
  const [openFaq, setOpenFaq] = useState(null);          // "catIdx-itemIdx"
  const [activeTab, setActiveTab] = useState('all');     // 'all' | category name
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (key) => setOpenFaq(openFaq === key ? null : key);

  // Flatten for search
  const flatFaqs = useMemo(() => {
    const result = [];
    FAQ_DATA.forEach((cat, ci) => {
      cat.items.forEach((item, ii) => {
        result.push({ ...item, category: cat.category, icon: cat.icon, catIdx: ci, itemIdx: ii });
      });
    });
    return result;
  }, []);

  const filteredFlat = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;
    return flatFaqs.filter(f =>
      f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [searchQuery, flatFaqs]);

  // Steps
  const steps = [
    { icon: 'fa-search', title: 'ค้นหาทรัพย์', desc: 'เลือกดูทรัพย์ที่ถูกใจ กรองตามทำเล ราคา และประเภท' },
    { icon: 'fa-calendar-check', title: 'นัดชมทรัพย์', desc: 'ติดต่อเจ้าของโดยตรง นัดดูสถานที่จริงสะดวกทุกวัน' },
    { icon: 'fa-file-signature', title: 'ทำสัญญาซื้อขาย', desc: 'ตรวจสอบโฉนด ลงนามสัญญา พร้อมพยานครบถ้วน' },
    { icon: 'fa-university', title: 'โอนกรรมสิทธิ์', desc: 'โอนที่กรมที่ดิน รับกุญแจ เสร็จสิ้นในวันเดียว' },
  ];

  return (
    <div style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", background: 'var(--surface, #FAF9F7)', minHeight: '100vh' }}>
      <Navbar />

      {/* ===== HERO — Quiet Luxury ===== */}
      <section style={{
        background: `linear-gradient(135deg, ${navy} 0%, #147A5E 60%, ${brandGreen} 100%)`,
        color: '#fff', padding: 'calc(64px + 48px) 16px 36px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: '0.62rem', color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
            Frequently Asked Questions
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 400, marginBottom: 8, fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif", letterSpacing: '-0.01em' }}>
            คำถามที่พบบ่อย
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 18 }}>
            รวมคำตอบทุกข้อสงสัยเรื่องการซื้อ-ขาย-เช่า อสังหาริมทรัพย์ กับ บ้าน D มีเชง
          </p>

          {/* Search bar */}
          <div style={{
            maxWidth: 520, margin: '0 auto',
            background: '#fff', borderRadius: 50,
            display: 'flex', alignItems: 'center',
            padding: '8px 20px', gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <i className="fas fa-search" style={{ color: '#bbb' }} />
            <input
              type="text"
              placeholder="ค้นหาคำถาม เช่น ซื้อบ้าน, โฉนด, ค่าโอน..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setActiveTab('all'); }}
              style={{
                border: 'none', outline: 'none', flex: 1,
                fontSize: '0.92rem', color: navy,
                background: 'transparent', fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', padding: 0, fontSize: '0.9rem' }}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===== CATEGORY TABS ===== */}
      {!searchQuery && (
        <div style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
          <div className="container">
            <div style={{
              display: 'flex', gap: 0, overflowX: 'auto',
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}>
              {[{ category: 'all', icon: 'fa-th-large' }, ...FAQ_DATA].map((cat) => {
                const isActive = activeTab === cat.category;
                const label = cat.category === 'all' ? 'ทั้งหมด' : cat.category;
                return (
                  <button
                    key={cat.category}
                    onClick={() => { setActiveTab(cat.category); setOpenFaq(null); }}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      padding: '14px 16px', whiteSpace: 'nowrap',
                      fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: isActive ? 800 : 500,
                      color: isActive ? brandGreen : '#777',
                      borderBottom: isActive ? `3px solid ${brandGreen}` : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className={`fas ${cat.icon}`} style={{ marginRight: 6, fontSize: '0.8rem' }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== FAQ CONTENT ===== */}
      <section style={{ padding: '40px 0 60px' }}>
        <div className="container">
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* SEARCH RESULTS */}
            {filteredFlat !== null && (
              <>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>
                  พบ {filteredFlat.length} รายการสำหรับ "<strong>{searchQuery}</strong>"
                </p>
                {filteredFlat.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                    <p>ไม่พบคำถามที่ตรงกับ "{searchQuery}"<br />ลองค้นหาด้วยคำอื่น หรือ<a href="tel:081-638-6966" style={{ color: brandGreen }}>โทรถามเรา</a></p>
                  </div>
                ) : (
                  filteredFlat.map((faq, i) => {
                    const key = `search-${i}`;
                    return (
                      <div key={i}>
                        <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: 4, marginLeft: 4 }}>
                          <i className={`fas ${faq.icon}`} style={{ marginRight: 4, fontSize: '0.7rem' }} /> {faq.category}
                        </div>
                        <AccordionItem
                          faq={faq} index={key} isOpen={openFaq === key}
                          onToggle={toggleFaq}
                        />
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* GROUPED ACCORDION (no search active) */}
            {filteredFlat === null && (() => {
              const categoriesToShow = activeTab === 'all'
                ? FAQ_DATA
                : FAQ_DATA.filter(c => c.category === activeTab);

              return categoriesToShow.map((cat, ci) => (
                <div key={ci} style={{ marginBottom: 36 }}>
                  {/* Category Header */}
                  {activeTab === 'all' && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 16, paddingBottom: 10,
                      borderBottom: `2px solid ${brandGreen}22`,
                    }}>
                      <i className={`fas ${cat.icon}`} style={{ fontSize: '1.1rem', color: brandGreen }} />
                      <h3 style={{ fontWeight: 500, color: navy, margin: 0, fontSize: '1.05rem', fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif" }}>
                        {cat.category}
                      </h3>
                      <span style={{
                        background: '#e8f8f2', color: brandGreen,
                        borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
                      }}>{cat.items.length} ข้อ</span>
                    </div>
                  )}
                  {cat.items.map((faq, ii) => {
                    const key = `${ci}-${ii}`;
                    return (
                      <AccordionItem
                        key={key} faq={faq} index={key}
                        isOpen={openFaq === key}
                        onToggle={toggleFaq}
                      />
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ===== STEPS ===== */}
      <section style={{ background: '#fff', padding: '50px 0 60px', borderTop: '1px solid #eee' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontWeight: 900, color: navy, fontSize: '1.6rem', marginBottom: 6 }}>
              ซื้อบ้านง่ายๆ <span style={{ color: brandGreen }}>ใน 4 ขั้นตอน</span>
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>จากการค้นหาจนถึงรับกุญแจ บ้าน D มีเชง ดูแลทุกขั้นตอน</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 24, maxWidth: 900, margin: '0 auto',
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 36, right: '-12%', width: '24%', height: 2,
                    background: `${brandGreen}44`, display: 'none',
                  }} />
                )}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: '#e8f8f2', margin: '0 auto 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 2px 12px rgba(4,170,109,0.12)',
                }}>
                  <i className={`fas ${s.icon}`} style={{ fontSize: '1.8rem', color: brandGreen }} />
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 26, height: 26, borderRadius: '50%',
                    background: navy, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 900,
                  }}>{i + 1}</span>
                </div>
                <div style={{ fontWeight: 800, color: navy, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        background: `linear-gradient(135deg, ${navy} 0%, #00463d 60%, ${brandGreen} 100%)`,
        padding: '50px 0', textAlign: 'center', color: '#fff',
      }}>
        <div className="container">
          <i className="fas fa-comments" style={{ fontSize: '2rem', marginBottom: 12, color: '#C9A84C', display: 'block' }} />
          <h2 style={{ fontWeight: 400, fontSize: '1.5rem', marginBottom: 8, fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif" }}>ยังมีคำถามเพิ่มเติม?</h2>
          <p style={{ opacity: 0.85, marginBottom: 28, fontSize: '0.95rem' }}>
            ปรึกษาฟรี ไม่มีข้อผูกมัด ทีมงานพร้อมตอบทุกคำถามเรื่องอสังหาฯ
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <a href="https://line.me/R/ti/p/@loan_dd" target="_blank" rel="noopener noreferrer"
              style={{
                background: '#06C755', color: '#fff', textDecoration: 'none',
                borderRadius: 50, padding: '13px 32px', fontWeight: 800, fontSize: '0.95rem',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(6,199,85,0.4)',
              }}>
              <i className="fab fa-line" style={{ fontSize: '1.1rem' }} />
              LINE: @loan_dd
            </a>
            <a href="tel:081-638-6966"
              style={{
                background: '#fff', color: navy, textDecoration: 'none',
                borderRadius: 50, padding: '13px 32px', fontWeight: 800, fontSize: '0.95rem',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
              <i className="fas fa-phone-alt" />
              081-638-6966
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#1a1a1a', padding: '24px 0', textAlign: 'center', color: '#aaa' }}>
        <div className="container">
          <p style={{ margin: 0, fontSize: '0.82rem' }}>&copy; 2026 บ้าน D มีเชง Co., Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default FaqPage;
