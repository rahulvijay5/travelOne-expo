import { API_URL } from "@lib/config/index";
import { getHeaders } from "@lib/utils";
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface DocumentData {
  base64?: string;
  uri: string;
  type?: string;
  name?: string;
}

export const uploadDocument = async (
  documentUri: string,
  folderName: string,
  token: string,
  mimeType?: string
): Promise<string> => {
  try {
    console.log("Starting document upload process for:", documentUri);
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(documentUri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Get file extension and type
    const extension = documentUri.split('.').pop()?.toLowerCase() || 'jpg';
    const type = mimeType || (extension === 'pdf' ? 'application/pdf' : `image/${extension}`);

    let processedUri = documentUri;
    let base64Data = '';

    // If it's an image, compress it
    if (type.startsWith('image/')) {
      console.log('Compressing image before upload...');
      const manipulateResult = await manipulateAsync(
        documentUri,
        [{ resize: { width: 800 } }], // Reduced size
        { compress: 0.5, format: SaveFormat.JPEG, base64: true } // Increased compression
      );
      base64Data = manipulateResult.base64 || '';
      processedUri = manipulateResult.uri;
    } else {
      // For non-image files, just read as base64
      base64Data = await FileSystem.readAsStringAsync(documentUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (!base64Data) {
      throw new Error("Failed to process document");
    }

    // Split base64 data into chunks if it's too large
    const chunkSize = 500000; // ~500KB chunks
    const chunks = [];
    for (let i = 0; i < base64Data.length; i += chunkSize) {
      chunks.push(base64Data.slice(i, i + chunkSize));
    }

    console.log(`Splitting upload into ${chunks.length} chunks...`);

    // Upload first chunk with metadata
    const documentData: DocumentData = {
      base64: chunks[0],
      uri: processedUri,
      type,
      name: `document.${extension}`
    };

    console.log("Sending first chunk to server...");
    const response = await fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({
        document: documentData,
        folderName,
        totalChunks: chunks.length,
        currentChunk: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Upload error response:", errorData);
      throw new Error(errorData.error || "Failed to upload document");
    }

    let uploadResponse = await response.json();
    
    // Upload remaining chunks if any
    if (chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        console.log(`Sending chunk ${i + 1} of ${chunks.length}...`);
        const chunkResponse = await fetch(`${API_URL}/api/documents/upload-chunk`, {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify({
            documentId: uploadResponse.documentId,
            chunk: chunks[i],
            currentChunk: i + 1,
            totalChunks: chunks.length
          }),
        });

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json();
          throw new Error(errorData.error || "Failed to upload document chunk");
        }

        uploadResponse = await chunkResponse.json();
      }
    }

    console.log("Upload complete:", uploadResponse);
    
    if (!uploadResponse.documentUrl) {
      throw new Error("Invalid response format from server");
    }

    return uploadResponse.documentUrl;
  } catch (error) {
    console.error("Error in uploadDocument:", error);
    throw error;
  }
};

export const deleteDocument = async (documentUrl: string, token: string): Promise<void> => {
  try {
    console.log("Deleting document:", documentUrl);

    const response = await fetch(`${API_URL}/api/documents/delete`, {
      method: "DELETE",
      headers: getHeaders(token),
      body: JSON.stringify({ documentUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete document");
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};