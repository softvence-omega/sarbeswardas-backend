"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const streamifier_1 = __importDefault(require("streamifier"));
// Cloudinary Configuration
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Use memory storage (no writing to disk)
exports.upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Accepts either a file path or a Multer file object
const uploadToCloudinary = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result;
        if (typeof file === "string") {
            // case 1️⃣: local file path (used by AI or generated images)
            result = yield cloudinary_1.v2.uploader.upload(file, { folder: "uploads" });
            // delete local file if exists
            if (fs_1.default.existsSync(file)) {
                yield fs_1.default.promises.unlink(file);
            }
        }
        else {
            // case 2️⃣: multer memory buffer (used by routes)
            result = yield new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: "uploads" }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                streamifier_1.default.createReadStream(file.buffer).pipe(uploadStream);
            });
        }
        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    }
    catch (error) {
        console.error("❌ Cloudinary upload failed:", error);
        throw new Error("Cloudinary upload failed");
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
// Cloudinary Delete Function
const deleteFromCloudinary = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield cloudinary_1.v2.uploader.destroy(publicId);
        console.log("✅ Image deleted from Cloudinary:", publicId);
        return { success: true };
    }
    catch (error) {
        console.error("❌ Cloudinary deletion failed:", error);
        return { success: false };
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
