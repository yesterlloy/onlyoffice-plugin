# Loop Region (Comment-based) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "Loop Region" functionality using OnlyOffice comments to mark repeating document areas, with bi-directional conversion to `{{?JK...}}` template syntax.

**Architecture:** Use `AddComment` to mark ranges in OnlyOffice. During `visualToRaw`, identify these comments, wrap their content in loop expressions, and flag internal indicators as `isInLoop`. During `rawToVisual`, restore the comments.

**Tech Stack:** React (Frontend), OnlyOffice Document Builder API (Plugin), JavaScript.

---

### Task 1: Frontend Communication Constants

**Files:**
- Modify: `fe/src/utils/onlyoffice-bridge.ts`

- [ ] **Step 1: Add new message types to `MESSAGE_TYPES`**

```typescript
export const MESSAGE_TYPES = {
  // ... existing
  SET_LOOP_REGION: 'setLoopRegion',
  APPLY_LOOP_REGION: 'applyLoopRegion',
  // ...
}
```

- [ ] **Step 2: Commit**
```bash
git add fe/src/utils/onlyoffice-bridge.ts
git commit -m "feat: add loop region message types"
```

---

### Task 2: Toolbar Integration

**Files:**
- Modify: `fe/src/components/Toolbar/index.tsx`

- [ ] **Step 1: Add "Set as Loop Region" button**

```tsx
<Button 
  type="default" 
  onClick={() => onlyOfficeBridge.send(MESSAGE_TYPES.SET_LOOP_REGION)}
>
  设置为循环区域
</Button>
```

- [ ] **Step 2: Commit**
```bash
git add fe/src/components/Toolbar/index.tsx
git commit -m "feat: add 'Set as Loop Region' button to toolbar"
```

---

### Task 3: Plugin Logic - Adding Comments

**Files:**
- Modify: `sdk/template-doc-agent/scripts/plugin.js`

- [ ] **Step 1: Implement `handleSetLoopRegion`**

```javascript
function handleSetLoopRegion(startTime) {
    window.Asc.plugin.callCommand(function() {
        var oDocument = Api.GetDocument();
        var oRange = oDocument.GetSelection();
        if (oRange) {
            oRange.AddComment("循环区域：【待配置】", "TemplateEditor");
        }
    }, function() {
        // Response handled via bridge if needed
    });
}
```

- [ ] **Step 2: Register message handler in `processMessage`**

```javascript
case 'setLoopRegion':
    handleSetLoopRegion(startTime);
    break;
```

- [ ] **Step 3: Commit**
```bash
git add sdk/template-doc-agent/scripts/plugin.js
git commit -m "feat: implement handleSetLoopRegion in plugin"
```

---

### Task 4: Template Patterns Update

**Files:**
- Modify: `sdk/template-doc-agent/scripts/patterns.js`

- [ ] **Step 1: Add loop and relative indicator patterns**

```javascript
const Patterns = {
    // ...
    LOOP_START: /\{\{\?([A-Z0-9]+)\.subList\((\d+),\s*(\d+)\)\}\}/g,
    LOOP_END: /\{\{\/\}\}/g,
    RELATIVE_INDICATOR: /\{\{=#this\.get\("([a-zA-Z0-9_]+)"\)\}\}/g,
    // ...
};
```

- [ ] **Step 2: Update `parseExpression` to handle these types**

```javascript
// Add cases for LOOP_START, LOOP_END, and RELATIVE_INDICATOR
```

- [ ] **Step 3: Commit**
```bash
git add sdk/template-doc-agent/scripts/patterns.js
git commit -m "feat: update patterns for loop and relative indicators"
```

---

### Task 5: Converter - Visual to Raw (Comments to Loops)

**Files:**
- Modify: `sdk/template-doc-agent/scripts/converter.js`

- [ ] **Step 1: Update `visualToRaw` to process comments**

```javascript
// 1. Get all comments
// 2. Identify loop comments (starts with "循环区域：")
// 3. For each loop comment:
//    a. Get range
//    b. Mark internal CCs with isInLoop = true
//    c. Insert {{?...}} at start and {{/}} at end
//    d. Remove comment
```

- [ ] **Step 2: Update `generateExpression` to handle `isInLoop`**

```javascript
if (tag.isInLoop) {
    return `{{=#this.get("${tag.field}")}}`;
}
```

- [ ] **Step 3: Commit**
```bash
git add sdk/template-doc-agent/scripts/converter.js
git commit -m "feat: support loop region conversion in visualToRaw"
```

---

### Task 6: Converter - Raw to Visual (Loops to Comments)

**Files:**
- Modify: `sdk/template-doc-agent/scripts/converter.js`

- [ ] **Step 1: Update `rawToVisual` to restore comments**

```javascript
// 1. Search for loop patterns
// 2. Convert internal indicators
// 3. Wrap the resulting range in a Comment: "循环区域：【指标名称】"
```

- [ ] **Step 2: Commit**
```bash
git add sdk/template-doc-agent/scripts/converter.js
git commit -m "feat: support loop region restoration in rawToVisual"
```
