# Design Spec: Async visualToRaw with In-Place Manipulation

## Context
The ONLYOFFICE plugin needs to convert visual Content Controls back into raw template expressions (e.g., `{{JK4816.get("year")}}`) for saving. The current implementation is synchronous and fails because ONLYOFFICE API calls are asynchronous.

## Goals
1. Implement `visualToRaw` using `GetAllContentControls` directly.
2. Ensure the conversion correctly waits for all asynchronous API calls.
3. Use an "In-Place Manipulation" strategy to accurately replace controls with their expressions in the final output.

## Architecture

### 1. Promise Wrapper Utility
Added to `converter.js` to allow `async/await` syntax for ONLYOFFICE `executeMethod`.

```javascript
function executeMethodPromise(method, params) {
  return new Promise((resolve) => {
    window.Asc.plugin.executeMethod(method, params, (result) => {
      resolve(result);
    });
  });
}
```

### 2. Async `visualToRaw` Logic
The function will now follow these steps:
1. **Get Controls**: Fetch all controls using `GetAllContentControls`.
2. **Transform Controls**:
   - Loop through each control.
   - For each, use `UpdateContentControl` or a sequence of `Select` + `InsertText` to temporarily replace the visual text with its `{{expression}}`.
3. **Capture**: Call `GetDocumentContent` to retrieve the template-ready string.
4. **Restore**: Call `Undo` (via `executeMethod`) to revert the document to its visual state, ensuring the user's experience is unaffected.

### 3. Plugin Integration
`plugin.js` will be updated to handle the `Promise` returned by `visualToRaw`.

## Data Flow
1. `plugin.js` receives `convertToRaw` message.
2. Calls `Converter.visualToRaw()`.
3. `visualToRaw` performs document manipulation and returns the raw string.
4. `plugin.js` sends the result back to the frontend via `convertDone`.

## Success Criteria
- `convertToRaw` returns a string containing all indicators as `{{...}}` expressions.
- The document in the editor remains visually unchanged after the operation.
- No "empty content" errors due to race conditions.
