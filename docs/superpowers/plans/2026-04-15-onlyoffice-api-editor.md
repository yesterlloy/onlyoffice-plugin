# OnlyOffice API Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new React component `OnlyOfficeApiEditor` that initializes the OnlyOffice editor by directly calling the `DocsAPI` from `api.js`, providing a more flexible alternative to the React wrapper.

**Architecture:** The component dynamically loads the Document Server's `api.js` script, then uses `new DocsAPI.DocEditor()` to mount the editor into a DOM element. It maintains compatibility with the existing `onlyOfficeBridge` for plugin communication.

**Tech Stack:** React, TypeScript, OnlyOffice SDK (DocsAPI).

---

### Task 1: Create the ApiEditor Component

**Files:**
- Create: `fe/src/components/OnlyOfficeEditor/ApiEditor.tsx`

- [ ] **Step 1: Define the component structure and props**

```typescript
// fe/src/components/OnlyOfficeEditor/ApiEditor.tsx
import { useEffect, useRef, useState } from 'react'
import { message } from 'antd'
import config, { getCallbackUrl, getDocServerApiUrl } from '@/config'
import { onlyOfficeBridge, MESSAGE_TYPES } from '@/utils/onlyoffice-bridge'
import './index.css'

interface OnlyOfficeApiEditorProps {
  documentId: string
  documentUrl: string
  documentKey: string
  documentTitle: string
  onError?: (error: Error) => void
}

declare global {
  interface Window {
    DocsAPI?: any
    docEditor?: any
  }
}

const OnlyOfficeApiEditor = ({
  documentId,
  documentUrl,
  documentKey,
  documentTitle,
  onError,
}: OnlyOfficeApiEditorProps) => {
  const editorInstance = useRef<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // ... implementation follows
  return (
    <div className="onlyoffice-editor-wrapper" id="onlyoffice-editor-wrapper">
      <div id="onlyoffice-api-container" style={{ width: '100%', height: '100%' }}></div>
    </div>
  )
}

export default OnlyOfficeApiEditor
```

- [ ] **Step 2: Implement dynamic script loading**

Add the script loading logic to the `useEffect` hook.

```typescript
  useEffect(() => {
    if (window.DocsAPI) {
      setScriptLoaded(true)
      return
    }

    const scriptUrl = getDocServerApiUrl()
    console.log('[ApiEditor] Loading OnlyOffice API script:', scriptUrl)

    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => {
      console.log('[ApiEditor] OnlyOffice API script loaded')
      setScriptLoaded(true)
    }
    script.onerror = () => {
      const err = new Error('Failed to load OnlyOffice API script')
      console.error('[ApiEditor]', err)
      onError?.(err)
      message.error(err.message)
    }

    document.head.appendChild(script)

    return () => {
      // Optional: Cleanup script if desired, though usually kept for session
    }
  }, [onError])
```

- [ ] **Step 3: Implement editor initialization and cleanup**

Add a second `useEffect` to initialize the editor once the script is loaded.

```typescript
  useEffect(() => {
    if (!scriptLoaded || !window.DocsAPI) return

    const initEditor = () => {
      console.log('[ApiEditor] Initializing DocsAPI.DocEditor')
      
      const editorConfig = {
        document: {
          fileType: 'docx',
          key: documentKey,
          title: documentTitle,
          url: documentUrl,
          permissions: {
            edit: true,
            download: true,
            print: true,
            save: true,
          },
        },
        documentType: 'word',
        height: '100%',
        width: '100%',
        editorConfig: {
          mode: 'edit',
          lang: 'zh-CN',
          user: {
            id: 'uid-1',
            name: '模板编辑员',
          },
          plugins: {
            autostart: ['asc.template-doc-agent'],
            pluginsData: [config.pluginUrl],
          },
          customization: {
            chat: false,
            compactHeader: true,
            feedback: false,
            forcesave: true,
            goback: {
              url: '/templates',
            },
          },
          callbackUrl: getCallbackUrl(documentId),
        },
        events: {
          onDocumentReady: () => {
            console.log('[ApiEditor] Document ready')
            onlyOfficeBridge.init('onlyoffice-editor-wrapper')
          },
          onError: (event: any) => {
            console.error('[ApiEditor] Error event:', event)
            const errorMsg = event?.data?.error || '编辑器加载失败'
            onError?.(new Error(errorMsg))
            message.error(errorMsg)
          }
        },
      }

      try {
        editorInstance.current = new window.DocsAPI.DocEditor('onlyoffice-api-container', editorConfig)
        window.docEditor = editorInstance.current
        console.log('[ApiEditor] ✅ Editor instance created')
      } catch (e: any) {
        console.error('[ApiEditor] Failed to create editor instance:', e)
        onError?.(e)
      }
    }

    initEditor()

    return () => {
      if (editorInstance.current) {
        console.log('[ApiEditor] Destroying editor instance')
        editorInstance.current.destroyEditor()
        editorInstance.current = null
        window.docEditor = null
      }
      onlyOfficeBridge.destroy()
    }
  }, [scriptLoaded, documentId, documentUrl, documentKey, documentTitle, onError])
```

- [ ] **Step 4: Export from index**

Update `fe/src/components/OnlyOfficeEditor/index.ts` to export the new component.

```typescript
// fe/src/components/OnlyOfficeEditor/index.ts
export { default as OnlyOfficeEditor } from './index.tsx'
export { default as OnlyOfficeApiEditor } from './ApiEditor'
```

- [ ] **Step 5: Commit changes**

```bash
git add fe/src/components/OnlyOfficeEditor/ApiEditor.tsx fe/src/components/OnlyOfficeEditor/index.ts
git commit -m "feat(fe): add OnlyOfficeApiEditor for direct SDK usage"
```

---

### Task 2: Verification

- [ ] **Step 1: Verify dynamic loading**
In the browser, check the Network tab and Head elements to ensure `api.js` is loaded correctly.

- [ ] **Step 2: Verify initialization**
Confirm the editor renders in the `onlyoffice-api-container` div.

- [ ] **Step 3: Verify bridge communication**
Check the console for `[Bridge] ✅ Editor iframe connected` and verify plugin actions still work.
