// 指标类型
export type IndicatorType = 'text' | 'number' | 'percent' | 'date' | 'chart' | 'table' | 'condition' | 'ai_generate'

// 图表类型
export type ChartType = 'bar' | 'pie' | 'line'

// 输入控件类型
export type InputType = 'select' | 'text' | 'textarea' | 'number' | 'switch' | 'color' | 'multiselect'

// 指标分类
export interface IndicatorCategory {
  id: number
  name: string
  icon: string
  sortOrder: number
  indicators: IndicatorMetadata[]
}

// 指标元数据
export interface IndicatorMetadata {
  id: number
  categoryId: number
  indicatorId: string
  code: string
  field: string
  name: string
  type: IndicatorType
  chartType?: ChartType
  unit?: string
  previewValue?: string
  sortOrder: number
}

// 指标参数定义
export interface IndicatorParam {
  paramKey: string
  paramLabel: string
  inputType: InputType
  defaultValue: any
  options?: string[]
  optionsSource?: string
  minValue?: number
  maxValue?: number
  required: boolean
}

// 指标详情（含参数）
export interface IndicatorDetail extends IndicatorMetadata {
  params: IndicatorParam[]
}

// 文档中的标签项
export interface DocTagItem {
  uid: string
  indicatorId: string
  code: string
  field: string
  name: string
  type: IndicatorType
  chartType?: ChartType
  paramValues: Record<string, any>
}

// 文档段落
export interface DocBlock {
  uid: string
  type: 'heading' | 'paragraph'
  level?: number
  content: string
  items: DocTagItem[]
}

// 模板文件
export interface TemplateFile {
  id: number
  name: string
  description?: string
  ossUrl: string
  fileSize?: number
  version: number
  status: number
  createdBy?: string
  createdAt?: string
}

// 数据接口
export interface Datasource {
  datasourceId: string
  name: string
  description?: string
  apiUrl: string
  method: string
  status: number
}

// AI 预览请求
export interface AiPreviewRequest {
  promptTemplate: string
  dataSources?: string[]
  modelProvider?: string
  modelName?: string
  temperature?: number
  maxTokens?: number
  outputFormat?: string
  contextData?: Record<string, any>
}

// AI 预览结果
export interface AiPreviewResult {
  generatedContent: string
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  generationTime: number
}

// API 响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 分页结果
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// 打开文档请求
export interface OpenDocumentRequest {
  templateId: number
  userId?: string
  userName?: string
}

// OnlyOffice 编辑器配置 VO
export interface EditorConfigVO {
  templateId: number
  templateName: string
  documentKey: string
  documentUrl: string
  documentServerUrl: string
  callbackUrl: string
  editorConfig: Record<string, any>
  token?: string
}
