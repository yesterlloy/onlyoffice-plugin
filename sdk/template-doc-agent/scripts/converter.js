/**
 * 双向转换引擎模块
 *
 * 负责模板语法与可视化 Content Control 之间的转换
 */

(function(window, undefined) {

  // 调试日志配置
  const LOG_PREFIX = '[Converter]';
  const LOG_ENABLED = true;

  function log(...args) {
    if (LOG_ENABLED) {
      console.log(LOG_PREFIX, ...args);
    }
  }

  function logError(...args) {
    console.error(LOG_PREFIX, '❌', ...args);
  }

  function logSuccess(...args) {
    console.log(LOG_PREFIX, '✅', ...args);
  }

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

  function getDocumentPromise() {
    return new Promise((resolve) => {
      try {
        //传递参数

        Asc.scope.resolveFn = resolve
        console.log('Asc.scope.resolveFn obj===', Asc.scope, Asc.scope.resolveFn)

        window.Asc.plugin.callCommand(() => {
          let oDocument = Api.GetDocument()
          console.log('Api=', Api)
          console.log('Asc=', Asc)
          console.log('rrrrrrr fn=', Asc.scope.resolveFn, Asc.scope)
          Asc.scope.resolveFn(oDocument);
        });
      } catch (err) {
        logError(`Error executing method ${method}:`, err);
        resolve(null); // Resolve with null on error to prevent hanging
      }
    });
  }


  // 正则表达式模式
  const Patterns = {
    // 文本类指标：{{JK4816.get("year")}}
    textIndicator: /\{\{([A-Z0-9]+)\.get\("([a-zA-Z0-9_]+)"\)\}\}/g,

    // 图表类指标：{{put("JK3008", data("JK1959.."))}}
    chartIndicator: /\{\{put\("([A-Z0-9]+)",\s*data\("([^"]+)"\)\)\}\}/g,

    // AI 生成：{{ai_generate("field", ...)}}
    aiGenerate: /\{\{ai_generate\("([a-zA-Z0-9_]+)"[^}]*\}\}/g,

    // 条件控制：{{?JK4816 instanceof T(java.util.Map)}}...{{/}}
    conditionBlock: /\{\{\?([A-Z0-9]+)\s+instanceof\s+T\(java\.util\.Map\)\}\}([\s\S]*?)\{\{\/\}\}/g,

    // 日期格式：{{f(now(),"yyyy年MM月dd日")}}
    dateFormat: /\{\{f\(now\(\),"([^"]+)"\)\}\}/g,

    // 通用表达式
    genericExpression: /\{\{([^}]+)\}\}/g
  };

  /**
   * 可视化 → 原始转换 (Async)
   * 将 Content Control 转换为模板语法，并收集指标映射关系
   *
   * @returns {Promise<Object>} - { rawContent: string, indicatorMap: Object }
   */
  async function visualToRaw() {
    log('========== VISUAL_TO_RAW START ==========');

    const indicatorMap = {};

    // 1. 获取所有 Content Control
    log('📋 Calling GetAllContentControls...');
    const controls = await executeMethodPromise('GetAllContentControls', []);
    
    if (!controls || !Array.isArray(controls) || controls.length === 0) {
      log('⚠️ No ContentControls found, fetching document content directly');
      const content = await executeMethodPromise('GetDocumentContent', []);
      logSuccess('visualToRaw complete (no tags)');
      return {
        rawContent: content || '',
        indicatorMap: {}
      };
    }

    log('📊 Found', controls.length, 'controls for conversion', this);

    // 2. 依次将控件替换为表达式，并收集映射
    for (let i = 0; i < controls.length; i++) {
      const cc = controls[i];
      log('cc111=======', cc)
      try {
        const tagData = JSON.parse(cc.Tag);
        const expression = generateExpression(tagData);
        
        // 记录映射关系：表达式 -> 原始元数据
        indicatorMap[expression] = tagData;
        
        log(`🔄 move to and Replacing CC [${cc.InternalId}] with: ${expression}`);

        // 将光标移动到指定的内容控件。
        await executeMethodPromise('MoveCursorToContentControl', [cc.InternalId, false])

        // 移除控件并输入文本
        let ccPr = await executeMethodPromise('RemoveContentControl', [cc.InternalId]);
        log('ccPr=', ccPr, tagData)
        await executeMethodPromise('InputText', [expression, tagData.text || '']);
      } catch (e) {
        logError(`Failed to process control ${cc.InternalId}:`, e.message);
      }
    }

    // 3. 获取替换后的全文内容
    log('📡 Capturing raw content...');
    const rawContent = await executeMethodPromise('GetDocumentContent', []);
    log('📥 Raw content captured, length:', rawContent ? rawContent.length : 0);

    logSuccess('visualToRaw complete');
    log('========== VISUAL_TO_RAW END ==========');

    return {
      rawContent: rawContent || '',
      indicatorMap: indicatorMap
    };
  }

  /**
   * 原始 → 可视化转换 (Async)
   * 将模板语法转换为 Content Control
   *
   * @param {Object} indicatorMap - 指标映射表 { expression: indicatorInfo }
   */
  async function rawToVisual(indicatorMap) {
    log('========== RAW_TO_VISUAL START ==========');
    
    if (!indicatorMap || Object.keys(indicatorMap).length === 0) {
      log('⚠️ indicatorMap is empty, skipping conversion');
      return;
    }

    // 遍历映射表中的每一个表达式
    for (const expression in indicatorMap) {
      const tagData = indicatorMap[expression];
      log(`🔍 Searching for expression: ${expression}`);

      // 1. 使用 SearchNext 查找表达式
      // 注意：同一个表达式可能出现多次，所以使用 while 循环直到找不到为止
      let found = true;
      while (found) {
        let searchResult = window.Asc.plugin.executeMethod('SearchNext', [
          {
            "searchString": expression,
            "matchCase": true
          },
          true // Wrap around?
        ])
        log('rs====', searchResult)
        // const searchResult = await executeMethodPromise('SearchNext', [
        //   {
        //     "searchString": expression,
        //     "matchCase": true
        //   },
        //   true // Wrap around?
        // ]);

        if (searchResult) {
          log(`📍 Found expression: ${expression}, replacing...`);

          // 2. 使用 InputText 将匹配到的文本替换为空（即删除该文本并保持光标位置）
          // 第一个参数是替换后的文本，第二个参数是原始文本（用于匹配，但 SearchNext 已经选中了，这里传空即可）
          await executeMethodPromise('InputText', ['', expression]);

          // 3. 在当前光标位置插入 Content Control 标签
          // 我们直接使用 ContentControlModule.insert，它内部会调用 InsertAndReplaceContentControls
          window.ContentControlModule.insert(tagData);
        } else {
          log(`🏁 No more occurrences of: ${expression}`);
          found = false;
        }
      }
    }

    logSuccess('rawToVisual complete');
    log('========== RAW_TO_VISUAL END ==========');
  }

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
      // 使用 SearchNext 查找并自动选中占位符 (参考 rawToVisual 逻辑)
      const searchResult = window.Asc.plugin.executeMethod('SearchNext', [
        {
          "searchString": searchString,
          "matchCase": true
        },
        true // Wrap around?
      ]);

      if (searchResult) {
        log(`📍 Found placeholder via SearchNext, replacing...`);
        
        // 使用 InputText 将选中的文本替换为空
        await executeMethodPromise('InputText', ['', searchString]);
      }
      // 插入可视化标签
      window.ContentControlModule.insert(indicatorData);

      logSuccess('replaceDroppedPlaceholder complete');
      return true;
    } catch (error) {
      logError(`Error during placeholder search:`, error.message);
    }

    log('⚠️ Placeholder not found via SearchNext');
    return false;
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

  /**
   * 根据标签数据生成模板表达式
   * @param {Object} tag - 标签数据
   * @returns {string} - 模板表达式
   */
  function generateExpression(tag) {
    log('📝 generateExpression for:', JSON.stringify(tag, null, 2));

    let expression = '';

    switch (tag.type) {
      case 'text':
      case 'number':
      case 'percent':
      case 'date':
        // {{JK4816.get("field")}}
        expression = `{{${tag.code}.get("${tag.field}")}}`;
        log('📝 Text/Number type expression:', expression);
        break;

      case 'chart':
        // {{put("JK3008", data("dataSource"))}}
        const dataSource = tag.paramValues.dataSource || '';
        expression = `{{put("${tag.code}", data("${dataSource}"))}}`;
        log('📝 Chart type expression:', expression, 'dataSource:', dataSource);
        break;

      case 'ai_generate':
        // {{ai_generate("field", prompt="...", model="...")}}
        expression = generateAiExpression(tag);
        log('📝 AI_generate type expression:', expression);
        break;

      case 'condition':
        // {{?JK4816 instanceof T(java.util.Map)}}...{{/}}
        const bindIndicator = tag.paramValues.bindIndicator || '';
        expression = `{{?${bindIndicator} instanceof T(java.util.Map)}}content{{/}}`;
        log('📝 Condition type expression:', expression);
        break;

      default:
        expression = `{{${tag.code}.${tag.field}}}`;
        log('📝 Default expression:', expression);
    }

    return expression;
  }

  /**
   * 生成 AI 类型表达式
   */
  function generateAiExpression(tag) {
    log('🤖 generateAiExpression for:', tag);

    const params = tag.paramValues || {};
    const parts = [`"${tag.field}"`];

    if (params.promptTemplate) {
      parts.push(`prompt="${params.promptTemplate.slice(0, 50)}..."`);
    }
    if (params.modelProvider) {
      parts.push(`model="${params.modelProvider}"`);
    }

    const expression = `{{ai_generate(${parts.join(', ')})}}`;
    log('🤖 AI expression:', expression);

    return expression;
  }

  /**
   * 查找文档中的所有模板表达式
   * @param {string} content - 文档内容
   * @returns {Array} - 表达式列表
   */
  function findExpressions(content) {
    log('🔍 findExpressions in content, length:', content.length);

    const expressions = [];
    let match;

    // 重置正则
    Patterns.genericExpression.lastIndex = 0;

    while ((match = Patterns.genericExpression.exec(content)) !== null) {
      const expr = {
        full: match[0],           // 完整匹配 {{...}}
        expression: match[1],     // 内部表达式
        index: match.index,
        type: detectExpressionType(match[1])
      };

      log('🔍 Found expression:', expr.full, 'at index:', expr.index, 'type:', expr.type);
      expressions.push(expr);
    }

    log('🔍 Total expressions found:', expressions.length);

    return expressions;
  }

  /**
   * 检测表达式类型
   * @param {string} expression - 表达式内容
   * @returns {string} - 类型
   */
  function detectExpressionType(expression) {
    log('🔎 detectExpressionType:', expression);

    if (/^ai_generate/.test(expression)) {
      log('🔎 Detected type: ai_generate');
      return 'ai_generate';
    }
    if (/^put\(/.test(expression)) {
      log('🔎 Detected type: chart');
      return 'chart';
    }
    if (/^\?/.test(expression)) {
      log('🔎 Detected type: condition');
      return 'condition';
    }
    if (/^f\(now\(/.test(expression)) {
      log('🔎 Detected type: date');
      return 'date';
    }
    if (/\.get\("/.test(expression)) {
      log('🔎 Detected type: text');
      return 'text';
    }

    log('🔎 Detected type: unknown');
    return 'unknown';
  }

  /**
   * 生成唯一 ID
   */
  function generateUid() {
    const uid = 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    log('🔑 Generated UID:', uid);
    return uid;
  }

  // 导出模块
  window.ConverterModule = {
    visualToRaw: visualToRaw,
    rawToVisual: rawToVisual,
    replaceDroppedPlaceholder: replaceDroppedPlaceholder,
    generateExpression: generateExpression,
    findExpressions: findExpressions,
    Patterns: Patterns
  };

  log('📦 ConverterModule loaded');

})(window, undefined);