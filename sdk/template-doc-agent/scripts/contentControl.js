/**
 * Content Control 操作模块
 *
 * 提供对 OnlyOffice Content Control 的 CRUD 操作
 */

(function(window, undefined) {

  // 调试日志配置
  const LOG_PREFIX = '[ContentControl]';
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

  // Content Control 标签样式映射
  const TAG_STYLES = {
    text: { color: '36D399', title: '📝 ' },
    number: { color: '36D399', title: '🔢 ' },
    percent: { color: '36D399', title: '📊 ' },
    date: { color: '36D399', title: '📅 ' },
    chart: { color: '4F7CFF', title: '📈 ' },
    table: { color: '8B5CF6', title: '📋 ' },
    condition: { color: 'F59E0B', title: '⚙️ ' },
    ai_generate: { color: '7C3AED', title: '🤖 ' }
  };

  /**
   * 插入 Content Control
   * @param {Object} data - 标签数据
   * @returns {Object} - 创建的标签信息
   */
  function insert(data) {
    log('========== INSERT START ==========');
    log('📥 Input data:', JSON.stringify(data, null, 2));

    const uid = data.uid || generateUid();
    const style = TAG_STYLES[data.type] || TAG_STYLES.text;
    const displayTitle = style.title + data.name;

    log('🏷️ Generated UID:', uid);
    log('🎨 Style config:', { type: data.type, color: style.color, title: displayTitle });

    // 构建 Tag 元数据
    const tagData = {
      uid: uid,
      type: data.type,
      indicatorId: data.indicatorId,
      code: data.code,
      field: data.field,
      name: data.name,
      chartType: data.chartType || null,
      text: displayTitle,
      paramValues: data.paramValues || {}
    };

    const tagJson = JSON.stringify(tagData);
    log('📦 Tag metadata:', tagJson);
    log('📦 Tag size:55555', tagJson.length, 'bytes', style.color);

    // 构建 Content Control 配置
    const ccConfig = {
      Props: {
        Id: uid,
        Tag: tagJson,
        Title: displayTitle,
        // Alias: displayTitle,
        PlaceHolderText: displayTitle,
        // 0 - 仅删除 1 - 禁止删除或编辑 2 - 仅编辑 3 - 完全访问
        Lock: 3,
        Appearance: 1  // 1 - 标签
      },
      Script: `

        var oRun = Api.CreateInlineLvlSdt()
        oRun.AddText("${displayTitle}");

        Api.GetDocument().InsertContent([oRun], true, {"KeepTextOnly": true});
      `
    };

    log('🔧 ContentControl config:', JSON.stringify(ccConfig, null, 2));
    log('window.Asc=', window.Asc)

    // 检查 OnlyOffice API 是否可用
    if (!window.Asc || !window.Asc.plugin) {
      logError('OnlyOffice API not available!');
      throw new Error('OnlyOffice API not available');
    }

    log('📡 Calling InsertAndReplaceContentControls with correct nesting...');

    // 注意：executeMethod 的第二个参数是传递给内部方法的参数列表。
    // InsertAndReplaceContentControls 接收一个数组作为唯一参数。
    // 因此需要嵌套数组: [[ccConfig]]
    // window.Asc.plugin.executeMethod('InsertAndReplaceContentControls', [[ccConfig]]);

    //指定内容控件类型的数值。可以是以下值之一：1（块）、2（内联）、3（行）或 4（单元格）。
    window.Asc.plugin.executeMethod ("AddContentControl", [2, ccConfig.Props]);

    logSuccess('Insert API called');
    log('========== INSERT END ==========');

    return { uid: uid };
  }

  /**
   * 移除 Content Control
   * @param {string} uid - 标签唯一标识
   */
  function remove(data) {
    log('========== REMOVE START ==========');
    log('🗑️ data.InternalId11111111:', data.InternalId);

    if (!window.Asc || !window.Asc.plugin) {
      logError('OnlyOffice API not available!');
      throw new Error('OnlyOffice API not available');
    }

    log('📡 Calling RemoveContentControl...');

    // 1. 移除 Content Control 控件本身
      // 使用 InternalId 以确保唯一性
      window.Asc.plugin.executeMethod('RemoveContentControl', [data.InternalId]);

      // 2. 清除控件内的文本内容
      // 使用 InputText 将选中的文本（刚才移除控件后会自动选中该区域）替换为空
      // 这里的 data.Title 通常是显示名称，作为原文本提示
      // window.Asc.plugin.executeMethod('InputText', ['', data.Tag?.text || '']);

    logSuccess('Remove API called');
    log('========== REMOVE END ==========');
  }

  /**
   * 更新 Content Control 的 Tag 元数据
   * @param {Object} tag - 完整的 Content Control 对象
   * @param {Object} paramValues - 新的参数值
   */
  function updateTag(tag, paramValues) {
    log('========== UPDATE START 2222==========');
    log('⚙️ InternalId:', tag.InternalId);
    log('⚙️ New paramValues:', JSON.stringify(paramValues, null, 2));

    if (!window.Asc || !window.Asc.plugin) {
      logError('OnlyOffice API not available!');
      throw new Error('OnlyOffice API not available');
    }

    try {
      // 1. 获取当前的 Tag 数据
      let tagData = tag.Tag;
      if (typeof tagData === 'string') {
        tagData = JSON.parse(tagData);
      }

      // 2. 合并新参数
      tagData.paramValues = { ...tagData.paramValues, ...paramValues };
      const newTagJson = JSON.stringify(tagData);

      log('📦 Updated tagData:', newTagJson);

      // 3. 调用 UpdateContentControl 更新
      // 使用 InternalId 以确保操作正确的目标
      // 构建 Content Control 配置
    const ccConfig = {
      Props: {
        Tag: newTagJson,
        InternalId: tag.InternalId,
        Id: tagData.uid,
        //0 - 仅删除 1 - 禁止删除或编辑 2 - 仅编辑 3 - 完全访问
        Lock: 3,  // 0 - 可编辑
        Appearance: 1  // 1 - 标签
      },
      Script: `
        var oParagraph = Api.CreateParagraph();
        oParagraph.AddText("${tagData.text}");

        Api.GetDocument().InsertContent([oParagraph], true, {"KeepTextOnly": true});
      `
    };

    log('🔧 ContentControl config:', JSON.stringify(ccConfig, null, 2));
    log('window.Asc=', window.Asc)


    log('📡 Calling InsertAndReplaceContentControls with correct nesting...');

    // 注意：executeMethod 的第二个参数是传递给内部方法的参数列表。
    // InsertAndReplaceContentControls 接收一个数组作为唯一参数。
    // 因此需要嵌套数组: [[ccConfig]]
    window.Asc.plugin.executeMethod('InsertAndReplaceContentControls', [[ccConfig]]);
      

      logSuccess('Update complete');

    } catch (e) {
      logError('Update tag failed:', e.message, e.stack);
    }

    log('========== UPDATE END ==========');
  }

  /**
   * 获取文档中所有 Content Control 标签
   * @returns {Array} - 标签列表
   */
  function getAllTags() {
    log('========== GET_ALL_TAGS START ==========');

    const tags = [];

    if (!window.Asc || !window.Asc.plugin) {
      logError('OnlyOffice API not available!');
      return tags;
    }

    log('📡 Calling GetAllContentControls...');

    // 使用同步方式获取（实际 OnlyOffice 可能需要回调）
    window.Asc.plugin.executeMethod('GetAllContentControls', [], function(result) {
      log('📥 GetAllContentControls result:', JSON.stringify(result, null, 2));

      if (result && Array.isArray(result)) {
        log('📊 Found', result.length, 'ContentControls');

        result.forEach(function(cc, index) {
          log('🔍 Processing CC #' + index, {
            Id: cc.Id,
            Title: cc.Title,
            TagPreview: cc.Tag ? cc.Tag.substring(0, 100) + '...' : '(empty)'
          });

          try {
            const tagData = JSON.parse(cc.Tag);
            tags.push({
              uid: tagData.uid,
              indicatorId: tagData.indicatorId,
              type: tagData.type,
              paramValues: tagData.paramValues
            });
            log('✅ Parsed successfully:', tagData.uid);

          } catch (e) {
            log('⚠️ Non-JSON Tag, skipping:', cc.Id);
          }
        });
      } else {
        log('⚠️ No ContentControls found or invalid result');
      }
    });

    logSuccess('getAllTags complete, found', tags.length, 'tags');
    log('========== GET_ALL_TAGS END ==========');

    return tags;
  }

  /**
   * 根据 UID 获取单个 Content Control 的 Tag
   * @param {string} uid
   * @returns {Object|null}
   */
  function getTagByUid(uid) {
    log('========== GET_TAG_BY_UID START ==========');
    log('🔍 UID:', uid);

    let result = null;

    if (!window.Asc || !window.Asc.plugin) {
      logError('OnlyOffice API not available!');
      return null;
    }

    log('📡 Calling GetContentControl...');

    window.Asc.plugin.executeMethod('GetContentControl', [uid], function(cc) {
      log('📥 GetContentControl result:', JSON.stringify(cc, null, 2));

      if (cc && cc.Tag) {
        try {
          result = JSON.parse(cc.Tag);
          logSuccess('Parsed successfully:', result.uid);
        } catch (e) {
          logError('Parse tag failed:', e.message);
        }
      } else {
        log('⚠️ ContentControl not found');
      }
    });

    log('========== GET_TAG_BY_UID END ==========');

    return result;
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
  window.ContentControlModule = {
    insert: insert,
    remove: remove,
    updateTag: updateTag,
    getAllTags: getAllTags,
    getTagByUid: getTagByUid
  };

  log('📦 ContentControlModule loaded');

})(window, undefined);