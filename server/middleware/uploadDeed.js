const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const deedDir = path.join(__dirname, '..', 'uploads', 'deeds');
if (!fs.existsSync(deedDir)) fs.mkdirSync(deedDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, deedDir),
  filename:    (req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = `deed_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(
    path.extname(file.originalname).toLowerCase()
  );
  ok ? cb(null, true) : cb(new Error('รองรับเฉพาะ JPG, PNG, WEBP, PDF'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });
