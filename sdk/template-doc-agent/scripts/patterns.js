/**
 * 模板语法正则库
 *
 * 定义各种模板表达式的正则匹配模式
 */

(function(window, undefined) {

  const Patterns = {
    /**
     * 文本/数值/百分比类指标
     * 示例：{{JK4816.get("year")}}
     * 捕获组：[1]接口编码, [2]字段名
     */
    TEXT_INDICATOR: /\{\{([A-Z0-9]+)\.get\("([a-zA-Z0-9_]+)"\)\}\}/g,

    /**
     * 图表类指标
     * 示例：{{put("JK3008", data("JK195981497926161032"))}}
     * 捕获组：[1]图表编码, [2]数据源ID
     */
    CHART_INDICATOR: /\{\{put\("([A-Z0-9]+)",\s*data\("([^"]+)"\)\)\}\}/g,

    /**
     * AI 生成类指标
     * 示例：{{ai_generate("overview", prompt="...", model="Claude")}}
     * 捕获组：[1]字段名
     */
    AI_GENERATE: /\{\{ai_generate\("([a-zA-Z0-9_]+)"[^}]*\}\}/g,

    /**
     * 条件控制块
     * 示例：{{?JK4816 instanceof T(java.util.Map)}}内容{{/}}
     * 捕获组：[1]指标编码, [2]条件内容
     */
    CONDITION_BLOCK: /\{\{\?([A-Z0-9]+)\s+instanceof\s+T\(java\.util\.Map\)\}\}([\s\S]*?)\{\{\/\}\}/g,

    /**
     * 日期格式化
     * 示例：{{f(now(),"yyyy年MM月dd日")}}
     * 捕获组：[1]日期格式
     */
    DATE_FORMAT: /\{\{f\(now\(\),"([^"]+)"\)\}\}/g,

    /**
     * 数据访问
     * 示例：{{data("JK4816")}}
     * 捕获组：[1]数据源ID
     */
    DATA_ACCESS: /\{\{data\("([^"]+)"\)\}\}/g,

    /**
     * 循环开始
     * 示例：{{?JK4816.subList(0, 10)}}
     */
    LOOP_START: /\{\{\?([A-Z0-9]+)\.subList\((\d+),\s*(\d+)\)\}\}/g,

    /**
     * 循环结束
     * 示例：{{/}}
     */
    LOOP_END: /\{\{\/\}\}/g,

    /**
     * 相对指标
     * 示例：{{=#this.get("name")}}
     */
    RELATIVE_INDICATOR: /\{\{=#this\.get\("([a-zA-Z0-9_]+)"\)\}\}/g,

    /**
     * 通用表达式（匹配所有 {{...}}）
     */
    GENERIC_EXPRESSION: /\{\{([^}]+)\}\}/g
  };

  /**
   * 解析表达式类型
   * @param {string} expression - 表达式内容（不含 {{}}）
   * @returns {Object} - { type, code, field, params }
   */
  function parseExpression(expression) {
    // 文本/数值类
    let match = expression.match(/^([A-Z0-9]+)\.get\("([a-zA-Z0-9_]+)"\)$/);
    if (match) {
      return {
        type: 'text',
        code: match[1],
        field: match[2],
        params: {}
      };
    }

    // 图表类
    match = expression.match(/^put\("([A-Z0-9]+)",\s*data\("([^"]+)"\)\)$/);
    if (match) {
      return {
        type: 'chart',
        code: match[1],
        field: 'chart',
        params: {
          dataSource: match[2]
        }
      };
    }

    // AI 生成类
    match = expression.match(/^ai_generate\("([a-zA-Z0-9_]+)"/);
    if (match) {
      return {
        type: 'ai_generate',
        code: 'AI_GEN',
        field: match[1],
        params: extractAiParams(expression)
      };
    }

    // 条件类
    match = expression.match(/^\?([A-Z0-9]+)\s+instanceof/);
    if (match) {
      return {
        type: 'condition',
        code: match[1],
        field: 'condition',
        params: {
          condType: 'hasData'
        }
      };
    }

    // 日期类
    match = expression.match(/^f\(now\(\),"([^"]+)"\)$/);
    if (match) {
      return {
        type: 'date',
        code: 'SYS',
        field: 'now',
        params: {
          format: match[1]
        }
      };
    }

    // 循环开始
    match = expression.match(/^\?([A-Z0-9]+)\.subList\((\d+),\s*(\d+)\)$/);
    if (match) {
      return {
        type: 'loop_start',
        code: match[1],
        field: 'loop',
        params: {
          start: match[2],
          end: match[3]
        }
      };
    }

    // 循环结束
    if (expression === '/') {
      return {
        type: 'loop_end',
        code: '',
        field: '',
        params: {}
      };
    }

    // 相对指标
    match = expression.match(/^=#this\.get\("([a-zA-Z0-9_]+)"\)$/);
    if (match) {
      return {
        type: 'relative',
        code: 'this',
        field: match[1],
        params: {}
      };
    }

    // 未知类型
    return {
      type: 'unknown',
      code: '',
      field: '',
      params: {}
    };
  }

  /**
   * 提取 AI 参数
   */
  function extractAiParams(expression) {
    const params = {};

    // 提取 prompt
    const promptMatch = expression.match(/prompt="([^"]+)"/);
    if (promptMatch) {
      params.promptTemplate = promptMatch[1];
    }

    // 提取 model
    const modelMatch = expression.match(/model="([^"]+)"/);
    if (modelMatch) {
      params.modelProvider = modelMatch[1];
    }

    return params;
  }

  /**
   * 重置所有正则的 lastIndex
   */
  function resetPatterns() {
    Object.values(Patterns).forEach(function(pattern) {
      if (pattern instanceof RegExp) {
        pattern.lastIndex = 0;
      }
    });
  }

  // 导出
  window.PatternsModule = {
    Patterns: Patterns,
    parseExpression: parseExpression,
    resetPatterns: resetPatterns
  };

})(window, undefined);