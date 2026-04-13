import request from './request'
import { useMock } from '@/config'
import { mockApi } from '@/mock/mockService'
import type {
  IndicatorCategory,
  IndicatorDetail,
  TemplateFile,
  Datasource,
  AiPreviewRequest,
  AiPreviewResult,
  PageResult,
} from '@/types'

// ============ 真实 API 实现（非 Mock 模式） ============

const realApi = {
  // 指标
  getIndicatorCategories: () => request.get<IndicatorCategory[]>('/indicators/categories'),
  getIndicatorDetail: (indicatorId: string) => request.get<IndicatorDetail>(`/indicators/${indicatorId}`),
  getIndicatorParams: (indicatorId: string) => request.get<IndicatorDetail>(`/indicators/${indicatorId}/params`),
  getIndicatorsByType: (type: string) => request.get<IndicatorDetail[]>(`/indicators/type/${type}`),

  // 模板
  getTemplates: (params?: { page?: number; size?: number; status?: number }) =>
    request.get<PageResult<TemplateFile>>('/templates', { params }),
  getTemplateDetail: (id: number) => request.get<TemplateFile>(`/templates/${id}`),
  createTemplate: (data: {
    name: string
    description?: string
    content: string
    createdBy?: string
    indicators?: Array<{ uid: string; indicatorId: string; paramValues: Record<string, any> }>
  }) => request.post<TemplateFile>('/templates', data),
  updateTemplate: (id: number, data: { name?: string; description?: string; content?: string }) =>
    request.put<TemplateFile>(`/templates/${id}`, data),
  deleteTemplate: (id: number) => request.delete(`/templates/${id}`).then(() => true),
  getTemplateUrl: (id: number) => request.get<{ url: string; name?: string }>(`/templates/${id}/url`),

  // 数据接口
  getDatasources: () => request.get<Datasource[]>('/datasources'),
  getDatasourceDetail: (datasourceId: string) => request.get<Datasource>(`/datasources/${datasourceId}`),
  invokeDatasource: (datasourceId: string, params?: Record<string, any>) =>
    request.post<Record<string, any>>(`/datasources/${datasourceId}/invoke`, params),

  // AI
  aiPreview: (data: AiPreviewRequest) => request.post<AiPreviewResult>('/ai/preview', data),
  getAiReviews: (params?: { templateId?: number; status?: string }) =>
    request.get<Array<{
      reviewId: number
      templateId: number
      indicatorUid: string
      indicatorName: string
      generatedContent: string
      status: string
      reviewComment?: string
      reviewer?: string
      createdAt: string
    }>>('/ai/reviews', { params }),
  approveAiReview: (reviewId: number) => request.post(`/ai/reviews/${reviewId}/approve`).then(() => true),
  rejectAiReview: (reviewId: number, reason: string) =>
    request.post(`/ai/reviews/${reviewId}/reject`, { reason }).then(() => true),
  editAiReview: (reviewId: number, content: string) =>
    request.put(`/ai/reviews/${reviewId}/edit`, { content }).then(() => true),
}

// 根据 mock 模式选择 API 实现
const api = useMock ? mockApi : realApi

// ============ 指标相关 API ============

/** 获取指标分类树 */
export function getIndicatorCategories() {
  return api.getIndicatorCategories()
}

/** 获取指标详情 */
export function getIndicatorDetail(indicatorId: string) {
  return api.getIndicatorDetail(indicatorId)
}

/** 获取指标参数定义 */
export function getIndicatorParams(indicatorId: string) {
  return api.getIndicatorParams(indicatorId)
}

/** 按类型筛选指标 */
export function getIndicatorsByType(type: string) {
  return api.getIndicatorsByType(type)
}

/** 获取动态下拉选项 */
export function getDynamicOptions(source: string) {
  return useMock
    ? mockApi.getDynamicOptions(source)
    : request.get<string[]>(`/indicators/params/options?source=${source}`)
}

// ============ 模板相关 API ============

/** 获取模板列表 */
export function getTemplates(params?: { page?: number; size?: number; status?: number }) {
  return api.getTemplates(params)
}

/** 获取模板详情 */
export function getTemplateDetail(id: number) {
  return api.getTemplateDetail(id)
}

/** 创建模板 */
export function createTemplate(data: {
  name: string
  description?: string
  content: string
  createdBy?: string
  indicators?: Array<{ uid: string; indicatorId: string; paramValues: Record<string, any> }>
}) {
  return api.createTemplate(data)
}

/** 更新模板 */
export function updateTemplate(
  id: number,
  data: {
    name?: string
    description?: string
    content?: string
    createdBy?: string
  }
) {
  return api.updateTemplate(id, data)
}

/** 删除模板 */
export function deleteTemplate(id: number) {
  return api.deleteTemplate(id)
}

/** 下载模板 */
export function downloadTemplate(id: number) {
  if (useMock) {
    console.log('Mock: Download template', id)
    return ''
  }
  return `/api/templates/${id}/download`
}

/** 获取模板文档 URL（用于 OnlyOffice） */
export function getTemplateUrl(id: number) {
  return api.getTemplateUrl(id)
}

/** 上传模板文件 */
export function uploadTemplateFile(file: File) {
  if (useMock) {
    console.log('Mock: Upload file', file.name)
    return Promise.resolve({ url: 'https://oss.example.com/mock-upload.docx', ossKey: 'mock-key' })
  }
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ url: string; ossKey: string }>('/templates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ============ 数据接口相关 API ============

/** 获取数据接口列表 */
export function getDatasources() {
  return api.getDatasources()
}

/** 获取数据接口详情 */
export function getDatasourceDetail(datasourceId: string) {
  return api.getDatasourceDetail(datasourceId)
}

/** 注册数据接口 */
export function registerDatasource(data: {
  datasourceId: string
  name: string
  description?: string
  apiUrl: string
  method?: string
  authType?: string
  authConfig?: string
  timeout?: number
}) {
  if (useMock) {
    console.log('Mock: Register datasource', data.datasourceId)
    return Promise.resolve({ ...data, status: 1 } as Datasource)
  }
  return request.post<Datasource>('/datasources', data)
}

/** 调用数据接口 */
export function invokeDatasource(datasourceId: string, params?: Record<string, any>) {
  return api.invokeDatasource(datasourceId, params)
}

// ============ AI 相关 API ============

/** AI 预览生成 */
export function aiPreview(data: AiPreviewRequest) {
  return api.aiPreview(data)
}

/** 获取 AI 审核列表 */
export function getAiReviews(params?: { templateId?: number; status?: string }) {
  return api.getAiReviews(params)
}

/** 审核通过 */
export function approveAiReview(reviewId: number) {
  return api.approveAiReview(reviewId)
}

/** 审核拒绝 */
export function rejectAiReview(reviewId: number, reason: string) {
  return api.rejectAiReview(reviewId, reason)
}

/** 编辑 AI 内容 */
export function editAiReview(reviewId: number, content: string) {
  return api.editAiReview(reviewId, content)
}

// 导出 mock 切换函数
export { setMockMode } from '@/config'