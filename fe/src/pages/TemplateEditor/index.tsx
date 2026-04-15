import { useEffect, useState } from 'react'
import { Layout, Spin, Button, message, Modal, Input, Space, Empty } from 'antd'
import { SaveOutlined, EyeOutlined } from '@ant-design/icons'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { useEditorStore } from '@/stores'
import { getIndicatorCategories, getIndicatorDetail, getTemplateUrl } from '@/api'
import { onlyOfficeBridge, MESSAGE_TYPES } from '@/utils/onlyoffice-bridge'
import type { IndicatorDetail, IndicatorMetadata } from '@/types'
import IndicatorPanel from '@/components/IndicatorPanel'
import OnlyOfficeEditor from '@/components/OnlyOfficeEditor'
import ConfigPanel from '@/components/ConfigPanel'
import Toolbar from '@/components/Toolbar'
import './index.css'

const { Sider, Content, Header } = Layout

// 获取默认参数值
const getDefaultParamValues = (detail: IndicatorDetail): Record<string, any> => {
  const values: Record<string, any> = {}
  detail.params?.forEach((param) => {
    if (param.defaultValue !== undefined && param.defaultValue !== null) {
      values[param.paramKey] = param.defaultValue
    }
  })
  return values
}

const TemplateEditorPage = () => {
  const {
    categories,
    setCategories,
    indicatorMap,
    setIndicatorMap,
    loading,
    setLoading,
    editorReady,
    setEditorReady,
    documentUrl,
    documentKey,
    documentTitle,
    currentTemplateId,
    setCurrentTemplate,
    setCurrentEditingTag,
    setConfigPanelVisible,
    insertIndicatorToOnlyOffice,
    getDocTagsFromOnlyOffice,
    convertToRawTemplate,
  } = useEditorStore()

  const [loadModalVisible, setLoadModalVisible] = useState(false)
  const [templateIdInput, setTemplateIdInput] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  // 加载指标库数据
  useEffect(() => {
    const loadIndicators = async () => {
      setLoading(true)
      try {
        // 获取分类树
        const cats = await getIndicatorCategories()
        setCategories(cats)

        // 构建指标映射表
        const map = new Map<string, IndicatorDetail>()
        for (const cat of cats) {
          for (const indicator of cat.indicators) {
            // 获取完整指标详情
            const detail = await getIndicatorDetail(indicator.indicatorId)
            if (detail) {
              map.set(indicator.indicatorId, detail)
            }
          }
        }
        setIndicatorMap(map)
      } catch (error) {
        console.error('加载指标库失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIndicators()
  }, [setCategories, setIndicatorMap, setLoading])

  // 监听插件消息
  useEffect(() => {
    // 标签点击
    onlyOfficeBridge.on(MESSAGE_TYPES.TAG_CLICKED, (data) => {
      setCurrentEditingTag(data)
      setConfigPanelVisible(true)
    })

    // Bridge 就绪（iframe 已连接）
    onlyOfficeBridge.on(MESSAGE_TYPES.BRIDGE_READY, () => {
      console.log('[TemplateEditor] Bridge ready received')
      setEditorReady(true)
      message.success('OnlyOffice 编辑器已就绪')
    })

    // 插件就绪
    onlyOfficeBridge.on(MESSAGE_TYPES.EDITOR_READY, () => {
      console.log('[TemplateEditor] Plugin ready received')
    })

    return () => {
      onlyOfficeBridge.off(MESSAGE_TYPES.TAG_CLICKED, () => {})
      onlyOfficeBridge.off(MESSAGE_TYPES.BRIDGE_READY, () => {})
      onlyOfficeBridge.off(MESSAGE_TYPES.EDITOR_READY, () => {})
    }
  }, [setCurrentEditingTag, setConfigPanelVisible, setEditorReady])

  // 加载模板
  const handleLoadTemplate = async () => {
    if (!templateIdInput) {
      message.warning('请输入模板 ID')
      return
    }

    try {
      const id = parseInt(templateIdInput)
      const result = await getTemplateUrl(id)
      setCurrentTemplate(id, result.url, `template_${id}_${Date.now()}`, result.name || '模板文档')
      setLoadModalVisible(false)
      message.success('模板加载成功')
    } catch (error) {
      message.error('模板加载失败')
    }
  }

  // 处理拖拽开始
  const handleDragStart = (event: DragEndEvent) => {
    console.log('[Drag] 🎯 DRAG START', {
      activeId: event.active.id,
      activeData: event.active.data.current,
      timestamp: new Date().toISOString()
    })
    setActiveId(event.active.id as string)
  }

  // 处理拖拽结束（页面级别的 DndContext）
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    console.log('[Drag] 🎯 DRAG END', {
      activeId: active.id,
      activeData: active.data.current,
      overId: over?.id,
      overData: over?.data.current,
      timestamp: new Date().toISOString()
    })

    setActiveId(null)

    if (!over) {
      console.log('[Drag] ⚠️ No drop target, drag cancelled')
      return
    }

    // 检查是否拖拽到文档区域（由 IndicatorPanel 内部的 DndContext 处理）
    const indicatorData = active.data.current

    if (indicatorData?.type === 'indicator' && editorReady) {
      const indicator = indicatorData.indicator as IndicatorMetadata
      handleInsertIndicator(indicator)
    }
  }

  // 处理指标插入
  const handleInsertIndicator = async (indicator: IndicatorMetadata) => {
    console.log('[InsertIndicator] 🚀 START', {
      editorReady,
      indicator: {
        indicatorId: indicator.indicatorId,
        code: indicator.code,
        field: indicator.field,
        name: indicator.name,
        type: indicator.type,
        chartType: indicator.chartType
      },
      timestamp: new Date().toISOString()
    })

    if (!editorReady) {
      console.warn('[InsertIndicator] ⚠️ Editor not ready')
      message.warning('请等待编辑器加载完成')
      return
    }

    try {
      const detail = indicatorMap.get(indicator.indicatorId)
      const paramValues = detail ? getDefaultParamValues(detail) : {}

      const tagItem = {
        uid: '',
        indicatorId: indicator.indicatorId,
        code: indicator.code,
        field: indicator.field,
        name: indicator.name,
        type: indicator.type,
        chartType: indicator.chartType,
        paramValues,
      }

      console.log('[InsertIndicator] 📤 Sending to OnlyOffice plugin...')
      console.log('[InsertIndicator] 📦 TagItem:', JSON.stringify(tagItem, null, 2))

      const result = await insertIndicatorToOnlyOffice(tagItem)

      console.log('[InsertIndicator] 📥 Plugin response:', result)
      console.log('[InsertIndicator] ✅ SUCCESS')

      message.success(`已插入「${indicator.name}」`)
    } catch (error) {
      console.error('[InsertIndicator] ❌ FAILED:', error)
      message.error('插入失败')
    }
  }

  // 保存模板（转换为原始模板）
  const handleSaveTemplate = async () => {
    if (editorReady) {
      try {
        const result = await convertToRawTemplate()
        console.log('Raw template:', result)
        message.success('模板转换完成')
        // TODO: 提交到后端保存
      } catch (error) {
        message.error('转换失败')
      }
    }
  }

  // 获取文档标签
  const handleGetTags = async () => {
    if (editorReady) {
      try {
        const result = await getDocTagsFromOnlyOffice()
        console.log('Document tags:', result)
        message.success(`共 ${result?.tags?.length || 0} 个标签`)
      } catch (error) {
        message.error('获取标签失败')
      }
    }
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <Layout className="template-editor-layout">
        {/* 顶部工具栏 */}
        <Header className="editor-header">
          <Toolbar />
        </Header>

        {/* 次级工具栏：操作按钮 */}
        <div className="editor-toolbar-secondary">
          <Space>
            <Button onClick={() => setLoadModalVisible(true)}>加载模板</Button>
            <Button icon={<EyeOutlined />} onClick={handleGetTags} disabled={!editorReady}>
              查看标签
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveTemplate} disabled={!editorReady}>
              保存模板
            </Button>
          </Space>
        </div>

        <Layout>
          {/* 左侧指标库面板 */}
          <Sider width={280} className="indicator-sider" theme="light">
            {loading ? (
              <div className="loading-container">
                <Spin tip="加载中..." />
              </div>
            ) : (
              <IndicatorPanel
                categories={categories}
                onIndicatorInsert={handleInsertIndicator}
              />
            )}
          </Sider>

          {/* 中间文档编辑区 */}
          <Content className="editor-content">
            {documentUrl ? (
              <OnlyOfficeEditor
                documentId={currentTemplateId?.toString() || ''}
                documentUrl={documentUrl}
                documentKey={documentKey!}
                documentTitle={documentTitle!}
              />
            ) : (

                <div className="editor-placeholder">
                  <Empty description="请先加载模板文件" />
                  <Button type="primary" onClick={() => setLoadModalVisible(true)}>
                    加载模板
                  </Button>
                </div>
            )}
          </Content>

          {/* 右侧配置面板 */}
          <ConfigPanel />
        </Layout>

        {/* 加载模板对话框 */}
        <Modal
          title="加载模板"
          open={loadModalVisible}
          onOk={handleLoadTemplate}
          onCancel={() => setLoadModalVisible(false)}
        >
          <Input
            placeholder="请输入模板 ID"
            value={templateIdInput}
            onChange={(e) => setTemplateIdInput(e.target.value)}
            type="number"
          />
        </Modal>
      </Layout>

      {/* 拖拽预览层 */}
      <DragOverlay>
        {activeId && (
          <div className="drag-overlay-item">
            拖拽中...
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default TemplateEditorPage