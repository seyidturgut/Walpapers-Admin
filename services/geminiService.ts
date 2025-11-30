
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiMetadataResponse, AppProfile } from "../types";

/**
 * Retrieves the API Key from environment variables or local storage.
 */
export const getApiKey = (): string => {
  // 1. Check process.env (Build time / Server side)
  if (process.env.API_KEY) return process.env.API_KEY;
  
  // 2. Check localStorage (Client side manual entry)
  const storedKey = localStorage.getItem('gemini_api_key');
  return storedKey || '';
};

const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Please add it in Settings.");
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
      description: "A warm, engaging description suitable for the app audience.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5-7 relevant tags for search functionality.",
    },
  },
  required: ["title", "description", "tags"],
};

/**
 * Generates metadata for an image or a video frame, respecting the App Context.
 */
export const generateMediaMetadata = async (
  base64Data: string,
  mimeType: string,
  appContext?: AppProfile
): Promise<AiMetadataResponse> => {
  const ai = getAiClient();

  // Clean the base64 string if it contains the header
  const cleanBase64 = base64Data.replace(/^data:(image|video)\/\w+;base64,/, "");

  // Dynamic context based on the App
  const appName = appContext?.name || "General Wallpaper App";
  const appDesc = appContext?.description || "mobile wallpapers";
  
  const promptText = `Analyze this image. It is content for an Android application named '${appName}' which is about: ${appDesc}. Generate a creative title, a short description, and relevant tags in JSON format that fits this specific app's theme.`;

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
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: `You are a content manager for '${appName}'. Your tone should match the app's niche (e.g., funny for memes, serene for nature, cute for pets).`,
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
 * Generates a creative prompt for image or video generation based on App Context.
 */
export const generateCreativePrompt = async (type: 'image' | 'video', appContext?: AppProfile): Promise<string> => {
  const ai = getAiClient();
  
  const appName = appContext?.name || "Mobile Wallpaper";
  const contextKeywords = appContext?.aiContext || "aesthetic, beautiful, 4k";

  const systemInstruction = type === 'image' 
    ? `You are an expert prompt engineer for AI Image Generators. The user is managing an app called '${appName}' focusing on: ${contextKeywords}. Create a single, highly detailed, artistic, and visually stunning prompt for a mobile wallpaper that fits this specific app theme perfectly. Keep it under 60 words. Output ONLY the prompt text.`
    : `You are an expert prompt engineer for AI Video Generators. The user is managing an app called '${appName}' focusing on: ${contextKeywords}. Create a single, descriptive prompt for a short, looping vertical video that fits this specific app theme. Focus on movement and atmosphere. Keep it under 60 words. Output ONLY the prompt text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a random, creative prompt for the '${appName}' app now.`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.2, // High creativity
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating creative prompt:", error);
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
  const enhancedPrompt = `Ultra-realistic 2K mobile wallpaper (9:16 vertical): ${prompt}. Masterpiece, hyper-detailed, cinematic lighting, sharp focus, 8k resolution.`;

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
  const apiKey = getApiKey();

  // Enhance prompt specifically for short video loops
  const enhancedPrompt = `A short, looping cinematic vertical video: ${prompt}. High quality, slow motion, photorealistic, suitable for phone live wallpaper.`;

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
