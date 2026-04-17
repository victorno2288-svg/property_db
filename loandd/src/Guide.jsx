
import React, { useState } from 'react';
import Navbar from './Navbar';

const Guide = () => {
  const brandGreen = '#A1D99B';
  const navy = '#3d7a3a';
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  // คู่มือผู้ซื้อ FAQ
  const faqs = [
    {
      q: 'ควรตรวจสอบอะไรก่อนตัดสินใจซื้อ?',
      a: '1. โฉนดที่ดิน — ตรวจชื่อเจ้าของ เนื้อที่ และภาระผูกพัน\n2. สภาพทรัพย์ — โครงสร้าง ระบบไฟฟ้า ประปา รั่วซึม\n3. ทำเลและสิ่งแวดล้อม — น้ำท่วม เสียงรบกวน เส้นทางเข้าออก\n4. ราคาตลาด — เปรียบเทียบทรัพย์ใกล้เคียงอย่างน้อย 3 รายการ\n5. ค่าใช้จ่ายแฝง — ค่าส่วนกลาง ค่าโอน ภาษี'
    },
    {
      q: 'ต้องเตรียมเอกสารอะไรบ้างสำหรับการโอน?',
      a: 'ฝั่งผู้ซื้อ:\n• บัตรประชาชนตัวจริง\n• ทะเบียนบ้าน\n• ทะเบียนสมรส/หย่า (ถ้ามี)\n• หนังสือมอบอำนาจ (ถ้ามีตัวแทน)\n\nฝั่งผู้ขาย:\n• โฉนดที่ดินตัวจริง\n• บัตรประชาชนและทะเบียนบ้าน\n• หนังสือยินยอมคู่สมรส (ถ้าทรัพย์สินร่วม)'
    },
    {
      q: 'ค่าใช้จ่ายวันโอนกรรมสิทธิ์มีอะไรบ้าง?',
      a: 'ค่าธรรมเนียมโอน: 2% ของราคาประเมิน (แบ่งจ่ายคนละครึ่งหรือตามตกลง)\nภาษีธุรกิจเฉพาะ: 3.3% (ถ้าผู้ขายถือครองน้อยกว่า 5 ปี)\nอากรแสตมป์: 0.5% (กรณีได้รับยกเว้นภาษีธุรกิจเฉพาะ)\nภาษีเงินได้หัก ณ ที่จ่าย: คำนวณตามหลักเกณฑ์กรมสรรพากร\n\nโดยรวมประมาณ 3–6% ของราคาประเมิน'
    },
    {
      q: 'สัญญาจะซื้อจะขายสำคัญแค่ไหน?',
      a: 'สำคัญมาก — สัญญาจะซื้อจะขายเป็นหลักฐานผูกพันทั้งสองฝ่าย\n• ระบุราคา วิธีชำระเงิน วันโอน และเงื่อนไขต่างๆ\n• มีเงินมัดจำ (ปกติ 5–10% ของราคา)\n• หากผู้ซื้อผิดสัญญา สูญเสียเงินมัดจำ\n• หากผู้ขายผิดสัญญา ต้องคืนเงินมัดจำสองเท่า\n\nแนะนำให้ทนายความตรวจสอบสัญญาก่อนลงนามเสมอ'
    },
    {
      q: 'ซื้อบ้านพร้อมสินเชื่อธนาคาร ต้องทำอะไรบ้าง?',
      a: '1. เตรียมเอกสารรายได้ — สลิปเงินเดือน หรือหนังสือรับรองรายได้ย้อนหลัง 3 เดือน\n2. ยื่นกู้ก่อนทำสัญญาซื้อขาย — รอผลอนุมัติ 7–14 วัน\n3. ธนาคารประเมินทรัพย์ — จะได้รับวงเงินกู้\n4. ทำสัญญากู้และสัญญาค้ำประกัน\n5. โอนกรรมสิทธิ์พร้อมจดทะเบียนที่กรมที่ดิน'
    },
    {
      q: 'คอนโดกับบ้านเดี่ยว ต่างกันอย่างไรในเรื่องการตรวจสอบ?',
      a: 'คอนโด:\n• ตรวจสอบนิติบุคคล — งบสำรอง ค่าส่วนกลางค้างชำระ\n• ขอดูรายงานการประชุมใหญ่ประจำปี\n• ตรวจสอบกฎระเบียบนิติบุคคล เช่น ห้ามเลี้ยงสัตว์\n\nบ้านเดี่ยว/ทาวน์เฮ้าส์:\n• ตรวจสอบใบอนุญาตก่อสร้าง\n• ตรวจสอบเขตก่อสร้างและผังเมือง\n• ตรวจระบบท่อระบาย เส้นทางน้ำ\n• ยืนยันขนาดที่ดินตรงกับโฉนด'
    }
  ];

  // จุดเด่นของ บ้าน D มีเชง
  const features = [
    { icon: 'fa-shield-alt',      title: 'ทรัพย์ตรวจสอบแล้วทุกรายการ',   desc: 'ทีมงานตรวจโฉนด ภาระผูกพัน และเอกสารก่อนนำขึ้นประกาศทุกรายการ' },
    { icon: 'fa-user-tie',        title: 'ซื้อตรงจาก บ้าน D มีเชง ไม่ผ่านคนกลาง', desc: 'บ้าน D มีเชง รีโนเวทและขายเอง ราคาเป็นธรรม ไม่มีค่าคอมมิชชันแอบแฝง' },
    { icon: 'fa-map-marker-alt',  title: 'ครอบคลุมทุกทำเล ทั่วไทย',       desc: 'ทรัพย์หลากหลายประเภท ทุกจังหวัด เลือกได้ตามไลฟ์สไตล์' },
    { icon: 'fa-headset',         title: 'ทีมงานพร้อมดูแล 7 วัน',         desc: 'ปรึกษาฟรีทุกขั้นตอน ตั้งแต่หาทรัพย์จนถึงโอนกรรมสิทธิ์' },
    { icon: 'fa-chart-line',      title: 'ข้อมูลราคาตลาดแม่นยำ',           desc: 'เปรียบเทียบราคาทรัพย์ใกล้เคียง ตัดสินใจได้มั่นใจขึ้น' },
  ];

  // ขั้นตอนซื้อบ้าน
  const buyingSteps = [
    { step: '01', icon: 'fa-search', title: 'ค้นหาทรัพย์', desc: 'กรองตามทำเล ราคา ประเภท และเงื่อนไขที่ต้องการ' },
    { step: '02', icon: 'fa-calendar-check', title: 'นัดชมสถานที่', desc: 'ดูทรัพย์จริง ตรวจสภาพ สอบถามทีม บ้าน D มีเชง โดยตรง' },
    { step: '03', icon: 'fa-handshake', title: 'ต่อรองราคา', desc: 'ตกลงเงื่อนไข วางเงินมัดจำ ทำสัญญาจะซื้อจะขาย' },
    { step: '04', icon: 'fa-university', title: 'โอนกรรมสิทธิ์', desc: 'ชำระเงินส่วนที่เหลือ โอนที่กรมที่ดิน รับกุญแจ' },
  ];

  return (
    <div style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <Navbar />

      {/* === HERO — Quiet Luxury === */}
      <section style={{
        background: `linear-gradient(135deg, ${navy} 0%, #8BC683 60%, ${brandGreen} 100%)`,
        color: '#fff', padding: 'calc(64px + 48px) 16px 40px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: '0.62rem', color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
            Buyer's Guide
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 400, marginBottom: 8, fontFamily: "'Prompt', sans-serif", letterSpacing: '-0.01em' }}>
            คู่มือผู้ซื้อ-ขายอสังหาฯ
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: 0 }}>
            ทุกสิ่งที่ต้องรู้ก่อนซื้ออสังหาริมทรัพย์จาก บ้าน D มีเชง
          </p>
        </div>
      </section>

      {/* === จุดเด่น บ้าน D มีเชง === */}
      <section className="py-5" style={{ background: '#f8faf9' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 style={{ fontFamily: "'Prompt', sans-serif", fontWeight: 500 }}>ทำไมต้องเลือก<span style={{ color: brandGreen }}> บ้าน D มีเชง</span></h2>
            <p className="text-muted">แพลตฟอร์มอสังหาริมทรัพย์ที่เชื่อถือได้ ดูแลคุณทุกขั้นตอน</p>
          </div>

          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="card-body p-4 text-center">
                    <div className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#e8f7ee' }}>
                      <i className={`fas ${f.icon}`} style={{ fontSize: '1.8rem', color: brandGreen }}></i>
                    </div>
                    <h5 className="fw-bold mb-2">{f.title}</h5>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === ขั้นตอนซื้อบ้าน === */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">ขั้นตอนซื้อบ้าน<span style={{ color: brandGreen }}> ง่ายๆ 4 ขั้น</span></h2>
            <p className="text-muted">จากการค้นหาจนถึงรับกุญแจ บ้าน D มีเชง ดูแลทุกขั้นตอน</p>
          </div>
          <div className="row g-4 justify-content-center">
            {buyingSteps.map((s, i) => (
              <div className="col-sm-6 col-lg-3" key={i}>
                <div style={{ textAlign: 'center', padding: '20px 10px', position: 'relative' }}>
                  {/* Step number */}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: '#e8f7ee', border: `3px solid ${brandGreen}`,
                    margin: '0 auto 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <i className={`fas ${s.icon}`} style={{ fontSize: '1.8rem', color: brandGreen }} />
                    <span style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 28, height: 28, borderRadius: '50%',
                      background: navy, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 900,
                    }}>{s.step}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: navy, marginBottom: 8, fontSize: '1rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#777', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === ประเภทอสังหาที่ บ้าน D มีเชง มี === */}
      <section className="py-5" style={{ background: '#f8faf9' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 style={{ fontFamily: "'Prompt', sans-serif", fontWeight: 500 }}>ประเภทอสังหาฯ<span style={{ color: brandGreen }}> ที่ บ้าน D มีเชง มี</span></h2>
          </div>
          <div className="row g-3 justify-content-center">
            {[
              { icon: 'fa-building',   type: 'คอนโด',          desc: 'ห้องชุดพักอาศัย พร้อมสิ่งอำนวยความสะดวกครบครัน' },
              { icon: 'fa-home',       type: 'บ้านเดี่ยว',     desc: 'บ้านพร้อมที่ดิน เหมาะสำหรับครอบครัว' },
              { icon: 'fa-city',       type: 'ทาวน์เฮ้าส์',   desc: 'ที่พักอาศัยประหยัดพื้นที่ ใจกลางเมือง' },
              { icon: 'fa-house-user', type: 'ทาวน์โฮม',      desc: 'บ้านแถวสไตล์โมเดิร์น พื้นที่ใช้สอยคุ้มค่า' },
              { icon: 'fa-mountain',   type: 'ที่ดิน',          desc: 'ที่ดินเปล่า พร้อมพัฒนาหรือลงทุน' },
              { icon: 'fa-store',      type: 'อาคารพาณิชย์',   desc: 'ตึกแถว อาคารสำนักงาน เหมาะทำธุรกิจ' },
              { icon: 'fa-hotel',      type: 'อพาร์ทเม้นท์',  desc: 'อาคารให้เช่า รายได้ passive income' },
              { icon: 'fa-briefcase',  type: 'โฮมออฟฟิศ',     desc: 'บ้านพักอาศัยพร้อมพื้นที่ทำงาน' },
              { icon: 'fa-warehouse',  type: 'โกดัง/โรงงาน',  desc: 'พื้นที่อุตสาหกรรม โลจิสติกส์ และการผลิต' },
            ].map((t, i) => (
              <div className="col-6 col-md-3" key={i}>
                <div className="text-center p-3 rounded-3" style={{ transition: 'all 0.2s', cursor: 'default', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  onMouseOver={e => { e.currentTarget.style.background = brandGreen; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,50,42,0.14)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <i className={`fas ${t.icon}`} style={{ fontSize: '1.5rem', marginBottom: 8, color: brandGreen, display: 'block', transition: 'color 0.2s' }} />
                  <div className="fw-bold" style={{ fontSize: '0.9rem', marginBottom: 4 }}>{t.type}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === เคล็ดลับสำคัญ === */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">⚠️ สิ่งที่<span style={{ color: '#e74c3c' }}> ต้องระวัง</span> ก่อนซื้อ</h2>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { icon: 'fa-file-alt',      color: '#e74c3c', bg: '#fde8e8', title: 'ตรวจโฉนดด้วยตนเอง',       desc: 'อย่าเชื่อเพียงเอกสารที่ผู้ขายให้มา ควรยื่นตรวจที่กรมที่ดินด้วยตนเอง' },
              { icon: 'fa-money-check',   color: '#f39c12', bg: '#fef9e7', title: 'อย่าชำระเงินสดทั้งหมด',   desc: 'ชำระผ่านธนาคารเสมอ มีหลักฐาน ป้องกันการฉ้อโกง' },
              { icon: 'fa-search-location', color: '#3498db', bg: '#e8f4f8', title: 'เยี่ยมชมสถานที่จริง',   desc: 'อย่าตัดสินใจจากรูปออนไลน์เพียงอย่างเดียว ดูทรัพย์จริงหลายรอบ' },
              { icon: 'fa-balance-scale',  color: '#9b59b6', bg: '#f4ecf7', title: 'ให้ทนายตรวจสัญญา',       desc: 'ก่อนลงนามสัญญาจะซื้อจะขาย ให้ผู้เชี่ยวชาญตรวจสอบเงื่อนไขทุกข้อ' },
            ].map((item, i) => (
              <div className="col-md-6" key={i}>
                <div className="d-flex gap-3 p-4 rounded-3" style={{ border: '1px solid #eee' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '12px', background: item.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fas ${item.icon}`} style={{ fontSize: '1.4rem', color: item.color }}></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{item.title}</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.87rem', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-5" style={{ background: '#f8faf9' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">คำถาม<span style={{ color: brandGreen }}>ที่พบบ่อย</span></h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {faqs.map((faq, i) => (
                <div key={i} className="mb-3">
                  <div
                    className="d-flex justify-content-between align-items-center p-3 rounded-3"
                    style={{
                      background: openFaq === i ? '#e8f7ee' : '#fff',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: openFaq === i ? `1.5px solid ${brandGreen}` : '1.5px solid #eee',
                      boxShadow: openFaq === i ? `0 4px 16px rgba(4,170,109,0.1)` : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onClick={() => toggleFaq(i)}>
                    <h6 className="fw-bold mb-0" style={{ color: openFaq === i ? brandGreen : '#333', fontSize: '0.92rem' }}>
                      <i className={`fas fa-${openFaq === i ? 'minus' : 'plus'}-circle me-2`} style={{ color: brandGreen }}></i>
                      {faq.q}
                    </h6>
                    <i className={`fas fa-chevron-${openFaq === i ? 'up' : 'down'}`} style={{ color: brandGreen, flexShrink: 0, marginLeft: 8 }}></i>
                  </div>
                  {openFaq === i && (
                    <div className="p-3 border border-top-0 rounded-bottom-3" style={{ background: '#fff' }}>
                      <p className="text-secondary mb-0" style={{ lineHeight: '1.9', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="py-5" style={{ background: `linear-gradient(135deg, ${navy} 0%, #6aab62 60%, ${brandGreen} 100%)` }}>
        <div className="container text-center text-white">
          <i className="fas fa-comments" style={{ fontSize: '2rem', marginBottom: 12, color: '#C9A84C', display: 'block' }} />
          <h2 style={{ fontWeight: 400, fontFamily: "'Prompt', sans-serif", marginBottom: 16 }}>พร้อมหาบ้านในฝันแล้วหรือยัง?</h2>
          <p className="lead mb-4" style={{ opacity: 0.9 }}>ปรึกษาฟรี ทีมงานพร้อมช่วยคุณทุกขั้นตอน</p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <a href="https://line.me/R/ti/p/@loan_dd" target="_blank" rel="noopener noreferrer"
              className="btn btn-lg rounded-pill px-5 py-3 fw-bold"
              style={{ backgroundColor: '#06C755', color: '#fff', border: 'none' }}>
              <i className="fab fa-line me-2"></i> Line: @loan_dd
            </a>
            <a href="tel:081-638-6966"
              className="btn btn-lg rounded-pill px-5 py-3 fw-bold"
              style={{ backgroundColor: '#fff', color: navy, border: 'none' }}>
              <i className="fas fa-phone-alt me-2"></i> 081-638-6966
            </a>
          </div>
          <p className="mt-4 mb-0 small" style={{ opacity: 0.7 }}>
            เปิดให้บริการ จันทร์ - อาทิตย์ 09:00 - 17:00 น.
          </p>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-4 text-center text-white" style={{ backgroundColor: '#222' }}>
        <div className="container">
          <div className="mb-3">
            <i className="fab fa-facebook fa-lg mx-2"></i>
            <i className="fab fa-line fa-lg mx-2"></i>
            <i className="fas fa-phone-alt fa-lg mx-2"></i>
          </div>
          <p className="mb-0 small text-white-50">&copy; 2026 บ้าน D มีเชง Co., Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Guide;
