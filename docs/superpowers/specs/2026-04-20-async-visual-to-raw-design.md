# Design Spec: Async visualToRaw and rawToVisual with In-Place Manipulation

## Context
The ONLYOFFICE plugin needs to convert between visual Content Controls and raw template expressions (e.g., `{{JK4816.get("year")}}`). Both directions currently use synchronous logic that fails due to the asynchronous nature of the ONLYOFFICE API.

## Goals
1. Implement `visualToRaw` using `GetAllContentControls` directly.
2. Implement `rawToVisual` using `Search` and `InsertAndReplaceContentControls`.
3. Ensure both directions correctly wait for all asynchronous API calls using Promises.
4. Use "In-Place Manipulation" to ensure accurate text positioning.

## Architecture

### 1. Promise Wrapper Utility
Added to `converter.js` to allow `async/await` syntax for ONLYOFFICE `executeMethod`.

```javascript
function executeMethodPromise(method, params) {
  return new Promise((resolve, reject) => {
    try {
      window.Asc.plugin.executeMethod(method, params, (result) => {
        resolve(result);
      });
    } catch (err) {
      reject(err);
    }
  });
}
```

### 2. Async `visualToRaw` Logic (Visual → Raw)
1. **Get Controls**: Fetch all controls using `GetAllContentControls`.
2. **Transform Controls**:
   - Loop through each control.
   - For each, use its `Tag` to generate a `{{expression}}`.
   - Temporarily replace the control with this plain text expression.
3. **Capture**: Call `GetDocumentContent` to retrieve the template-ready string.
4. **Restore**: Call `Undo` to revert the document to its visual state.

### 3. Async `rawToVisual` Logic (Raw → Visual)
1. **Identify Expressions**: Find all `{{...}}` expressions in the document (either via `GetDocumentContent` or `Search`).
2. **Sequential Replacement**:
   - For each expression found:
     - Check if it exists in the `indicatorMap`.
     - If yes, use `Search` to locate it in the document.
     - `Select` the result and call `InsertAndReplaceContentControls` to replace the raw text with a visual Content Control.
   - **Crucial**: Must be done sequentially (`await`) to avoid race conditions with the document selection.

### 4. Plugin Integration
`plugin.js` will be updated to `await` both `Converter.visualToRaw()` and `Converter.rawToVisual()`.

## Data Flow
- **Save Path**: `convertToRaw` (msg) → `visualToRaw()` (async) → `convertDone` (msg with raw string).
- **Load Path**: `convertToVisual` (msg) → `rawToVisual(map)` (async) → `convertDone` (msg).

## Success Criteria
- Round-trip conversion (Visual → Raw → Visual) preserves all indicator data.
- The document accurately reflects the requested state after each operation.
- No "empty content" or "undefined" errors during heavy document processing.
