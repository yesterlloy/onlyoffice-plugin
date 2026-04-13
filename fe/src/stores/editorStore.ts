import { create } from 'zustand'
import type { IndicatorCategory, IndicatorDetail, DocBlock, DocTagItem } from '@/types'
import { useMock } from '@/config'

// 编辑器模式
export type EditorMode = 'mock' | 'onlyoffice'

interface EditorState {
  // 指标库数据
  categories: IndicatorCategory[]
  indicatorMap: Map<string, IndicatorDetail>
  loading: boolean

  // 编辑器模式
  editorMode: EditorMode
  editorReady: boolean

  // 文档数据（mock 模式）
  docBlocks: DocBlock[]
  selectedTagUid: string | null
  configPanelVisible: boolean

  // 当前编辑的标签
  currentEditingTag: DocTagItem | null

  // 当前模板信息（onlyoffice 模式）
  currentTemplateId: number | null
  documentUrl: string | null
  documentKey: string | null
  documentTitle: string | null

  // Actions
  setCategories: (categories: IndicatorCategory[]) => void
  setIndicatorMap: (map: Map<string, IndicatorDetail>) => void
  setLoading: (loading: boolean) => void
  setEditorMode: (mode: EditorMode) => void
  setEditorReady: (ready: boolean) => void
  setDocBlocks: (blocks: DocBlock[]) => void
  setSelectedTagUid: (uid: string | null) => void
  setConfigPanelVisible: (visible: boolean) => void
  setCurrentEditingTag: (tag: DocTagItem | null) => void
  setCurrentTemplate: (id: number, url: string, key: string, title: string) => void
  // 同步 mock 模式配置
  syncMockConfig: () => void

  // 添加标签到段落（mock 模式）
  addTagToBlock: (blockUid: string, tag: DocTagItem) => void
  // 从段落移除标签
  removeTagFromBlock: (tagUid: string) => void
  // 更新标签参数
  updateTagParams: (tagUid: string, paramValues: Record<string, any>) => void

  // OnlyOffice 模式操作（通过 bridge）
  insertIndicatorToOnlyOffice: (indicator: DocTagItem) => Promise<any>
  removeIndicatorFromOnlyOffice: (uid: string) => Promise<any>
  updateIndicatorParams: (uid: string, paramValues: Record<string, any>) => Promise<any>
  getDocTagsFromOnlyOffice: () => Promise<any>
  convertToRawTemplate: () => Promise<any>
}

let tagUidCounter = 100

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  categories: [],
  indicatorMap: new Map(),
  loading: false,
  editorMode: useMock ? 'mock' : 'onlyoffice', // 根据 config.useMock 配置决定默认模式
  editorReady: false,
  docBlocks: [
    { uid: 'p1', type: 'heading', level: 1, content: '数据研判季报', items: [] },
    { uid: 'p2', type: 'paragraph', content: '', items: [] },
    { uid: 'p3', type: 'heading', level: 2, content: '本期导读', items: [] },
    { uid: 'p4', type: 'heading', level: 3, content: '★ 总体概况', items: [] },
    { uid: 'p5', type: 'paragraph', content: '拖拽左侧指标到此处插入...', items: [] },
    { uid: 'p6', type: 'heading', level: 3, content: '★ 诉求热点', items: [] },
    { uid: 'p7', type: 'paragraph', content: '拖拽图表或 AI 生成类指标到此处。', items: [] },
    { uid: 'p8', type: 'heading', level: 3, content: '★ 研判分析与建议', items: [] },
    { uid: 'p9', type: 'paragraph', content: '拖拽 🤖 AI 智能生成类指标到此处。', items: [] },
  ],
  selectedTagUid: null,
  configPanelVisible: false,
  currentEditingTag: null,
  currentTemplateId: null,
  documentUrl: 'http://192.168.0.203:8888',
  documentKey: 'doc_123456',
  documentTitle: '我的文档.docx',

  // Actions
  setCategories: (categories) => set({ categories }),
  setIndicatorMap: (indicatorMap) => set({ indicatorMap }),
  setLoading: (loading) => set({ loading }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setEditorReady: (ready) => set({ editorReady: ready }),
  setDocBlocks: (docBlocks) => set({ docBlocks }),
  setSelectedTagUid: (uid) => set({ selectedTagUid: uid }),
  setConfigPanelVisible: (visible) => set({ configPanelVisible: visible }),
  setCurrentEditingTag: (tag) => set({ currentEditingTag: tag }),
  setCurrentTemplate: (id, url, key, title) => set({
    currentTemplateId: id,
    documentUrl: url,
    documentKey: key,
    documentTitle: title,
  }),

  // 同步 mock 配置
  syncMockConfig: () => {
    // 动态导入 config 以获取最新值
    import('@/config').then(({ useMock }) => {
      set({ editorMode: useMock ? 'mock' : 'onlyoffice' })
    })
  },

  addTagToBlock: (blockUid, tag) => {
    set((state) => ({
      docBlocks: state.docBlocks.map((block) =>
        block.uid === blockUid
          ? { ...block, items: [...block.items, { ...tag, uid: `tag_${++tagUidCounter}` }] }
          : block
      ),
    }))
  },

  removeTagFromBlock: (tagUid) => {
    set((state) => ({
      docBlocks: state.docBlocks.map((block) => ({
        ...block,
        items: block.items.filter((item) => item.uid !== tagUid),
      })),
      selectedTagUid: state.selectedTagUid === tagUid ? null : state.selectedTagUid,
      configPanelVisible:
        state.currentEditingTag?.uid === tagUid ? false : state.configPanelVisible,
      currentEditingTag: state.currentEditingTag?.uid === tagUid ? null : state.currentEditingTag,
    }))
  },

  updateTagParams: (tagUid, paramValues) => {
    set((state) => ({
      docBlocks: state.docBlocks.map((block) => ({
        ...block,
        items: block.items.map((item) =>
          item.uid === tagUid ? { ...item, paramValues: { ...item.paramValues, ...paramValues } } : item
        ),
      })),
    }))
  },

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