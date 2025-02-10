import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";

export const uploadImages = async (
  imageUris: string[],
  folderName: string,
  token: string
) => {
  try {
    console.log("Uploading images:", imageUris);
    const response = await fetch(`${API_URL}/api/images/upload`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        imageUris, // Send the URIs directly
        folderName,
      }),
    });
    console.log("Response:", response);

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
