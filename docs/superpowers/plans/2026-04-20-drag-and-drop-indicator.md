# Drag and Drop Indicator Insertion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement native drag-and-drop to allow users to drag an indicator from the panel and drop it into the OnlyOffice editor exactly at the mouse release position.

**Architecture:** We will replace `@dnd-kit/core` with native HTML5 drag-and-drop. When an indicator is dragged, we set its `dataTransfer` text to a unique placeholder (`[[TAG_uid]]`). When dropped into the editor, OnlyOffice natively inserts this text at the drop position. The frontend's `onDragEnd` event then triggers the plugin to search for this placeholder, clear it, and insert the actual Content Control in its place.

**Tech Stack:** React, HTML5 Drag and Drop, OnlyOffice Plugin API.

---

### Task 1: Update Frontend Store and Bridge

**Files:**
- Modify: `fe/src/utils/onlyoffice-bridge.ts`
- Modify: `fe/src/stores/editorStore.ts`

- [ ] **Step 1: Add new message type to bridge**

In `fe/src/utils/onlyoffice-bridge.ts`, add `REPLACE_DROPPED_INDICATOR`:

```typescript
export const MESSAGE_TYPES = {
  // ... existing types
  CONVERT_TO_RAW: 'convertToRaw',
  CONVERT_TO_VISUAL: 'convertToVisual',
  REPLACE_DROPPED_INDICATOR: 'replaceDroppedIndicator',
}
```

- [ ] **Step 2: Add store action to EditorState interface**

In `fe/src/stores/editorStore.ts`, add the method signature:

```typescript
  // ... existing actions
  convertToRawTemplate: () => Promise<any>
  saveTemplate: (rawContent: string, indicatorMap: Record<string, any>) => Promise<void>
  replaceDroppedIndicatorInOnlyOffice: (dropUid: string, indicator: DocTagItem) => Promise<any>
}
```

- [ ] **Step 3: Implement the store action**

In `fe/src/stores/editorStore.ts`, add the implementation:

```typescript
  // ... inside useEditorStore
  replaceDroppedIndicatorInOnlyOffice: async (dropUid, indicator) => {
    console.log('[Store] 🚀 replaceDroppedIndicatorInOnlyOffice START', { dropUid, indicator })
    try {
      const messageData = {
        dropUid,
        indicator: {
          uid: indicator.uid || `tag_${Date.now()}`,
          indicatorId: indicator.indicatorId,
          code: indicator.code,
          field: indicator.field,
          name: indicator.name,
          type: indicator.type,
          chartType: indicator.chartType,
          paramValues: indicator.paramValues || {},
        }
      }
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.REPLACE_DROPPED_INDICATOR, messageData)
      console.log('[Store] ✅ replaceDroppedIndicator SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ replaceDroppedIndicator FAILED:', error)
      throw error
    }
  },
```

- [ ] **Step 4: Commit**

```bash
git add fe/src/utils/onlyoffice-bridge.ts fe/src/stores/editorStore.ts
git commit -m "feat: add replaceDroppedIndicator action to store and bridge"
```

---

### Task 2: Implement Plugin and Converter Logic

**Files:**
- Modify: `sdk/template-doc-agent/scripts/converter.js`
- Modify: `sdk/template-doc-agent/scripts/plugin.js`

- [ ] **Step 1: Implement `replaceDroppedPlaceholder` in converter.js**

Add this method to `converter.js` inside the IIFE, near the `rawToVisual` method. Don't forget to export it.

```javascript
  /**
   * 替换拖拽时插入的占位符文本为 Content Control
   * @param {string} dropUid - 占位符 ID
   * @param {Object} indicatorData - 指标数据
   */
  async function replaceDroppedPlaceholder(dropUid, indicatorData) {
    log('========== REPLACE_DROPPED_PLACEHOLDER START ==========');
    const searchString = `[[TAG_${dropUid}]]`;
    log(`🔍 Searching for dropped placeholder: ${searchString}`);

    try {
      const searchResult = await executeMethodPromise('SearchNext', [
        {
          "searchString": searchString,
          "matchCase": true
        },
        false // Do not wrap around
      ]);

      if (searchResult) {
        log(`📍 Found placeholder, replacing with Content Control...`);
        // 选中并清空占位符文本
        await executeMethodPromise('InputText', ['', searchString]);
        
        // 插入 Content Control
        window.ContentControlModule.insert(indicatorData);
        logSuccess('replaceDroppedPlaceholder complete');
        return true;
      } else {
        logError(`🏁 Placeholder not found: ${searchString}`);
        return false;
      }
    } catch (error) {
      logError(`Failed to replace placeholder:`, error.message);
      return false;
    }
  }
```

Export it in `window.ConverterModule`:
```javascript
  window.ConverterModule = {
    visualToRaw: visualToRaw,
    rawToVisual: rawToVisual,
    replaceDroppedPlaceholder: replaceDroppedPlaceholder,
    // ...
```

- [ ] **Step 2: Add message handler in plugin.js**

In `sdk/template-doc-agent/scripts/plugin.js`, add `handleReplaceDroppedIndicator`:

```javascript
  async function handleReplaceDroppedIndicator(data, startTime) {
    log('🎯 Handling replaceDroppedIndicator:', data.dropUid);

    try {
      if (Converter.replaceDroppedPlaceholder) {
        // 等待一小段时间，确保 OnlyOffice 原生拖放的文本已完成插入并被索引
        setTimeout(async () => {
          await Converter.replaceDroppedPlaceholder(data.dropUid, data.indicator);
          const elapsed = Date.now() - startTime;
          logSuccess('Replace dropped indicator complete', { elapsed: elapsed + 'ms' });
          reply('replaceDroppedDone', {
            uid: data.indicator.uid,
            elapsed: elapsed,
            timestamp: Date.now()
          });
        }, 300); // 300ms 延迟
      }
    } catch (error) {
      logError('Replace dropped indicator failed:', error.message);
      reply('replaceDroppedError', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
```

Update `processMessage` to handle it:
```javascript
      case 'replaceDroppedIndicator':
        log('🎯 Handling: replaceDroppedIndicator');
        handleReplaceDroppedIndicator(data, startTime);
        break;
```

Update `window.TemplateDocAgent` exports:
```javascript
    handleConvertToVisual,
    handleReplaceDroppedIndicator,
    log,
```

- [ ] **Step 3: Commit**

```bash
git add sdk/template-doc-agent/scripts/converter.js sdk/template-doc-agent/scripts/plugin.js
git commit -m "feat: implement replaceDroppedPlaceholder in plugin to handle drag and drop"
```

---

### Task 3: Refactor IndicatorPanel for Native Drag

**Files:**
- Modify: `fe/src/components/IndicatorPanel/index.tsx`

- [ ] **Step 1: Remove `@dnd-kit/core` and implement native drag**

Update `DraggableIndicatorProps` and `IndicatorPanelProps`:

```typescript
interface DraggableIndicatorProps {
  indicator: IndicatorMetadata
  onInsert?: (indicator: IndicatorMetadata) => void
  onDragStart?: (uid: string, indicator: IndicatorMetadata) => void
  onDragEnd?: (uid: string, indicator: IndicatorMetadata) => void
}

interface IndicatorPanelProps {
  categories: IndicatorCategory[]
  onIndicatorInsert?: (indicator: IndicatorMetadata) => void
  onIndicatorDrop?: (uid: string, indicator: IndicatorMetadata) => void
}
```

Refactor `DraggableIndicator` to use native HTML5 drag events instead of `@dnd-kit/core`:

```tsx
const DraggableIndicator = ({ indicator, onInsert, onDragStart, onDragEnd }: DraggableIndicatorProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragUid, setDragUid] = useState('')

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onInsert?.(indicator)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const uid = Date.now().toString()
    setDragUid(uid)
    setIsDragging(true)
    
    // 设置原生拖放数据，当拖入 OnlyOffice 编辑器时，会自动插入这段文本
    e.dataTransfer.setData('text/plain', `[[TAG_${uid}]]`)
    e.dataTransfer.effectAllowed = 'copy'
    
    onDragStart?.(uid, indicator)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false)
    if (dragUid) {
      onDragEnd?.(dragUid, indicator)
    }
  }

  return (
    <div
      className={`indicator-item ${isDragging ? 'dragging' : ''}`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="indicator-drag-handle">
        <span className="indicator-item-drag">⠿</span>
      </div>

      <div className="indicator-item-dot" style={{ background: typeColors[indicator.type] }} />
      <div className="indicator-item-content">
        <Text strong>{indicator.name}</Text>
        <Text type="secondary" className="indicator-item-meta">
          {indicator.code} · {indicator.previewValue || '-'}
        </Text>
      </div>
      <Tag color={typeColors[indicator.type]} className="indicator-item-tag">
        {typeLabels[indicator.type]}
      </Tag>
      {onInsert && (
        <Tooltip title="点击插入">
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleInsert}
            className="indicator-item-insert"
          />
        </Tooltip>
      )}
    </div>
  )
}
```

Update the tree rendering in `IndicatorPanel` to pass `onDragEnd` up:

```tsx
    children: cat.indicators.map((ind) => ({
      key: `ind-${ind.indicatorId}`,
      title: <DraggableIndicator 
               indicator={ind} 
               onInsert={onIndicatorInsert} 
               onDragEnd={onIndicatorDrop} 
             />,
      isLeaf: true,
    })),
```

- [ ] **Step 2: Commit**

```bash
git add fe/src/components/IndicatorPanel/index.tsx
git commit -m "feat: use native HTML5 drag and drop for indicators"
```

---

### Task 4: Integrate Drag-and-Drop in TemplateEditorPage

**Files:**
- Modify: `fe/src/pages/TemplateEditor/index.tsx`

- [ ] **Step 1: Remove `@dnd-kit/core` logic**

Remove `DndContext`, `DragOverlay`, `closestCenter`, `DragEndEvent` imports.
Remove `handleDragStart`, `handleDragEnd` functions, and `activeId` state.
Remove the `<DndContext>` wrapper around the `<Layout>` and the `<DragOverlay>`.

- [ ] **Step 2: Implement `handleDropIndicator`**

Add a handler for the native drag end event to send the replacement request.

```tsx
  const handleDropIndicator = async (uid: string, indicator: IndicatorMetadata) => {
    if (!editorReady) return

    try {
      const detail = indicatorMap.get(indicator.indicatorId)
      const paramValues = detail ? getDefaultParamValues(detail) : {}

      const tagItem = {
        uid: '',
        indicatorId: indicator.indicatorId,
        code: indicator.code,
        field: indicator.field,
        name: indicator.name,
        type: indicator.type,
        chartType: indicator.chartType,
        paramValues,
      }

      await useEditorStore.getState().replaceDroppedIndicatorInOnlyOffice(uid, tagItem)
      message.success(`已插入「${indicator.name}」`)
    } catch (error) {
      console.error('插入失败:', error)
      message.error('插入失败')
    }
  }
```

- [ ] **Step 3: Pass to IndicatorPanel**

Update the `IndicatorPanel` usage:

```tsx
              <IndicatorPanel
                categories={categories}
                onIndicatorInsert={handleInsertIndicator}
                onIndicatorDrop={handleDropIndicator}
              />
```

- [ ] **Step 4: Commit**

```bash
git add fe/src/pages/TemplateEditor/index.tsx
git commit -m "feat: integrate native drag drop handling in template editor page"
```
