# OnlyOffice Frontend Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a functional "Save" button in the template editor toolbar that triggers an OnlyOffice force save via the frontend SDK.

**Architecture:**
- **Frontend:** The "Save" button in `Toolbar` component will invoke `window.docEditor.serviceCommand('forceSave')`.
- **Backend:** The existing `DocumentController` and `TemplateService` already handle the `status 6` callback to download the file from OnlyOffice and upload it to OSS.

**Tech Stack:** React, antd, Spring Boot (Cleanup)

---

### Task 1: Update Frontend Toolbar

**Files:**
- Modify: `fe/src/components/Toolbar/index.tsx`

- [ ] **Step 1: Implement handleSave function**

Modify `fe/src/components/Toolbar/index.tsx` to add the click handler:

```tsx
import { Button, message } from 'antd'
import { EyeOutlined, SaveOutlined } from '@ant-design/icons'
import './index.css'

const Toolbar = () => {
  const handleSave = () => {
    try {
      if (window.docEditor) {
        window.docEditor.serviceCommand('forceSave');
        message.info('正在请求保存文档...');
      } else {
        message.error('编辑器尚未就绪，无法保存');
      }
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存请求失败');
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

        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  )
}

export default Toolbar
```

- [ ] **Step 2: Verify in browser (manual)**
Confirm that clicking "Save" shows the "正在请求保存文档..." message and triggers a callback in the backend logs.

- [ ] **Step 3: Commit**

```bash
git add fe/src/components/Toolbar/index.tsx
git commit -m "feat: implement frontend save trigger via OnlyOffice SDK"
```

### Task 2: Backend Cleanup (Optional but Recommended)

**Files:**
- Modify: `be/template-editor-api/src/main/java/com/yl/template/api/controller/DocumentController.java`
- Modify: `be/template-editor-service/src/main/java/com/yl/template/service/document/OnlyOfficeDocumentService.java`

- [ ] **Step 1: Remove redundant forceSave endpoint in DocumentController**

Remove the `forceSave` method from `DocumentController.java` as it is no longer needed with the frontend trigger.

- [ ] **Step 2: Remove forceSave method in OnlyOfficeDocumentService**

Remove the `forceSave` method from `OnlyOfficeDocumentService.java`.

- [ ] **Step 3: Run tests to ensure no regressions**

Run: `mvn test -f be/pom.xml`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add be/template-editor-api/src/main/java/com/yl/template/api/controller/DocumentController.java be/template-editor-service/src/main/java/com/yl/template/service/document/OnlyOfficeDocumentService.java
git commit -m "refactor: remove redundant backend forceSave logic"
```
