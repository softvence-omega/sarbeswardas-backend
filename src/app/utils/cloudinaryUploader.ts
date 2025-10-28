import multer from "multer";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import streamifier from "streamifier";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Use memory storage (no writing to disk)
export const upload = multer({ storage: multer.memoryStorage() });

// Accepts either a file path or a Multer file object
export const uploadToCloudinary = async (
  file: string | Express.Multer.File
): Promise<{ url: string; public_id: string }> => {
  try {
    let result: UploadApiResponse;

    if (typeof file === "string") {
      // case 1️⃣: local file path (used by AI or generated images)
      result = await cloudinary.uploader.upload(file, { folder: "uploads" });

      // delete local file if exists
      if (fs.existsSync(file)) {
        await fs.promises.unlink(file);
      }
    } else {
      // case 2️⃣: multer memory buffer (used by routes)
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "uploads" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    throw new Error("Cloudinary upload failed");
  }
};

// Cloudinary Delete Function
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
