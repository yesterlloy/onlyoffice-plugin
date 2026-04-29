# OnlyOffice Loop Region Click Detection Plan (onClickAnnotation-based)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement click detection on OnlyOffice loop regions using the `onClickAnnotation` event, and show a configuration window in the frontend.

**Architecture:**
- **Plugin (`plugin.js`)**: Attach `onClickAnnotation` to detect when a comment is clicked. Use `callCommand` to get the comment text and send it to the frontend.
- **Bridge & Store**: Use `loopCommentClicked` and `applyLoopConfig` messages.
- **Frontend UI**: Show Loop Configuration in `ConfigPanel`.

---

### Task 1: Update Frontend Communication Constants

**Files:**
- Modify: `fe/src/utils/onlyoffice-bridge.ts`

- [ ] **Step 1: Add new message types**

```typescript
export const MESSAGE_TYPES = {
  // ... existing ...
  LOOP_COMMENT_CLICKED: 'loopCommentClicked',
  APPLY_LOOP_CONFIG: 'applyLoopConfig',
  // ...
}
```

- [ ] **Step 2: Commit**

---

### Task 2: Plugin Logic - Detect Annotation Click

**Files:**
- Modify: `sdk/template-doc-agent/scripts/plugin.js`

- [ ] **Step 1: Attach `onClickAnnotation` listener**

In `plugin.js`, inside the `init` or listener attachment section:
```javascript
        window.Asc.plugin.attachEditorEvent("onClickAnnotation", function(data) {
          log('🖱️ EditorEvent: onClickAnnotation', data);
          
          // Use callCommand to get the comment at the current selection
          // When an annotation is clicked, OnlyOffice usually selects its range.
          window.Asc.plugin.callCommand(function() {
              var oDocument = Api.GetDocument();
              var oRange = oDocument.GetRangeBySelect();
              if (!oRange) return null;

              // ApiRange.GetComments() returns comments for the range
              var aComments = oRange.GetComments();
              if (aComments && aComments.length > 0) {
                  for (var i = 0; i < aComments.length; i++) {
                      var text = aComments[i].GetText();
                      if (text && text.indexOf("循环区域：") === 0) {
                          return {
                              text: text,
                              quote: aComments[i].GetQuoteText(),
                              author: aComments[i].GetAuthor()
                          };
                      }
                  }
              }
              return null;
          }, false, true, function(commentData) {
              if (commentData) {
                  log('Found loop comment via onClickAnnotation:', commentData);
                  reply('loopCommentClicked', commentData);
              }
          });
        });
```

- [ ] **Step 2: Commit**

---

### Task 3: Store Management for Loop Config

**Files:**
- Modify: `fe/src/stores/editorStore.ts`

- [ ] **Step 1: Define loop state and actions**

```typescript
  currentLoopConfig: null,
  setCurrentLoopConfig: (config) => set({ currentLoopConfig: config }),

  applyLoopConfigToOnlyOffice: async (config) => {
    return await onlyOfficeBridge.send(MESSAGE_TYPES.APPLY_LOOP_CONFIG, config);
  },
```

- [ ] **Step 2: Commit**

---

### Task 4: Bridge Message Listener in Template Editor

**Files:**
- Modify: `fe/src/pages/TemplateEditor/index.tsx`

- [ ] **Step 1: Add listener for `LOOP_COMMENT_CLICKED`**

```typescript
    const handleLoopCommentClicked = (data: any) => {
      setCurrentEditingTag(null);
      setCurrentLoopConfig(data);
      setConfigPanelVisible(true);
    };
    onlyOfficeBridge.on(MESSAGE_TYPES.LOOP_COMMENT_CLICKED, handleLoopCommentClicked);
```

- [ ] **Step 2: Commit**

---

### Task 5: UI - Render Loop Config in ConfigPanel

**Files:**
- Modify: `fe/src/components/ConfigPanel/index.tsx`

- [ ] **Step 1: Support `currentLoopConfig` rendering**

Render a loop-specific form with Indicator selection and subList parameters.

- [ ] **Step 2: Commit**

---

### Task 6: Plugin Logic - Apply Loop Config

**Files:**
- Modify: `sdk/template-doc-agent/scripts/plugin.js`

- [ ] **Step 1: Implement `handleApplyLoopConfig`**

Update the comment text by removing the old one and adding a new one with the bound indicator info.

- [ ] **Step 2: Commit**
