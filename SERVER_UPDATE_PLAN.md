# Server Update Plan for ZIP Upload Support

## Overview
This document outlines the server-side changes needed to support accepting compressed HTML via ZIP file upload instead of JSON POST requests. This solves the "413 Request Too Long" error for large visualizations.

## Current Implementation
The server currently accepts JSON POST requests at `/api/create-image-key` with the following structure:
```json
{
  "imageGenerationInputs": {
    "html": "<html>...</html>",
    "width": 800,
    "height": 600,
    "browserZoom": 1.0
  }
}
```

## New Implementation (Opt-in)

### Client-Side Changes (Already Implemented)
The client now supports two modes via a `useZipUpload` boolean flag:

1. **Legacy Mode** (`useZipUpload: false`): Sends JSON POST with HTML string (existing behavior)
2. **ZIP Mode** (`useZipUpload: true`): Sends multipart/form-data with ZIP file

### Required Server Changes

#### 1. New Endpoint or Modified Endpoint
**Option A: Create new endpoint** (Recommended for safety)
- Create `/api/create-image-key-zip` endpoint
- Keeps existing endpoint unchanged
- Allows gradual migration

**Option B: Modify existing endpoint**
- Update `/api/create-image-key` to accept both content types
- Detect content type and route accordingly
- More complex but single endpoint

#### 2. Request Handling

The server needs to:

1. **Detect Content Type**
```javascript
if (req.headers['content-type']?.includes('multipart/form-data')) {
  // Handle ZIP upload
} else {
  // Handle JSON (existing code)
}
```

2. **Parse Multipart Request**
- Use a library like `multer` (Express), `busboy`, or similar
- Extract the uploaded ZIP file from the `file` field
- Extract metadata fields (`width`, `height`, `browserZoom`) from form fields

3. **Unzip the File**
```javascript
const JSZip = require('jszip');
const zip = new JSZip();

// Load the ZIP file
const zipContent = await zip.loadAsync(uploadedFileBuffer);

// Extract index.html
const htmlContent = await zipContent.file('index.html').async('string');
```

4. **Validate and Process**
```javascript
const imageGenerationInputs = {
  html: htmlContent,
  width: parseInt(formData.width),
  height: parseInt(formData.height),
  browserZoom: parseFloat(formData.browserZoom || '1.0')
};

// Continue with existing screenshot generation logic
```

#### 3. Example Implementation (Express + Multer)

```javascript
const express = require('express');
const multer = require('multer');
const JSZip = require('jszip');

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/create-image-key', upload.single('file'), async (req, res) => {
  try {
    let imageGenerationInputs;
    
    // Check if this is a ZIP upload
    if (req.file) {
      // Parse ZIP file
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(req.file.buffer);
      
      // Extract index.html
      const htmlFile = zipContent.file('index.html');
      if (!htmlFile) {
        return res.status(400).json({ 
          ok: false, 
          body: 'ZIP file must contain index.html' 
        });
      }
      
      const html = await htmlFile.async('string');
      
      // Get metadata from form fields
      imageGenerationInputs = {
        html,
        width: parseInt(req.body.width),
        height: parseInt(req.body.height),
        browserZoom: parseFloat(req.body.browserZoom || '1.0')
      };
    } else {
      // Parse JSON body (existing behavior)
      imageGenerationInputs = req.body.imageGenerationInputs;
    }
    
    // Existing screenshot generation logic
    const imageKey = await generateScreenshot(imageGenerationInputs);
    
    res.json({ ok: true, imageKey });
    
  } catch (error) {
    console.error('Error creating image key:', error);
    res.status(500).json({ ok: false, body: error.message });
  }
});
```

#### 4. Required Dependencies

Add to server's `package.json`:
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "jszip": "^3.10.1"
  }
}
```

#### 5. Request Size Limits

Update body parser limits to handle ZIP files:
```javascript
app.use(express.json({ limit: '10mb' })); // For JSON requests
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// For multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

## Testing Plan

1. **Test JSON endpoint** (existing behavior)
   - Verify small HTML still works
   - Verify error handling

2. **Test ZIP endpoint** (new behavior)
   - Create test ZIP with index.html
   - Verify extraction works
   - Verify screenshot generation works
   - Test with large HTML (>1MB)

3. **Load Testing**
   - Test concurrent requests
   - Monitor memory usage (ZIP parsing can be memory-intensive)
   - Verify proper cleanup of uploaded files

## Migration Strategy

1. **Phase 1: Add new endpoint** (Week 1)
   - Implement `/api/create-image-key-zip`
   - Test thoroughly
   - Keep existing endpoint unchanged

2. **Phase 2: Enable client flag** (Week 2)
   - Set `useZipUpload: true` for new generations
   - Monitor error rates
   - Compare performance

3. **Phase 3: Full migration** (Week 3+)
   - Once stable, make ZIP upload default
   - Keep JSON fallback for small files
   - Eventually deprecate JSON-only endpoint

## Security Considerations

1. **Validate ZIP contents**
   - Check for index.html existence
   - Limit ZIP file size (10MB recommended)
   - Scan for malicious content if needed

2. **Resource limits**
   - Set timeout for ZIP extraction (30 seconds max)
   - Limit memory usage
   - Clean up temp files promptly

3. **Rate limiting**
   - Same rate limits as existing endpoint
   - Consider separate limits for ZIP uploads

## Performance Notes

- ZIP compression typically reduces HTML size by 70-90%
- Decompression overhead: ~50-200ms for typical visualizations
- Memory usage: 2-3x the uncompressed size during extraction
- Net benefit: Allows visualizations 5-10x larger than current limit

## Rollback Plan

If issues arise:
1. Set `useZipUpload: false` on client
2. Increase JSON request size limits temporarily
3. Fix server issues
4. Re-enable ZIP upload

## Questions for Server Team

1. Which framework is the server using? (Express, Fastify, etc.)
2. Current request size limit?
3. Preference for Option A (new endpoint) vs Option B (modified endpoint)?
4. Any existing file upload infrastructure to leverage?
5. CDN or direct server upload?

## Success Criteria

- [ ] ZIP uploads work for files >1MB
- [ ] JSON uploads still work (backward compatibility)
- [ ] No increase in error rate
- [ ] Response time impact <200ms
- [ ] Memory usage remains stable
- [ ] All tests pass
