import { create } from 'zustand'
import type { IndicatorCategory, IndicatorDetail, DocTagItem } from '@/types'
import config from '@/config'

interface EditorState {
  // 指标库数据
  categories: IndicatorCategory[]
  indicatorMap: Map<string, IndicatorDetail>
  loading: boolean

  // 编辑器状态
  editorReady: boolean

  // 当前编辑的标签
  currentEditingTag: DocTagItem | null
  configPanelVisible: boolean

  // 当前模板信息
  currentTemplateId: number | null
  documentUrl: string | null
  documentKey: string | null
  documentTitle: string | null

  // Actions
  setCategories: (categories: IndicatorCategory[]) => void
  setIndicatorMap: (map: Map<string, IndicatorDetail>) => void
  setLoading: (loading: boolean) => void
  setEditorReady: (ready: boolean) => void
  setConfigPanelVisible: (visible: boolean) => void
  setCurrentEditingTag: (tag: DocTagItem | null) => void
  setCurrentTemplate: (id: number, url: string, key: string, title: string) => void

  // OnlyOffice 操作（通过 bridge）
  insertIndicatorToOnlyOffice: (indicator: DocTagItem) => Promise<any>
  removeIndicatorFromOnlyOffice: (uid: string) => Promise<any>
  updateIndicatorParams: (uid: string, paramValues: Record<string, any>) => Promise<any>
  getDocTagsFromOnlyOffice: () => Promise<any>
  convertToRawTemplate: () => Promise<any>
}

export const useEditorStore = create<EditorState>((set) => ({
  // 初始状态
  categories: [],
  indicatorMap: new Map(),
  loading: false,
  editorReady: false,
  currentEditingTag: null,
  configPanelVisible: false,
  currentTemplateId: null,
  documentUrl: config.documentServerUrl,
  documentKey: 'key123',
  documentTitle: 'new.docx',

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

  // OnlyOffice 模式操作（通过 bridge 发送消息）
  insertIndicatorToOnlyOffice: async (indicator) => {
    console.log('[Store] 🚀 insertIndicatorToOnlyOffice START', {
      indicator,
      timestamp: new Date().toISOString()
    })

    const { onlyOfficeBridge, MESSAGE_TYPES } = await import('@/utils/onlyoffice-bridge')

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

  removeIndicatorFromOnlyOffice: async (uid) => {
    console.log('[Store] 🗑️ removeIndicatorFromOnlyOffice START', { uid })
    const { onlyOfficeBridge, MESSAGE_TYPES } = await import('@/utils/onlyoffice-bridge')
    try {
      console.log('[Store] 📤 Sending REMOVE_INDICATOR message')
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.REMOVE_INDICATOR, { uid })
      console.log('[Store] ✅ Remove SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ Remove FAILED:', error)
      throw error
    }
  },

  updateIndicatorParams: async (uid, paramValues) => {
    console.log('[Store] ⚙️ updateIndicatorParams START', { uid, paramValues })
    const { onlyOfficeBridge, MESSAGE_TYPES } = await import('@/utils/onlyoffice-bridge')
    try {
      console.log('[Store] 📤 Sending UPDATE_PARAMS message')
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.UPDATE_PARAMS, { uid, paramValues })
      console.log('[Store] ✅ Update SUCCESS:', result)
      return result
    } catch (error) {
      console.error('[Store] ❌ Update FAILED:', error)
      throw error
    }
  },

  getDocTagsFromOnlyOffice: async () => {
    console.log('[Store] 📋 getDocTagsFromOnlyOffice START')
    const { onlyOfficeBridge, MESSAGE_TYPES } = await import('@/utils/onlyoffice-bridge')
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
    const { onlyOfficeBridge, MESSAGE_TYPES } = await import('@/utils/onlyoffice-bridge')
    try {
      const result = await onlyOfficeBridge.send(MESSAGE_TYPES.CONVERT_TO_RAW)
      return result
    } catch (error) {
      console.error('[Store] Convert to raw failed:', error)
      throw error
    }
  },
}))