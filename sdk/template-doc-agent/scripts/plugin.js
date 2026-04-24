/**
 * Template Document Agent - OnlyOffice Plugin
 *
 * 职责：文档操作代理，无 UI，仅通过消息与产品前端通信
 */

(function(window) {
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
  window.Asc = window.Asc || {};
  window.Asc.plugin = window.Asc.plugin || {};

  log('Asc:', window.Asc);
  log('Asc.plugin:', window.Asc?.plugin);
  log('onExternalMessage:', window.Asc?.plugin?.onExternalMessage);

  // ========== 通信状态追踪 ==========

  // 记录消息来源，以便通过相同方式回复
  let lastMessageSource = null;  // 'broadcast' | 'postMessage' | 'sdk'
  let lastMessageEvent = null;   // 用于 postMessage 回复时获取 source

  // ========== 消息处理核心 ==========

  function processMessage(msg, sourceType, event) {
    log('📨 ========== MESSAGE RECEIVED ==========');
    log('📨 Source:', sourceType);
    log('📨 Type:', msg.type);
    log('📨 Data:', JSON.stringify(msg.data, null, 2));
    log('📨 Timestamp:', new Date().toISOString());

    // 记录来源，用于回复
    lastMessageSource = sourceType;
    lastMessageEvent = event;

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

      case 'replaceDroppedIndicator':
        log('🎯 Handling: replaceDroppedIndicator');
        handleReplaceDroppedIndicator(data, startTime);
        break;

      default:
        logError('Unknown message type:', msg.type);
    }
  }

  // ========== 通信方式初始化 ==========

  // 方式1: BroadcastChannel（同源场景）
  let broadcastChannel = null;
  try {
    broadcastChannel = new BroadcastChannel('onlyoffice-plugin-channel');
    broadcastChannel.onmessage = function(event) {
      log('📡 BroadcastChannel received:', event.data);
      processMessage(event.data, 'broadcast', event);
    };
    log('✅ BroadcastChannel initialized (same-origin communication)');
  } catch (e) {
    log('⚠️ BroadcastChannel not available:', e.message);
  }

  // 方式2: postMessage（跨域场景，监听来自 parent 的消息）
  window.addEventListener('message', function(event) {
    log('📬 postMessage received from:', event);

    // 忽略来自自身的消息
    if (event.source === window) {
      return;
    }

    // 解析消息 - 支持多种格式
    let msg = event.data;
    if (!msg || typeof msg !== 'object') {
      return;
    }

    // 格式1: 直接格式 { type: 'insertIndicator', data: {...} }
    if (msg.type && msg.data) {
      // 格式2: OnlyOffice SDK 包装格式 { type: 'onExternalPluginMessage', data: { type: '...', data: {...} } }
      if (msg.type === 'onExternalPluginMessage') {
        processMessage(msg.data, 'postMessage', event);
      } else {
        processMessage(msg, 'postMessage', event);
      }
      return;
    }
    
  });

  log('📦 postMessage listener registered (cross-origin communication)');

  // 方式3: OnlyOffice SDK onExternalMessage - serviceSendMessage 会触发这个
  window.Asc.plugin.onExternalMessage = function(msg) {
    log('📨 ========== EXTERNAL MESSAGE (serviceSendMessage) ==========');
    log('📨 Source: serviceSendMessage');
    log('📨 Message:', JSON.stringify(msg, null, 2));
    log('📨 Timestamp:', new Date().toISOString());

    // serviceSendMessage 发送的消息格式: { type, data }
    processMessage(msg, 'serviceSendMessage', null);
  };

  // 插件初始化
  window.Asc.plugin.init = function() {
    log('🚀 Plugin initialized');
    log('📦 Available modules:', {
      ContentControl: Object.keys(ContentControl),
      Converter: Object.keys(Converter)
    });

    // 通知前端插件已就绪 - 尝试多种方式
    reply('editorReady', { initialized: true, timestamp: Date.now() });
    logSuccess('Editor ready notification sent');


    // 新版本 (8.2+) 推荐使用 attachEditorEvent
    try {
      if (window.Asc.plugin.attachEditorEvent) {
        // 监听焦点进入 Content Control
        //  window.Asc.plugin.attachEditorEvent("onFocusContentControl", function(control) {
        //   log('🖱️ EditorEvent: onFocusContentControl', control);
        //   if (control && control.InternalId) {
        //     onTargetControlClick(control);
        //   }
        // });

        // 监听点击事件作为兜底
        window.Asc.plugin.attachEditorEvent("onClick", function() {
          log('🖱️ EditorEvent: onClick 11111');
          window.Asc.plugin.executeMethod("GetCurrentContentControl", null, function (internalId) {
            console.log('current id', internalId)
            // 点击对象不是ContentControl
            if(!internalId) {
              return
            }

            window.Asc.plugin.executeMethod('GetAllContentControls', null, function (data) {
              console.log('GetAllContentControls data:', internalId, data)
              for (var i = 0; i < data.length; i++) {
                if (data[i].InternalId == internalId) {
                  onTargetControlClick(data[i]);
                  break;
                }
              }
            });
          });
        });
        
        // log('✅ attachEditorEvent listeners initialized');
      }
    } catch (e) {
      log('⚠️ attachEditorEvent failed:', e.message);
    }
  };

  /**
   * OnlyOffice 事件：当点击 Content Control 时触发
   * @param {string} id - Content Control 的 InternalId
   */
  function onTargetControlClick(cc) {
    log('🖱️ Event: onTargetControlClick', cc);
      if (cc && cc.Tag) {
        try {
          // 解析 JSON 标签数据
          // const tagData = JSON.parse(cc.Tag);
          logSuccess('Found indicator tag, sending to frontend:', cc);

          // 发送消息给前端
          reply('tagClicked', cc);

        } catch (e) {
          log('⚠️ Non-indicator ContentControl or invalid JSON Tag');
        }
      }
  }

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
    log('🗑️ Removing indicator (full):', data.InternalId);

    try {
      ContentControl.remove(data) 

      const elapsed = Date.now() - startTime;

      logSuccess('Remove complete', { id: data.InternalId, elapsed: elapsed + 'ms' });
      reply('removeDone', {
        uid: data.Tag?.uid,
        elapsed: elapsed,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('Remove failed:', error.message);
      reply('removeError', {
        uid: data.Tag?.uid,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  function handleUpdateParams(data, startTime) {
    log('⚙️ Updating params...');
    log('⚙️ id:', data.tag?.InternalId);
    log('⚙️ paramValues:', JSON.stringify(data.paramValues, null, 2));

    try {
      // 传递整个 tag 对象和新的参数值
      ContentControl.updateTag(data.tag, data.paramValues);
      const elapsed = Date.now() - startTime;

      logSuccess('Update complete', { id: data.tag?.InternalId, elapsed: elapsed + 'ms' });
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

  async function handleConvertToRaw(startTime) {
    log('🔄 Converting to raw template (async)...');

    try {
      // visualToRaw 现在返回 { rawContent, indicatorMap }
      const result = Converter.visualToRaw ? await Converter.visualToRaw() : { rawContent: '', indicatorMap: {} };
      const elapsed = Date.now() - startTime;
      
      window.Asc.plugin.callCommand(() => {
        console.log('save=', Api)
        Api.Save()
      });

      logSuccess('ConvertToRaw complete', { elapsed: elapsed + 'ms' });
      reply('convertDone', {
        content: result.rawContent,
        indicatorMap: result.indicatorMap,
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
    log('🔄 Converting to visual (async)... data11111=', data);

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

  /**
   * 处理替换拖拽占位符的消息
   * 
   * @param {Object} data - { dropUid: string, indicatorData: Object }
   * @param {number} startTime - 开始处理的时间戳
   */
  function handleReplaceDroppedIndicator(data, startTime) {
    log('🔄 Replacing dropped indicator (delayed)...111', data.dropUid);

    // 延迟 300ms 等待本地拖拽输入操作完成（由 SDK 触发的文字插入）
    setTimeout(async () => {
      try {
        if (!Converter.replaceDroppedPlaceholder) {
          throw new Error('Converter.replaceDroppedPlaceholder not found');
        }

        const success = await Converter.replaceDroppedPlaceholder(data.dropUid, data.indicator);
        
        if (!success) {
          log('⚠️ Placeholder not found, falling back to direct insertion at cursor');
          // 兜底方案：直接在当前光标位置插入
          ContentControl.insert(data.indicator);
        }

        const elapsed = Date.now() - startTime;
        logSuccess('Replace operation finished', { dropUid: data.dropUid, success, elapsed: elapsed + 'ms' });
        
        reply('replaceDone', {
          dropUid: data.dropUid,
          success: true, // 即使是兜底插入也算成功
          elapsed: elapsed,
          timestamp: Date.now()
        });

      } catch (error) {
        logError('Replace failed:', error.message);
        reply('replaceError', {
          dropUid: data.dropUid,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }, 300);
  }

  // ========== 回复函数 - 根据来源选择方式 ==========

  function reply(type, data) {
    log('📤 ========== SENDING RESPONSE ==========');
    log('📤 Type:', type);
    log('📤 Last source:', lastMessageSource);
    log('📤 Data:', JSON.stringify(data, null, 2));

    const message = { type: type, data: data };

    // 根据消息来源选择回复方式
    if (lastMessageSource === 'broadcast') {
      // 同源：通过 BroadcastChannel 回复
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(message);
          log('📤 Response sent via BroadcastChannel');
          return;
        } catch (e) {
          log('⚠️ BroadcastChannel failed:', e.message);
        }
      }
    } else if (lastMessageSource === 'postMessage' && lastMessageEvent) {
      // postMessage：通过 postMessage 回复到消息来源
      try {
        lastMessageEvent.source.postMessage(message, '*');
        log('📤 Response sent via postMessage to source');
        return;
      } catch (e) {
        log('⚠️ postMessage to source failed:', e.message);
      }
    } else if (lastMessageSource === 'serviceSendMessage') {
      // serviceSendMessage：使用 BroadcastChannel 或 postMessage 回复
      // 因为 serviceSendMessage 是单向的，插件需要通过其他方式回复
      log('📤 serviceSendMessage source, using fallback');
      sendFallback(message);
      return;
    }

    // 兜底：尝试所有方式
    log('📤 Using fallback methods...');
    sendFallback(message);
  }

  function sendFallback(message) {
    // 尝试 BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(message);
        log('📤 Fallback: sent via BroadcastChannel');
      } catch (e) {
        log('⚠️ Fallback BroadcastChannel failed:', e.message);
      }
    }

    // 尝试 postMessage 到顶层和父窗口
    try {
      if (window.top) {
        window.top.postMessage(message, '*');
        log('📤 Fallback: sent to window.top');
      }
      if (window.parent && window.parent !== window.top) {
        window.parent.postMessage(message, '*');
        log('📤 Fallback: sent to window.parent');
      }
    } catch (e) {
      log('⚠️ Fallback postMessage failed:', e.message);
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
    handleReplaceDroppedIndicator,
    log,
    reply,
    // 测试方法
    testBroadcast: function() {
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'test', data: { from: 'plugin' } });
        log('📤 Test broadcast sent');
      }
    }
  };

  log('📦 Plugin module loaded');

})(window);