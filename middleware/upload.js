import multer from "multer";
import { promises as fs } from "fs";
import path from "path";

// Ensure the 'uploads' directory exists
const ensureUploadsDir = async () => {
  const uploadDir = path.resolve("uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error ensuring uploads directory exists:", error);
    process.exit(1); // Exit if we can't create the upload directory
  }
};

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Files will be stored in the 'uploads/' directory
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
