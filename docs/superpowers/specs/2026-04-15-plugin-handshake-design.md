# Design Specification: Plugin Handshake Communication (Option D)

## Problem Statement
The frontend application cannot reliably communicate with the OnlyOffice SDK plugin using `postMessage` because the plugin is hosted within a cross-origin iframe structure. Direct DOM traversal to find the plugin's iframe is blocked by the Same-Origin Policy.

## Proposed Solution: Handshake Capture
Instead of the frontend trying to "find" the plugin, the plugin will "find" the frontend.

### 1. Plugin-side (Handshake Initiation)
- When the plugin initializes (`window.Asc.plugin.init`), it sends a "ready" message (`type: 'editorReady'`) to `window.top` and `window.parent`.
- This message is sent via `postMessage('*')`.

### 2. Frontend-side (Source Capture)
- The `OnlyOfficeBridge` listens for all `message` events.
- When a message with `type: 'editorReady'` is received, the bridge captures the `event.source`.
- This `event.source` is a direct reference to the plugin's `window` object, bypassing the need to find its iframe in the DOM.

### 3. Communication Loop
- **Frontend -> Plugin**: The bridge uses the captured `pluginSource.postMessage()` to send commands.
- **Plugin -> Frontend**: The plugin uses the same captured source (if it was a response) or continues sending to `window.top`.

## Technical Changes

### Frontend (`fe/src/utils/onlyoffice-bridge.ts`)
- Add `private pluginSource: MessageEventSource | null = null`.
- Update `handleMessage` to capture `event.source` when `type === 'editorReady'`.
- Update `send` to prioritize `pluginSource` over `editorFrame.contentWindow`.

### Plugin (`sdk/template-doc-agent/scripts/plugin.js`)
- Ensure `reply('editorReady', ...)` is called during `init`.
- (Already implemented in current version, but will be verified).

## Verification Plan
1.  **Manual Test**: Check browser console for `[Bridge] ✅ Captured plugin source from handshake`.
2.  **Functionality Test**: Trigger an "Insert Indicator" action from the frontend and verify the plugin receives it and responds.
3.  **Cross-Origin Test**: Verify it works even when the Document Server is on a different domain.
