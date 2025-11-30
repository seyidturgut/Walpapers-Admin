import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiMetadataResponse } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy, short title for the wallpaper or video.",
    },
    description: {
      type: Type.STRING,
      description: "A warm, engaging description of the cat content suitable for an app.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5-7 relevant tags for search functionality (e.g., 'fluffy', 'sleeping', 'funny').",
    },
  },
  required: ["title", "description", "tags"],
};

/**
 * Generates metadata for an image or a video frame.
 */
export const generateMediaMetadata = async (
  base64Data: string,
  mimeType: string
): Promise<AiMetadataResponse> => {
  const ai = getAiClient();

  // Clean the base64 string if it contains the header
  const cleanBase64 = base64Data.replace(/^data:(image|video)\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image. It is content for a 'Cat Wallpaper & Video' Android application. Generate a creative title, a short description, and relevant tags in JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are a content manager for a popular cat lover app. Your tone is fun, lighthearted, and descriptive.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI.");
    }

    return JSON.parse(text) as AiMetadataResponse;
  } catch (error) {
    console.error("Error generating metadata:", error);
    throw error;
  }
};

/**
 * Generates a wallpaper image using Gemini 3 Pro Image (Banana Pro).
 * Enforces 9:16 aspect ratio for mobile devices.
 */
export const generateWallpaper = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  
  // Enhance prompt for maximum quality 2K generation
  const enhancedPrompt = `Ultra-realistic 2K mobile wallpaper (9:16 vertical) of: ${prompt}. Masterpiece, hyper-detailed, cinematic lighting, ray tracing, sharp focus, 8k resolution, high dynamic range, professional photography.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: enhancedPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16", // Perfect for mobile wallpapers
          imageSize: "2K"      // 2K resolution
        },
      },
    });

    // Parse response to find the image part
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating wallpaper:", error);
    throw error;
  }
};

/**
 * Generates a short MP4 video wallpaper using Veo.
 */
export const generateVideoWallpaper = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const apiKey = process.env.API_KEY;

  // Enhance prompt specifically for short video loops
  const enhancedPrompt = `A short, looping cinematic vertical video of: ${prompt}. High quality, slow motion, photorealistic, suitable for phone live wallpaper.`;

  try {
    console.log("Starting video generation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: enhancedPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    // Poll for completion
    while (!operation.done) {
      console.log("Waiting for video generation...");
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
      throw new Error("Video generation completed but no URI returned.");
    }

    // Fetch the video content to convert to Base64 (for persistence in this demo app)
    // IMPORTANT: Must append API key to download
    const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
    if (!videoResponse.ok) {
      throw new Error("Failed to download generated video.");
    }
    
    const blob = await videoResponse.blob();
    return await blobToBase64(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};