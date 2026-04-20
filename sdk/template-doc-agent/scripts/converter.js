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
   * 可视化 → 原始转换
   * 将 Content Control 转换为模板语法
   *
   * @returns {string} - 原始模板内容
   */
  function visualToRaw() {
    log('========== VISUAL_TO_RAW START ==========');

    let rawContent = '';

    log('📡 Calling GetDocumentContent...');

    // 获取文档全文
    window.Asc.plugin.executeMethod('GetDocumentContent', [], function(content) {
      log('📥 Document content received, length:', content ? content.length : 0);
      rawContent = content || '';
    });

    // 获取所有 Content Control
    log('📋 Getting all ContentControl tags...');
    const tags = window.ContentControlModule.getAllTags();
    log('📋 Found', tags.length, 'tags:', JSON.stringify(tags, null, 2));

    // 替换每个 Content Control 为模板表达式
    log('🔄 Processing tags for conversion...');
    tags.forEach(function(tag) {
      log('🔄 Processing tag:', tag.uid);
      const expression = generateExpression(tag);
      log('📝 Generated expression:', expression);
      // 替换 Content Control 为表达式
      // 实际实现需要遍历文档并替换
    });

    logSuccess('visualToRaw complete');
    log('========== VISUAL_TO_RAW END ==========');

    return rawContent;
  }

  /**
   * 原始 → 可视化转换
   * 将模板语法转换为 Content Control
   *
   * @param {Object} indicatorMap - 指标映射表 { expression: indicatorInfo }
   */
  function rawToVisual(indicatorMap) {
    log('========== RAW_TO_VISUAL START ==========');
    log('📥 indicatorMap:', JSON.stringify(indicatorMap, null, 2));

    // 获取文档全文
    log('📡 Calling GetDocumentContent...');

    window.Asc.plugin.executeMethod('GetDocumentContent', [], function(content) {
      log('📥 Document content received, length:', content ? content.length : 0);

      if (!content) {
        logError('No document content');
        return;
      }

      // 1. 查找所有模板表达式
      log('🔍 Finding expressions in document...');
      const expressions = findExpressions(content);
      log('🔍 Found', expressions.length, 'expressions:', JSON.stringify(expressions, null, 2));

      // 2. 对每个表达式，查找对应的指标信息
      log('🔄 Matching expressions to indicators...');
      expressions.forEach(function(expr) {
        log('🔄 Processing expression:', expr.full);

        const indicatorInfo = indicatorMap[expr.full];
        if (indicatorInfo) {
          log('✅ Found matching indicator:', indicatorInfo.name);
          // 3. 创建 Content Control 替换原始文本
          createContentControlFromExpression(expr, indicatorInfo);
        } else {
          log('⚠️ No matching indicator for:', expr.full);
        }
      });
    });

    logSuccess('rawToVisual complete');
    log('========== RAW_TO_VISUAL END ==========');
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
   * 根据表达式创建 Content Control
   */
  function createContentControlFromExpression(expr, indicatorInfo) {
    log('🔧 createContentControlFromExpression START');
    log('🔧 Expression:', expr);
    log('🔧 IndicatorInfo:', indicatorInfo);

    const tagData = {
      uid: generateUid(),
      type: indicatorInfo.type || expr.type,
      indicatorId: indicatorInfo.indicatorId,
      code: indicatorInfo.code,
      field: indicatorInfo.field,
      name: indicatorInfo.name,
      paramValues: indicatorInfo.paramValues || {}
    };

    log('🔧 Creating tagData:', JSON.stringify(tagData, null, 2));

    // 调用 ContentControl 模块创建
    log('📡 Calling ContentControlModule.insert...');
    window.ContentControlModule.insert(tagData);

    logSuccess('ContentControl created from expression');
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
    generateExpression: generateExpression,
    findExpressions: findExpressions,
    Patterns: Patterns
  };

  log('📦 ConverterModule loaded');

})(window, undefined);