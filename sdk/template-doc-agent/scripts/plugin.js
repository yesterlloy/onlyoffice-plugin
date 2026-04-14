/**
 * Template Document Agent - OnlyOffice Plugin
 *
 * 职责：文档操作代理，无 UI，仅通过消息与产品前端通信
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

  log('📦 Script loading, window.Asc status:', window.Asc ? 'available' : 'not available');


  // 直接定义插件函数（OnlyOffice SDK 会调用它们）
  // 需要先确保 window.Asc 对象存在
  window.Asc = window.Asc || {};
  window.Asc.plugin = window.Asc.plugin || {};


  log('Asc:', window.Asc)                                                                                                                                     
  log('Asc.plugin:', window.Asc?.plugin)                                                                                                                      
  log('onExternalMessage:', window.Asc?.plugin?.onExternalMessage)

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

  log('📦 Plugin handlers defined');

  // ========== 消息处理函数 ==========

  function handleInsertIndicator(data, startTime) {
    log('📝 Inserting indicator...');
    log('📝 Input data:', JSON.stringify(data, null, 2));

    try {
      const tag = ContentControl.insert(data);
      const elapsed = Date.now() - startTime;

      logSuccess('Insert complete', { uid: tag ? tag.uid : data.uid, elapsed: elapsed + 'ms' });
      reply('insertDone', {
        uid: data.uid,
        tagUid: tag ? tag.uid : data.uid,
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

  function handleRemoveIndicator(data, startTime) {
    log('🗑️ Removing indicator:', data.uid);

    try {
      ContentControl.remove(data.uid);
      const elapsed = Date.now() - startTime;

      logSuccess('Remove complete', { uid: data.uid, elapsed: elapsed + 'ms' });
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

  function handleUpdateParams(data, startTime) {
    log('⚙️ Updating params...');
    log('⚙️ uid:', data.uid);
    log('⚙️ paramValues:', JSON.stringify(data.paramValues, null, 2));

    try {
      ContentControl.updateTag(data.uid, data.paramValues);
      const elapsed = Date.now() - startTime;

      logSuccess('Update complete', { uid: data.uid, elapsed: elapsed + 'ms' });
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

  function handleGetDocTags(startTime) {
    log('📋 Getting all doc tags...');

    try {
      const tags = ContentControl.getAllTags();
      const elapsed = Date.now() - startTime;

      logSuccess('GetDocTags complete', { count: tags ? tags.length : 0, elapsed: elapsed + 'ms' });
      reply('allTags', {
        tags: tags || [],
        count: tags ? tags.length : 0,
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

  function handleConvertToRaw(startTime) {
    log('🔄 Converting to raw template...');

    try {
      const rawContent = Converter.visualToRaw ? Converter.visualToRaw() : '';
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

  function handleConvertToVisual(data, startTime) {
    log('🔄 Converting to visual...');

    try {
      if (Converter.rawToVisual) {
        Converter.rawToVisual(data.indicatorMap || {});
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

  // ========== 辅助函数 ==========

  function reply(type, data) {
    log('📤 ========== SENDING RESPONSE ==========');
    log('📤 Type:', type);
    log('📤 Data:', JSON.stringify(data, null, 2));

    const message = { type: type, data: data };

    // 尝试多种方式发送消息
    // 1. 使用 OnlyOffice SDK 的 sendToPlugin（如果可用）
    if (window.Asc && window.Asc.plugin && window.Asc.plugin.sendToPlugin) {
      try {
        window.Asc.plugin.sendToPlugin('onMessage', message);
        log('📤 Response sent via sendToPlugin');
      } catch (e) {
        log('⚠️ sendToPlugin failed:', e.message);
        sendViaPostMessage(message);
      }
    } else {
      sendViaPostMessage(message);
    }
  }

  function sendViaPostMessage(message) {
    log('📤 Using postMessage to send response');

    // 尝试发送到顶层窗口（前端）
    try {
      if (window.top && window.top !== window) {
        log('📤 Sending to window.top');
        window.top.postMessage(message, '*');
      }
    } catch (e) {
      log('⚠️ window.top failed:', e.message);
    }

    // 也尝试发送到父窗口
    try {
      if (window.parent && window.parent !== window) {
        log('📤 Sending to window.parent');
        window.parent.postMessage(message, '*');
      }
    } catch (e) {
      log('⚠️ window.parent failed:', e.message);
    }
  }

  // 暴露给调试
  window.TemplateDocAgent = {
    handleInsertIndicator,
    handleRemoveIndicator,
    handleUpdateParams,
    handleGetDocTags,
    handleConvertToRaw,
    handleConvertToVisual,
    log,
    reply
  };

  log('📦 Plugin module loaded');

})(window, undefined);