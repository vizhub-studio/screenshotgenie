# Changelog

## [Unreleased]

### Added
- ZIP compression support for large HTML content
  - New `useZipUpload` option in `ScreenshotGenieConfig`
  - Compresses HTML before uploading to avoid 413 Request Too Long errors
  - Typical compression: 70-90% size reduction
  - Opt-in feature (default: false for backward compatibility)
  - Requires server-side ZIP extraction support

### Changed
- Refactored `createImageKey()` to support multiple upload methods
- Split upload logic into `createImageKeyWithJson()` and `createImageKeyWithZip()`

### Documentation
- Added `SERVER_UPDATE_PLAN.md` - Server implementation guide
- Added `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- Added `QUICK_START_ZIP.md` - Quick start guide for ZIP uploads
- Updated README.md with ZIP upload examples and best practices
- Added test example: `test/zip-upload-example.ts`

### Dependencies
- Added `jszip` ^3.10.1
- Added `@types/jszip` for TypeScript support

## [0.1.0] - Previous Release

Initial release with basic screenshot generation functionality.
