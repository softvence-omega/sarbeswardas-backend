import axios from "axios";

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
    console.log(data)
  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/image_generation`, 
      data,
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${process.env.AI_IMAGE_API_KEY}`, // if needed
    //     },
    //     timeout: 60000, // 1 minute
    //   }
    );

    return response.data;
  } catch (error: any) {
    console.error("❌ Error calling AI Image API:", error?.message || error);
    throw new Error("AI image generation failed");
  }
};
