# Template Document Agent - OnlyOffice 插件

## 概述

Template Document Agent 是一个 OnlyOffice 文档编辑器插件，作为"薄插件"提供文档操作代理功能。该插件无 UI 界面，仅通过消息与产品前端通信。

### 核心功能

- **Content Control 操作**：创建、读取、更新、删除
- **Tag 元数据管理**：存储指标信息的 JSON 数据
- **双向转换**：可视化标签 ↔ 原始模板语法
- **消息通信**：与产品前端 postMessage 交互

---

## 目录结构

```
template-doc-agent/
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

---

## 安装部署

### 方式一：本地开发部署

1. **复制插件到 OnlyOffice 插件目录**

```bash
# Linux
cp -r template-doc-agent /var/www/onlyoffice/documentserver/sdkjs-plugins/

# Windows
xcopy template-doc-agent C:\Program Files\ONLYOFFICE\DocumentServer\sdkjs-plugins\ /E
```

2. **重启 OnlyOffice 服务**

```bash
# Linux (Docker)
docker restart onlyoffice-document-server

# Linux (包安装)
systemctl restart ds-docservice
```

3. **在编辑器中启用插件**

打开 OnlyOffice 编辑器 → 插件 → 管理插件 → 启用 "Template Document Agent"

### 方式二：通过配置文件加载

修改 `config.json` 中的 `baseUrl` 指向插件托管地址：

```json
{
  "name": "Template Document Agent",
  "guid": "asc.{your-company}.template-doc-agent",
  "baseUrl": "https://your-domain.com/plugins/template-doc-agent/",
  ...
}
```

---

## 消息协议

### 消息格式

所有消息采用统一格式：

```javascript
{
  type: '消息类型',
  data: { /* 消息数据 */ }
}
```

### 产品前端 → 插件

| 消息类型 | 说明 | 数据结构 |
|----------|------|----------|
| `insertIndicator` | 插入指标标签 | 见下方示例 |
| `removeIndicator` | 删除标签 | `{ uid }` |
| `updateParams` | 更新参数 | `{ uid, paramValues }` |
| `getDocTags` | 获取所有标签 | 无 |
| `convertToRaw` | 可视化→原始 | 无 |
| `convertToVisual` | 原始→可视化 | `{ indicatorMap }` |

#### insertIndicator 数据示例

```javascript
{
  uid: 'tag_001',
  indicatorId: 'work_count',
  code: 'JK4816',
  field: 'work_count',
  name: '受理总量',
  type: 'number',  // text/number/percent/date/chart/ai_generate/condition
  chartType: null, // bar/pie/line (仅 chart 类型)
  paramValues: {
    dataSource: 'JK195981497926161032',
    unit: '万宗',
    decimal: 0
  }
}
```

### 插件 → 产品前端

| 消息类型 | 说明 | 数据结构 |
|----------|------|----------|
| `insertDone` | 插入成功 | `{ uid, tagUid }` |
| `removeDone` | 删除成功 | `{ uid }` |
| `updateDone` | 更新成功 | `{ uid }` |
| `allTags` | 标签列表 | `{ tags: [...] }` |
| `convertDone` | 转换完成 | `{ content?, direction }` |
| `tagClicked` | 用户点击标签 | `{ uid, paramValues }` |
| `*Error` | 操作失败 | `{ uid?, error }` |

---

## 与产品前端集成

### 产品前端代码示例

```javascript
// 1. 获取 OnlyOffice 编辑器 iframe
const editorFrame = document.getElementById('onlyoffice-editor');

// 2. 发送消息给插件
function sendToPlugin(type, data) {
  if (editorFrame && editorFrame.contentWindow) {
    editorFrame.contentWindow.postMessage({ type, data }, '*');
  }
}

// 3. 接收插件消息
window.addEventListener('message', function(event) {
  // 安全检查（生产环境应验证 origin）
  // if (event.origin !== 'https://your-onlyoffice-domain') return;
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'tagClicked':
      // 用户点击了文档中的标签，打开配置面板
      openConfigPanel(data.uid, data.paramValues);
      break;
      
    case 'insertDone':
      // 标签插入成功
      console.log('标签已插入:', data.tagUid);
      showSuccessMessage('指标插入成功');
      break;
      
    case 'allTags':
      // 收到标签列表
      console.log('当前标签:', data.tags);
      break;
      
    case 'insertError':
    case 'removeError':
    case 'updateError':
      // 错误处理
      showErrorMessage(data.error);
      break;
  }
});

// 4. 使用示例

// 插入指标
sendToPlugin('insertIndicator', {
  uid: 'tag_' + Date.now(),
  indicatorId: 'work_count',
  code: 'JK4816',
  field: 'work_count',
  name: '受理总量',
  type: 'number',
  paramValues: { unit: '万宗' }
});

// 获取所有标签
sendToPlugin('getDocTags');

// 更新标签参数
sendToPlugin('updateParams', {
  uid: 'tag_001',
  paramValues: { unit: '件' }
});

// 删除标签
sendToPlugin('removeIndicator', { uid: 'tag_001' });

// 保存时转换
sendToPlugin('convertToRaw');
```

### 完整流程示例

```
用户拖拽指标 → 前端检测释放位置 → 
前端发送 insertIndicator → 
插件创建 Content Control → 
插件返回 insertDone → 
前端显示成功提示
```

---

## Tag 元数据结构

Content Control 的 Tag 字段存储 JSON 格式的指标信息：

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
    "decimal": 0,
    "thousandSep": true
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| uid | string | 标签唯一标识 |
| type | string | 指标类型 |
| indicatorId | string | 指标 ID |
| code | string | 接口编码 |
| field | string | 字段名 |
| name | string | 显示名称 |
| chartType | string | 图表类型（仅 chart 类型） |
| paramValues | object | 参数键值对 |

---

## 标签样式

### 类型颜色映射

| 指标类型 | 颜色 | 图标 |
|----------|------|------|
| text | #36D399 | 📝 |
| number | #36D399 | 🔢 |
| percent | #36D399 | 📊 |
| date | #36D399 | 📅 |
| chart | #4F7CFF | 📈 |
| table | #8B5CF6 | 📋 |
| condition | #F59E0B | ⚙️ |
| ai_generate | #7C3AED | 🤖 |

---

## 模板语法

### 表达式格式

| 指标类型 | 表达式示例 |
|----------|------------|
| 文本/数值 | `{{JK4816.get("year")}}` |
| 图表 | `{{put("JK3008", data("JK1959.."))}}` |
| AI 生成 | `{{ai_generate("overview", prompt="...", model="Claude")}}` |
| 条件 | `{{?JK4816 instanceof T(java.util.Map)}}...{{/}}` |
| 日期 | `{{f(now(),"yyyy年MM月dd日")}}` |

### 双向转换

```
可视化 → 原始（convertToRaw）
  Content Control → 模板表达式文本

原始 → 可视化（convertToVisual）
  模板表达式 → Content Control
```

---

## 调试指南

### 启用日志

插件内置 console 日志，打开浏览器开发者工具查看：

```
[TemplateDocAgent] Plugin initialized
[TemplateDocAgent] Received message: insertIndicator
[TemplateDocAgent] Insert failed: ...
```

### 控制台测试

在浏览器控制台直接调用插件方法：

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

// 测试获取标签
TemplateDocAgent.handleGetDocTags();

// 测试转换
TemplateDocAgent.handleConvertToRaw();
```

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 消息无响应 | iframe 跨域限制 | 检查 postMessage origin 配置 |
| Content Control 创建失败 | OnlyOffice API 版本 | 确认 OnlyOffice 版本 >= 7.0 |
| Tag 解析失败 | JSON 格式错误 | 检查 paramValues 是否包含特殊字符 |

---

## 配置说明

### config.json

```json
{
  "name": "Template Document Agent",
  "guid": "asc.{guid}",
  "baseUrl": "",
  "variations": [
    {
      "description": "Template Document Agent",
      "url": "index.html",
      "icons": ["resources/icon.png"],
      "EditorsSupport": ["word"],
      "isVisual": false,
      "initDataType": "none"
    }
  ]
}
```

### 关键配置项

| 配置 | 说明 |
|------|------|
| `guid` | 插件唯一标识，需替换为实际值 |
| `baseUrl` | 插件资源基础路径（留空表示相对路径） |
| `EditorsSupport` | 支持的编辑器类型 |
| `isVisual` | 是否有 UI（本插件为 false） |

---

## 兼容性

### OnlyOffice 版本

| 版本 | 状态 |
|------|------|
| 7.0+ | ✅ 完全支持 |
| 6.4-6.5 | ⚠️ 部分功能受限 |
| < 6.4 | ❌ 不支持 |

### 浏览器

| 浏览器 | 状态 |
|--------|------|
| Chrome 90+ | ✅ 支持 |
| Edge 90+ | ✅ 支持 |
| Firefox | ⚠️ 部分功能受限 |
| Safari | ⚠️ 部分功能受限 |

---

## 更新日志

### v1.0.0 (2026-04-09)

- 初始版本
- 支持 Content Control CRUD 操作
- 支持双向转换引擎
- 支持 6 种指标类型
- 支持 AI 生成类标签

---

## 联系支持

如有问题，请联系：

- 技术支持：[your-email@example.com]
- 问题反馈：[GitHub Issues URL]