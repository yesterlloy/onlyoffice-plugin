# Async Conversion Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the ONLYOFFICE plugin's conversion logic (`visualToRaw` and `rawToVisual`) to be asynchronous and use `GetAllContentControls` directly for accurate document-to-template conversion.

**Architecture:** Use a Promise wrapper for ONLYOFFICE `executeMethod` to allow `async/await` syntax. Implement an "In-Place Manipulation" strategy where Content Controls are temporarily replaced by their expressions during export and raw text is searched and replaced by Content Controls during import.

**Tech Stack:** JavaScript (ES6+), ONLYOFFICE Plugin API.

---

### Task 1: Add Promise Utility to converter.js

**Files:**
- Modify: `sdk/template-doc-agent/scripts/converter.js`

- [ ] **Step 1: Add `executeMethodPromise` utility function**

Add this at the top of the module (inside the IIFE):

```javascript
  /**
   * 将 OnlyOffice executeMethod 包装为 Promise
   * @param {string} method - 方法名
   * @param {any} params - 参数
   * @returns {Promise<any>}
   */
  function executeMethodPromise(method, params) {
    return new Promise((resolve) => {
      try {
        window.Asc.plugin.executeMethod(method, params, (result) => {
          resolve(result);
        });
      } catch (err) {
        logError(`Error executing method ${method}:`, err);
        resolve(null); // Resolve with null on error to prevent hanging
      }
    });
  }
```

- [ ] **Step 2: Commit utility addition**

```bash
git add sdk/template-doc-agent/scripts/converter.js
git commit -m "feat: add executeMethodPromise utility to converter"
```

---

### Task 2: Refactor visualToRaw (Visual → Raw)

**Files:**
- Modify: `sdk/template-doc-agent/scripts/converter.js`

- [ ] **Step 1: Update visualToRaw to be async and use GetAllContentControls**

Replace the existing `visualToRaw` implementation with an async version that performs in-place replacement.

```javascript
  /**
   * 可视化 → 原始转换 (Async)
   * 将 Content Control 转换为模板语法
   *
   * @returns {Promise<string>} - 原始模板内容
   */
  async function visualToRaw() {
    log('========== VISUAL_TO_RAW START ==========');

    // 1. 获取所有 Content Control
    log('📋 Calling GetAllContentControls...');
    const controls = await executeMethodPromise('GetAllContentControls', []);
    
    if (!controls || !Array.isArray(controls) || controls.length === 0) {
      log('⚠️ No ContentControls found, fetching document content directly');
      const content = await executeMethodPromise('GetDocumentContent', []);
      logSuccess('visualToRaw complete (no tags)');
      return content || '';
    }

    log('📊 Found', controls.length, 'controls for conversion');

    // 2. 依次将控件替换为表达式
    // 注意：需要从后往前处理或者确保顺序不影响位置
    // ONLYOFFICE 的 Select + InsertText 比较稳妥
    for (let i = 0; i < controls.length; i++) {
      const cc = controls[i];
      try {
        const tagData = JSON.parse(cc.Tag);
        const expression = generateExpression(tagData);
        log(`🔄 Replacing CC [${cc.Id}] with: ${expression}`);

        // 选中并替换
        await executeMethodPromise('SelectContentControl', [cc.Id]);
        await executeMethodPromise('InsertText', [expression]);
      } catch (e) {
        logError(`Failed to process control ${cc.Id}:`, e.message);
      }
    }

    // 3. 获取替换后的全文内容
    log('📡 Capturing raw content...');
    const rawContent = await executeMethodPromise('GetDocumentContent', []);
    log('📥 Raw content captured, length:', rawContent ? rawContent.length : 0);

    // 4. 恢复文档 (Undo 之前的 N 次操作)
    log('⏪ Restoring document via Undo...');
    for (let i = 0; i < controls.length; i++) {
      await executeMethodPromise('Undo', []);
    }

    logSuccess('visualToRaw complete');
    log('========== VISUAL_TO_RAW END ==========');

    return rawContent || '';
  }
```

- [ ] **Step 2: Commit visualToRaw refactor**

```bash
git add sdk/template-doc-agent/scripts/converter.js
git commit -m "feat: refactor visualToRaw to be async using GetAllContentControls and In-Place manipulation"
```

---

### Task 3: Refactor rawToVisual (Raw → Visual)

**Files:**
- Modify: `sdk/template-doc-agent/scripts/converter.js`

- [ ] **Step 1: Update rawToVisual to be async**

Refactor `rawToVisual` to properly handle asynchronous replacements using `Search` and `InsertAndReplaceContentControls`.

```javascript
  /**
   * 原始 → 可视化转换 (Async)
   * 将模板语法转换为 Content Control
   *
   * @param {Object} indicatorMap - 指标映射表 { expression: indicatorInfo }
   */
  async function rawToVisual(indicatorMap) {
    log('========== RAW_TO_VISUAL START ==========');
    
    // 1. 获取文档全文并查找所有表达式
    const content = await executeMethodPromise('GetDocumentContent', []);
    if (!content) {
      logError('No document content');
      return;
    }

    const expressions = findExpressions(content);
    log('🔍 Found', expressions.length, 'expressions');

    // 2. 依次处理每个表达式
    for (const expr of expressions) {
      const indicatorInfo = indicatorMap[expr.full];
      if (indicatorInfo) {
        log('✅ Matching indicator:', indicatorInfo.name, 'for', expr.full);
        
        // 查找并选中
        // 注意：Search 可能返回多个结果，这里简单处理第一个
        const searchResult = await executeMethodPromise('Search', [{
          Text: expr.full,
          MatchCase: true,
          MatchWholeWord: false
        }]);

        if (searchResult && searchResult.length > 0) {
          log('📍 Expression found at position, replacing with Content Control...');
          
          // 选中第一个匹配项
          await executeMethodPromise('SelectText', [searchResult[0]]);
          
          // 创建并插入 Content Control
          await createContentControlFromExpressionAsync(expr, indicatorInfo);
        }
      }
    }

    logSuccess('rawToVisual complete');
    log('========== RAW_TO_VISUAL END ==========');
  }

  /**
   * 异步创建 Content Control
   */
  async function createContentControlFromExpressionAsync(expr, indicatorInfo) {
    const tagData = {
      uid: generateUid(),
      type: indicatorInfo.type || expr.type,
      indicatorId: indicatorInfo.indicatorId,
      code: indicatorInfo.code,
      field: indicatorInfo.field,
      name: indicatorInfo.name,
      paramValues: indicatorInfo.paramValues || {}
    };

    // 直接调用 ContentControlModule.insert 的核心逻辑
    // 为了保持一致性，我们在这里调用它
    window.ContentControlModule.insert(tagData);
  }
```

- [ ] **Step 2: Commit rawToVisual refactor**

```bash
git add sdk/template-doc-agent/scripts/converter.js
git commit -m "feat: refactor rawToVisual to be async with sequential Search and Replace"
```

---

### Task 4: Update plugin.js to handle Async Calls

**Files:**
- Modify: `sdk/template-doc-agent/scripts/plugin.js`

- [ ] **Step 1: Update handleConvertToRaw and handleConvertToVisual to use async/await**

```javascript
  async function handleConvertToRaw(startTime) {
    log('🔄 Converting to raw template (async)...');

    try {
      const rawContent = Converter.visualToRaw ? await Converter.visualToRaw() : '';
      const elapsed = Date.now() - startTime;

      logSuccess('ConvertToRaw complete', { elapsed: elapsed + 'ms' });
      reply('convertDone', {
        content: rawContent,
        direction: 'toRaw',
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('ConvertToRaw failed:', error.message);
      reply('convertError', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async function handleConvertToVisual(data, startTime) {
    log('🔄 Converting to visual (async)...');

    try {
      if (Converter.rawToVisual) {
        await Converter.rawToVisual(data.indicatorMap || {});
      }
      const elapsed = Date.now() - startTime;

      logSuccess('ConvertToVisual complete', { elapsed: elapsed + 'ms' });
      reply('convertDone', {
        direction: 'toVisual',
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('ConvertToVisual failed:', error.message);
      reply('convertError', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
```

- [ ] **Step 2: Commit plugin changes**

```bash
git add sdk/template-doc-agent/scripts/plugin.js
git commit -m "feat: update plugin to handle async conversion methods"
```

---

### Task 5: Verification

- [ ] **Step 1: Verify converter exports**

Ensure `ConverterModule` exports the new async methods correctly.

- [ ] **Step 2: Check logs for sequential execution**

Run the plugin and trigger `convertToRaw`. Check console logs to ensure `GetAllContentControls` is called and each replacement is logged sequentially.

- [ ] **Step 3: Final Review**

Run a full round-trip conversion to verify no data loss.
