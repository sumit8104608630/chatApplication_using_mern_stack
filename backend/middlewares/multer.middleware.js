import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname manually in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve(__dirname, "../public/temp")); // Use __dirname correctly
    },
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage
});

export { upload };
