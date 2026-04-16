/**
 * Mock API Service
 * 提供模拟的 API 响应，用于前端功能联调
 */

import type {
  IndicatorCategory,
  IndicatorDetail,
  TemplateFile,
  Datasource,
  AiPreviewRequest,
  AiPreviewResult,
  PageResult,
} from '@/types'

import {
  mockIndicatorCategories,
  mockIndicatorParams,
  mockTemplates,
  mockDatasources,
  mockDatasourceInvokeResults,
  mockAiResults,
  mockDynamicOptions,
} from './data'

// 模拟延迟（毫秒）
const MOCK_DELAY = 200

/**
 * 模拟异步响应
 */
function mockResponse<T>(data: T, delay = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * 模拟分页响应
 */
function mockPageResponse<T>(records: T[], page = 1, size = 10): Promise<PageResult<T>> {
  const total = records.length
  const totalPages = Math.ceil(total / size)
  const start = (page - 1) * size
  const end = start + size
  return mockResponse({
    records: records.slice(start, end),
    total,
    page,
    size,
    totalPages,
  })
}

// ============ 指标相关 Mock API ============

/** 获取指标分类树 */
export function mockGetIndicatorCategories(): Promise<IndicatorCategory[]> {
  return mockResponse(mockIndicatorCategories)
}

/** 获取指标详情 */
export function mockGetIndicatorDetail(indicatorId: string): Promise<IndicatorDetail | null> {
  for (const category of mockIndicatorCategories) {
    const indicator = category.indicators.find((i) => i.indicatorId === indicatorId)
    if (indicator) {
      return mockResponse({
        ...indicator,
        params: mockIndicatorParams[indicatorId] || [],
      })
    }
  }
  return mockResponse(null)
}

/** 获取指标参数定义 */
export function mockGetIndicatorParams(indicatorId: string): Promise<IndicatorDetail | null> {
  return mockGetIndicatorDetail(indicatorId)
}

/** 按类型筛选指标 */
export function mockGetIndicatorsByType(type: string): Promise<IndicatorDetail[]> {
  const results: IndicatorDetail[] = []
  for (const category of mockIndicatorCategories) {
    for (const indicator of category.indicators) {
      if (indicator.type === type) {
        results.push({
          ...indicator,
          params: mockIndicatorParams[indicator.indicatorId] || [],
        })
      }
    }
  }
  return mockResponse(results)
}

/** 获取动态下拉选项 */
export function mockGetDynamicOptions(source: string): Promise<string[]> {
  return mockResponse(mockDynamicOptions[source] || [])
}

// ============ 模板相关 Mock API ============

/** 获取模板列表 */
export function mockGetTemplates(params?: {
  page?: number
  size?: number
  status?: number
}): Promise<PageResult<TemplateFile>> {
  let filtered = mockTemplates
  if (params?.status !== undefined) {
    filtered = filtered.filter((t) => t.status === params.status)
  }
  return mockPageResponse(filtered, params?.page || 1, params?.size || 10)
}

/** 获取模板详情 */
export function mockGetTemplateDetail(id: number): Promise<TemplateFile | null> {
  const template = mockTemplates.find((t) => t.id === id)
  return mockResponse(template || null)
}

/** 创建模板 */
export function mockCreateTemplate(data: {
  name: string
  description?: string
  content: string
  createdBy?: string
  indicators?: Array<{ uid: string; indicatorId: string; paramValues: Record<string, any> }>
}): Promise<TemplateFile> {
  const newTemplate: TemplateFile = {
    id: mockTemplates.length + 1,
    name: data.name,
    description: data.description,
    ossUrl: 'https://oss.example.com/templates/new-template.docx',
    fileSize: data.content.length,
    version: 1,
    status: 1,
    createdBy: data.createdBy || 'mock-user',
    createdAt: new Date().toISOString(),
  }
  mockTemplates.push(newTemplate)
  return mockResponse(newTemplate)
}

/** 更新模板 */
export function mockUpdateTemplate(
  id: number,
  data: { name?: string; description?: string; content?: string }
): Promise<TemplateFile | null> {
  const template = mockTemplates.find((t) => t.id === id)
  if (!template) {
    return mockResponse(null)
  }
  if (data.name) template.name = data.name
  if (data.description) template.description = data.description
  template.version += 1
  return mockResponse(template)
}

/** 删除模板 */
export function mockDeleteTemplate(id: number): Promise<boolean> {
  const index = mockTemplates.findIndex((t) => t.id === id)
  if (index >= 0) {
    mockTemplates.splice(index, 1)
    return mockResponse(true)
  }
  return mockResponse(false)
}

/** 获取模板 URL */
export function mockGetTemplateUrl(id: number): Promise<{ url: string; name?: string }> {
  const template = mockTemplates.find((t) => t.id === id)
  if (template) {
    return mockResponse({
      url: template.ossUrl,
      name: template.name,
    })
  }
  return mockResponse({ url: '', name: '' })
}

// ============ 数据接口相关 Mock API ============

/** 获取数据接口列表 */
export function mockGetDatasources(): Promise<Datasource[]> {
  return mockResponse(mockDatasources)
}

/** 获取数据接口详情 */
export function mockGetDatasourceDetail(datasourceId: string): Promise<Datasource | null> {
  const datasource = mockDatasources.find((d) => d.datasourceId === datasourceId)
  return mockResponse(datasource || null)
}

/** 调用数据接口 */
export function mockInvokeDatasource(
  datasourceId: string,
  params?: Record<string, any>
): Promise<Record<string, any>> {
  // 模拟数据返回
  const result = mockDatasourceInvokeResults[datasourceId] || {
    message: 'Mock data response',
    params,
  }
  return mockResponse(result, 500) // 数据接口响应稍慢
}

// ============ AI 相关 Mock API ============

/** AI 预览生成 */
export function mockAiPreview(data: AiPreviewRequest): Promise<AiPreviewResult> {
  // 根据提示词模板关键词匹配预置结果
  const promptLower = data.promptTemplate?.toLowerCase() || ''

  let content = '这是模拟的 AI 生成内容。根据您提供的提示词模板和数据，AI 会生成相应的分析文本。'

  // 尝试匹配预置结果
  if (promptLower.includes('概况') || promptLower.includes('整体')) {
    content = mockAiResults['overview_ai']
  } else if (promptLower.includes('热点') || promptLower.includes('诉求类型')) {
    content = mockAiResults['hotspot_ai']
  } else if (promptLower.includes('建议') || promptLower.includes('下一步')) {
    content = mockAiResults['suggestion_ai']
  } else if (promptLower.includes('总结') || promptLower.includes('概括')) {
    content = mockAiResults['summary_ai']
  }

  return mockResponse(
    {
      generatedContent: content,
      tokenUsage: {
        promptTokens: Math.floor(promptLower.length / 4),
        completionTokens: Math.floor(content.length / 4),
        totalTokens: Math.floor((promptLower.length + content.length) / 4),
      },
      generationTime: 1500,
    },
    1500 // AI 响应较慢
  )
}

/** 获取 AI 审核列表 */
export function mockGetAiReviews(params?: {
  templateId?: number
  status?: string
}): Promise<Array<{
  reviewId: number
  templateId: number
  indicatorUid: string
  indicatorName: string
  generatedContent: string
  status: string
  reviewComment?: string
  reviewer?: string
  createdAt: string
}>> {
  return mockResponse([
    {
      reviewId: 1,
      templateId: params?.templateId || 1,
      indicatorUid: 'tag_101',
      indicatorName: '本期概况分析',
      generatedContent: mockAiResults['overview_ai'],
      status: params?.status || 'pending',
      createdAt: '2024-04-10 10:00:00',
    },
    {
      reviewId: 2,
      templateId: params?.templateId || 1,
      indicatorUid: 'tag_102',
      indicatorName: '热点诉求分析',
      generatedContent: mockAiResults['hotspot_ai'],
      status: 'approved',
      reviewer: 'admin',
      createdAt: '2024-04-10 11:00:00',
    },
  ])
}

/** 审核通过 */
export function mockApproveAiReview(_reviewId: number): Promise<boolean> {
  return mockResponse(true)
}

/** 审核拒绝 */
export function mockRejectAiReview(reviewId: number, reason: string): Promise<boolean> {
  console.log(`Mock: Reject review ${reviewId}, reason: ${reason}`)
  return mockResponse(true)
}

/** 编辑 AI 内容 */
export function mockEditAiReview(reviewId: number, content: string): Promise<boolean> {
  console.log(`Mock: Edit review ${reviewId}, new content length: ${content.length}`)
  return mockResponse(true)
}

// ============ 导出所有 Mock API ============

export const mockApi = {
  // 指标
  getIndicatorCategories: mockGetIndicatorCategories,
  getIndicatorDetail: mockGetIndicatorDetail,
  getIndicatorParams: mockGetIndicatorParams,
  getIndicatorsByType: mockGetIndicatorsByType,
  getDynamicOptions: mockGetDynamicOptions,

  // 模板
  getTemplates: mockGetTemplates,
  getTemplateDetail: mockGetTemplateDetail,
  createTemplate: mockCreateTemplate,
  updateTemplate: mockUpdateTemplate,
  deleteTemplate: mockDeleteTemplate,
  getTemplateUrl: mockGetTemplateUrl,

  // 数据接口
  getDatasources: mockGetDatasources,
  getDatasourceDetail: mockGetDatasourceDetail,
  invokeDatasource: mockInvokeDatasource,

  // AI
  aiPreview: mockAiPreview,
  getAiReviews: mockGetAiReviews,
  approveAiReview: mockApproveAiReview,
  rejectAiReview: mockRejectAiReview,
  editAiReview: mockEditAiReview,
}