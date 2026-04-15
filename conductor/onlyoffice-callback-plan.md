# OnlyOffice Callback Implementation Plan

## Objective
Fix the "This file cannot be saved" error in OnlyOffice by implementing the official callback mechanism. The Document Server requires a valid `callbackUrl` to POST the updated document when a user saves or closes the editor.

## Key Files & Context
- **Frontend**: 
  - `fe/src/config/index.ts`
  - `fe/src/components/OnlyOfficeEditor/index.tsx`
  - `fe/src/pages/TemplateEditor/index.tsx`
- **Backend**: 
  - `be/template-editor-api/src/main/java/com/yl/template/api/controller/TemplateController.java`
  - `be/template-editor-service/src/main/java/com/yl/template/service/template/TemplateService.java`
  - `be/template-editor-service/src/main/java/com/yl/template/service/template/impl/TemplateServiceImpl.java`
  - (New) `be/template-editor-dao/src/main/java/com/yl/template/dao/dto/OnlyOfficeCallbackDTO.java`

## Implementation Steps

### 1. Backend: Create Callback DTO
Create `OnlyOfficeCallbackDTO.java` in the `com.yl.template.dao.dto` package to represent the OnlyOffice callback JSON payload. Key fields include:
- `Integer status` (Status 2 = document ready for saving, Status 6 = force saving)
- `String url` (URL to download the saved document)
- `String key` (Document key)
- `List<String> users`

### 2. Backend: Update TemplateService
Add a method `void handleOnlyOfficeCallback(Long id, OnlyOfficeCallbackDTO dto)` to `TemplateService` and its implementation.
- If `dto.getStatus() == 2` or `dto.getStatus() == 6`:
  - Fetch the `TemplateFile` entity by `id`.
  - Use `cn.hutool.http.HttpUtil.downloadBytes(dto.getUrl())` to download the updated document.
  - Upload the bytes to OSS using the existing `ossClient.upload(...)` method (generating a new key).
  - Update the `TemplateFile` entity: set the new `ossKey`, `ossUrl`, file size, increment `version`, and update the `updatedAt` timestamp.
  - Save the updated entity via `templateFileMapper.updateById(entity)`.

### 3. Backend: Update TemplateController
Add a new POST mapping to `TemplateController.java`:
```java
@PostMapping("/{id}/callback")
public Map<String, Integer> onlyOfficeCallback(@PathVariable Long id, @RequestBody OnlyOfficeCallbackDTO dto) {
    templateService.handleOnlyOfficeCallback(id, dto);
    // OnlyOffice requires {"error": 0} to acknowledge successful receipt
    Map<String, Integer> response = new HashMap<>();
    response.put("error", 0);
    return response;
}
```

### 4. Frontend: Update Callback URL Generation
In `fe/src/config/index.ts`, modify `getCallbackUrl` to accept a `documentId` parameter and return the full API path:
```typescript
export function getCallbackUrl(documentId: string): string {
  return getApiUrl(`/api/templates/${documentId}/callback`);
}
```

### 5. Frontend: Update OnlyOfficeEditor Component
- In `fe/src/components/OnlyOfficeEditor/index.tsx`, update the `OnlyOfficeEditorProps` interface to accept an optional (or required) `documentId` string.
- Update the `editorConfig.editorConfig.callbackUrl` assignment to invoke `getCallbackUrl(documentId)`.
- In `fe/src/pages/TemplateEditor/index.tsx`, where `<OnlyOfficeEditor />` is rendered, pass the current `templateId` (likely from state or route params) as the `documentId` prop.

## Verification & Testing
- Load a template into the OnlyOffice editor.
- Make a change and click the Save button (or wait for auto-save).
- The OnlyOffice Document Server will trigger a POST request to `/api/templates/{id}/callback`.
- Verify the backend successfully downloads the file, updates OSS, and returns `{"error": 0}`.
- Refresh the page and verify the updated content is loaded.