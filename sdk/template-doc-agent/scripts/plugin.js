/**
 * Template Document Agent - OnlyOffice Plugin
 *
 * 职责：文档操作代理，无 UI，仅通过消息与产品前端通信
 *
 * 消息协议：
 * - 接收：insertIndicator, removeIndicator, updateParams, getDocTags, convertToRaw, convertToVisual
 * - 发送：tagClicked, convertDone, allTags, insertDone, updateDone, removeDone
 */

(function(window, undefined) {
  // 调试日志配置
  const LOG_PREFIX = '[Plugin]';
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

  // 导入模块
  const ContentControl = window.ContentControlModule || {};
  const Converter = window.ConverterModule || {};

  // 插件初始化
  window.Asc.plugin.init = function() {
    log('🚀 Plugin initialized');
    log('📦 Available modules:', {
      ContentControl: Object.keys(ContentControl),
      Converter: Object.keys(Converter)
    });

    // 通知前端插件已就绪
    reply('editorReady', { initialized: true, timestamp: Date.now() });
    logSuccess('Editor ready notification sent');
  };

  // 外部消息处理
  window.Asc.plugin.onExternalMessage = function(msg) {
    log('📨 ========== MESSAGE RECEIVED ==========');
    log('📨 Type:', msg.type);
    log('📨 Data:', JSON.stringify(msg.data, null, 2));
    log('📨 Timestamp:', new Date().toISOString());

    const data = msg.data || {};
    const startTime = Date.now();

    switch (msg.type) {
      case 'insertIndicator':
        log('🎯 Handling: insertIndicator');
        handleInsertIndicator(data, startTime);
        break;

      case 'removeIndicator':
        log('🎯 Handling: removeIndicator');
        handleRemoveIndicator(data, startTime);
        break;

      case 'updateParams':
        log('🎯 Handling: updateParams');
        handleUpdateParams(data, startTime);
        break;

      case 'getDocTags':
        log('🎯 Handling: getDocTags');
        handleGetDocTags(startTime);
        break;

      case 'convertToRaw':
        log('🎯 Handling: convertToRaw');
        handleConvertToRaw(startTime);
        break;

      case 'convertToVisual':
        log('🎯 Handling: convertToVisual');
        handleConvertToVisual(data, startTime);
        break;

      default:
        logError('Unknown message type:', msg.type);
    }
  };

  // ========== 消息处理函数 ==========

  /**
   * 插入指标标签
   * @param {Object} data - { uid, indicatorId, code, field, name, type, chartType, paramValues }
   * @param {Number} startTime - 开始时间
   */
  function handleInsertIndicator(data, startTime) {
    log('📝 Inserting indicator...');
    log('📝 Input data:', {
      uid: data.uid,
      indicatorId: data.indicatorId,
      code: data.code,
      field: data.field,
      name: data.name,
      type: data.type,
      chartType: data.chartType,
      paramValues: JSON.stringify(data.paramValues)
    });

    try {
      const tag = ContentControl.insert(data);
      const elapsed = Date.now() - startTime;

      logSuccess('Insert complete', { uid: tag.uid, elapsed: elapsed + 'ms' });
      log('📤 Sending insertDone response');

      reply('insertDone', {
        uid: data.uid,
        tagUid: tag.uid,
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('Insert failed:', error.message, error.stack);
      reply('insertError', {
        uid: data.uid,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 移除指标标签
   * @param {Object} data - { uid }
   * @param {Number} startTime - 开始时间
   */
  function handleRemoveIndicator(data, startTime) {
    log('🗑️ Removing indicator:', data.uid);

    try {
      ContentControl.remove(data.uid);
      const elapsed = Date.now() - startTime;

      logSuccess('Remove complete', { uid: data.uid, elapsed: elapsed + 'ms' });
      log('📤 Sending removeDone response');

      reply('removeDone', {
        uid: data.uid,
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('Remove failed:', error.message);
      reply('removeError', {
        uid: data.uid,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 更新参数
   * @param {Object} data - { uid, paramValues }
   * @param {Number} startTime - 开始时间
   */
  function handleUpdateParams(data, startTime) {
    log('⚙️ Updating params...');
    log('⚙️ uid:', data.uid);
    log('⚙️ paramValues:', JSON.stringify(data.paramValues, null, 2));

    try {
      ContentControl.updateTag(data.uid, data.paramValues);
      const elapsed = Date.now() - startTime;

      logSuccess('Update complete', { uid: data.uid, elapsed: elapsed + 'ms' });
      log('📤 Sending updateDone response');

      reply('updateDone', {
        uid: data.uid,
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('Update failed:', error.message);
      reply('updateError', {
        uid: data.uid,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 获取文档中所有标签
   * @param {Number} startTime - 开始时间
   */
  function handleGetDocTags(startTime) {
    log('📋 Getting all doc tags...');

    try {
      const tags = ContentControl.getAllTags();
      const elapsed = Date.now() - startTime;

      logSuccess('GetDocTags complete', { count: tags.length, elapsed: elapsed + 'ms' });
      log('📋 Tags found:', JSON.stringify(tags, null, 2));
      log('📤 Sending allTags response');

      reply('allTags', {
        tags: tags,
        count: tags.length,
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('GetDocTags failed:', error.message);
      reply('getTagsError', {
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 可视化 → 原始转换
   * @param {Number} startTime - 开始时间
   */
  function handleConvertToRaw(startTime) {
    log('🔄 Converting to raw template...');

    try {
      const rawContent = Converter.visualToRaw();
      const elapsed = Date.now() - startTime;

      logSuccess('ConvertToRaw complete', {
        contentLength: rawContent ? rawContent.length : 0,
        elapsed: elapsed + 'ms'
      });
      log('📄 Raw content preview:', rawContent ? rawContent.substring(0, 500) + '...' : '(empty)');
      log('📤 Sending convertDone response');

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

  /**
   * 原始 → 可视化转换
   * @param {Object} data - { indicatorMap }
   * @param {Number} startTime - 开始时间
   */
  function handleConvertToVisual(data, startTime) {
    log('🔄 Converting to visual...');
    log('🔄 indicatorMap:', JSON.stringify(data.indicatorMap, null, 2));

    try {
      Converter.rawToVisual(data.indicatorMap || {});
      const elapsed = Date.now() - startTime;

      logSuccess('ConvertToVisual complete', { elapsed: elapsed + 'ms' });
      log('📤 Sending convertDone response');

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

  // ========== 辅助函数 ==========

  /**
   * 发送消息给产品前端
   * @param {string} type - 消息类型
   * @param {Object} data - 消息数据
   */
  function reply(type, data) {
    log('📤 ========== SENDING RESPONSE ==========');
    log('📤 Type:', type);
    log('📤 Data:', JSON.stringify(data, null, 2));

    const message = {
      type: type,
      data: data
    };

    log('📤 Full message:', JSON.stringify(message).length, 'bytes');

    window.Asc.plugin.sendToPlugin('onMessage', message);

    log('📤 Response sent via sendToPlugin');
  }

  /**
   * 生成唯一 ID
   */
  function generateUid() {
    return 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 暴露给测试
  window.TemplateDocAgent = {
    handleInsertIndicator: handleInsertIndicator,
    handleRemoveIndicator: handleRemoveIndicator,
    handleUpdateParams: handleUpdateParams,
    handleGetDocTags: handleGetDocTags,
    handleConvertToRaw: handleConvertToRaw,
    handleConvertToVisual: handleConvertToVisual,
    // 调试方法
    log: log,
    reply: reply
  };

  log('📦 Plugin module loaded and ready');

})(window, undefined);