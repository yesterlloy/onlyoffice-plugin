# 数据研判分析系统 - OnlyOffice 薄插件设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 版本 | V1.0 |
| 日期 | 2026-04-09 |
| 状态 | 待审核 |
| 作者 | Claude |

---

## 1. 插件概述

### 1.1 插件定位

**薄插件（Thin Plugin）**：无 UI 的"文档操作代理"，仅通过消息与产品前端通信。

### 1.2 核心职责

| 职责 | 说明 |
|------|------|
| Content Control 操作 | 创建、读取、删除、更新 |
| Tag 元数据读写 | 存储指标信息的 JSON 数据 |
| 双向转换 | 可视化 ↔ 原始模板语法 |
| 消息通信 | 与产品前端 postMessage 交互 |

### 1.3 设计原则

- **轻量稳定**：代码量控制在 800-1200 行
- **无 UI**：所有界面由产品前端实现
- **单一职责**：仅处理文档操作，不涉及业务逻辑
- **数据透明**：不在插件内缓存业务数据

---

## 2. 项目结构

### 2.1 目录结构

```
sdk/template-doc-agent/
├── config.json              # OnlyOffice 插件配置
├── index.html               # 插件入口（加载 JS 模块）
├── scripts/
│   ├── plugin.js            # 插件主入口，消息路由
│   ├── contentControl.js    # Content Control 操作封装
│   ├── converter.js         # 双向转换引擎
│   └── patterns.js          # 模板语法正则库
└── resources/
    └── icon.png             # 插件图标
```

### 2.2 模块说明

| 模块 | 职责 | 代码行数 |
|------|------|----------|
| plugin.js | 消息路由、初始化 | ~150 行 |
| contentControl.js | Content Control CRUD | ~200 行 |
| converter.js | 双向转换引擎 | ~250 行 |
| patterns.js | 正则模式定义 | ~150 行 |
| **总计** | | **~750 行** |

---

## 3. 消息协议

### 3.1 消息格式

```javascript
{
  type: '消息类型',
  data: { /* 消息数据 */ }
}
```

### 3.2 产品前端 → 插件

| 消息类型 | 触发场景 | 携带数据 |
|----------|----------|----------|
| `insertIndicator` | 拖拽指标释放到文档 | `{ uid, indicatorId, code, field, name, type, chartType, paramValues }` |
| `removeIndicator` | 用户删除标签 | `{ uid }` |
| `updateParams` | 用户保存参数配置 | `{ uid, paramValues }` |
| `getDocTags` | 打开配置面板时查询 | 无 |
| `convertToRaw` | 保存/预览时触发 | 无 |
| `convertToVisual` | 打开模板时触发 | `{ indicatorMap }` |

### 3.3 插件 → 产品前端

| 消息类型 | 触发场景 | 携带数据 |
|----------|----------|----------|
| `insertDone` | 插入成功 | `{ uid, tagUid }` |
| `removeDone` | 删除成功 | `{ uid }` |
| `updateDone` | 更新成功 | `{ uid }` |
| `allTags` | 查询响应 | `{ tags: [...] }` |
| `convertDone` | 转换完成 | `{ content?, direction }` |
| `tagClicked` | 用户点击标签 | `{ uid, paramValues }` |
| `*Error` | 操作失败 | `{ uid?, error }` |

### 3.4 通信示例

**插入指标**：
```javascript
// 产品前端发送
window.postMessage({
  type: 'insertIndicator',
  data: {
    uid: 'tag_001',
    indicatorId: 'work_count',
    code: 'JK4816',
    field: 'work_count',
    name: '受理总量',
    type: 'number',
    paramValues: { dataSource: 'JK195981497926161032', unit: '万宗' }
  }
});

// 插件响应
window.Asc.plugin.sendToPlugin('onMessage', {
  type: 'insertDone',
  data: { uid: 'tag_001', tagUid: 'tag_001' }
});
```

---

## 4. Content Control 操作

### 4.1 Tag 元数据结构

Content Control 的 Tag 字段存储 JSON 格式的元数据：

```json
{
  "uid": "tag_001",
  "type": "number",
  "indicatorId": "work_count",
  "code": "JK4816",
  "field": "work_count",
  "name": "受理总量",
  "chartType": null,
  "paramValues": {
    "dataSource": "JK195981497926161032",
    "unit": "万宗",
    "decimal": 0
  }
}
```

### 4.2 标签样式映射

| 指标类型 | 颜色 | 标题前缀 |
|----------|------|----------|
| text | #36D399 | 📝 |
| number | #36D399 | 🔢 |
| percent | #36D399 | 📊 |
| date | #36D399 | 📅 |
| chart | #4F7CFF | 📈 |
| table | #8B5CF6 | 📋 |
| condition | #F59E0B | ⚙️ |
| ai_generate | #7C3AED | 🤖 |

### 4.3 操作 API

| 方法 | 说明 | 参数 |
|------|------|------|
| `insert(data)` | 在光标位置创建 Content Control | 标签数据对象 |
| `remove(uid)` | 删除指定 Content Control | uid |
| `updateTag(uid, paramValues)` | 更新 Tag 中的参数 | uid, paramValues |
| `getAllTags()` | 获取文档中所有标签 | 无 |
| `getTagByUid(uid)` | 获取单个标签详情 | uid |

---

## 5. 双向转换引擎

### 5.1 可视化 → 原始（convertToRaw）

**流程**：
1. 获取文档全文内容
2. 遍历所有 Content Control
3. 读取每个 Content Control 的 Tag 元数据
4. 根据 type 和 paramValues 生成模板表达式
5. 将 Content Control 替换为纯文本表达式
6. 返回原始模板内容

### 5.2 原始 → 可视化（convertToVisual）

**流程**：
1. 获取文档全文内容
2. 使用正则匹配所有 `{{...}}` 表达式
3. 对每个表达式，查找指标映射表中的匹配项
4. 创建 Content Control，写入 Tag 元数据
5. 替换原始文本为可视化标签

### 5.3 表达式生成规则

| 指标类型 | paramValues | 生成的模板语法 |
|----------|-------------|----------------|
| text/number/percent | code=JK4816, field=year | `{{JK4816.get("year")}}` |
| chart | code=JK3008, dataSource=JK1959.. | `{{put("JK3008", data("JK1959.."))}}` |
| ai_generate | field=overview, prompt=..., model=... | `{{ai_generate("overview", prompt="...", model="...")}}` |
| condition | bindIndicator=JK4816 | `{{?JK4816 instanceof T(java.util.Map)}}...{{/}}` |
| date | format=yyyy年MM月dd日 | `{{f(now(),"yyyy年MM月dd日")}}` |

---

## 6. 模板语法正则库

### 6.1 正则模式定义

```javascript
// 文本/数值类指标
TEXT_INDICATOR: /\{\{([A-Z0-9]+)\.get\("([a-zA-Z0-9_]+)"\)\}\}/g

// 图表类指标
CHART_INDICATOR: /\{\{put\("([A-Z0-9]+)",\s*data\("([^"]+)"\)\)\}\}/g

// AI 生成类
AI_GENERATE: /\{\{ai_generate\("([a-zA-Z0-9_]+)"[^}]*\}\}/g

// 条件控制块
CONDITION_BLOCK: /\{\{\?([A-Z0-9]+)\s+instanceof\s+T\(java\.util\.Map\)\}\}([\s\S]*?)\{\{\/\}\}/g

// 日期格式化
DATE_FORMAT: /\{\{f\(now\(\),"([^"]+)"\)\}\}/g

// 通用表达式
GENERIC_EXPRESSION: /\{\{([^}]+)\}\}/g
```

### 6.2 表达式解析

```javascript
// 解析表达式：{{JK4816.get("work_count")}}
parseExpression('JK4816.get("work_count")')
// 返回：
{
  type: 'text',
  code: 'JK4816',
  field: 'work_count',
  params: {}
}

// 解析表达式：{{put("JK3008", data("JK1959.."))}}
parseExpression('put("JK3008", data("JK1959.."))')
// 返回：
{
  type: 'chart',
  code: 'JK3008',
  field: 'chart',
  params: { dataSource: 'JK1959..' }
}
```

---

## 7. 与 OnlyOffice API 集成

### 7.1 使用的 OnlyOffice API

| API 方法 | 用途 |
|----------|------|
| `InsertAndReplaceContentControls` | 创建 Content Control |
| `RemoveContentControl` | 删除 Content Control |
| `GetContentControl` | 获取单个 Content Control |
| `GetAllContentControls` | 获取所有 Content Control |
| `UpdateContentControl` | 更新 Content Control 属性 |
| `GetDocumentContent` | 获取文档全文 |
| `executeMethod` | 执行编辑器方法 |

### 7.2 Content Control 属性

```javascript
{
  Id: 'tag_001',           // 唯一标识
  Tag: '{...}',            // JSON 元数据
  Title: '🔢 受理总量',     // 显示标题
  Lock: 0,                 // 锁定状态
  Appearance: 1            // 外观样式
}
```

---

## 8. 错误处理

### 8.1 错误类型

| 错误 | 场景 | 处理方式 |
|------|------|----------|
| `insertError` | 插入失败 | 返回错误信息 |
| `removeError` | 删除失败 | 返回错误信息 |
| `updateError` | 更新失败 | 返回错误信息 |
| `convertError` | 转换失败 | 返回错误信息 |
| `getTagsError` | 查询失败 | 返回错误信息 |

### 8.2 错误响应格式

```javascript
{
  type: 'insertError',
  data: {
    uid: 'tag_001',
    error: 'Content Control creation failed'
  }
}
```

---

## 9. 调试指南

### 9.1 启用日志

插件内置日志输出，可通过浏览器控制台查看：

```
[TemplateDocAgent] Plugin initialized
[TemplateDocAgent] Received message: insertIndicator
[TemplateDocAgent] Insert failed: ...
```

### 9.2 手动测试

在浏览器控制台执行：

```javascript
// 测试插入
TemplateDocAgent.handleInsertIndicator({
  uid: 'test_001',
  indicatorId: 'year',
  code: 'JK4816',
  field: 'year',
  name: '年份',
  type: 'text',
  paramValues: {}
});

// 测试获取所有标签
TemplateDocAgent.handleGetDocTags();
```

---

## 10. 部署说明

### 10.1 插件安装

1. 将 `template-doc-agent` 目录复制到 OnlyOffice 插件目录
2. 重启 OnlyOffice 服务
3. 在编辑器中启用插件

### 10.2 配置修改

修改 `config.json` 中的 `guid` 为实际值：

```json
{
  "guid": "asc.{your-company}.template-doc-agent",
  ...
}
```

---

## 11. 与产品前端集成

### 11.1 通信代码示例

```javascript
// 产品前端发送消息
function sendToPlugin(type, data) {
  const pluginFrame = document.getElementById('onlyoffice-editor');
  if (pluginFrame && pluginFrame.contentWindow) {
    pluginFrame.contentWindow.postMessage({ type, data }, '*');
  }
}

// 产品前端接收消息
window.addEventListener('message', function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'tagClicked':
      // 打开配置面板
      openConfigPanel(data.uid, data.paramValues);
      break;
    case 'insertDone':
      // 显示成功提示
      message.success('指标插入成功');
      break;
  }
});
```

---

## 12. 附录

### 12.1 完整消息流程示例

**拖拽插入指标**：

```
1. 用户在前端拖拽指标到文档
2. 前端检测释放位置
3. 前端发送 insertIndicator 消息
4. 插件调用 OnlyOffice API 创建 Content Control
5. 插件返回 insertDone 消息
6. 前端显示成功提示
```

**保存模板**：

```
1. 用户点击保存按钮
2. 前端发送 convertToRaw 消息
3. 插件遍历所有 Content Control
4. 插件生成模板表达式替换标签
5. 插件返回 convertDone（含原始内容）
6. 前端调用后端 API 保存
```

### 12.2 已知限制

1. OnlyOffice API 部分方法为异步调用，需要注意回调处理
2. Content Control 的 Tag 字段长度有限制，需控制 JSON 大小
3. 部分旧版 OnlyOffice 可能不支持某些 API