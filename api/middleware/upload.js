import multer from "multer";

const storage = multer.memoryStorage(); // lưu trong RAM
const upload = multer({ storage });

export default upload;
