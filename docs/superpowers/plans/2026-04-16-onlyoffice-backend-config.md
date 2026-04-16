# OnlyOffice Backend Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the backend `/api/documents/open` endpoint to dynamically configure the OnlyOffice editor with JWT security.

**Architecture:** The frontend requests editor configuration from the backend, which returns a complete `EditorConfigVO`. This VO is stored in `editorStore` and passed to the `OnlyOfficeEditor` component, which merges it with mandatory client-side settings (events, plugins).

**Tech Stack:** React, TypeScript, Zustand, Axios, OnlyOffice React Component.

---

### Task 1: Define Type Definitions

**Files:**
- Modify: `fe/src/types/index.ts`

- [ ] **Step 1: Add OpenDocumentRequest and EditorConfigVO interfaces**

```typescript
// 打开文档请求
export interface OpenDocumentRequest {
  templateId: number
  userId?: string
  userName?: string
}

// OnlyOffice 编辑器配置 VO
export interface EditorConfigVO {
  templateId: number
  templateName: string
  documentKey: string
  documentUrl: string
  documentServerUrl: string
  callbackUrl: string
  editorConfig: Record<string, any>
  token?: string
}
```

- [ ] **Step 2: Commit types**

```bash
git add fe/src/types/index.ts
git commit -m "feat: add OpenDocumentRequest and EditorConfigVO types"
```

---

### Task 2: API Implementation

**Files:**
- Modify: `fe/src/api/index.ts`

- [ ] **Step 1: Implement openDocument function**

```typescript
/** 打开文档编辑器 (从后端获取配置) */
export function openDocument(data: OpenDocumentRequest) {
  if (useMock) {
    console.log('Mock: Open document', data.templateId)
    // 返回 Mock 数据
    return Promise.resolve({
      templateId: data.templateId,
      templateName: 'Mock Template',
      documentKey: `mock_key_${Date.now()}`,
      documentUrl: 'https://example.com/mock.docx',
      documentServerUrl: 'https://documentserver.example.com',
      callbackUrl: 'https://api.example.com/callback',
      editorConfig: {
        document: {
          fileType: 'docx',
          key: `mock_key_${Date.now()}`,
          title: 'Mock Template',
          url: 'https://example.com/mock.docx',
        },
        documentType: 'word',
        editorConfig: {
          mode: 'edit',
          lang: 'zh-CN',
          user: { id: data.userId || 'uid-1', name: data.userName || '模板编辑员' },
        }
      }
    } as EditorConfigVO)
  }
  return request.post<EditorConfigVO>('/documents/open', data)
}
```

- [ ] **Step 2: Commit API changes**

```bash
git add fe/src/api/index.ts
git commit -m "feat: implement openDocument API"
```

---

### Task 3: Update Store State

**Files:**
- Modify: `fe/src/stores/editorStore.ts`

- [ ] **Step 1: Update EditorState interface and imports**

Import `EditorConfigVO` and `openDocument` from `@/api`.
Add `backendConfig: EditorConfigVO | null` and `openTemplate: (templateId: number) => Promise<void>` to `EditorState`.

- [ ] **Step 2: Implement openTemplate action**

```typescript
  backendConfig: null as EditorConfigVO | null,

  openTemplate: async (templateId: number) => {
    set({ loading: true })
    try {
      const config = await openDocument({ templateId })
      set({
        backendConfig: config,
        currentTemplateId: config.templateId,
        documentUrl: config.documentUrl,
        documentKey: config.documentKey,
        documentTitle: config.templateName,
      })
    } catch (error) {
      console.error('Failed to open template:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },
```

- [ ] **Step 3: Commit store changes**

```bash
git add fe/src/stores/editorStore.ts
git commit -m "feat: update editorStore to support backend config"
```

---

### Task 4: Auto-load Template on Page Mount

**Files:**
- Modify: `fe/src/pages/TemplateEditor/index.tsx`

- [ ] **Step 1: Update store destructuring and add mount effect**

Add `openTemplate` and `backendConfig` to `useEditorStore` destructuring.
Add an effect to call `openTemplate(4)` on mount.

```typescript
  const {
    // ... other state
    openTemplate,
    backendConfig,
  } = useEditorStore()

  // 页面加载时自动打开默认模板
  useEffect(() => {
    const init = async () => {
      try {
        await openTemplate(4)
      } catch (error) {
        message.error('加载默认模板失败')
      }
    }
    init()
  }, [openTemplate])
```

- [ ] **Step 2: Update OnlyOfficeEditor component call**

Pass `backendConfig` as `configVO` prop.

```typescript
            {documentUrl ? (
              <OnlyOfficeEditor
                documentId={currentTemplateId?.toString() || ''}
                documentUrl={documentUrl}
                documentKey={documentKey!}
                documentTitle={documentTitle!}
                configVO={backendConfig}
              />
            ) : (
```

- [ ] **Step 3: Commit page changes**

```bash
git add fe/src/pages/TemplateEditor/index.tsx
git commit -m "feat: auto-load template 4 on page mount"
```

---

### Task 5: Refactor OnlyOfficeEditor Component

**Files:**
- Modify: `fe/src/components/OnlyOfficeEditor/index.tsx`

- [ ] **Step 1: Update Props to include optional backend config**

```typescript
interface OnlyOfficeEditorProps {
  documentId: string
  documentUrl: string
  documentKey: string
  documentTitle: string
  configVO?: EditorConfigVO | null // 新增
  onError?: (error: Error) => void
}
```

- [ ] **Step 2: Merge backend config in component**

```typescript
  // 合并编辑器配置
  const editorConfig = configVO ? {
    ...configVO.editorConfig,
    token: configVO.token,
    editorConfig: {
      ...configVO.editorConfig.editorConfig,
      plugins: {
        autostart: ['asc.template-doc-agent'],
        pluginsData: [config.pluginUrl],
      },
      callbackUrl: configVO.callbackUrl || getCallbackUrl(documentId),
    },
    events: {
      onDocumentReady,
      onInfo,
      onError: onErrorEvent,
    },
  } : {
    // 回退到原来的硬编码逻辑 (可选，但为了向后兼容)
    document: {
      fileType: 'docx',
      key: documentKey,
      title: documentTitle,
      url: documentUrl,
      permissions: { edit: true, download: true, print: true, save: true },
    },
    documentType: 'word',
    editorConfig: {
      mode: 'edit',
      lang: 'zh-CN',
      user: { id: 'uid-1', name: '模板编辑员' },
      plugins: {
        autostart: ['asc.template-doc-agent'],
        pluginsData: [config.pluginUrl],
      },
      callbackUrl: getCallbackUrl(documentId),
    },
    events: {
      onDocumentReady,
      onInfo,
      onError: onErrorEvent,
    },
  }
```

- [ ] **Step 3: Commit component changes**

```bash
git add fe/src/components/OnlyOfficeEditor/index.tsx
git commit -m "feat: update OnlyOfficeEditor to use backend config"
```
