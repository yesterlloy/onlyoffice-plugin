/**
 * 双向转换引擎模块
 *
 * 负责模板语法与可视化 Content Control 之间的转换
 */

(function (window, undefined) {

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
        window.Asc.plugin.callCommand(() => {
          let oDocument = Api.GetDocument()
          return oDocument;
        }, false, true, function (oDocument) {
          resolve(oDocument);
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

    // 循环开始：{{?JK4816.subList(0, 10)}}
    loopStart: /\{\{\?([A-Z0-9]+)\.subList\((\d+),\s*(\d+)\)\}\}/g,

    // 循环结束：{{/}}
    loopEnd: /\{\{\/\}\}/g,

    // 相对指标：{{=#this.get("name")}}
    relativeIndicator: /\{\{=#this\.get\("([a-zA-Z0-9_]+)"\)\}\}/g,

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
    log('📋 Calling GetAllContentControls... 11111');
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
      if (!cc || !cc.InternalId) {
        log('⚠️ Skipping invalid or missing ContentControl at index', i);
        continue;
      }
      log('cc111=======', cc)
      try {
        const tagData = JSON.parse(cc.Tag);
        const expression = generateExpression(tagData);

        // 记录映射关系：uid -> { expression, tagData }
        const uid = tagData.uid || generateUid();
        tagData.uid = uid;
        indicatorMap[uid] = {
          expression: expression,
          tagData: tagData
        };

        log(`🔄 move to and Replacing CC [${cc.InternalId}] with: ${expression}`);

        // 将光标移动到指定的内容控件。
        await executeMethodPromise('MoveCursorToContentControl', [cc.InternalId, false])

        // 移除控件并输入文本
        let ccPr = await executeMethodPromise('RemoveContentControl', [cc.InternalId]);

        //
        await executeMethodPromise('InputText', [expression]);
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

    indicatorMap = indicatorMap || {};

    const rawContent = await executeMethodPromise('GetDocumentContent', []);
    log('rawContent==', rawContent)
    if (rawContent) {
      const expressions = findExpressions(rawContent);
      log('🔍 Found', expressions.length, 'expressions from document content');

      // 构建一个现有表达式的集合，用于判断是否需要新建 tagData
      const existingExpressions = {};
      for (const uid in indicatorMap) {
        existingExpressions[indicatorMap[uid].expression] = true;
      }

      for (let i = 0; i < expressions.length; i++) {
        const expr = expressions[i];
        if (!existingExpressions[expr.full]) {
          log('🆕 Building tag data for expression:', expr.full);
          const newUid = generateUid();
          const tagData = {
            uid: newUid,
            type: expr.type,
            name: expr.expression,
            code: '',
            field: '',
            paramValues: {}
          };

          if (expr.type === 'text' || expr.type === 'number' || expr.type === 'percent' || expr.type === 'date') {
            const match = /([A-Z0-9]+)\.get\("([a-zA-Z0-9_]+)"\)/.exec(expr.expression);
            if (match) {
              tagData.code = match[1];
              tagData.field = match[2];
              tagData.name = tagData.code + '.' + tagData.field;
            } else {
              const parts = expr.expression.split('.');
              if (parts.length >= 2) {
                tagData.code = parts[0];
                tagData.field = parts[1];
              }
            }
          } else if (expr.type === 'chart') {
            const match = /put\("([A-Z0-9]+)",\s*data\("([^"]+)"\)\)/.exec(expr.expression);
            if (match) {
              tagData.code = match[1];
              tagData.paramValues.dataSource = match[2];
              tagData.name = tagData.code + ' 图表';
            }
          } else if (expr.type === 'ai_generate') {
            const match = /ai_generate\("([a-zA-Z0-9_]+)"/.exec(expr.expression);
            if (match) {
              tagData.field = match[1];
              tagData.name = tagData.field + ' (AI)';
            }
          } else if (expr.type === 'loop_start') {
            tagData.name = '循环开始';
            tagData.isLoopStart = true;
            const match = /^\?([A-Z0-9_]+)/.exec(expr.expression);
            if (match) tagData.code = match[1];
            tagData.text = '循环开始：【' + expr.expression.substring(1) + '】';
          } else if (expr.type === 'loop_end') {
            tagData.name = '循环结束';
            tagData.isLoopEnd = true;
          }

          indicatorMap[newUid] = {
            expression: expr.full,
            tagData: tagData
          };
          existingExpressions[expr.full] = true;
        }
      }
    }

    if (Object.keys(indicatorMap).length === 0) {
      log('⚠️ indicatorMap is empty and no expressions found, skipping conversion');
      return;
    }

    // 按表达式对 UID 进行分组，以便为文档中多次出现的同一个表达式按序分配正确的 tagData
    const exprToMappings = {};
    for (const uid in indicatorMap) {
      const mapping = indicatorMap[uid];
      const expression = mapping.expression;
      if (!exprToMappings[expression]) {
        exprToMappings[expression] = [];
      }
      exprToMappings[expression].push(mapping.tagData);
    }

    // 遍历每一个唯一的表达式
    for (const expression in exprToMappings) {
      const tagDataList = exprToMappings[expression];
      log(`🔍 Searching for expression: ${expression} (Total expected occurrences: ${tagDataList.length})`);

      let tagDataIndex = 0;
      let found = true;

      // 1. 使用 SearchNext 查找表达式
      while (found) {
        let searchResult = window.Asc.plugin.executeMethod('SearchNext', [
          {
            "searchString": expression,
            "matchCase": true
          },
          true // Wrap around?
        ])

        if (searchResult) {
          log(`📍 Found occurrence ${tagDataIndex + 1} of expression: ${expression}, replacing...`);

          // 2. 使用 InputText 将匹配到的文本替换为空
          await executeMethodPromise('InputText', ['', expression]);

          // 获取当前索引对应的 tagData（如果文档中该表达式的出现次数多于 map 中记录的数量，则复制最后一条记录并重新生成 uid）
          let tagData = tagDataList[tagDataIndex];
          if (!tagData) {
            log(`⚠️ Missing tagData for occurrence ${tagDataIndex + 1}, cloning previous.`);
            tagData = JSON.parse(JSON.stringify(tagDataList[tagDataList.length - 1]));
            tagData.uid = generateUid();
            if (tagData.isLoopEnd) {
              tagData.loopStartUid = generateUid(); // Fallback to avoid duplicate linkage
            }
          }

          // 3. 在当前光标位置插入 Content Control 标签
          window.ContentControlModule.insert(tagData);
          tagDataIndex++;
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

    // 处理循环区域内的字段
    if (tag.isInLoop) {
      const expression = `{{=#this.get("${tag.field}")}}`;
      log('📝 Loop region field expression:', expression);
      return expression;
    }

    // 处理循环开始标记
    if (tag.isLoopStart) {
      let exprInner = `${tag.code}.subList(0, 10)`; // 默认
      if (tag.text) {
        const match = /【(.*?)】/.exec(tag.text);
        if (match && match[1]) {
          exprInner = match[1];
        } else {
          const raw = tag.text.replace('循环开始：', '').trim();
          if (raw) {
            exprInner = raw;
            if (exprInner.indexOf('.subList') === -1) {
              exprInner += '.subList(0, 10)';
            }
          }
        }
      }
      const expression = `{{?${exprInner}}}`;
      log('📝 Loop start expression:', expression);
      return expression;
    }

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

      case 'loop_end':
        expression = '{{/}}';
        log('📝 Loop end expression:', expression);
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
    if (/^\?.*\.subList\(/.test(expression)) {
      log('🔎 Detected type: loop_start');
      return 'loop_start';
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
    if (expression === '/') {
      log('🔎 Detected type: loop_end');
      return 'loop_end';
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