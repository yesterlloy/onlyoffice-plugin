# OnlyOffice Document Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the OnlyOffice callback processing to actually save the document and implement frontend-triggered document saving via the OnlyOffice Command Service.

**Architecture:**
- **Backend (Callback):** Update `DocumentController` to delegate callback handling (status 2 and 6) to `TemplateService` so the file is downloaded and saved to OSS.
- **Backend (Force Save):** Update `OnlyOfficeDocumentService.forceSave` to call the OnlyOffice Document Server's Command Service API (`/coauthoring/CommandService.ashx` or `/command`) rather than just incrementing the DB version. This triggers OnlyOffice to push the latest edits to the callback endpoint.
- **Frontend (Toolbar):** Bind the "保存" (Save) button to invoke the backend's `/api/documents/{templateId}/force-save` endpoint via a new API request function, providing user feedback.

**Tech Stack:** Java, Spring Boot, React, Zustand, antd

---

### Task 1: Fix DocumentController Callback Logic

**Files:**
- Modify: `be/template-editor-api/src/main/java/com/yl/template/api/controller/DocumentController.java`

- [ ] **Step 1: Inject TemplateService and update callback handler**

In `DocumentController.java`:
1. Inject `TemplateService`:
   ```java
   import com.yl.template.service.template.TemplateService;
   
   // In the class:
   private final TemplateService templateService;
   ```
2. In `documentCallback` method, replace `logCallback(templateId, dto);` with `templateService.handleOnlyOfficeCallback(templateId, dto);`.
3. Remove the now unused `logCallback` private method.

- [ ] **Step 2: Commit**

```bash
git add be/template-editor-api/src/main/java/com/yl/template/api/controller/DocumentController.java
git commit -m "fix: update DocumentController to handle OnlyOffice callback via TemplateService"
```

### Task 2: Implement Real Force Save in OnlyOfficeDocumentService

**Files:**
- Modify: `be/template-editor-service/src/main/java/com/yl/template/service/document/OnlyOfficeDocumentService.java`

- [ ] **Step 1: Rewrite forceSave method to call OnlyOffice Command Service**

In `OnlyOfficeDocumentService.java`:
1. Replace the existing `forceSave` method body. Instead of bumping the DB version, it needs to send a request to OnlyOffice.
2. Use Hutool's `HttpUtil` to POST the command.

```java
    import cn.hutool.http.HttpUtil;
    import com.fasterxml.jackson.databind.ObjectMapper;
    // ...

    public void forceSave(Long templateId) {
        TemplateFile template = templateFileMapper.selectById(templateId);
        if (template == null) {
            throw new BusinessException("模板不存在: " + templateId);
        }
        
        String documentKey = generateDocumentKey(template);
        // Use /coauthoring/CommandService.ashx as it's broadly compatible, or /command.
        String commandUrl = documentServerUrl.endsWith("/") ? 
                documentServerUrl + "coauthoring/CommandService.ashx" : 
                documentServerUrl + "/coauthoring/CommandService.ashx";
        
        Map<String, Object> req = new HashMap<>();
        req.put("c", "forcesave");
        req.put("key", documentKey);
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonStr = mapper.writeValueAsString(req);
            String response = HttpUtil.post(commandUrl, jsonStr);
            log.info("调用 OnlyOffice Command Service forcesave 结果: {}", response);
        } catch (Exception e) {
            log.error("调用 OnlyOffice 强制保存失败", e);
            throw new BusinessException("强制保存失败: " + e.getMessage());
        }
    }
```

- [ ] **Step 2: Commit**

```bash
git add be/template-editor-service/src/main/java/com/yl/template/service/document/OnlyOfficeDocumentService.java
git commit -m "feat: implement real OnlyOffice force save via Command Service"
```

### Task 3: Add Frontend Save API and Wire to Toolbar

**Files:**
- Modify: `fe/src/api/index.ts`
- Modify: `fe/src/components/Toolbar/index.tsx`

- [ ] **Step 1: Add forceSave API function**

In `fe/src/api/index.ts`, add the export for the force save endpoint:
```typescript
// 强制保存文档
export const forceSaveDocument = (templateId: number) => {
  return request.post(`/api/documents/${templateId}/force-save`)
}
```

- [ ] **Step 2: Update Toolbar to call the API**

In `fe/src/components/Toolbar/index.tsx`, use `useEditorStore` to get the `currentTemplateId` and call the API when the "保存" button is clicked:
```tsx
import { useState } from 'react'
import { Button, message } from 'antd'
import { EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { useEditorStore } from '@/stores/editorStore'
import { forceSaveDocument } from '@/api'
import './index.css'

const Toolbar = () => {
  const { currentTemplateId } = useEditorStore()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!currentTemplateId) {
      message.warning('没有可保存的模板')
      return
    }

    setSaving(true)
    try {
      await forceSaveDocument(currentTemplateId)
      message.success('保存请求已发送，正在保存中...')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-logo">
          模板编辑器
        </div>
      </div>

      <div className="toolbar-right">
        <Button type="default" icon={<EyeOutlined />}>
          预览
        </Button>

        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          保存
        </Button>
      </div>
    </div>
  )
}

export default Toolbar
```

- [ ] **Step 3: Commit**

```bash
git add fe/src/api/index.ts fe/src/components/Toolbar/index.tsx
git commit -m "feat: wire up save button in frontend toolbar to trigger document save"
```
