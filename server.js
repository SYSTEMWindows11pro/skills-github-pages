const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // 解决跨域问题

const app = express();
// 1. 适配Render的环境端口，本地测试用3000
const PORT = process.env.PORT || 3000;
// 2. 使用Linux兼容的相对路径，替代Windows的D盘路径
const UPLOAD_DIR = path.join(__dirname, 'file-uploads');

// 启用跨域和静态资源托管（关键：托管根目录的index.html和图片）
app.use(cors());
app.use(express.static(__dirname));

// 自动创建上传目录（Linux环境兼容）
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`已在 ${UPLOAD_DIR} 创建存储目录`);
}

// 3. multer存储配置（适配相对路径）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'files';
    if (file.fieldname === 'videos') subdir = 'videos';
    const finalDir = path.join(UPLOAD_DIR, subdir);
    fs.mkdirSync(finalDir, { recursive: true });
    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    // 文件名处理：时间戳+原文件名（移除特殊字符）
    const safeName = file.originalname.replace(/[\/:*?"<>|]/g, '');
    const fileName = `${Date.now()}-${safeName}`;
    cb(null, fileName);
  }
});

// multer上传限制配置
const uploadFiles = multer({
  storage: storage,
  limits: { files: 150, fileSize: 50 * 1024 * 1024 }
}).array('files', 150);

const uploadVideos = multer({
  storage: storage,
  limits: { files: 25, fileSize: 100 * 1024 * 1024 }
}).array('videos', 25);

// 4. 根路径路由（关键：返回index.html，解决Cannot GET /）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 上传接口（保留原有功能）
app.post('/upload/files', (req, res) => {
  uploadFiles(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, files: req.files });
  });
});

app.post('/upload/videos', (req, res) => {
  uploadVideos(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, files: req.files });
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`服务运行在端口 ${PORT}`);
  console.log(`公网访问地址：https://skills-github-pages-ddje.onrender.com`);
});
