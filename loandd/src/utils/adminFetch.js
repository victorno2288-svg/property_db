/**
 * adminFetch.js
 * Wrapper สำหรับ fetch ทุก Admin API:
 * - ใส่ Authorization header อัตโนมัติ
 * - ถ้า server ตอบ 401 หรือ 403 → ล้าง token แล้ว redirect ไป /admin ทันที (auto-logout)
 */

const BASE_URL = '';

const adminFetch = async (path, options = {}) => {
  const token = localStorage.getItem('adminToken');

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // Token หมดอายุหรือไม่มีสิทธิ์ → auto-logout
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin';
    throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }

  return res;
};

export { BASE_URL };
export default adminFetch;
