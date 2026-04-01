/**
 * Thailand Train Stations Database
 * ครอบคลุม: BTS Sukhumvit/Silom, MRT Blue/Purple/Yellow/Pink, ARL, Gold Line, SRT Red Line
 * ใช้คำนวณสถานีใกล้เคียงจากพิกัด lat/lng
 */

export const TRAIN_LINES = {
  bts_sukhumvit:  { label: 'BTS สายสุขุมวิท',      color: '#76B743', type: 'bts' },
  bts_silom:      { label: 'BTS สายสีลม',           color: '#76B743', type: 'bts' },
  mrt_blue:       { label: 'MRT สายสีน้ำเงิน',      color: '#1E4D9B', type: 'mrt' },
  mrt_purple:     { label: 'MRT สายสีม่วง',          color: '#7B2D8B', type: 'mrt' },
  mrt_yellow:     { label: 'MRT สายสีเหลือง',        color: '#F5B400', type: 'mrt' },
  mrt_pink:       { label: 'MRT สายสีชมพู',          color: '#E6007E', type: 'mrt' },
  arl:            { label: 'Airport Rail Link',       color: '#C0392B', type: 'arl' },
  srt_red_north:  { label: 'SRT สายสีแดงเข้ม (เหนือ)', color: '#A52A2A', type: 'arl' },
  srt_red_east:   { label: 'SRT สายสีแดงอ่อน (ตะวันออก)', color: '#C1440E', type: 'arl' },
  gold:           { label: 'BTS สายสีทอง',           color: '#D4A017', type: 'bts' },
};

export const TRAIN_STATIONS = [
  // ─── BTS Sukhumvit Line (สายสีเขียวเข้ม N/E) ───────────────────────────
  { id: 'bts_n8',  name: 'BTS หมอชิต',           line: 'bts_sukhumvit', lat: 13.8027, lng: 100.5533 },
  { id: 'bts_n7',  name: 'BTS สะพานควาย',        line: 'bts_sukhumvit', lat: 13.7950, lng: 100.5476 },
  { id: 'bts_n6',  name: 'BTS อารีย์',            line: 'bts_sukhumvit', lat: 13.7881, lng: 100.5449 },
  { id: 'bts_n5',  name: 'BTS สนามเป้า',          line: 'bts_sukhumvit', lat: 13.7811, lng: 100.5422 },
  { id: 'bts_n4',  name: 'BTS อนุสาวรีย์ชัย',    line: 'bts_sukhumvit', lat: 13.7657, lng: 100.5393 },
  { id: 'bts_n3',  name: 'BTS พญาไท',             line: 'bts_sukhumvit', lat: 13.7604, lng: 100.5327 },
  { id: 'bts_n2',  name: 'BTS ราชเทวี',           line: 'bts_sukhumvit', lat: 13.7573, lng: 100.5296 },
  { id: 'bts_c0',  name: 'BTS สยาม',              line: 'bts_sukhumvit', lat: 13.7455, lng: 100.5330 },
  { id: 'bts_e1',  name: 'BTS ชิดลม',             line: 'bts_sukhumvit', lat: 13.7434, lng: 100.5394 },
  { id: 'bts_e2',  name: 'BTS เพลินจิต',          line: 'bts_sukhumvit', lat: 13.7421, lng: 100.5459 },
  { id: 'bts_e3',  name: 'BTS นานา',              line: 'bts_sukhumvit', lat: 13.7409, lng: 100.5548 },
  { id: 'bts_e4',  name: 'BTS อโศก',              line: 'bts_sukhumvit', lat: 13.7380, lng: 100.5609 },
  { id: 'bts_e5',  name: 'BTS พร้อมพงษ์',         line: 'bts_sukhumvit', lat: 13.7309, lng: 100.5686 },
  { id: 'bts_e6',  name: 'BTS ทองหล่อ',           line: 'bts_sukhumvit', lat: 13.7241, lng: 100.5765 },
  { id: 'bts_e7',  name: 'BTS เอกมัย',            line: 'bts_sukhumvit', lat: 13.7164, lng: 100.5842 },
  { id: 'bts_e8',  name: 'BTS พระโขนง',           line: 'bts_sukhumvit', lat: 13.7092, lng: 100.5901 },
  { id: 'bts_e9',  name: 'BTS อ่อนนุช',           line: 'bts_sukhumvit', lat: 13.7021, lng: 100.5986 },
  { id: 'bts_e10', name: 'BTS อุดมสุข',           line: 'bts_sukhumvit', lat: 13.6940, lng: 100.6062 },
  { id: 'bts_e11', name: 'BTS บางนา',             line: 'bts_sukhumvit', lat: 13.6866, lng: 100.6119 },
  { id: 'bts_e12', name: 'BTS แบริ่ง',            line: 'bts_sukhumvit', lat: 13.6820, lng: 100.6178 },
  { id: 'bts_e13', name: 'BTS สำโรง',             line: 'bts_sukhumvit', lat: 13.6683, lng: 100.5985 },
  { id: 'bts_e14', name: 'BTS ปู่เจ้า',           line: 'bts_sukhumvit', lat: 13.6568, lng: 100.5917 },
  { id: 'bts_e15', name: 'BTS ช้างเอราวัณ',       line: 'bts_sukhumvit', lat: 13.6502, lng: 100.5858 },
  { id: 'bts_e16', name: 'BTS โรงเรียนนายเรือ',   line: 'bts_sukhumvit', lat: 13.6407, lng: 100.5787 },
  { id: 'bts_e17', name: 'BTS ปากน้ำ',            line: 'bts_sukhumvit', lat: 13.6347, lng: 100.5726 },
  { id: 'bts_e18', name: 'BTS ศรีนครินทร์',       line: 'bts_sukhumvit', lat: 13.6222, lng: 100.5680 },
  { id: 'bts_e19', name: 'BTS แพรกษา',            line: 'bts_sukhumvit', lat: 13.6110, lng: 100.5635 },
  { id: 'bts_e20', name: 'BTS แพรกษาใหม่',        line: 'bts_sukhumvit', lat: 13.6043, lng: 100.5601 },
  { id: 'bts_e21', name: 'BTS สายลวด',            line: 'bts_sukhumvit', lat: 13.5973, lng: 100.5566 },
  { id: 'bts_e22', name: 'BTS เคหะ',              line: 'bts_sukhumvit', lat: 13.5920, lng: 100.5535 },
  // สายสีเขียวส่วนต่อขยายเหนือ
  { id: 'bts_n9',  name: 'BTS ห้าแยกลาดพร้าว',   line: 'bts_sukhumvit', lat: 13.8135, lng: 100.5545 },
  { id: 'bts_n10', name: 'BTS พหลโยธิน 24',       line: 'bts_sukhumvit', lat: 13.8252, lng: 100.5597 },
  { id: 'bts_n11', name: 'BTS รัชโยธิน',          line: 'bts_sukhumvit', lat: 13.8369, lng: 100.5664 },
  { id: 'bts_n12', name: 'BTS เสนานิคม',          line: 'bts_sukhumvit', lat: 13.8461, lng: 100.5695 },
  { id: 'bts_n13', name: 'BTS มหาวิทยาลัยเกษตร', line: 'bts_sukhumvit', lat: 13.8471, lng: 100.5763 },
  { id: 'bts_n14', name: 'BTS กองทัพบกอุปถัมภ์', line: 'bts_sukhumvit', lat: 13.8580, lng: 100.5810 },
  { id: 'bts_n15', name: 'BTS วัดพระศรีมหาธาตุ', line: 'bts_sukhumvit', lat: 13.8668, lng: 100.5820 },
  { id: 'bts_n16', name: 'BTS แยก 4 ถนน',        line: 'bts_sukhumvit', lat: 13.8748, lng: 100.5833 },
  { id: 'bts_n17', name: 'BTS สะพานใหม่',         line: 'bts_sukhumvit', lat: 13.8843, lng: 100.5877 },
  { id: 'bts_n18', name: 'BTS สายหยุด',           line: 'bts_sukhumvit', lat: 13.8938, lng: 100.5958 },
  { id: 'bts_n19', name: 'BTS ลำลูกกา คลอง 1',   line: 'bts_sukhumvit', lat: 13.9060, lng: 100.6018 },
  { id: 'bts_n20', name: 'BTS ลำลูกกา คลอง 2',   line: 'bts_sukhumvit', lat: 13.9167, lng: 100.6049 },
  { id: 'bts_n21', name: 'BTS ลำลูกกา คลอง 3',   line: 'bts_sukhumvit', lat: 13.9248, lng: 100.6067 },
  { id: 'bts_n22', name: 'BTS ลำลูกกา คลอง 4',   line: 'bts_sukhumvit', lat: 13.9339, lng: 100.6044 },
  { id: 'bts_n23', name: 'BTS คูคต',              line: 'bts_sukhumvit', lat: 13.9437, lng: 100.6087 },

  // ─── BTS Silom Line (สายสีเขียวอ่อน W/S) ───────────────────────────────
  { id: 'bts_w1',  name: 'BTS สนามกีฬาแห่งชาติ', line: 'bts_silom', lat: 13.7465, lng: 100.5291 },
  { id: 'bts_s1',  name: 'BTS ราชดำริ',           line: 'bts_silom', lat: 13.7430, lng: 100.5261 },
  { id: 'bts_s2',  name: 'BTS ศาลาแดง',           line: 'bts_silom', lat: 13.7268, lng: 100.5249 },
  { id: 'bts_s3',  name: 'BTS ช่องนนทรี',         line: 'bts_silom', lat: 13.7220, lng: 100.5251 },
  { id: 'bts_s4',  name: 'BTS เซนต์หลุยส์',      line: 'bts_silom', lat: 13.7160, lng: 100.5252 },
  { id: 'bts_s5',  name: 'BTS สุรศักดิ์',         line: 'bts_silom', lat: 13.7137, lng: 100.5219 },
  { id: 'bts_s6',  name: 'BTS สะพานตากสิน',       line: 'bts_silom', lat: 13.7185, lng: 100.5147 },
  { id: 'bts_s7',  name: 'BTS กรุงธนบุรี',        line: 'bts_silom', lat: 13.7232, lng: 100.4981 },
  { id: 'bts_s8',  name: 'BTS วงเวียนใหญ่',       line: 'bts_silom', lat: 13.7212, lng: 100.4885 },
  { id: 'bts_s9',  name: 'BTS โพธิ์นิมิตร',       line: 'bts_silom', lat: 13.7163, lng: 100.4781 },
  { id: 'bts_s10', name: 'BTS ตลาดพลู',           line: 'bts_silom', lat: 13.7128, lng: 100.4707 },
  { id: 'bts_s11', name: 'BTS วุฒากาศ',           line: 'bts_silom', lat: 13.7100, lng: 100.4636 },
  { id: 'bts_s12', name: 'BTS บางหว้า',           line: 'bts_silom', lat: 13.7119, lng: 100.4566 },

  // ─── BTS Gold Line (สายสีทอง) ───────────────────────────────────────────
  { id: 'gold_g1', name: 'BTS กรุงธนบุรี (สีทอง)',line: 'gold', lat: 13.7232, lng: 100.4981 },
  { id: 'gold_g2', name: 'BTS เจริญนคร',          line: 'gold', lat: 13.7196, lng: 100.5028 },
  { id: 'gold_g3', name: 'BTS คลองสาน',           line: 'gold', lat: 13.7228, lng: 100.5068 },

  // ─── MRT Blue Line (สายสีน้ำเงิน วงแหวน) ───────────────────────────────
  { id: 'mrt_bl01', name: 'MRT หัวลำโพง',         line: 'mrt_blue', lat: 13.7381, lng: 100.5157 },
  { id: 'mrt_bl02', name: 'MRT วัดมังกร',          line: 'mrt_blue', lat: 13.7424, lng: 100.5096 },
  { id: 'mrt_bl03', name: 'MRT สามยอด',            line: 'mrt_blue', lat: 13.7478, lng: 100.5003 },
  { id: 'mrt_bl04', name: 'MRT สนามไชย',           line: 'mrt_blue', lat: 13.7425, lng: 100.4919 },
  { id: 'mrt_bl05', name: 'MRT อิสรภาพ',           line: 'mrt_blue', lat: 13.7390, lng: 100.4816 },
  { id: 'mrt_bl06', name: 'MRT ท่าพระ',            line: 'mrt_blue', lat: 13.7305, lng: 100.4753 },
  { id: 'mrt_bl07', name: 'MRT บางไผ่',            line: 'mrt_blue', lat: 13.7260, lng: 100.4628 },
  { id: 'mrt_bl08', name: 'MRT บางหว้า (MRT)',     line: 'mrt_blue', lat: 13.7119, lng: 100.4566 },
  { id: 'mrt_bl09', name: 'MRT บางแค',             line: 'mrt_blue', lat: 13.7117, lng: 100.4437 },
  { id: 'mrt_bl10', name: 'MRT หลักสอง',           line: 'mrt_blue', lat: 13.7124, lng: 100.4329 },
  { id: 'mrt_bl11', name: 'MRT สามเสน',            line: 'mrt_blue', lat: 13.7573, lng: 100.5023 },
  { id: 'mrt_bl12', name: 'MRT อนุสาวรีย์ประชาธิปไตย', line: 'mrt_blue', lat: 13.7570, lng: 100.5012 },
  { id: 'mrt_bl13', name: 'MRT สะพานผ่านฟ้า',     line: 'mrt_blue', lat: 13.7540, lng: 100.5026 },
  { id: 'mrt_bl14', name: 'MRT สีลม',              line: 'mrt_blue', lat: 13.7279, lng: 100.5280 },
  { id: 'mrt_bl15', name: 'MRT สามย่าน',           line: 'mrt_blue', lat: 13.7323, lng: 100.5261 },
  { id: 'mrt_bl16', name: 'MRT ลุมพินี',           line: 'mrt_blue', lat: 13.7279, lng: 100.5395 },
  { id: 'mrt_bl17', name: 'MRT คลองเตย',           line: 'mrt_blue', lat: 13.7226, lng: 100.5540 },
  { id: 'mrt_bl18', name: 'MRT ศูนย์การประชุมฯสิริกิติ์', line: 'mrt_blue', lat: 13.7222, lng: 100.5604 },
  { id: 'mrt_bl19', name: 'MRT สุขุมวิท',          line: 'mrt_blue', lat: 13.7380, lng: 100.5609 },
  { id: 'mrt_bl20', name: 'MRT เพชรบุรี',          line: 'mrt_blue', lat: 13.7508, lng: 100.5604 },
  { id: 'mrt_bl21', name: 'MRT ศูนย์วัฒนธรรม',    line: 'mrt_blue', lat: 13.7590, lng: 100.5683 },
  { id: 'mrt_bl22', name: 'MRT ห้วยขวาง',          line: 'mrt_blue', lat: 13.7715, lng: 100.5717 },
  { id: 'mrt_bl23', name: 'MRT สุทธิสาร',          line: 'mrt_blue', lat: 13.7844, lng: 100.5681 },
  { id: 'mrt_bl24', name: 'MRT รัชดาภิเษก',        line: 'mrt_blue', lat: 13.7929, lng: 100.5664 },
  { id: 'mrt_bl25', name: 'MRT ลาดพร้าว',          line: 'mrt_blue', lat: 13.8033, lng: 100.5625 },
  { id: 'mrt_bl26', name: 'MRT พหลโยธิน',          line: 'mrt_blue', lat: 13.8131, lng: 100.5557 },
  { id: 'mrt_bl27', name: 'MRT สวนจตุจักร',        line: 'mrt_blue', lat: 13.8031, lng: 100.5540 },
  { id: 'mrt_bl28', name: 'MRT กำแพงเพชร',         line: 'mrt_blue', lat: 13.8040, lng: 100.5497 },
  { id: 'mrt_bl29', name: 'MRT บางซื่อ',           line: 'mrt_blue', lat: 13.8055, lng: 100.5386 },
  { id: 'mrt_bl30', name: 'MRT เตาปูน',            line: 'mrt_blue', lat: 13.8074, lng: 100.5254 },
  { id: 'mrt_bl31', name: 'MRT บางโพ',             line: 'mrt_blue', lat: 13.8168, lng: 100.5157 },
  { id: 'mrt_bl32', name: 'MRT วงศ์สว่าง',         line: 'mrt_blue', lat: 13.8249, lng: 100.5047 },
  { id: 'mrt_bl33', name: 'MRT บางรัก',            line: 'mrt_blue', lat: 13.8160, lng: 100.4897 },
  { id: 'mrt_bl34', name: 'MRT สายไหม',            line: 'mrt_blue', lat: 13.8127, lng: 100.4793 },
  { id: 'mrt_bl35', name: 'MRT พักเกษม',           line: 'mrt_blue', lat: 13.8065, lng: 100.4714 },
  { id: 'mrt_bl36', name: 'MRT บางใหญ่',           line: 'mrt_blue', lat: 13.8400, lng: 100.4231 },

  // ─── MRT Purple Line (สายสีม่วง) ────────────────────────────────────────
  { id: 'mrt_pu01', name: 'MRT บางใหญ่ (สีม่วง)',  line: 'mrt_purple', lat: 13.8400, lng: 100.4231 },
  { id: 'mrt_pu02', name: 'MRT บางพลู',             line: 'mrt_purple', lat: 13.8354, lng: 100.4364 },
  { id: 'mrt_pu03', name: 'MRT บางรักใหญ่',         line: 'mrt_purple', lat: 13.8300, lng: 100.4487 },
  { id: 'mrt_pu04', name: 'MRT บางรักน้อย-ท่าอิฐ', line: 'mrt_purple', lat: 13.8252, lng: 100.4600 },
  { id: 'mrt_pu05', name: 'MRT ไทรม้า',             line: 'mrt_purple', lat: 13.8226, lng: 100.4768 },
  { id: 'mrt_pu06', name: 'MRT สะพานพระนั่งเกล้า', line: 'mrt_purple', lat: 13.8221, lng: 100.4902 },
  { id: 'mrt_pu07', name: 'MRT แยกนนทบุรี 1',      line: 'mrt_purple', lat: 13.8226, lng: 100.5015 },
  { id: 'mrt_pu08', name: 'MRT บางกระสอ',           line: 'mrt_purple', lat: 13.8209, lng: 100.5119 },
  { id: 'mrt_pu09', name: 'MRT ศูนย์ราชการนนทบุรี',line: 'mrt_purple', lat: 13.8193, lng: 100.5209 },
  { id: 'mrt_pu10', name: 'MRT กระทรวงสาธารณสุข',  line: 'mrt_purple', lat: 13.8167, lng: 100.5296 },
  { id: 'mrt_pu11', name: 'MRT แยกติวานนท์',        line: 'mrt_purple', lat: 13.8082, lng: 100.5249 },
  { id: 'mrt_pu12', name: 'MRT วงศ์สว่าง (สีม่วง)', line: 'mrt_purple', lat: 13.8249, lng: 100.5047 },
  { id: 'mrt_pu13', name: 'MRT เตาปูน (สีม่วง)',   line: 'mrt_purple', lat: 13.8074, lng: 100.5254 },
  { id: 'mrt_pu14', name: 'MRT บางซ่อน',            line: 'mrt_purple', lat: 13.8248, lng: 100.5132 },
  { id: 'mrt_pu15', name: 'MRT บางโพ (สีม่วง)',     line: 'mrt_purple', lat: 13.8168, lng: 100.5157 },
  { id: 'mrt_pu16', name: 'MRT คลองบางไผ่',         line: 'mrt_purple', lat: 13.8460, lng: 100.4069 },

  // ─── MRT Yellow Line (สายสีเหลือง) ─────────────────────────────────────
  { id: 'mrt_yl01', name: 'MRT ลาดพร้าว (สีเหลือง)', line: 'mrt_yellow', lat: 13.8033, lng: 100.5625 },
  { id: 'mrt_yl02', name: 'MRT ภาวนา',              line: 'mrt_yellow', lat: 13.7961, lng: 100.5701 },
  { id: 'mrt_yl03', name: 'MRT โชคชัย 4',           line: 'mrt_yellow', lat: 13.7897, lng: 100.5767 },
  { id: 'mrt_yl04', name: 'MRT พหลโยธิน (สีเหลือง)',line: 'mrt_yellow', lat: 13.7839, lng: 100.5836 },
  { id: 'mrt_yl05', name: 'MRT ลาดพร้าว 71',        line: 'mrt_yellow', lat: 13.7777, lng: 100.5902 },
  { id: 'mrt_yl06', name: 'MRT ลาดพร้าว 83',        line: 'mrt_yellow', lat: 13.7724, lng: 100.5978 },
  { id: 'mrt_yl07', name: 'MRT ลาดพร้าว 101',       line: 'mrt_yellow', lat: 13.7668, lng: 100.6032 },
  { id: 'mrt_yl08', name: 'MRT บางกะปิ',             line: 'mrt_yellow', lat: 13.7608, lng: 100.6115 },
  { id: 'mrt_yl09', name: 'MRT แยกลำสาลี',          line: 'mrt_yellow', lat: 13.7550, lng: 100.6183 },
  { id: 'mrt_yl10', name: 'MRT ศรีกรีฑา',            line: 'mrt_yellow', lat: 13.7465, lng: 100.6258 },
  { id: 'mrt_yl11', name: 'MRT หัวหมาก',             line: 'mrt_yellow', lat: 13.7394, lng: 100.6351 },
  { id: 'mrt_yl12', name: 'MRT ราษฎร์พัฒนา',        line: 'mrt_yellow', lat: 13.7251, lng: 100.6397 },
  { id: 'mrt_yl13', name: 'MRT สวนหลวง ร.9',        line: 'mrt_yellow', lat: 13.7144, lng: 100.6437 },
  { id: 'mrt_yl14', name: 'MRT ศรีนุช',              line: 'mrt_yellow', lat: 13.7042, lng: 100.6424 },
  { id: 'mrt_yl15', name: 'MRT ศรีเอี่ยม',           line: 'mrt_yellow', lat: 13.6956, lng: 100.6389 },
  { id: 'mrt_yl16', name: 'MRT ศรีด่าน',             line: 'mrt_yellow', lat: 13.6852, lng: 100.6364 },
  { id: 'mrt_yl17', name: 'MRT ศรีแบริ่ง',           line: 'mrt_yellow', lat: 13.6756, lng: 100.6335 },
  { id: 'mrt_yl18', name: 'MRT ศรีลาซาล',            line: 'mrt_yellow', lat: 13.6644, lng: 100.6285 },
  { id: 'mrt_yl19', name: 'MRT สำโรง (สีเหลือง)',   line: 'mrt_yellow', lat: 13.6540, lng: 100.6153 },

  // ─── MRT Pink Line (สายสีชมพู) ──────────────────────────────────────────
  { id: 'mrt_pk01', name: 'MRT ศูนย์ราชการเฉลิมพระเกียรติ', line: 'mrt_pink', lat: 13.8803, lng: 100.5696 },
  { id: 'mrt_pk02', name: 'MRT ทีโอที',              line: 'mrt_pink', lat: 13.8747, lng: 100.5595 },
  { id: 'mrt_pk03', name: 'MRT แยก 4 ถนน (สีชมพู)', line: 'mrt_pink', lat: 13.8726, lng: 100.5470 },
  { id: 'mrt_pk04', name: 'MRT วัดพระศรีมหาธาตุ (สีชมพู)',line:'mrt_pink', lat:13.8665, lng:100.5411 },
  { id: 'mrt_pk05', name: 'MRT ราษฎร์นิยม',          line: 'mrt_pink', lat: 13.8637, lng: 100.5299 },
  { id: 'mrt_pk06', name: 'MRT แยกติวานนท์ (สีชมพู)',line: 'mrt_pink', lat: 13.8636, lng: 100.5184 },
  { id: 'mrt_pk07', name: 'MRT สนามบินน้ำ',          line: 'mrt_pink', lat: 13.8669, lng: 100.4990 },
  { id: 'mrt_pk08', name: 'MRT สามัคคี',              line: 'mrt_pink', lat: 13.8634, lng: 100.4859 },
  { id: 'mrt_pk09', name: 'MRT กรมชลประทาน',         line: 'mrt_pink', lat: 13.8600, lng: 100.4736 },
  { id: 'mrt_pk10', name: 'MRT บางใหญ่ (สีชมพู)',    line: 'mrt_pink', lat: 13.8551, lng: 100.4560 },
  { id: 'mrt_pk11', name: 'MRT มีนบุรี',              line: 'mrt_pink', lat: 13.8146, lng: 100.7171 },
  { id: 'mrt_pk12', name: 'MRT มิตรไมตรี',            line: 'mrt_pink', lat: 13.8125, lng: 100.7038 },
  { id: 'mrt_pk13', name: 'MRT วัชรพล',               line: 'mrt_pink', lat: 13.8173, lng: 100.6897 },
  { id: 'mrt_pk14', name: 'MRT นวลจันทร์',            line: 'mrt_pink', lat: 13.8251, lng: 100.6759 },
  { id: 'mrt_pk15', name: 'MRT บึงกุ่ม',              line: 'mrt_pink', lat: 13.8241, lng: 100.6602 },
  { id: 'mrt_pk16', name: 'MRT นวมินทร์ 110',         line: 'mrt_pink', lat: 13.8255, lng: 100.6464 },
  { id: 'mrt_pk17', name: 'MRT นวมินทร์',             line: 'mrt_pink', lat: 13.8357, lng: 100.6299 },
  { id: 'mrt_pk18', name: 'MRT รามอินทรา 3',          line: 'mrt_pink', lat: 13.8465, lng: 100.6149 },
  { id: 'mrt_pk19', name: 'MRT รามอินทรา 40',         line: 'mrt_pink', lat: 13.8561, lng: 100.5980 },
  { id: 'mrt_pk20', name: 'MRT รามอินทรา 83',         line: 'mrt_pink', lat: 13.8626, lng: 100.5812 },
  { id: 'mrt_pk21', name: 'MRT มหาวิทยาลัยเกษตร (สีชมพู)', line:'mrt_pink', lat:13.8626, lng:100.5763},

  // ─── Airport Rail Link / ARL (สายสีแดงเข้ม) ───────────────────────────
  { id: 'arl_a1',  name: 'ARL พญาไท',              line: 'arl', lat: 13.7604, lng: 100.5340 },
  { id: 'arl_a2',  name: 'ARL ราชปรารภ',           line: 'arl', lat: 13.7547, lng: 100.5451 },
  { id: 'arl_a3',  name: 'ARL มักกะสัน',           line: 'arl', lat: 13.7524, lng: 100.5585 },
  { id: 'arl_a4',  name: 'ARL รามคำแหง',           line: 'arl', lat: 13.7538, lng: 100.5924 },
  { id: 'arl_a5',  name: 'ARL หัวหมาก',            line: 'arl', lat: 13.7394, lng: 100.6351 },
  { id: 'arl_a6',  name: 'ARL บ้านทับช้าง',        line: 'arl', lat: 13.7226, lng: 100.6671 },
  { id: 'arl_a7',  name: 'ARL ลาดกระบัง',          line: 'arl', lat: 13.7228, lng: 100.7229 },
  { id: 'arl_a8',  name: 'ARL สุวรรณภูมิ',         line: 'arl', lat: 13.6990, lng: 100.7503 },

  // ─── SRT Red Line North (สายสีแดงเข้ม รังสิต) ─────────────────────────
  { id: 'srt_r01', name: 'SRT กรุงเทพอภิวัฒน์',   line: 'srt_red_north', lat: 13.8055, lng: 100.5386 },
  { id: 'srt_r02', name: 'SRT จตุจักร',            line: 'srt_red_north', lat: 13.8138, lng: 100.5468 },
  { id: 'srt_r03', name: 'SRT หลักสี่',            line: 'srt_red_north', lat: 13.8639, lng: 100.5781 },
  { id: 'srt_r04', name: 'SRT การเคหะดอนเมือง',   line: 'srt_red_north', lat: 13.8956, lng: 100.5854 },
  { id: 'srt_r05', name: 'SRT ดอนเมือง',           line: 'srt_red_north', lat: 13.9147, lng: 100.5897 },
  { id: 'srt_r06', name: 'SRT หลักหก',             line: 'srt_red_north', lat: 13.9568, lng: 100.6116 },
  { id: 'srt_r07', name: 'SRT รังสิต',             line: 'srt_red_north', lat: 14.0000, lng: 100.6219 },

  // ─── SRT Red Line East (สายสีแดงอ่อน ตะวันออก) ────────────────────────
  { id: 'srt_e01', name: 'SRT มักกะสัน (สีแดง)',  line: 'srt_red_east', lat: 13.7524, lng: 100.5585 },
  { id: 'srt_e02', name: 'SRT สุวินทวงศ์',        line: 'srt_red_east', lat: 13.8188, lng: 100.7186 },
  { id: 'srt_e03', name: 'SRT ฉะเชิงเทรา',        line: 'srt_red_east', lat: 13.6919, lng: 101.0758 },
];

// ─── Haversine Distance (km) ────────────────────────────────────────────────
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * หาสถานีรถไฟฟ้าใกล้เคียงจากพิกัด
 * @param {number} lat
 * @param {number} lng
 * @param {number} maxKm - ระยะสูงสุด (default 3 กม.)
 * @returns Array of { ...station, distance, lineLabel, lineColor, type }
 */
export function findNearbyTransit(lat, lng, maxKm = 3) {
  return TRAIN_STATIONS
    .map(s => ({
      ...s,
      distance: haversineKm(lat, lng, s.lat, s.lng),
      lineLabel: TRAIN_LINES[s.line]?.label || s.line,
      lineColor: TRAIN_LINES[s.line]?.color || '#999',
      type:      TRAIN_LINES[s.line]?.type  || 'bts',
    }))
    .filter(s => s.distance <= maxKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * หาสถานีใกล้ที่สุดแยกตาม type (bts / mrt / arl)
 * คืนค่า { bts: {...}, mrt: {...}, arl: {...} }
 */
export function findNearestByType(lat, lng, maxKm = 5) {
  const all = findNearbyTransit(lat, lng, maxKm);
  const result = {};
  for (const t of ['bts', 'mrt', 'arl']) {
    result[t] = all.find(s => s.type === t) || null;
  }
  return result;
}
