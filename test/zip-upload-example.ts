import { ScreenshotGenie } from '../src/index';

/**
 * Example demonstrating ZIP upload for large HTML content
 */
async function demonstrateZipUpload() {
  // Initialize with ZIP upload enabled
  const genie = new ScreenshotGenie({
    apiKey: process.env.SCREENSHOT_GENIE_API_KEY,
    useZipUpload: true,  // Enable ZIP compression
  });

  // Generate a large HTML string (simulating a complex visualization)
  const largeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Complex Visualization</title>
        <style>
          ${generateLargeCSS()}
        </style>
      </head>
      <body>
        ${generateLargeContent()}
      </body>
    </html>
  `;

  console.log(`Original HTML size: ${largeHtml.length} bytes`);
  console.log(`Original HTML size: ${(largeHtml.length / 1024).toFixed(2)} KB`);

  try {
    // Create image key - will use ZIP compression automatically
    const imageKey = await genie.createImageKey({
      html: largeHtml,
      width: 800,
      height: 600,
      browserZoom: 1.0,
    });

    console.log(`Image key created: ${imageKey}`);

    // Get thumbnail URL
    const thumbnailUrl = genie.getImageUrl(imageKey, 400);
    console.log(`Thumbnail URL: ${thumbnailUrl}`);

    // Get full resolution URL
    const fullResUrl = genie.getImageUrl(imageKey, 800);
    console.log(`Full resolution URL: ${fullResUrl}`);

  } catch (error) {
    console.error('Error creating image key:', error);
  }
}

/**
 * Generate large CSS content for testing
 */
function generateLargeCSS(): string {
  const css: string[] = [];
  for (let i = 0; i < 1000; i++) {
    css.push(`
      .element-${i} {
        background-color: #${Math.floor(Math.random() * 16777215).toString(16)};
        padding: 10px;
        margin: 5px;
      }
    `);
  }
  return css.join('\n');
}

/**
 * Generate large HTML content for testing
 */
function generateLargeContent(): string {
  const elements: string[] = [];
  for (let i = 0; i < 5000; i++) {
    elements.push(`
      <div class="element-${i % 1000}">
        <h3>Element ${i}</h3>
        <p>This is test content for element ${i}</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
    `);
  }
  return elements.join('\n');
}

// Run the demonstration
if (require.main === module) {
  demonstrateZipUpload().catch(console.error);
}

export { demonstrateZipUpload };
