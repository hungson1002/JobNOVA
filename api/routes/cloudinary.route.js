import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();

// Cấu hình multer để chấp nhận cả ảnh và video
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // Chấp nhận ảnh
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    // Chấp nhận video
    else if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Không hỗ trợ định dạng file này!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // Tăng lên 500MB cho mỗi file
        files: 20 // Cho phép upload tối đa 20 file cùng lúc
    }
});

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Route upload file đơn lẻ
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file để upload' });
        }

        let result;
        if (req.file.mimetype.startsWith('image/')) {
            result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'images',
                resource_type: 'image'
            });
        } else if (req.file.mimetype.startsWith('video/')) {
            result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'videos',
                resource_type: 'video',
                chunk_size: 10000000, // Tăng chunk size lên 10MB
                eager: [
                    { format: "mp4", quality: "auto" }
                ]
        });
        }

        // Xóa file tạm sau khi upload
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            type: req.file.mimetype.startsWith('image/') ? 'image' : 'video'
        });
    } catch (error) {
        console.error('Lỗi upload file:', error);
        res.status(500).json({ message: 'Lỗi khi upload file' });
    }
});

// Route upload nhiều file (ảnh hoặc video)
router.post('/upload-multiple', upload.array('files', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một file để upload' });
        }

        const uploadPromises = req.files.map(file => {
            const options = {
                folder: file.mimetype.startsWith('image/') ? 'images' : 'videos',
                resource_type: file.mimetype.startsWith('image/') ? 'image' : 'video'
            };

            if (file.mimetype.startsWith('video/')) {
                options.chunk_size = 10000000; // Tăng chunk size lên 10MB
                options.eager = [
                    { format: "mp4", quality: "auto" }
                ];
            }

            return cloudinary.uploader.upload(file.path, options);
        });

        const results = await Promise.all(uploadPromises);

        // Xóa các file tạm sau khi upload
        req.files.forEach(file => {
            fs.unlinkSync(file.path);
        });

        res.json({
            success: true,
            files: results.map((result, index) => ({
                fileUrl: result.secure_url,
                publicId: result.public_id,
                type: req.files[index].mimetype.startsWith('image/') ? 'image' : 'video'
            }))
        });
    } catch (error) {
        console.error('Lỗi upload nhiều file:', error);
        res.status(500).json({ message: 'Lỗi khi upload nhiều file' });
    }
});

// Route xóa file
router.delete('/delete/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'auto' // Tự động phát hiện loại resource (ảnh hoặc video)
        });
        res.json({
            success: true,
            message: 'Xóa file thành công',
            result
        });
    } catch (error) {
        console.error('Lỗi xóa file:', error);
        res.status(500).json({ message: 'Lỗi khi xóa file' });
    }
});

export default router;
