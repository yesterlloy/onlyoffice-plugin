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

      case 'setLoopRegion':
        log('🎯 Handling: setLoopRegion');
        handleSetLoopRegion(data, startTime);
        break;

      case 'removeLoopEnd':
        log('🎯 Handling: removeLoopEnd');
        handleRemoveLoopEnd(data, startTime);
        break;

      case 'applyLoopConfig':
        log('🎯 Handling: applyLoopConfig');
        handleApplyLoopConfig(data, startTime);
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
    log('🚀 Plugin initialized 22222');
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
          log('🖱️ EditorEvent: onClick 6666');
          
          window.Asc.plugin.executeMethod("GetCurrentContentControl", null, function (internalId) {
            console.log('current id', internalId)
            
            if(internalId) {
              // 处理 ContentControl 点击
              window.Asc.plugin.executeMethod('GetAllContentControls', null, function (data) {
                console.log('GetAllContentControls data:', internalId, data)
                for (var i = 0; i < data.length; i++) {
                  if (data[i].InternalId == internalId) {
                    onTargetControlClick(data[i]);
                    break;
                  }
                }
              });
            } else {
              // 点击对象不是ContentControl，尝试检测是否点击了循环区域批注
              checkForLoopComment();
            }
          });
        });

        // 监听批注点击/聚焦事件 - 循环区域配置入口
        window.Asc.plugin.attachEditorEvent("onClickAnnotation", function(data) {
          log('🖱️ EditorEvent: onClickAnnotation', data);
          checkForLoopComment(data);
        });

        window.Asc.plugin.attachEditorEvent("onFocusAnnotation", function(data) {
          log('🖱️ EditorEvent: onFocusAnnotation', data);
          checkForLoopComment(data);
        });

        // 监听光标位置变化 - 更加灵敏的检测方式
        // window.Asc.plugin.attachEditorEvent("onTargetPositionChanged", function() {
          // 为了性能考虑，可以在这里做频率限制，但目前逻辑较轻，直接调用
          // checkForLoopComment();
        // });
        
        // log('✅ attachEditorEvent listeners initialized');
      }
    } catch (e) {
      log('⚠️ attachEditorEvent failed:', e.message);
    }
  };

  /**
   * 检测当前位置是否处于循环区域批注中
   * @param {Object} eventData - 可选的事件数据（包含 paragraphId 和 ranges）
   */
  var isCheckingLoopComment = false;
  function checkForLoopComment(eventData) {
    if (isCheckingLoopComment) return;
    isCheckingLoopComment = true;

    window.Asc.plugin.callCommand(function(extData) {
      var oDocument = Api.GetDocument();
      var oRange = oDocument.GetRangeBySelect();
      if (!oRange) return null;

      // 1. 尝试检测标准 ApiComment
      var aComments = [];
      
      if (oRange.GetComments) {
        aComments = oRange.GetComments();
      } else if (oRange.GetComment) {
        var singleComment = oRange.GetComment();
        if (singleComment) aComments = [singleComment];
      }

      // 如果通过 Range 无法直接获取，且当前有选中文本，尝试通过 QuoteText 匹配
      if (aComments.length === 0) {
        var selectedText = oRange.GetText();
        if (selectedText) {
          var allComments = oDocument.GetAllComments();
          for (var i = 0; i < allComments.length; i++) {
            var comment = allComments[i];
            // 注意：某些版本 ApiComment 可能没有 GetQuoteText，需做防御
            var quote = comment.GetQuoteText ? comment.GetQuoteText() : "";
            if (quote === selectedText) {
              aComments.push(comment);
            }
          }
        }
      }

      // 过滤并返回循环区域批注
      if (aComments && aComments.length > 0) {
        for (var i = 0; i < aComments.length; i++) {
          var text = aComments[i].GetText();
          if (text && text.indexOf("循环区域：") === 0) {
            return {
              type: 'comment',
              text: text,
              quote: aComments[i].GetQuoteText ? aComments[i].GetQuoteText() : "",
              author: aComments[i].GetAuthor ? aComments[i].GetAuthor() : "",
            };
          }
        }
      }
      
      // 2. 尝试检测 AnnotateParagraph 批注 (通过 extData)
      if (extData && extData.ranges && extData.ranges.length > 0) {
          // 目前 AnnotateParagraph 的元数据通过全文匹配 QuoteText 逻辑处理（见上方）
      }

      return null;
    }, false, true, function(commentData) {
      isCheckingLoopComment = false;
      if (commentData) {
        log('✅ Detected loop comment:', commentData);
        reply('loopCommentClicked', commentData);
      }
    }, eventData);
  }

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

  async function handleSetLoopRegion(data, startTime) {
    log('🎯 handleSetLoopRegion START', data);
    
    if (!data || !data.InternalId) {
      reply('setLoopRegionError', { message: 'Invalid tag data' });
      return;
    }

    window.Asc.plugin.callCommand(function(tagInfo) {
      var oDocument = Api.GetDocument();
      var oContentControls = oDocument.GetAllContentControls();
      var oTargetCC = null;
      for (var i = 0; i < oContentControls.length; i++) {
        if (oContentControls[i].GetInternalId() == tagInfo.InternalId) {
          oTargetCC = oContentControls[i];
          break;
        }
      }

      if (oTargetCC) {
        var tagJson = oTargetCC.GetTag();
        if (!tagJson) return false;
        var tagData = JSON.parse(tagJson);
        
        if (!tagData.text.startsWith('循环开始：')) {
          tagData.text = '循环开始：' + tagData.text;
          tagData.isLoopStart = true;
          tagData.loopEndUid = tagData.uid + '_end';
          
          oTargetCC.SetTag(JSON.stringify(tagData));
          oTargetCC.Clear();
          var oRun = Api.CreateRun();
          oRun.AddText(tagData.text);
          oTargetCC.AddElement(oRun, 0);

          var oEndCC = Api.CreateInlineLvlSdt();
          var endTagData = {
             uid: tagData.loopEndUid,
             type: 'loop_end',
             text: '循环结束',
             name: '循环结束',
             isLoopEnd: true,
             loopStartUid: tagData.uid
          };
          oEndCC.SetTag(JSON.stringify(endTagData));
          oEndCC.SetLock("sdtContentUnlocked");
          var oEndRun = Api.CreateRun();
          oEndRun.AddText("循环结束");
          oEndCC.AddElement(oEndRun, 0);
          
          var oPara = oTargetCC.GetParent();
          if (oPara) {
            var count = oPara.GetElementsCount();
            var targetIndex = -1;
            for (var j = 0; j < count; j++) {
              var el = oPara.GetElement(j);
              if (el && el.GetInternalId && el.GetInternalId() === tagInfo.InternalId) {
                targetIndex = j;
                break;
              }
            }
            if (targetIndex !== -1) {
              oPara.AddElement(oEndCC, targetIndex + 1);
            } else {
              oPara.AddElement(oEndCC);
            }
          }
        }
      }
      return true;
    }, false, true, function() {
      reply('setLoopRegionSuccess', {
        timestamp: Date.now(),
        elapsed: Date.now() - startTime
      });
    }, { InternalId: data.InternalId });
  }

  async function handleRemoveLoopEnd(data, startTime) {
    log('🎯 handleRemoveLoopEnd START', data);
    
    if (!data || !data.InternalId) {
      reply('removeLoopEndError', { message: 'Invalid tag data' });
      return;
    }

    window.Asc.plugin.callCommand(function(tagInfo) {
      var oDocument = Api.GetDocument();
      var oContentControls = oDocument.GetAllContentControls();
      var oTargetCC = null;
      for (var i = 0; i < oContentControls.length; i++) {
        if (oContentControls[i].GetInternalId() == tagInfo.InternalId) {
          oTargetCC = oContentControls[i];
          break;
        }
      }

      if (oTargetCC) {
        var tagJson = oTargetCC.GetTag();
        if (!tagJson) return false;
        var tagData = JSON.parse(tagJson);
        
        if (tagData.text.startsWith('循环开始：')) {
          tagData.text = tagData.text.substring(5); // 去除 "循环开始："
          tagData.isLoopStart = false;
          var endUid = tagData.loopEndUid;
          delete tagData.loopEndUid;
          
          oTargetCC.SetTag(JSON.stringify(tagData));
          oTargetCC.Clear();
          var oRun = Api.CreateRun();
          oRun.AddText(tagData.text);
          oTargetCC.AddElement(oRun, 0);

          for (var j = 0; j < oContentControls.length; j++) {
            var ccTag = oContentControls[j].GetTag();
            if (ccTag) {
              var ccData = JSON.parse(ccTag);
              if (ccData.uid === endUid || ccData.loopStartUid === tagData.uid) {
                oContentControls[j].Delete(false);
              }
            }
          }
        }
      }
      return true;
    }, false, true, function() {
      reply('removeLoopEndSuccess', {
        timestamp: Date.now(),
        elapsed: Date.now() - startTime
      });
    }, { InternalId: data.InternalId });
  }

  function handleApplyLoopConfig(data, startTime) {
    log('📝 Applying loop config:', data);
    
    var newText = "循环区域：【" + data.indicatorId + ".subList(" + (data.startIndex || 0) + ", " + (data.endIndex || 10) + ")】";

    // 1. 先尝试通过 AnnotateParagraph 更新 (如果是新版标注)
    // 获取当前位置的 IDs
    window.Asc.plugin.executeMethod("GetSelectedContent", [{ type: "json" }], function(jsonRes) {
      var selectionData = typeof jsonRes === 'string' ? JSON.parse(jsonRes) : jsonRes;
      var paragraphs = selectionData ? (selectionData.paragraphs || selectionData.elements) : null;

      if (paragraphs && paragraphs.length > 0) {
        var targetPara = paragraphs[0];
        
        window.Asc.plugin.callCommand(function(configData) {
          var oDocument = Api.GetDocument();
          var oRange = oDocument.GetRangeBySelect();
          if (!oRange) return null;

          // 检查当前是否有标准批注
          var aComments = oRange.GetComments ? oRange.GetComments() : [];
          if (aComments.length === 0 && oRange.GetComment) {
              var sc = oRange.GetComment();
              if (sc) aComments = [sc];
          }

          if (aComments.length > 0) {
            // 如果是标准批注，移除并重新添加
            // 注意：由于 ApiComment.GetRange() 可能失败，我们直接使用当前选择区域 oRange
            // 因为点击批注通常会选中该批注的文本
            oRange.RemoveComment();
            oRange.AddComment(configData.newText, "TemplateEditor");
            return { type: 'comment' };
          }
          return { type: 'none', start: oRange.GetStartPos() - oRange.GetParagraph(0).GetRange().GetStartPos(), length: oRange.GetText().length };
        }, false, true, function(res) {
          if (res && res.type === 'none') {
            // 如果不是标准批注，尝试使用 AnnotateParagraph (更新或添加)
            window.Asc.plugin.executeMethod("AnnotateParagraph", [{
              "type": "highlightText",
              "name": "loop_region",
              "paragraphId": targetPara.paragraphId,
              "recalcId": targetPara.recalcId,
              "ranges": [{
                "start": res.start,
                "length": res.length,
                "id": "loop_" + Date.now(),
                "text": newText
              }]
            }]);
          }
          log('✅ Apply Loop Config SUCCESS');
          reply('applyLoopConfigSuccess', { status: 'ok', timestamp: Date.now() - startTime });
        }, { newText: newText });
      }
    });
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