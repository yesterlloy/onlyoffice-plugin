# Design Spec: OnlyOffice Loop Region Feature (Comment-based)

## 1. Overview
The "Loop Region" feature allows users to select a block of text and mark it as a repeating area using OnlyOffice **Comments (Annotations)**. During conversion, these commented regions are transformed into loop expressions (e.g., `{{?JK...subList(0,2)}} ... {{/}}`), and internal indicators are converted to relative paths (`{{=#this.get(...)}}`).

## 2. Architecture
We will use OnlyOffice's native Comment system to define the boundaries of a loop region.

### 2.1 Communication
- `SET_LOOP_REGION`: Frontend -> Plugin. Triggers comment insertion.
- `APPLY_LOOP_REGION`: Frontend -> Plugin. Updates the comment with specific indicator/params.

### 2.2 Metadata & Identification
- **Comment Format**: `循环区域：【${indicatorName}】`
- **Configuration**: Since comments are primarily text, the configuration (Indicator ID, subList params) will be derived from the indicator mapping or encoded in a hidden way if necessary. For this design, we assume the `indicatorName` allows us to look up the `indicatorId`.

## 3. Implementation Details

### 3.1 Plugin Logic (`plugin.js`)
1. **`handleSetLoopRegion`**:
   - Verify selection.
   - Use `Api.GetDocument().GetSelection().AddComment(text, author)` to mark the region.
   - The initial text will be a placeholder: `循环区域：【待配置】`.
   - Once the user selects an indicator in the ConfigPanel, update the comment text to `循环区域：【${name}】`.

### 3.2 Converter Logic (`converter.js`)
#### Visual to Raw
1. **Identify Loop Regions**:
   - Use `Api.GetDocument().GetAllComments()` to find all loop-related comments.
   - For each comment:
     - Get the range: `comment.GetRange()`.
     - Identify all Content Controls within this range.
     - Mark these child controls with `isInLoop: true` in-memory.
2. **Transform Range**:
   - At the start of the comment range, insert `{{?JK...subList(0,2)}}`.
   - At the end of the comment range, insert `{{/}}`.
   - Delete the comment after conversion (or during the `visualToRaw` process).
3. **Indicator Conversion**:
   - Indicators flagged with `isInLoop` generate `{{=#this.get("field")}}`.

#### Raw to Visual
1. **Detect Loops**:
   - Find `{{?...}}` and `{{/}}` pairs.
   - Extract the content between them.
2. **Apply Comments**:
   - After converting the internal indicators to visual controls, select the entire block.
   - Add a comment with the format `循环区域：【${indicatorName}】`.

### 3.3 Frontend UI
- **Toolbar**: "设置为循环区域" button.
- **ConfigPanel**:
  - Show configuration when a Loop Comment is active or when the region is selected.
  - Bind the loop to a specific indicator and set `subList` parameters.

## 4. Visual Styling
- Loop regions will be visually identified by OnlyOffice's native comment highlighting.
