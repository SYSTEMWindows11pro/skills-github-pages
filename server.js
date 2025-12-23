const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ==================== 修改为 D 盘存储路径 ====================
// 路径说明：D盘下的 file-uploads 文件夹，文件会按类型存到 files/videos 子目录
const WINDOWS_UPLOAD_DIR = 'D:\\file-uploads';

// 自动创建目录（支持多级子目录，无需手动创建）
if (!fs.existsSync(WINDOWS_UPLOAD_DIR)) {
  fs.mkdirSync(WINDOWS_UPLOAD_DIR, { recursive: true });
  console.log(`✅ 已在 D 盘创建存储目录: ${WINDOWS_UPLOAD_DIR}`);
}

// ==================== multer 存储配置 ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按文件类型分目录：普通文件存 files，视频存 videos
    const subDir = file.fieldname === 'videos' ? 'videos' : 'files';
    const finalDir = path.join(WINDOWS_UPLOAD_DIR, subDir);
    fs.mkdirSync(finalDir, { recursive: true });
    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    // 文件名规则：时间戳-原文件名（防重复，兼容中文）
    const safeName = `${Date.now()}-${file.originalname.replace(/[\/:*?"<>|]/g, '-')}`;
    cb(null, safeName);
  }
});

// 限制：最多150个文件/25个视频，单文件50MB（视频放宽到100MB）
const uploadFiles = multer({
  storage: storage,
  limits: { files: 150, fileSize: 50 * 1024 * 1024 }
}).array('files', 150);

const uploadVideos = multer({
  storage: storage,
  limits: { files: 25, fileSize: 100 * 1024 * 1024 }
}).array('videos', 25);

// ==================== 中间件 ====================
app.use(cors());
app.use(express.static('public')); // 托管前端页面
app.use('/uploads', express.static(WINDOWS_UPLOAD_DIR)); // 暴露下载路径

// ==================== 接口 ====================
// 1. 批量文件上传接口
app.post('/api/upload/files', (req, res) => {
  uploadFiles(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, msg: err.message });
    const fileList = req.files.map(file => ({
      name: file.originalname,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      downloadUrl: `http://localhost:${PORT}/uploads/files/${path.basename(file.path)}`
    }));
    res.json({ success: true, msg: `上传成功 ${fileList.length} 个文件`, files: fileList });
  });
});

// 2. 批量视频上传接口
app.post('/api/upload/videos', (req, res) => {
  uploadVideos(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, msg: err.message });
    const videoList = req.files.map(file => ({
      name: file.originalname,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      downloadUrl: `http://localhost:${PORT}/uploads/videos/${path.basename(file.path)}`
    }));
    res.json({ success: true, msg: `上传成功 ${videoList.length} 个视频`, videos: videoList });
  });
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在: http://localhost:${PORT}`);
  console.log(`📁 D 盘存储位置: ${WINDOWS_UPLOAD_DIR}`);
  console.log(`🔗 访问前端页面: http://localhost:${PORT}`);
});
