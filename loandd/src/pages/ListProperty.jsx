import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ListProperty.css';

// === ตัวเลือกประเภททรัพย์ ===
const PROPERTY_TYPES = [
  { value: 'house', label: 'บ้านเดี่ยว', icon: 'fa-home' },
  { value: 'condo', label: 'คอนโด', icon: 'fa-building' },
  { value: 'townhouse', label: 'ทาวน์เฮ้าส์', icon: 'fa-city' },
  { value: 'land', label: 'ที่ดินเปล่า', icon: 'fa-mountain' },
  { value: 'commercial', label: 'อาคารพาณิชย์', icon: 'fa-store' },
  { value: 'apartment', label: 'อพาร์ทเม้นท์', icon: 'fa-hotel' },
  { value: 'factory', label: 'โรงงาน / โกดัง', icon: 'fa-warehouse' },
  { value: 'other', label: 'อื่นๆ', icon: 'fa-th-large' },
];

// === จังหวัดยอดนิยม ===
const PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี',
  'เชียงใหม่', 'นครราชสีมา', 'ขอนแก่น', 'ภูเก็ต', 'สุราษฎร์ธานี',
  'เชียงราย', 'อุดรธานี', 'นครปฐม', 'สมุทรสาคร', 'ระยอง',
  'พระนครศรีอยุธยา', 'สงขลา', 'ลำปาง', 'นครสวรรค์', 'อุบลราชธานี',
  'อื่นๆ',
];

function ListProperty() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // === ข้อมูลฟอร์ม ===
  const [formData, setFormData] = useState({
    // Step 1: ข้อมูลทรัพย์สิน
    transaction_type: '',        // ขายฝาก หรือ จำนอง
    property_type: '',           // ประเภททรัพย์
    area_size: '',               // ขนาดพื้นที่ (ตัวเลข)
    area_unit: 'sqw',            // หน่วย: sqw = ตร.ว., sqm = ตร.ม., rai = ไร่
    province: '',                // จังหวัด
    district: '',                // อำเภอ/เขต

    // Step 2: ข้อมูลการเงิน + ติดต่อ
    purchase_price: '',          // ราคาซื้อ/ราคาประเมิน
    loan_amount: '',             // ต้องการเงินเท่าไหร่
    existing_debt: '',           // หนี้คงค้าง (ถ้ามี)
    phone: '',                   // เบอร์โทรศัพท์
    line_id: '',                 // Line ID (ถ้ามี)
    note: '',                    // หมายเหตุเพิ่มเติม
  });

  // === เช็ค Login ===
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserName(user.name || user.email || 'ผู้ใช้');
      } catch (e) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  // === Handle input change ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError('');
  };

  // === Format ตัวเลขเป็นเงินบาท ===
  const formatMoney = (value) => {
    if (!value) return '';
    const num = value.toString().replace(/[^0-9]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('th-TH');
  };

  const handleMoneyChange = (e) => {
    const { name, value } = e.target;
    const num = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: num }));
    if (submitError) setSubmitError('');
  };

  // === Validation แต่ละ Step ===
  const validateStep1 = () => {
    if (!formData.transaction_type) return 'กรุณาเลือกประเภทบริการ (ขายฝาก/จำนอง)';
    if (!formData.property_type) return 'กรุณาเลือกประเภททรัพย์สิน';
    if (!formData.area_size) return 'กรุณาระบุขนาดพื้นที่';
    if (!formData.province) return 'กรุณาเลือกจังหวัด';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.purchase_price) return 'กรุณาระบุราคาซื้อ/ราคาประเมิน';
    if (!formData.loan_amount) return 'กรุณาระบุจำนวนเงินที่ต้องการ';
    if (!formData.phone) return 'กรุณาระบุเบอร์โทรศัพท์';
    if (formData.phone.length < 9) return 'เบอร์โทรศัพท์ไม่ถูกต้อง';
    return null;
  };

  // === ไปขั้นตอนถัดไป ===
  const nextStep = () => {
    let error = null;
    if (currentStep === 1) error = validateStep1();
    if (currentStep === 2) error = validateStep2();

    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError('');
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setSubmitError('');
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // === Submit ===
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/investment-properties/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setSubmitSuccess(true);
        window.scrollTo(0, 0);
      } else {
        setSubmitError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      setSubmitError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Labels สำหรับ Step 3 (ยืนยัน) ===
  const areaUnitLabel = { sqw: 'ตร.ว.', sqm: 'ตร.ม.', rai: 'ไร่' };
  const transactionLabel = { 'selling-pledge': 'ขายฝาก', 'mortgage': 'จำนอง' };
  const propertyLabel = PROPERTY_TYPES.reduce((acc, t) => { acc[t.value] = t.label; return acc; }, {});

  // === LINE SVG Icon ===
  const LineSVG = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  );

  // =============================================
  // ถ้ายังไม่ได้ Login → แสดงหน้าบอกให้ Login ก่อน
  // =============================================
  if (!isLoggedIn) {
    return (
      <div className="lp-container">
        <div className="lp-login-required">
          <div className="lp-login-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2>กรุณาเข้าสู่ระบบก่อน</h2>
          <p>คุณต้องเข้าสู่ระบบเพื่อลงประกาศทรัพย์สิน</p>
          <div className="lp-login-buttons">
            <button className="btn-lp-primary" onClick={() => navigate('/login')}>
              <i className="fas fa-sign-in-alt"></i> เข้าสู่ระบบ
            </button>
            <button className="btn-lp-secondary" onClick={() => navigate('/register')}>
              สมัครสมาชิก
            </button>
          </div>
          <div className="lp-line-alt">
            <span>หรือติดต่อเราทาง Line ได้เลยค่ะ</span>
            <a href="https://line.me/R/ti/p/@343gpuvp" target="_blank" rel="noopener noreferrer" className="btn-lp-line">
              <LineSVG /> แอดไลน์ @LoanDD
            </a>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // Submit สำเร็จ → แสดงหน้า Thank You
  // =============================================
  if (submitSuccess) {
    return (
      <div className="lp-container">
        <div className="lp-success">
          <div className="lp-success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>ส่งข้อมูลเรียบร้อยแล้ว!</h2>
          <p>ทีมงาน LoanDD จะติดต่อกลับภายใน 24 ชั่วโมง</p>
          <p className="lp-success-sub">เลขอ้างอิง: #LP{Date.now().toString().slice(-6)}</p>
          <div className="lp-success-buttons">
            <button className="btn-lp-primary" onClick={() => navigate('/')}>
              <i className="fas fa-home"></i> กลับหน้าแรก
            </button>
            <button className="btn-lp-secondary" onClick={() => {
              setSubmitSuccess(false);
              setCurrentStep(1);
              setFormData({
                transaction_type: '', property_type: '', area_size: '', area_unit: 'sqw',
                province: '', district: '', purchase_price: '', loan_amount: '',
                existing_debt: '', phone: '', line_id: '', note: '',
              });
            }}>
              ลงประกาศอีก
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // MAIN FORM — 3 ขั้นตอน
  // =============================================
  return (
    <div className="lp-container">

      {/* Header */}
      <div className="lp-header">
        <h1><i className="fas fa-file-alt"></i> ลงประกาศทรัพย์สิน</h1>
        <p>สวัสดีคุณ {userName} — กรอกข้อมูลเบื้องต้นเพื่อให้ทีมงานประเมินราคาให้ฟรี</p>
      </div>

      {/* Line Contact Alternative */}
      <div className="lp-line-box">
        <div className="lp-line-box-inner">
          <span><i className="fas fa-headset"></i> ไม่สะดวกกรอกฟอร์ม? แอดไลน์คุยกับทีมงานได้เลยค่ะ</span>
          <a href="https://line.me/R/ti/p/@343gpuvp" target="_blank" rel="noopener noreferrer" className="btn-lp-line-sm">
            <LineSVG size={18} /> แอดไลน์
          </a>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="lp-steps">
        <div className={`lp-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>
          <div className="lp-step-num">{currentStep > 1 ? <i className="fas fa-check"></i> : '1'}</div>
          <span>ข้อมูลทรัพย์</span>
        </div>
        <div className="lp-step-line"></div>
        <div className={`lp-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'done' : ''}`}>
          <div className="lp-step-num">{currentStep > 2 ? <i className="fas fa-check"></i> : '2'}</div>
          <span>การเงิน & ติดต่อ</span>
        </div>
        <div className="lp-step-line"></div>
        <div className={`lp-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="lp-step-num">3</div>
          <span>ยืนยัน</span>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="lp-error">
          <i className="fas fa-exclamation-circle"></i> {submitError}
        </div>
      )}

      {/* ===== STEP 1: ข้อมูลทรัพย์สิน ===== */}
      {currentStep === 1 && (
        <div className="lp-card">
          <h2 className="lp-card-title">
            <i className="fas fa-home"></i> ข้อมูลทรัพย์สิน
          </h2>

          {/* ประเภทบริการ: ขายฝาก / จำนอง */}
          <div className="lp-field">
            <label className="lp-label">ประเภทบริการ <span className="required">*</span></label>
            <div className="lp-radio-group">
              <label className={`lp-radio-card ${formData.transaction_type === 'selling-pledge' ? 'selected' : ''}`}>
                <input
                  type="radio" name="transaction_type" value="selling-pledge"
                  checked={formData.transaction_type === 'selling-pledge'}
                  onChange={handleChange}
                />
                <div className="lp-radio-content">
                  <i className="fas fa-handshake"></i>
                  <strong>ขายฝาก</strong>
                  <small>ได้วงเงิน ~50% ของราคาประเมิน</small>
                </div>
              </label>
              <label className={`lp-radio-card ${formData.transaction_type === 'mortgage' ? 'selected' : ''}`}>
                <input
                  type="radio" name="transaction_type" value="mortgage"
                  checked={formData.transaction_type === 'mortgage'}
                  onChange={handleChange}
                />
                <div className="lp-radio-content">
                  <i className="fas fa-landmark"></i>
                  <strong>จำนอง</strong>
                  <small>ได้วงเงิน ~30% ของราคาประเมิน</small>
                </div>
              </label>
            </div>
          </div>

          {/* ประเภททรัพย์สิน — Grid */}
          <div className="lp-field">
            <label className="lp-label">ประเภททรัพย์สิน <span className="required">*</span></label>
            <div className="lp-type-grid">
              {PROPERTY_TYPES.map(t => (
                <div
                  key={t.value}
                  className={`lp-type-card ${formData.property_type === t.value ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, property_type: t.value }))}
                >
                  <i className={`fas ${t.icon}`}></i>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ขนาดพื้นที่ */}
          <div className="lp-field">
            <label className="lp-label">ขนาดพื้นที่ <span className="required">*</span></label>
            <div className="lp-input-group">
              <input
                type="number" name="area_size" value={formData.area_size}
                onChange={handleChange} placeholder="เช่น 50"
                className="lp-input" min="0"
              />
              <span className="lp-unit-label">ตร.ว.</span>
            </div>
          </div>

          {/* จังหวัด + อำเภอ */}
          <div className="lp-field-row">
            <div className="lp-field">
              <label className="lp-label">จังหวัด <span className="required">*</span></label>
              <select name="province" value={formData.province} onChange={handleChange} className="lp-select">
                <option value="">-- เลือกจังหวัด --</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="lp-field">
              <label className="lp-label">อำเภอ / เขต</label>
              <input
                type="text" name="district" value={formData.district}
                onChange={handleChange} placeholder="เช่น บางนา, เมือง"
                className="lp-input"
              />
            </div>
          </div>

          {/* ปุ่ม */}
          <div className="lp-buttons">
            <div></div>
            <button className="btn-lp-primary" onClick={nextStep}>
              ถัดไป <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: ข้อมูลการเงิน + ติดต่อ ===== */}
      {currentStep === 2 && (
        <div className="lp-card">
          <h2 className="lp-card-title">
            <i className="fas fa-coins"></i> ข้อมูลการเงิน & ช่องทางติดต่อ
          </h2>

          {/* ราคาซื้อ / ราคาประเมิน */}
          <div className="lp-field">
            <label className="lp-label">ราคาซื้อ / ราคาประเมิน (บาท) <span className="required">*</span></label>
            <div className="lp-input-money">
              <span className="lp-prefix">฿</span>
              <input
                type="text" name="purchase_price"
                value={formatMoney(formData.purchase_price)}
                onChange={handleMoneyChange}
                placeholder="เช่น 3,000,000"
                className="lp-input"
              />
            </div>
          </div>

          {/* จำนวนเงินที่ต้องการ */}
          <div className="lp-field">
            <label className="lp-label">ต้องการเงินเท่าไหร่ (บาท) <span className="required">*</span></label>
            <div className="lp-input-money">
              <span className="lp-prefix">฿</span>
              <input
                type="text" name="loan_amount"
                value={formatMoney(formData.loan_amount)}
                onChange={handleMoneyChange}
                placeholder="เช่น 1,500,000"
                className="lp-input"
              />
            </div>
            {formData.purchase_price && formData.loan_amount && Number(formData.purchase_price) > 0 && (
              <div className="lp-hint">
                <i className="fas fa-info-circle"></i>
                {' '}คิดเป็น {((Number(formData.loan_amount) / Number(formData.purchase_price)) * 100).toFixed(0)}% ของราคาทรัพย์
                {Number(formData.loan_amount) / Number(formData.purchase_price) > 0.5 && formData.transaction_type === 'selling-pledge' && (
                  <span className="lp-hint-warn"> (ขายฝากปกติได้ไม่เกิน 50%)</span>
                )}
              </div>
            )}
          </div>

          {/* หนี้คงค้าง */}
          <div className="lp-field">
            <label className="lp-label">หนี้คงค้าง (ถ้ามี)</label>
            <div className="lp-input-money">
              <span className="lp-prefix">฿</span>
              <input
                type="text" name="existing_debt"
                value={formatMoney(formData.existing_debt)}
                onChange={handleMoneyChange}
                placeholder="ไม่มีให้เว้นว่าง"
                className="lp-input"
              />
            </div>
          </div>

          <hr className="lp-divider" />

          {/* เบอร์โทร + Line ID */}
          <div className="lp-field-row">
            <div className="lp-field">
              <label className="lp-label">เบอร์โทรศัพท์ <span className="required">*</span></label>
              <input
                type="tel" name="phone" value={formData.phone}
                onChange={handleChange} placeholder="08X-XXX-XXXX"
                maxLength="10" className="lp-input"
              />
            </div>
            <div className="lp-field">
              <label className="lp-label">Line ID (ถ้ามี)</label>
              <input
                type="text" name="line_id" value={formData.line_id}
                onChange={handleChange} placeholder="เช่น @mylineid"
                className="lp-input"
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="lp-field">
            <label className="lp-label">หมายเหตุเพิ่มเติม</label>
            <textarea
              name="note" value={formData.note}
              onChange={handleChange}
              placeholder="เช่น ต้องการเงินด่วนภายใน 1 สัปดาห์, ทรัพย์ติดจำนองธนาคาร ฯลฯ"
              rows="3" className="lp-textarea"
            />
          </div>

          {/* ปุ่ม */}
          <div className="lp-buttons">
            <button className="btn-lp-back" onClick={prevStep}>
              <i className="fas fa-arrow-left"></i> ย้อนกลับ
            </button>
            <button className="btn-lp-primary" onClick={nextStep}>
              ถัดไป <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: ยืนยันข้อมูล ===== */}
      {currentStep === 3 && (
        <div className="lp-card">
          <h2 className="lp-card-title">
            <i className="fas fa-clipboard-check"></i> ตรวจสอบและยืนยันข้อมูล
          </h2>

          <div className="lp-summary">
            {/* ข้อมูลทรัพย์ */}
            <div className="lp-summary-section">
              <h3><i className="fas fa-home"></i> ข้อมูลทรัพย์สิน</h3>
              <div className="lp-summary-row">
                <span>ประเภทบริการ</span>
                <strong>{transactionLabel[formData.transaction_type] || '-'}</strong>
              </div>
              <div className="lp-summary-row">
                <span>ประเภททรัพย์</span>
                <strong>{propertyLabel[formData.property_type] || '-'}</strong>
              </div>
              <div className="lp-summary-row">
                <span>ขนาดพื้นที่</span>
                <strong>{formData.area_size} ตร.ว.</strong>
              </div>
              <div className="lp-summary-row">
                <span>ที่ตั้ง</span>
                <strong>{formData.district ? `${formData.district}, ` : ''}{formData.province}</strong>
              </div>
            </div>

            {/* ข้อมูลการเงิน */}
            <div className="lp-summary-section">
              <h3><i className="fas fa-coins"></i> ข้อมูลการเงิน</h3>
              <div className="lp-summary-row">
                <span>ราคาซื้อ/ประเมิน</span>
                <strong>฿{formatMoney(formData.purchase_price)}</strong>
              </div>
              <div className="lp-summary-row highlight">
                <span>ต้องการเงิน</span>
                <strong>฿{formatMoney(formData.loan_amount)}</strong>
              </div>
              {formData.existing_debt && (
                <div className="lp-summary-row">
                  <span>หนี้คงค้าง</span>
                  <strong>฿{formatMoney(formData.existing_debt)}</strong>
                </div>
              )}
            </div>

            {/* ช่องทางติดต่อ */}
            <div className="lp-summary-section">
              <h3><i className="fas fa-phone-alt"></i> ช่องทางติดต่อ</h3>
              <div className="lp-summary-row">
                <span>เบอร์โทร</span>
                <strong>{formData.phone}</strong>
              </div>
              {formData.line_id && (
                <div className="lp-summary-row">
                  <span>Line ID</span>
                  <strong>{formData.line_id}</strong>
                </div>
              )}
              {formData.note && (
                <div className="lp-summary-row">
                  <span>หมายเหตุ</span>
                  <strong>{formData.note}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ปุ่ม */}
          <div className="lp-buttons">
            <button className="btn-lp-back" onClick={prevStep}>
              <i className="fas fa-arrow-left"></i> แก้ไขข้อมูล
            </button>
            <button className="btn-lp-submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> กำลังส่ง...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> ส่งข้อมูลเพื่อประเมินราคา</>
              )}
            </button>
          </div>

          <p className="lp-disclaimer">
            <i className="fas fa-shield-alt"></i> ข้อมูลของคุณจะถูกเก็บเป็นความลับ ใช้สำหรับการประเมินราคาเบื้องต้นเท่านั้น
          </p>
        </div>
      )}
    </div>
  );
}

export default ListProperty;