# OnlyOffice Callback and Save Implementation Design

## 1. Objective
Enable users to manually save document templates from the editor toolbar and ensure the Document Server correctly synchronizes changes back to our backend and OSS storage.

## 2. Background
Currently, the "Save" button in the frontend is purely cosmetic. On the backend, while there is a callback endpoint, it isn't fully integrated with the "Force Save" mechanism required by OnlyOffice to push intermediate edits.

## 3. Architecture & Data Flow

### 3.1. Save Trigger (Frontend Request Save)
1. **Frontend**: User clicks the "Save" button in the `Toolbar`.
2. **SDK Interaction**: The frontend retrieves the `docEditor` instance and calls the service command:
   ```javascript
   window.docEditor.serviceCommand('forceSave');
   ```
3. **OnlyOffice Action**: The Document Server acknowledges the request and asynchronously triggers a callback to our server.

### 3.2. Callback Handling
1. **Entry Point**: `DocumentController.documentCallback` receives a POST request from OnlyOffice.
2. **Status Logic**:
   - **Status 2 (Ready for save)** or **Status 6 (Force save)**:
     - Get `url` from payload.
     - Delegate to `TemplateService.handleOnlyOfficeCallback`.
     - Download file -> Upload to OSS -> Update `template_file` table (version, size, oss_key).
3. **Acknowledgment**: Return `{"error": 0}`.

## 4. Component Changes

### 4.1. Backend (Java)
- **DocumentController**: Update callback handler to correctly call `TemplateService`.
- **TemplateServiceImpl**: Ensure robust downloading and OSS versioning.
- **OnlyOfficeDocumentService**: Remove or deprecate the internal `forceSave` method that only bumped versions, as the trigger now comes from the frontend.

### 4.2. Frontend (React/TS)
- **Toolbar Component**: 
  - Access `window.docEditor` (initialized in `OnlyOfficeEditor`).
  - Add `onClick` handler to call `serviceCommand('forceSave')`.
  - Provide immediate UI feedback (e.g., "Requesting save...").


## 5. Security & Error Handling
- **JWT**: Ensure requests to the Command Service include appropriate JWT headers if enabled.
- **Failures**: If the Command Service returns an error, notify the user. If the callback fails, log the error for debugging.

## 6. Implementation Plan Highlights
- Unified callback DTO handling.
- TDD for the Command Service client.
- UI feedback for the save process.