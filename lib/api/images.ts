import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const uploadImages = async (
  imageUris: string[],
  folderName: string,
  token: string
) => {
  try {
    console.log("Starting image upload process for:", imageUris);

    // Process each image
    const processedImages = await Promise.all(imageUris.map(async (uri) => {
      try {
        console.log("Processing image:", uri);
        
        // Compress and convert image
        const manipulateResult = await manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }],
          { 
            compress: 0.7, 
            format: SaveFormat.JPEG,
            base64: true 
          }
        );

        if (!manipulateResult.base64) {
          throw new Error("Failed to process image");
        }

        return manipulateResult.base64;
      } catch (error) {
        console.error("Error processing image:", error);
        throw error;
      }
    }));

    console.log("All images processed, sending to server...");

    const response = await fetch(`${API_URL}/api/images/upload`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        images: processedImages.map(base64 => ({
          data: base64,
          type: 'image/jpeg'
        })),
        folderName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload images");
    }

    const data = await response.json();
    return data.imageUrls;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
};
