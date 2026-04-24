# Design Spec: OnlyOffice Loop Region Feature

## 1. Overview
The "Loop Region" feature allows users to select a block of text (typically a paragraph containing multiple indicators) and mark it as a repeating area. In the final template, this region will be wrapped in a loop expression (e.g., `{{?JK...subList(0,2)}} ... {{/}}`), and all indicators inside will use a relative path (`{{=#this.get(...)}}`).

## 2. Architecture
We will use a **Boundary-based** approach to define the loop region. Instead of a single nested container, we will insert two specific Content Controls: a "Loop Start" marker and a "Loop End" marker. All Content Controls located between these markers will be flagged as being inside a loop.

### 2.1 Communication
New message types in `MESSAGE_TYPES`:
- `SET_LOOP_REGION`: Sent by Frontend to Plugin to initiate the marking of a region.
- `APPLY_LOOP_REGION`: Sent by Frontend to Plugin with the final loop configuration.

### 2.2 Metadata Structure
#### Loop Start (`loop_start`)
```json
{
  "uid": "tag_...",
  "type": "loop_start",
  "name": "循环开始",
  "bindIndicator": "JK...664",
  "subList": [0, 2],
  "paramValues": {
    "bindIndicator": "JK...664",
    "subListStart": 0,
    "subListEnd": 2
  }
}
```

#### Loop End (`loop_end`)
```json
{
  "uid": "tag_...",
  "type": "loop_end",
  "name": "循环结束"
}
```

#### Child Indicator (Update)
Existing indicators will have an additional field:
```json
{
  "isInLoop": true
}
```

## 3. Implementation Details

### 3.1 Plugin Logic (`plugin.js` & `contentControl.js`)
1. **`handleSetLoopRegion`**:
   - Check if text is selected. If not, warn the user.
   - Get the current selection range using `Api.GetDocument().GetSelection()`.
   - Before inserting markers, identify all existing Content Controls that intersect with or are contained within the selection range.
   - Insert the `loop_start` control at the start of the selection and `loop_end` at the end.
   - For each identified child Content Control, update its `Tag` metadata to include `isInLoop: true`.
   - Note: If using `callCommand`, we can use `oRange.GetSearch(options)` or iterate through `oDocument.GetAllContentControls()` and check `oControl.GetRange().IsOverlapping(oSelectionRange)`.

### 3.2 Converter Logic (`converter.js`)
#### Visual to Raw
- **`generateExpression(tag)`**:
  - `loop_start`: Return `{{?${tag.bindIndicator}.subList(${tag.subList[0]},${tag.subList[1]})}}`.
  - `loop_end`: Return `{{/}}`.
  - If `tag.isInLoop === true`: Change expression generation to `{{=#this.get("${tag.field}")}}`.

#### Raw to Visual
- Detect `{{?....subList(..)}}` pattern and create a `loop_start` control.
- Detect `{{/}}` and create a `loop_end` control.
- Detect `{{=#this.get(..)}}` and create an indicator with `isInLoop: true`.

### 3.3 Frontend UI
- **Toolbar**: Add a button labeled "设置为循环区域" (Set as Loop Region).
- **ConfigPanel**:
  - When a `loop_start` control is clicked, show a specialized configuration UI.
  - Dropdown to select the base indicator.
  - Numeric inputs for `subList` start and end indices.

## 4. Error Handling
- **Empty Selection**: Show a warning if the user clicks the button without selecting text.
- **Nested Loops**: For the initial version, we will support single-level loops. If a loop is already present in the selection, we may warn the user or prevent overlapping markers.
- **Deleted Marker**: If a user deletes the `loop_start` but keeps `loop_end` (or vice versa), the conversion might fail or generate invalid raw tags. We should add `Lock: 1` (Cannot delete) or visual indicators.

## 5. Visual Styling
- `loop_start`: Color `#F59E0B` (same as condition), Icon `🔁`.
- `loop_end`: Color `#F59E0B`, Icon `🔚`.
