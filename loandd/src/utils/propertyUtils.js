// ฟอร์แมตราคา — ตัวเลขปกติมีคอมมา เช่น 37,000 / 1,700,000
export const formatPrice = (price) => {
  if (!price) return '—';
  return Number(price).toLocaleString('th-TH');
};

// ชื่อประเภททรัพย์
export const propertyTypeLabel = (type) => {
  const map = {
    house:      'บ้านเดี่ยว',
    condo:      'คอนโด',
    townhouse:  'ทาวน์เฮ้าส์',
    townhome:   'ทาวน์โฮม',
    land:       'ที่ดิน',
    apartment:   'อพาร์ทเม้นท์',
    commercial:  'อาคารพาณิชย์',
    home_office: 'โฮมออฟฟิศ',
    warehouse:   'โกดัง/โรงงาน',
  };
  return map[type] || type;
};
