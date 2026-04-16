# Design Specification: OnlyOffice API Editor Component

## Problem Statement
The current `OnlyOfficeEditor` component relies on the `@onlyoffice/document-editor-react` wrapper. To provide more flexibility and direct access to the OnlyOffice SDK (DocsAPI), we need a new component that initializes the editor using the official `api.js` directly.

## Proposed Solution
Create a new component `OnlyOfficeApiEditor` that handles:
1.  Dynamic loading of the OnlyOffice `api.js` script.
2.  Direct initialization of the editor using `new DocsAPI.DocEditor()`.
3.  Cleanup and disposal of the editor instance when the component unmounts.

## Architecture & Data Flow

### 1. Script Loading
- The component will check if `window.DocsAPI` is already available.
- If not, it will inject a `<script>` tag into the document head pointing to the Document Server's `api.js` URL (retrieved from `getDocServerApiUrl()`).
- It will wait for the script's `onload` event before proceeding.

### 2. Editor Initialization
- Once the script is loaded, it will use the provided `documentId`, `documentUrl`, `documentKey`, and `documentTitle` to build the OnlyOffice configuration object.
- It will instantiate the editor in a specific container div using `new DocsAPI.DocEditor("container-id", config)`.
- The `onDocumentReady` event will trigger the existing `onlyOfficeBridge` initialization.

### 3. State Management
- The editor instance will be stored in a `ref` for cleanup.
- It will also be assigned to `window.docEditor` for global access (maintaining compatibility with the current `OnlyOfficeEditor`).

## Technical Changes

### Frontend
- **New Component**: `fe/src/components/OnlyOfficeEditor/ApiEditor.tsx`
- **Responsibilities**:
  - Props: `documentId`, `documentUrl`, `documentKey`, `documentTitle`, `onError`.
  - Effect: Load script and init editor.
  - Cleanup: `docEditor.destroy()` if available.

### Configuration
- Uses `config.documentServerUrl` and `getCallbackUrl(documentId)` from `fe/src/config/index.ts`.

## Verification Plan
1.  **Script Loading**: Verify that `api.js` is added to the DOM and loads correctly.
2.  **Editor Rendering**: Verify the OnlyOffice editor appears in the container.
3.  **Bridge Integration**: Verify that `onlyOfficeBridge` still connects and can communicate with the plugin.
4.  **Cleanup**: Verify that switching away from the editor correctly destroys the instance.
