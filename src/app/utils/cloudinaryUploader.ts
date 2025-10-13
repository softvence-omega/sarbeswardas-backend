import multer, { StorageEngine } from "multer";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import path from "path";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Multer Configuration
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });

// Cloudinary Upload Function
export const uploadToCloudinary = async (
  filePath: string
): Promise<{ url: string; public_id: string }> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
    });

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);

    // Cleanup on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    throw new Error("Cloudinary upload failed");
  }
};

//  Cloudinary Delete Function
export const deleteFromCloudinary = async (publicId: string): Promise<{ success: boolean }> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log("✅ Image deleted from Cloudinary:", publicId);
    return { success: true };
  } catch (error) {
    console.error("❌ Cloudinary deletion failed:", error);
    return { success: false };
  }
};
