# OnlyOffice Callback and Save Implementation Design

## 1. Objective
Enable users to manually save document templates from the editor toolbar and ensure the Document Server correctly synchronizes changes back to our backend and OSS storage.

## 2. Background
Currently, the "Save" button in the frontend is purely cosmetic. On the backend, while there is a callback endpoint, it isn't fully integrated with the "Force Save" mechanism required by OnlyOffice to push intermediate edits.

## 3. Architecture & Data Flow

### 3.1. Save Trigger (Force Save)
1. **Frontend**: User clicks the "Save" button in the `Toolbar`.
2. **Backend API**: The frontend calls `POST /api/documents/{templateId}/force-save`.
3. **Command Service**: The backend sends a `forcesave` command to the OnlyOffice Command Service:
   - URL: `${onlyoffice.document-server.url}/coauthoring/CommandService.ashx`
   - Payload: `{"c": "forcesave", "key": "{documentKey}"}`
4. **OnlyOffice Response**: OnlyOffice acknowledges the command and asynchronously triggers a callback to our server.

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
- **OnlyOfficeDocumentService**: Add logic to call the OnlyOffice Command Service using `HttpUtil`.
- **DocumentController**: Update callback handler to correctly call `TemplateService`.
- **TemplateServiceImpl**: Ensure robust downloading and OSS versioning.

### 4.2. Frontend (React/TS)
- **API Layer**: Add `forceSaveDocument` function in `api/index.ts`.
- **Toolbar Component**: Add `onClick` handler to the Save button, including loading states and user notifications.
- **Store**: Use `currentTemplateId` from `editorStore`.

## 5. Security & Error Handling
- **JWT**: Ensure requests to the Command Service include appropriate JWT headers if enabled.
- **Failures**: If the Command Service returns an error, notify the user. If the callback fails, log the error for debugging.

## 6. Implementation Plan Highlights
- Unified callback DTO handling.
- TDD for the Command Service client.
- UI feedback for the save process.