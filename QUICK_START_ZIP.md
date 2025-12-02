# Quick Start: ZIP Upload for Large Visualizations

## Problem
Getting "413 Request Too Long" errors when generating screenshots of complex visualizations with large HTML content.

## Solution
Enable ZIP compression to reduce payload size by 70-90%.

## How to Enable

### Step 1: Update Environment Variables

Add to your `.env` file:
```bash
SCREENSHOT_GENIE_USE_ZIP_UPLOAD=true
```

Or in your deployment configuration:
```bash
export SCREENSHOT_GENIE_USE_ZIP_UPLOAD=true
```

### Step 2: Verify Server Support

⚠️ **Important**: The Screenshot Genie server must support ZIP uploads.

Check with the server team or see `SERVER_UPDATE_PLAN.md` for implementation details.

### Step 3: Restart Your Application

```bash
# Restart to pick up new environment variable
npm restart
# or
pm2 restart your-app
```

### Step 4: Monitor Logs

You should see:
```
[VizHub] ScreenshotGenie initialized with ZIP upload enabled
[ScreenshotGenie] Creating ZIP file for HTML (2500000 bytes)...
[ScreenshotGenie] ZIP file created (250000 bytes, 10% of original)
[ScreenshotGenie] Image key created successfully via ZIP upload
```

## Expected Results

### Before (JSON Upload)
- Max HTML size: ~500KB (varies by server config)
- Large visualizations: ❌ 413 Request Too Long
- Transfer time: ~1-2 seconds for 500KB

### After (ZIP Upload)
- Max HTML size: ~5MB (10x larger)
- Large visualizations: ✅ Success
- Transfer time: ~200-500ms for compressed 500KB
- Compression ratio: 70-90% typical

## Troubleshooting

### Still Getting 413 Errors

1. **Check environment variable is set**
```bash
echo $SCREENSHOT_GENIE_USE_ZIP_UPLOAD
# Should output: true
```

2. **Verify server support**
   - Contact server team
   - Check server logs for ZIP processing
   - Confirm multipart/form-data is accepted

3. **Check server request limits**
   - Ensure server accepts files up to 10MB
   - Verify no reverse proxy limits (nginx, etc.)

### Slower Performance

This is normal for first request (compression overhead):
- First request: +100-200ms (compression time)
- Network transfer: -500-1500ms (smaller payload)
- Net effect: Usually faster overall

## When to Use

**Use ZIP Upload When:**
- ✅ HTML content >500KB
- ✅ Complex D3.js visualizations
- ✅ Getting 413 errors
- ✅ Server has ZIP support

**Use JSON Upload When:**
- ✅ HTML content <500KB
- ✅ Simple visualizations
- ✅ Server doesn't have ZIP support yet
- ✅ Maximum compatibility needed

## Programmatic Control

You can also control this per-instance:

```javascript
// For large visualizations
const genieWithZip = new ScreenshotGenie({
  apiKey: process.env.SCREENSHOT_GENIE_API_KEY,
  useZipUpload: true
});

// For small visualizations  
const genieWithJson = new ScreenshotGenie({
  apiKey: process.env.SCREENSHOT_GENIE_API_KEY,
  useZipUpload: false
});
```

## Testing

Test with a large HTML file:

```javascript
import { ScreenshotGenie } from 'screenshotgenie';

const genie = new ScreenshotGenie({ useZipUpload: true });

// Generate large HTML (2MB+)
const largeHtml = generateLargeVisualization();

console.log(`HTML size: ${(largeHtml.length / 1024).toFixed(2)} KB`);

const imageKey = await genie.createImageKey({
  html: largeHtml,
  width: 800,
  height: 600
});

console.log(`Success! Image key: ${imageKey}`);
```

## Support

If you encounter issues:
1. Check logs for compression stats
2. Verify server has ZIP support
3. Try with a smaller HTML first
4. Contact the team with error messages

## Related Documentation

- `SERVER_UPDATE_PLAN.md` - Server implementation guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `README.md` - Full API documentation
