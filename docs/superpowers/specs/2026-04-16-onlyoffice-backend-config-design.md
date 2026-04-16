# 2026-04-16-onlyoffice-backend-config-design.md

## Overview
Currently, the OnlyOffice editor configuration is partially hardcoded in the frontend. This design implements a dynamic configuration flow where the frontend calls the backend `/api/documents/open` endpoint to retrieve a fully prepared OnlyOffice configuration, including document keys and security tokens.

## Architecture & Data Flow
1. **Frontend Initial Load**: When `TemplateEditorPage` mounts, it requests the editor configuration for a specific template (defaulting to ID 4).
2. **Backend Config Generation**: The backend generates a unique `documentKey`, prepares the file URL, and optionally signs the configuration with a JWT token.
3. **Frontend Editor Setup**: The `OnlyOfficeEditor` component receives this configuration and merges it with client-side requirements (plugins and event handlers) before initializing the OnlyOffice instance.

## Technical Implementation

### 1. Type Definitions (`fe/src/types/index.ts`)
Add the following interfaces to match the backend models:
- `OpenDocumentRequest`: Request structure for opening a template.
- `EditorConfigVO`: The response object containing OnlyOffice configuration and metadata.

### 2. API Implementation (`fe/src/api/index.ts`)
- Implement `openDocument` calling `POST /documents/open`.

### 3. Store Integration (`fe/src/stores/editorStore.ts`)
- Update the store to track the full `EditorConfigVO`.
- Ensure `documentUrl`, `documentKey`, and `documentTitle` are populated from the backend response.

### 4. Component Updates
#### `TemplateEditorPage` (`fe/src/pages/TemplateEditor/index.tsx`)
- Add an effect to trigger `openDocument(4)` on mount.
- Display a loading state while fetching the configuration.

#### `OnlyOfficeEditor` (`fe/src/components/OnlyOfficeEditor/index.tsx`)
- Update to accept the backend-provided `editorConfig` and `token`.
- Merge backend configuration with:
  - `plugins`: Ensure the local plugin URL is correctly registered.
  - `events`: Attach the mandatory `onDocumentReady` and `onError` handlers.
  - `token`: Pass the JWT token to the `DocumentEditor` component.

## Security
- The implementation will use the `token` field from `EditorConfigVO` to support JWT authentication required by the OnlyOffice server.

## Verification Plan
1. **Network Check**: Verify `POST /api/documents/open` is called with `{ templateId: 4 }`.
2. **Editor Load**: Ensure OnlyOffice loads without "Document security token is not correct" or "Document key is not valid" errors.
3. **Plugin Functionality**: Verify that the `asc.template-doc-agent` plugin still autostarts and communicates correctly with the bridge.
