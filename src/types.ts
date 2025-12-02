// Config for the ScreenshotGenie client
export type ScreenshotGenieConfig = {
  // Your Screenshot Genie API key
  apiKey?: string;

  // Optional API host override
  host?: string;

  // Use ZIP file upload for large HTML content
  // When true, HTML will be compressed and uploaded as a ZIP file
  // This solves the "413 Request Too Long" error for large visualizations
  // Requires server support for multipart/form-data and ZIP extraction
  useZipUpload?: boolean;
};

// A unique identifier for an image
// Of the form `${imageHash}`, which is a hash of the image content,
// where `imageHash` contains no hyphens
export type ImageHash = string;

// The filename for an image
// Of the form `${imageHash}_${width}px.png`
// e.g. `abc123_800px.png`
// Or, no width for full-size images:
// e.g. `abc123.png`
export type ImageFileName = string;

// Expiration date for an image
// Format: "YYYYMMDD"
export type FormattedDateString = string;

// An Image Key is a unique identifier for an image,
// including the expiration date.
// Of the form `${imageHash}_expires_${expirationDate}`
export type ImageKey = string;

// Inputs for generating an image
export type ImageGenerationInputs = {
  // The HTML content to render
  // Mutually exclusive with `url`
  html?: string;

  // The URL of the page to render
  // Mutually exclusive with `html`
  url?: string;

  // The width of the browser window
  width: number;

  // The height of the browser window
  height: number;

  // The zoom level of the browser
  // 1.0 = 100%, defaults to 1.0
  browserZoom?: number;
};
