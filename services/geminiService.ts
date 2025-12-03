
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
    ? `You are an expert prompt engineer for AI Image Generators. The user is managing an app called '${appName}' focusing on: ${contextKeywords}. Create a single, highly detailed, artistic, and visually stunning prompt for a mobile wallpaper that fits this specific app theme perfectly. The prompt should explicitly ask for 4K resolution, sharp details, and best quality. Keep it under 60 words. Output ONLY the prompt text.`
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
 * Enforces 9:16 aspect ratio for mobile devices with 4K resolution.
 */
export const generateWallpaper = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  
  // Enhance prompt for maximum quality 4K generation
  const enhancedPrompt = `Ultra-realistic 4K mobile wallpaper (9:16 vertical): ${prompt}. Masterpiece, hyper-detailed, cinematic lighting, sharp focus, 8k resolution, raw photo quality.`;

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
          imageSize: "4K"      // 4K resolution (Highest available)
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
 * Generates a wallpaper using Flux (via Pollinations) with Gemini as Prompt Engineer.
 * Configured for Vertical 4K (2160x3840).
 */
export const generateFluxWallpaper = async (userRawInput: string): Promise<string> => {
  const ai = getAiClient();
  
  try {
    // 1. Rewrite Prompt using Gemini
    const promptResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rewrite this raw input into a highly detailed, English text-to-image prompt suitable for Stable Diffusion/Flux models. Input: "${userRawInput}".`,
      config: {
        systemInstruction: "You are an expert Prompt Engineer for Flux.1. Your goal is to take user input (which might be in Turkish or simple English) and output a single, highly descriptive, artistic, English prompt. Include lighting, style, and mood keywords. Emphasize '4K resolution', 'highly detailed', 'vertical wallpaper'. Return ONLY the raw prompt text.",
      }
    });

    const enhancedPrompt = promptResponse.text;
    if (!enhancedPrompt) throw new Error("Failed to enhance prompt.");

    console.log("Flux Enhanced Prompt:", enhancedPrompt);

    // 2. Call Pollinations API
    // Vertical 4K Resolution: 2160 x 3840
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=2160&height=3840&model=flux&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

    const imageResponse = await fetch(pollinationsUrl);
    if (!imageResponse.ok) throw new Error("Pollinations API request failed.");

    const imageBlob = await imageResponse.blob();

    // 3. Convert to Base64
    return await blobToBase64(imageBlob);

  } catch (error) {
    console.error("Error generating Flux wallpaper:", error);
    throw error;
  }
};


/**
 * Generates Image using Grok (x-ai/grok-4.1-fast:free via OpenRouter) for Prompting + Pollinations (Flux) for Image.
 * Configured for Vertical 4K.
 */
export const generateImageWithGrok = async (userRawInput: string): Promise<string> => {
  const openRouterApiKey = localStorage.getItem('openrouter_api_key');
  
  if (!openRouterApiKey) {
    throw new Error("OpenRouter API Key eksik. Lütfen ayarlardan ekleyin.");
  }

  try {
    // Step 1: Prompt Enhancement via Grok
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Purrfect Admin"
      },
      body: JSON.stringify({
        model: "x-ai/grok-4.1-fast:free",
        messages: [
          {
            role: "system",
            content: "You are an expert AI art prompter. Take the user's input (which may be in Turkish or simple terms) and expand it into a detailed, high-quality, English text-to-image prompt suitable for FLUX or Stable Diffusion. Focus on visual details, lighting, and style. The image will be generated in 4K Vertical format, so describe it accordingly. Output ONLY the raw prompt text, no introductions or explanations."
          },
          {
            role: "user",
            content: userRawInput
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok/OpenRouter API Error Details:", errorText);
      throw new Error(`Grok Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content;

    if (!enhancedPrompt) {
      throw new Error("Failed to generate prompt from Grok. Response was empty.");
    }
    
    console.log("Grok Enhanced Prompt:", enhancedPrompt);

    // Step 2: Image Generation via Pollinations (Mobile Ratio 9:16 4K)
    // 2160x3840 used for high quality mobile wallpaper
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const randomSeed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=2160&height=3840&model=flux&seed=${randomSeed}&nologo=true`;

    const imageResponse = await fetch(pollinationsUrl);
    if (!imageResponse.ok) {
      throw new Error("Pollinations Generation Failed");
    }

    const imageBlob = await imageResponse.blob();
    
    // Step 3: Convert to Base64
    return await blobToBase64(imageBlob);

  } catch (error) {
    console.error("generateImageWithGrok error:", error);
    throw error;
  }
};


/**
 * NEW: Generates Image using Stable Diffusion 3 via Stability AI API.
 */
export const generateImageWithStability = async (userRawInput: string): Promise<string> => {
  const stabilityApiKey = localStorage.getItem('stability_api_key');
  const ai = getAiClient();

  if (!stabilityApiKey) {
    throw new Error("Stability AI API Key eksik. Lütfen ayarlardan ekleyin.");
  }

  try {
    // 1. Enhance Prompt with Gemini (Turkish -> English SD3 Prompt)
    const promptResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Rewrite this raw input into a highly detailed, English text-to-image prompt optimized for Stable Diffusion 3 (SD3). Input: "${userRawInput}".`,
        config: {
          systemInstruction: "You are an expert Prompt Engineer for SD3. Output a single, highly descriptive, artistic, English prompt suitable for a 9:16 mobile wallpaper. Return ONLY the raw prompt text.",
        }
      });
  
    const enhancedPrompt = promptResponse.text || userRawInput;
    console.log("SD3 Enhanced Prompt:", enhancedPrompt);

    // 2. Call Stability AI API
    const formData = new FormData();
    formData.append('prompt', enhancedPrompt);
    formData.append('aspect_ratio', '9:16');
    formData.append('output_format', 'png');
    formData.append('model', 'sd3'); 

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Accept': 'application/json' 
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stability API Error:", errorText);
      throw new Error(`Stability API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 3. Return Base64 (Add prefix)
    return `data:image/png;base64,${data.image}`;

  } catch (error) {
    console.error("generateImageWithStability error:", error);
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
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
