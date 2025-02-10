export const handleResponse = async (res: Response) => {
    if (!res.ok) {
      // Log the response status and type to debug
      console.error("API Response Error: ", res.status, res.statusText);
  
      try {
        // Try to parse as JSON first
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          if (res.status === 404 && errorData.message === "User not found") {
            return { error: "User not found" };
          }
          throw new Error(errorData.message || `API error: ${res.status}`);
        }
        
        // If not JSON, try to get text
        const text = await res.text();
        console.error("Error Response Text: ", text);
        throw new Error(`API error: ${res.status} - ${res.statusText}`);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`API error: ${res.status} - ${res.statusText}`);
      }
    }
  
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return res.json();
      }
      // For endpoints that don't return JSON
      const text = await res.text();
      if (!text) return null;
      try {
        // Try to parse as JSON anyway in case content-type is wrong
        return JSON.parse(text);
      } catch {
        // If can't parse as JSON, return as is
        return text;
      }
    } catch (error) {
      console.error("Error parsing response:", error);
      throw new Error("Failed to parse response");
    }
  };