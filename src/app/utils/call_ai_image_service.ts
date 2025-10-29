import axios from "axios";
import { AppError } from "./app_error";

interface AIImageRequest {
  session_id: string;
  prompt: string;
  size?: string;
  compress?: boolean;
  max_size_kb?: number;
}

interface AIImageResponse {
  session_id: string;
  url: string; // base64 image string
  adapter: string;
  compressed: boolean;
  original_size_kb: number;
  compressed_size_kb: number;
}

export const call_ai_image_service = async (data: AIImageRequest): Promise<AIImageResponse> => {
  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/image_generation`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_IMAGE_API_KEY}`,
        },
        // timeout: 60000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("❌ Error calling AI Image API:", error?.response?.data || error?.message || error);
    
    // Parse the error detail
    const errorDetail = error?.response?.data?.detail || error?.message || "Unknown error";
    const statusCode = error?.response?.status || 500;

    // Check if it's a text generation prompt issue
    if (errorDetail.includes("Could not parse image URL") || 
        errorDetail.includes("Gemini response") ||
        errorDetail.toLowerCase().includes("text")) {
      throw new AppError(
        400,
        "Your prompt seems to be asking for text generation. Please describe a visual scene instead. Example: 'a cat in a business suit' instead of 'write about a cat'."
      );
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new AppError(
        408,
        "Image generation is taking too long. Please try again with a simpler prompt."
      );
    }

    // Handle rate limiting
    if (statusCode === 429) {
      throw new AppError(
        429,
        "Too many requests. Please wait a moment before trying again."
      );
    }

    // Handle authentication issues
    if (statusCode === 401 || statusCode === 403) {
      throw new AppError(
        503,
        "AI service authentication failed. Please contact support."
      );
    }

    // Generic AI service error
    throw new AppError(
      502,
      "AI image generation service is temporarily unavailable. Please try again later."
    );
  }
};


// Add logging before the request
// export const call_ai_image_service = async (data: AIImageRequest): Promise<AIImageResponse> => {
//   const url = `${process.env.AI_SERVICE_URL}/image_generation`;
  
//   console.log("🔍 Calling URL:", url);
//   console.log("🔍 Request payload:", JSON.stringify(data, null, 2));
  
//   try {
//     const response = await axios.post(url, data, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.AI_IMAGE_API_KEY}`,
//       },
//       timeout: 60000,
//     });

//     console.log("✅ Response:", response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error("❌ Full error:", {
//       status: error?.response?.status,
//       statusText: error?.response?.statusText,
//       data: error?.response?.data,
//       url: error?.config?.url,
//     });
//     throw new Error("AI image generation failed");
//   }
// };
