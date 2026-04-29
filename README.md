# OnlyOffice Template Editor Plugin

## 项目架构

这是一个 **OnlyOffice 模板编辑器插件系统**，用于在 Word 文档中管理 Content Control（内容控件）作为指标占位符，支持双向模板转换和 AI 生成。

### 整体架构（三层）

```
FE (React SPA)  ←→  BE (Spring Boot)  ←→  OnlyOffice DocumentServer
     ↕                                    ↕
  SDK Plugin (OnlyOffice 内嵌插件)
```

### 技术栈

| 层 | 技术 |
|---|---|
| **前端 (fe/)** | React 18 + TypeScript + Vite + Ant Design + Zustand + dnd-kit |
| **后端 (be/)** | Java 11 + Spring Boot 2.7 + MyBatis-Plus + MySQL + Druid |
| **插件 (sdk/)** | OnlyOffice 系统级插件（isVisual=false，无 UI），JavaScript |
| **存储** | Aliyun OSS / 本地文件系统 |
| **AI** | OpenAI 兼容协议，当前对接 Ollama (Qwen3) |

### 目录结构

- **fe/** — 前端 SPA，模板管理、编辑器包装器、指标库面板、拖拽支持
- **be/** — 后端，Maven 多模块（api / service / dao / common / ai-client / oss-client）
- **sdk/template-doc-agent/** — OnlyOffice 插件本体，headless 模式，通过 postMessage/BroadcastChannel 与前端通信
- **conductor/** — 设计文档（回调处理、循环区域交互、保存流程等）
- **doc/** — 参考文档（OnlyOffice API 定义、旧版原型）
- **docs/** — Superpowers 规划文档

### 核心机制

1. **指标 Content Control 系统**：每个指标在文档中对应一个 Content Control，tag 中存 JSON 元数据（uid、type、indicatorId 等）
2. **双向模板转换**：支持 visual 模式（彩色 Content Control）和 raw 模式（`{{表达式}}` 模板语法）之间的互转
3. **前端 ↔ 插件通信**：三层降级策略（BroadcastChannel → postMessage → SDK serviceSendMessage）
4. **OnlyOffice 回调**：文档保存时 DocumentServer 回调后端，下载文件存入 OSS
5. **循环区域标注**：用户选中文本标记为循环区域，通过 OnlyOffice AnnotateParagraph API 高亮显示
6. **AI 生成 + 审核流程**：后端调用 AI 生成内容，经过 pending/approved/rejected 审核流程

### 支持的指标类型

`text`, `number`, `percent`, `date`, `chart`, `table`, `condition`, `ai_generate`

### 数据库

7 张表：指标分类、指标元数据、指标参数、模板、数据源、AI 提示词配置、AI 审核记录。
