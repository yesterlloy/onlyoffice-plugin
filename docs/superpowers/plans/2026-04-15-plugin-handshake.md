# Plugin Handshake Communication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable reliable cross-origin communication between the frontend and the OnlyOffice plugin by capturing the plugin's `window` object during an initial handshake.

**Architecture:** The plugin sends an `editorReady` message to `window.top` on startup. The frontend bridge captures the `event.source` from this message and uses it as the direct target for all subsequent `postMessage` calls.

**Tech Stack:** TypeScript (Frontend), JavaScript (Plugin SDK), Web PostMessage API.

---

### Task 1: Update Frontend Bridge to Capture Plugin Source

**Files:**
- Modify: `fe/src/utils/onlyoffice-bridge.ts`

- [ ] **Step 1: Add `pluginSource` property and update `handleMessage`**

Modify `OnlyOfficeBridge` class to store the captured source and update the message handler to perform the capture.

```typescript
// fe/src/utils/onlyoffice-bridge.ts

class OnlyOfficeBridge {
  // ... existing properties
  private pluginSource: MessageEventSource | null = null;

  // ...

  private handleMessage(event: MessageEvent): void {
    const msg = event.data
    if (!msg || typeof msg !== 'object') return

    // 忽略来自自身的消息
    if (event.source === window) return

    const { type, data } = msg
    if (!type) return

    // Capture the plugin source on editorReady
    if (type === 'editorReady') {
        this.pluginSource = event.source;
        console.log(`${LOG_PREFIX} ✅ Captured plugin source from handshake`);
    }

    console.log(`${LOG_PREFIX} 📥 POSTMESSAGE RESPONSE`, { type, data, origin: event.origin })
    this.dispatchToHandlers(type, data)
  }
}
```

- [ ] **Step 2: Update `send` method to use `pluginSource`**

Modify the `send` method to prioritize the captured `pluginSource`.

```typescript
// fe/src/utils/onlyoffice-bridge.ts

  send(type: string, data?: any): Promise<any> {
    this.messageId++
    const msgId = this.messageId
    const startTime = Date.now()

    console.log(`${LOG_PREFIX} 📤 [${msgId}] SEND`, { type, data })

    return new Promise((resolve, reject) => {
      // Prioritize pluginSource over editorFrame
      const targetWindow = this.pluginSource || this.editorFrame?.contentWindow;

      if (!targetWindow) {
        console.error(`${LOG_PREFIX} ❌ [${msgId}] No communication target available (pluginSource or editorFrame)`)
        reject(new Error('No communication target available'))
        return
      }

      // ... existing callback logic ...

      // 发送 postMessage
      console.log(`${LOG_PREFIX} 📤 [${msgId}] postMessage to ${this.pluginSource ? 'captured source' : 'iframe'}`)
      targetWindow.postMessage(message, '*')
    })
  }
```

- [ ] **Step 3: Commit changes**

```bash
git add fe/src/utils/onlyoffice-bridge.ts
git commit -m "feat(fe): capture plugin source on handshake and use for communication"
```

---

### Task 2: Verify Plugin Handshake Initiation

**Files:**
- Modify: `sdk/template-doc-agent/scripts/plugin.js`

- [ ] **Step 1: Ensure `editorReady` is sent to `window.top`**

Verify that the `reply` function sends the `editorReady` message to `window.top` during initialization.

```javascript
// sdk/template-doc-agent/scripts/plugin.js

  // 插件初始化
  window.Asc.plugin.init = function() {
    log('🚀 Plugin initialized');
    // ...
    // 通知前端插件已就绪
    reply('editorReady', { initialized: true, timestamp: Date.now() });
    logSuccess('Editor ready notification sent');
  };

  // ... in reply/sendFallback ...
  function sendFallback(message) {
    // ...
    try {
      if (window.top && window.top !== window) {
        window.top.postMessage(message, '*');
        log('📤 Fallback: sent to window.top');
      }
    } catch (e) {
      log('⚠️ window.top failed:', e.message);
    }
    // ...
  }
```

- [ ] **Step 2: Commit changes (if any were needed)**

```bash
git add sdk/template-doc-agent/scripts/plugin.js
git commit -m "chore(sdk): ensure editorReady handshake reaches window.top"
```

---

### Task 3: Final Verification

- [ ] **Step 1: Verify in browser**
1. Open the application.
2. Check console for `[Bridge] ✅ Captured plugin source from handshake`.
3. Try an operation (e.g., inserting an indicator).
4. Verify the message is sent to "captured source" and a response is received.

- [ ] **Step 2: Clean up design docs**
Move the design spec to the final location if needed.
