# 数据研判分析系统 - 制式报告模板编辑器前端设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 版本 | V1.0 |
| 日期 | 2026-04-09 |
| 状态 | 待审核 |
| 作者 | Claude |

---

## 1. 项目概述

### 1.1 项目定位

制式报告模板编辑器前端应用，提供可视化模板编辑界面，支持指标拖拽、参数配置、AI内容生成预览等功能。

### 1.2 核心功能

- **指标库面板**：分类树展示、搜索过滤、拖拽插入
- **文档编辑区**：可视化标签渲染、拖拽接收
- **参数配置面板**：动态表单渲染、AI预览生成
- **工具栏**：格式控制、保存/预览操作

### 1.3 技术栈

| 技术选型 | 版本 | 说明 |
|----------|------|------|
| React | 18.x | 前端框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Ant Design | 5.x | UI 组件库 |
| Zustand | 4.x | 状态管理 |
| Axios | 1.x | HTTP 客户端 |
| dnd-kit | 6.x | 拖拽功能 |

---

## 2. 项目结构

### 2.1 目录结构

```
fe/
├── index.html                    # HTML 入口
├── package.json                  # 依赖配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置
│
└── src/
    ├── main.tsx                  # 应用入口
    ├── App.tsx                   # 路由配置
    ├── index.css                 # 全局样式
    │
    ├── api/                      # API 层
    │   ├── request.ts            # Axios 封装
    │   └── index.ts              # API 接口定义
    │
    ├── types/                    # 类型定义
    │   └── index.ts              # 全局类型
    │
    ├── stores/                   # 状态管理
    │   ├── editorStore.ts        # 编辑器状态
    │   ├── templateStore.ts      # 模板状态
    │   └── index.ts
    │
    ├── hooks/                    # 自定义 Hooks
    │   └── useIndicators.ts
    │
    ├── components/               # 组件
    │   ├── IndicatorPanel/       # 指标库面板
    │   │   ├── index.tsx
    │   │   └── index.css
    │   ├── DocEditor/            # 文档编辑区
    │   │   ├── index.tsx
    │   │   ├── DocTag.tsx
    │   │   └── DocTag.css
    │   ├── ConfigPanel/          # 参数配置面板
    │   │   ├── index.tsx
    │   │   └── index.css
    │   └── Toolbar/              # 工具栏
    │       ├── index.tsx
    │       └── index.css
    │
    ├── pages/                    # 页面
    │   └── TemplateEditor/       # 模板编辑页
    │       ├── index.tsx
    │       └── index.css
    │
    └── assets/                   # 静态资源
        └── images/
```

### 2.2 模块职责

| 模块 | 职责 |
|------|------|
| api/ | 封装 HTTP 请求，定义 API 接口 |
| types/ | TypeScript 类型定义 |
| stores/ | Zustand 状态管理 |
| components/ | 可复用 UI 组件 |
| pages/ | 页面级组件 |
| hooks/ | 自定义 React Hooks |

---

## 3. 页面设计

### 3.1 编辑页整体布局

```
┌─────────────────────────────────────────────────────────────┐
│                        工具栏 (Header)                       │
│  [格式按钮] [样式选择] [预览] [保存]                          │
├──────────────┬──────────────────────────┬──────────────────┤
│              │                          │                  │
│   指标库面板  │       文档编辑区          │   参数配置面板   │
│   (280px)    │       (自适应)            │   (380px)       │
│              │                          │                  │
│  ┌────────┐  │  ┌────────────────────┐  │  ┌────────────┐  │
│  │ 搜索框  │  │  │                    │  │  │ 标签信息   │  │
│  ├────────┤  │  │    文档内容         │  │  ├────────────┤  │
│  │ 分类树  │  │  │                    │  │  │ 参数表单   │  │
│  │ 指标列表│  │  │                    │  │  │ [Tab切换]  │  │
│  │         │  │  │                    │  │  │            │  │
│  └────────┘  │  └────────────────────┘  │  └────────────┘  │
│              │                          │                  │
└──────────────┴──────────────────────────┴──────────────────┘
```

### 3.2 响应式设计

| 屏幕宽度 | 布局调整 |
|----------|----------|
| ≥ 1400px | 三栏布局完整展示 |
| 1200-1400px | 配置面板可折叠 |
| < 1200px | 指标库折叠为抽屉 |

---

## 4. 组件设计

### 4.1 指标库面板 (IndicatorPanel)

**职责**：展示指标分类树，支持搜索和拖拽

**Props**：
```typescript
interface IndicatorPanelProps {
  categories: IndicatorCategory[]  // 指标分类数据
}
```

**功能**：
- 分类树展示（可展开/折叠）
- 关键字搜索过滤
- 指标项拖拽（使用 dnd-kit）
- 指标类型标签着色

**交互流程**：
```
用户拖拽指标 → dnd-kit 捕获拖拽事件 → 
释放到文档区 → 触发 addTagToBlock → 
更新 docBlocks 状态 → 重新渲染文档
```

### 4.2 文档编辑区 (DocEditor)

**职责**：渲染文档结构，接收拖拽插入

**状态**：
```typescript
interface EditorState {
  docBlocks: DocBlock[]           // 文档段落列表
  selectedTagUid: string | null   // 当前选中的标签
}
```

**DocBlock 数据结构**：
```typescript
interface DocBlock {
  uid: string
  type: 'heading' | 'paragraph'
  level?: number           // 标题级别 1-3
  content: string          // 文本内容
  items: DocTagItem[]      // 插入的标签
}

interface DocTagItem {
  uid: string
  indicatorId: string
  name: string
  type: IndicatorType
  chartType?: ChartType
  paramValues: Record<string, any>
}
```

**标签渲染规则**：

| 指标类型 | 渲染样式 | 说明 |
|----------|----------|------|
| text/number/percent/date | 内联标签 | 蓝绿色 Tag，显示名称 |
| chart | 块级卡片 | 蓝色边框，含图表预览区 |
| ai_generate | 块级卡片 | 紫色边框，含提示词摘要和预览按钮 |
| condition | 块级标签 | 黄色边框，显示条件说明 |

### 4.3 参数配置面板 (ConfigPanel)

**职责**：编辑选中标签的参数

**三 Tab 结构**：

| Tab | 内容 |
|-----|------|
| 接口参数 / 提示词与模型 | 动态渲染参数表单 |
| 显示设置 | 名称、字体、样式 |
| 高级 | 模板表达式、缓存策略、空值处理 |

**动态表单渲染**：
```typescript
// 根据 inputType 渲染不同控件
switch (param.inputType) {
  case 'select':     return <Select options={param.options} />
  case 'text':       return <Input />
  case 'textarea':   return <TextArea />
  case 'number':     return <InputNumber min={param.minValue} max={param.maxValue} />
  case 'switch':     return <Switch />
  case 'color':      return <ColorPicker />
  case 'multiselect': return <Select mode="multiple" />
}
```

**AI 预览功能**：
- 显示提示词模板
- 支持变量快速插入
- 点击"预览生成"调用 `/api/ai/preview`
- 展示生成结果和 Token 统计

### 4.4 工具栏 (Toolbar)

**功能按钮**：

| 按钮 | 功能 |
|------|------|
| 格式 (B/I/U) | 文本格式控制 |
| 样式选择 | 段落样式（正文/标题） |
| 字体选择 | 字体类型 |
| 预览 | 触发报告预览 |
| 保存模板 | 保存到后端 |

---

## 5. 状态管理

### 5.1 编辑器状态 (editorStore)

```typescript
interface EditorState {
  // 指标库数据
  categories: IndicatorCategory[]
  indicatorMap: Map<string, IndicatorDetail>
  loading: boolean

  // 文档数据
  docBlocks: DocBlock[]
  selectedTagUid: string | null
  configPanelVisible: boolean
  currentEditingTag: DocTagItem | null

  // Actions
  setCategories: (categories: IndicatorCategory[]) => void
  setIndicatorMap: (map: Map<string, IndicatorDetail>) => void
  setDocBlocks: (blocks: DocBlock[]) => void
  addTagToBlock: (blockUid: string, tag: DocTagItem) => void
  removeTagFromBlock: (tagUid: string) => void
  updateTagParams: (tagUid: string, paramValues: Record<string, any>) => void
  setSelectedTagUid: (uid: string | null) => void
  setConfigPanelVisible: (visible: boolean) => void
  setCurrentEditingTag: (tag: DocTagItem | null) => void
}
```

### 5.2 模板状态 (templateStore)

```typescript
interface TemplateState {
  currentTemplate: TemplateFile | null
  templates: TemplateFile[]
  loading: boolean

  // Actions
  setCurrentTemplate: (template: TemplateFile | null) => void
  setTemplates: (templates: TemplateFile[]) => void
}
```

---

## 6. API 接口

### 6.1 指标相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/indicators/categories` | GET | 获取指标分类树 |
| `/api/indicators/{indicatorId}` | GET | 获取指标详情 |
| `/api/indicators/{indicatorId}/params` | GET | 获取参数定义 |

### 6.2 模板相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/templates` | GET | 获取模板列表 |
| `/api/templates` | POST | 创建模板 |
| `/api/templates/{id}` | PUT | 更新模板 |
| `/api/templates/{id}` | DELETE | 删除模板 |

### 6.3 AI 相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai/preview` | POST | AI 内容预览生成 |

---

## 7. 类型定义

### 7.1 核心类型

```typescript
// 指标类型
type IndicatorType = 'text' | 'number' | 'percent' | 'date' | 'chart' | 'table' | 'condition' | 'ai_generate'

// 输入控件类型
type InputType = 'select' | 'text' | 'textarea' | 'number' | 'switch' | 'color' | 'multiselect'

// 指标分类
interface IndicatorCategory {
  id: number
  name: string
  icon: string
  sortOrder: number
  indicators: IndicatorMetadata[]
}

// 指标元数据
interface IndicatorMetadata {
  id: number
  indicatorId: string
  code: string
  field: string
  name: string
  type: IndicatorType
  chartType?: ChartType
  unit?: string
  previewValue?: string
}

// 指标参数
interface IndicatorParam {
  paramKey: string
  paramLabel: string
  inputType: InputType
  defaultValue: any
  options?: string[]
  minValue?: number
  maxValue?: number
  required: boolean
}

// API 响应
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
```

---

## 8. 样式规范

### 8.1 颜色系统

| 用途 | 颜色 | 说明 |
|------|------|------|
| 主色 | #1890ff | Ant Design 蓝色 |
| 成功 | #52c41a | 文本/数值类型标签 |
| 图表 | #1890ff | 图表类型标签 |
| AI | #7c3aed | AI 生成类型标签 |
| 条件 | #faad14 | 条件类型标签 |
| 边框 | #e8e8e8 | 卡片边框 |
| 背景 | #f0f2f5 | 页面背景 |

### 8.2 字体

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
  'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
```

### 8.3 间距

| Token | 值 | 用途 |
|-------|-----|------|
| xs | 4px | 紧凑间距 |
| sm | 8px | 元素间距 |
| md | 12px | 模块间距 |
| lg | 16px | 区域间距 |
| xl | 24px | 页面边距 |

---

## 9. 构建配置

### 9.1 Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080/template-editor',
        changeOrigin: true,
      },
    },
  },
})
```

### 9.2 环境变量

| 变量 | 开发环境 | 生产环境 |
|------|----------|----------|
| API_BASE_URL | /api | 实际后端地址 |
| AI_BASE_URL | http://localhost:11434/v1 | 生产 AI 服务地址 |

---

## 10. 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

---

## 11. 待确认事项

1. **OnlyOffice 集成方式**：是嵌入 iframe 还是独立窗口？
2. **与插件的通信**：postMessage 的具体消息格式需要与插件端对齐
3. **权限控制**：是否需要根据用户权限隐藏某些指标？

---

## 12. 下一步计划

完成本设计文档审核后，进入实现阶段：

1. 完善组件细节实现
2. 集成 dnd-kit 拖拽功能
3. 对接后端 API
4. 实现 OnlyOffice 集成
5. 实现与插件的消息通信
6. 编写单元测试