/**
 * authedFetch — fetch wrapper ที่จัดการ 401/403 อัตโนมัติ
 * - ถ้า response เป็น 401 หรือ 403 → ลบ token + redirect ไป /login
 * - ใช้แทน fetch() ปกติในทุกที่ที่ต้องการ auth
 *
 * Usage:
 *   import authedFetch from '../utils/authedFetch';
 *   const res = await authedFetch('/api/users/profile');
 */

const authedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Token หมดอายุหรือไม่ถูกต้อง → logout อัตโนมัติ
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // redirect ไป login แล้ว reload เพื่อเคลียร์ state
    window.location.href = '/login';
    return response; // return ก่อนที่ caller จะใช้ result ต่อ
  }

  return response;
};

export default authedFetch;
