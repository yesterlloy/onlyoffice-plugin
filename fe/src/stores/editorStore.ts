import { create } from 'zustand'
import type { IndicatorCategory, IndicatorDetail, DocTagItem, EditorConfigVO, DocContentControl } from '@/types'
import { openDocument } from '@/api'
import { onlyOfficeBridge, MESSAGE_TYPES } from '@/utils/onlyoffice-bridge'

interface EditorState {
  // 指标库数据
  categories: IndicatorCategory[]
  indicatorMap: Map<string, IndicatorDetail>
  loading: boolean

  // 编辑器状态
  editorReady: boolean
  backendConfig: EditorConfigVO | null

  // 当前编辑的标签
  currentEditingTag: DocContentControl | null
  configPanelVisible: boolean

  // 当前模板信息
  currentTemplateId: number | null
  documentUrl: string | null
  documentKey: string | null
  documentTitle: string | null
  templateIndicatorMap: Record<string, any> | null

  // Actions
  setCategories: (categories: IndicatorCategory[]) => void
  setIndicatorMap: (map: Map<string, IndicatorDetail>) => void
  setLoading: (loading: boolean) => void
  setEditorReady: (ready: boolean) => void
  setConfigPanelVisible: (visible: boolean) => void
  setCurrentEditingTag: (tag: DocContentControl | null) => void
  setCurrentTemplate: (id: number, url: string, key: string, title: string) => void
  openTemplate: (templateId: number) => Promise<void>

  // OnlyOffice 操作（通过 bridge）
  insertIndicatorToOnlyOffice: (indicator: DocTagItem) => Promise<any>
  replaceDroppedIndicatorInOnlyOffice: (dropUid: string, indicator: DocTagItem) => Promise<any>
  removeIndicatorFromOnlyOffice: (tag: DocContentControl) => Promise<any>
  updateIndicatorParams: (tag: DocContentControl, paramValues: Record<string, any>) => Promise<any>
  getDocTagsFromOnlyOffice: () => Promise<any>
  convertToRawTemplate: () => Promise<any>
  saveTemplate: (rawContent: string, indicatorMap: Record<string, any>) => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  categories: [],
  indicatorMap: new Map(),
  loading: false,
  editorReady: false,
  backendConfig: null,
  currentEditingTag: null,
  configPanelVisible: false,
  currentTemplateId: null,
  documentUrl: 'http://192.168.1.223:8080/template-editor/files/templates/20260416110039/test.docx',
  documentKey: 'key123',
  documentTitle: 'new.docx',
  templateIndicatorMap: null,
  callbackUrl: 'http://192.168.1.223:8080/example/api/documents/4/callback',

  // Actions
  setCategories: (categories) => set({ categories }),
  setIndicatorMap: (indicatorMap) => set({ indicatorMap }),
  setLoading: (loading) => set({ loading }),
  setEditorReady: (ready) => set({ editorReady: ready }),
  setConfigPanelVisible: (visible) => set({ configPanelVisible: visible }),
  setCurrentEditingTag: (tag) => set({ currentEditingTag: tag }),
  setCurrentTemplate: (id, url, key, title) => set({
    currentTemplateId: id,
    documentUrl: url,
    documentKey: key,
    documentTitle: title,
  }),

  openTemplate: async (templateId: number) => {
    set({ loading: true })
    try {
      const { getTemplateDetail } = await import('@/api')
      
      // 并行获取编辑器配置和模板详情（包含之前保存的 indicatorMap）
      const [config, detail] = await Promise.all([
        openDocument({ templateId }),
        getTemplateDetail(templateId)
      ])

      // 解析从后端返回的映射表
      let savedMap = null
      if (detail?.indicatorMap) {
        try {
          savedMap = typeof detail.indicatorMap === 'string' 
            ? JSON.parse(detail.indicatorMap) 
            : detail.indicatorMap
        } catch (e) {
          console.error('Failed to parse saved indicatorMap:', e)
        }
      }

      set({
        backendConfig: config,
        currentTemplateId: config.templateId,
        documentUrl: config.documentUrl,
        documentKey: config.documentKey,
        documentTitle: config.templateName,
        templateIndicatorMap: savedMap,
      })
    } catch (error) {
      console.error('Failed to open template:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // OnlyOffice 模式操作（通过 bridge 发送消息）
  insertIndicatorToOnlyOffice: async (indicator) => {
    console.log('[Store] 🚀 insertIndicatorToOnlyOffice START', {
      indicator,
      timestamp: new Date().toISOString()
    })


    console.log('[Store] 📦 Bridge loaded', {
      bridgeInitialized: onlyOfficeBridge.isInitialized()
    })

    try {
      const messageData = {
        uid: indicator.uid || `tag_${Date.now()}`,
        indicatorId: indicator.indicatorId,
        code: indicator.code,
        field: indicator.field,
        name: indicator.name,
        type: indicator.type,
        chartType: indicator.chartType,
        paramValues: indicator.paramValues || {},
      }

      console.log('[Store] 📤 Sending message via bridge')
      console.log('[Store] 📤 MESSAGE_TYPE:', MESSAGE_TYPES.INSERT_INDICATOR)
      console.log('[Store] 📤 MessageData:', JSON.stringify(messageData, null, 2))

      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.INSERT_INDICATOR, messageData)

      console.log('[Store] 📥 Received result:', result)
      console.log('[Store] ✅ insertIndicatorToOnlyOffice SUCCESS')

      return result
    } catch (error) {
      console.error('[Store] ❌ insertIndicatorToOnlyOffice FAILED:', error)
      throw error
    }
  },

  replaceDroppedIndicatorInOnlyOffice: async (dropUid, indicator) => {
    console.log('[Store] 🚀 replaceDroppedIndicatorInOnlyOffice START', { dropUid, indicator })
    try {
      const messageData = {
        dropUid,
        indicator: {
          uid: indicator.uid || `tag_${Date.now()}`,
          indicatorId: indicator.indicatorId,
          code: indicator.code,
          field: indicator.field,
          name: indicator.name,
          type: indicator.type,
          chartType: indicator.chartType,
          paramValues: indicator.paramValues || {},
        }
      }
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.REPLACE_DROPPED_INDICATOR, messageData)
      console.log('[Store] ✅ replaceDroppedIndicator SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ replaceDroppedIndicator FAILED:', error)
      throw error
    }
  },

  removeIndicatorFromOnlyOffice: async (tag) => {
    console.log('[Store] 🗑️ removeIndicatorFromOnlyOffice START', { tag })
    try {
      console.log('[Store] 📤 Sending REMOVE_INDICATOR message with full tag data')
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.REMOVE_INDICATOR, tag)
      console.log('[Store] ✅ Remove SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ Remove FAILED:', error)
      throw error
    }
  },

  updateIndicatorParams: async (tag, paramValues) => {
    console.log('[Store] ⚙️ updateIndicatorParams START', { tag, paramValues })
    try {
      console.log('[Store] 📤 Sending UPDATE_PARAMS message with full tag data')
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.UPDATE_PARAMS, { 
        uid: tag.Tag?.uid, 
        tag,
        paramValues 
      })
      console.log('[Store] ✅ Update SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ Update FAILED:', error)
      throw error
    }
  },

  getDocTagsFromOnlyOffice: async () => {
    console.log('[Store] 📋 getDocTagsFromOnlyOffice START')
    try {
      console.log('[Store] 📤 Sending GET_DOC_TAGS message')
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.GET_DOC_TAGS)
      console.log('[Store] ✅ GetDocTags SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ GetDocTags FAILED:', error)
      throw error
    }
  },

  convertToRawTemplate: async () => {
    console.log('[Store] 🔄 convertToRawTemplate START')
    try {
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.CONVERT_TO_RAW, { id: 1})
      return result
    } catch (error) {
      console.error('[Store] Convert to raw failed:', error)
      throw error
    }
  },

  saveTemplate: async (rawContent, indicatorMap) => {
    const { currentTemplateId, documentTitle } = get()
    if (!currentTemplateId) {
      console.error('[Store] ❌ No currentTemplateId')
      return
    }

    try {
      const { updateTemplate } = await import('@/api')
      await updateTemplate(currentTemplateId, {
        name: documentTitle || 'Untitled',
        content: rawContent,
        indicatorMap: JSON.stringify(indicatorMap)
      })
      console.log('[Store] ✅ Save SUCCESS')
    } catch (error) {
      console.error('[Store] ❌ Save FAILED:', error)
      throw error
    }
  },
}))