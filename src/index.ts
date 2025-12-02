import { writeFile } from "fs/promises";
import JSZip from "jszip";
import type {
  ImageGenerationInputs,
  ImageKey,
  ScreenshotGenieConfig,
  ImageHash,
  ImageFileName,
  FormattedDateString
} from "./types";

// Re-export the types
export type {
  ImageGenerationInputs,
  ImageKey,
  ScreenshotGenieConfig,
  ImageHash,
  ImageFileName,
  FormattedDateString
};

/**
 * Screenshot Genie client library for generating and managing screenshots
 */
export class ScreenshotGenie {
  private apiKey: string | undefined;
  private host: string;
  private useZipUpload: boolean;

  constructor(config: ScreenshotGenieConfig = {}) {
    const {
      apiKey = process.env.SCREENSHOT_GENIE_API_KEY,
      host = "https://screenshotgenie.com",
      useZipUpload = false,
    } = config;
    // Check for API key in options first, then environment variable
    const providedApiKey = apiKey || process.env.SCREENSHOT_GENIE_API_KEY;

    if (!providedApiKey) {
      throw new Error(
        "ScreenshotGenie requires an API key. Either provide it in the constructor options " +
          "or set the SCREENSHOT_GENIE_API_KEY environment variable."
      );
    }

    this.apiKey = providedApiKey;
    this.host = host;
    this.useZipUpload = useZipUpload;
  }

  async createImageKey(
    imageGenerationInputs: ImageGenerationInputs
  ): Promise<ImageKey> {
    if (!imageGenerationInputs.browserZoom) {
      imageGenerationInputs.browserZoom = 1.0;
    }

    // Use ZIP upload if enabled and HTML is provided
    if (this.useZipUpload && imageGenerationInputs.html) {
      return this.createImageKeyWithZip(imageGenerationInputs);
    }

    // Otherwise use traditional JSON POST
    return this.createImageKeyWithJson(imageGenerationInputs);
  }

  /**
   * Create image key using traditional JSON POST
   * (Existing behavior)
   */
  private async createImageKeyWithJson(
    imageGenerationInputs: ImageGenerationInputs
  ): Promise<ImageKey> {
    const response = await fetch(`${this.host}/api/create-image-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ imageGenerationInputs }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create image key. Status: ${response.status}, Body: ${errorText}`
      );
    }

    const json = await response.json();

    if (json.ok === false) {
      throw new Error(json.body);
    }

    console.log("json", json);
    return json.imageKey;
  }

  /**
   * Create image key using ZIP file upload
   * Compresses HTML and uploads as multipart/form-data
   */
  private async createImageKeyWithZip(
    imageGenerationInputs: ImageGenerationInputs
  ): Promise<ImageKey> {
    if (!imageGenerationInputs.html) {
      throw new Error("HTML content is required for ZIP upload");
    }

    console.log(
      `[ScreenshotGenie] Creating ZIP file for HTML (${imageGenerationInputs.html.length} bytes)...`
    );

    // Create ZIP file containing the HTML
    const zip = new JSZip();
    zip.file("index.html", imageGenerationInputs.html);

    // Generate the ZIP blob
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }, // Maximum compression
    });

    console.log(
      `[ScreenshotGenie] ZIP file created (${zipBlob.size} bytes, ${Math.round((zipBlob.size / imageGenerationInputs.html.length) * 100)}% of original)`
    );

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append("file", zipBlob, "visualization.zip");
    formData.append("width", imageGenerationInputs.width.toString());
    formData.append("height", imageGenerationInputs.height.toString());
    formData.append(
      "browserZoom",
      (imageGenerationInputs.browserZoom || 1.0).toString()
    );

    // Upload to server
    const response = await fetch(`${this.host}/api/create-image-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        // Don't set Content-Type - let the browser set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create image key (ZIP upload). Status: ${response.status}, Body: ${errorText}`
      );
    }

    const json = await response.json();

    if (json.ok === false) {
      throw new Error(json.body);
    }

    console.log("[ScreenshotGenie] Image key created successfully via ZIP upload");
    return json.imageKey;
  }

  getImageUrl(imageKey: ImageKey, width: number): string {
    if (!imageKey) {
      throw new Error("`imageKey` is required to generate the image URL.");
    }
    if (!width) {
      throw new Error("`width` is required to generate the image URL.");
    }

    const imageId = imageKey.split("_expires_")[0];
    const imageFileName = `${imageId}_${width}px.png`;
    return `${this.host}/images/${imageFileName}`;
  }

  // NodeJS only
  async downloadImage(url: string, filePath: string): Promise<void> {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to download image. Status: ${response.status}, Body: ${errorText}`
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);
  }
}

export const isImageKeyExpired = (imageKey: ImageKey): boolean => {
  // Extract the expiration date from the image key
  const parts = imageKey.split("_expires_");
  if (parts.length !== 2) {
    throw new Error(
      "Invalid image key format. Expected format: {imageHash}_expires_{expirationDate}"
    );
  }

  const expirationDateStr = parts[1];

  // Validate the expiration date format (should be YYYYMMDD)
  if (!/^\d{8}$/.test(expirationDateStr)) {
    throw new Error(
      "Invalid expiration date format in image key. Expected format: YYYYMMDD"
    );
  }

  // Parse the expiration date
  const year = parseInt(expirationDateStr.substring(0, 4), 10);
  const month = parseInt(expirationDateStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const day = parseInt(expirationDateStr.substring(6, 8), 10);

  const expirationDate = new Date(year, month, day);
  expirationDate.setHours(23, 59, 59, 999); // Set to end of the day

  // Compare with current date
  const currentDate = new Date();

  return currentDate > expirationDate;
};
