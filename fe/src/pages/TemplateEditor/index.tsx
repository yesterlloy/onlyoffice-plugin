import { useEffect, useState } from 'react'
import { Layout, Spin, Segmented, Button, message, Modal, Input, Space, Empty } from 'antd'
import { FileWordOutlined, EditOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { useEditorStore } from '@/stores'
import { getIndicatorCategories, getIndicatorDetail, getTemplateUrl } from '@/api'
import { onlyOfficeBridge, MESSAGE_TYPES } from '@/utils/onlyoffice-bridge'
import type { IndicatorDetail, DocTagItem, IndicatorMetadata } from '@/types'
import IndicatorPanel from '@/components/IndicatorPanel'
import DocEditor from '@/components/DocEditor'
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
    editorMode,
    setEditorMode,
    editorReady,
    setEditorReady,
    documentUrl,
    documentKey,
    documentTitle,
    setCurrentTemplate,
    setCurrentEditingTag,
    setConfigPanelVisible,
    insertIndicatorToOnlyOffice,
    updateIndicatorParams,
    removeIndicatorFromOnlyOffice,
    getDocTagsFromOnlyOffice,
    convertToRawTemplate,
    addTagToBlock,
  } = useEditorStore()
  console.log('editorMode:', editorMode, 'editorReady:', editorReady, 'documentUrl:', documentUrl)

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

  // OnlyOffice 模式下监听插件消息
  useEffect(() => {
    if (editorMode !== 'onlyoffice') return

    // 标签点击
    onlyOfficeBridge.on(MESSAGE_TYPES.TAG_CLICKED, (data) => {
      setCurrentEditingTag(data)
      setConfigPanelVisible(true)
    })

    // 编辑器就绪
    onlyOfficeBridge.on(MESSAGE_TYPES.EDITOR_READY, () => {
      setEditorReady(true)
      message.success('OnlyOffice 编辑器已就绪')
    })

    return () => {
      onlyOfficeBridge.off(MESSAGE_TYPES.TAG_CLICKED, () => {})
      onlyOfficeBridge.off(MESSAGE_TYPES.EDITOR_READY, () => {})
    }
  }, [editorMode, setCurrentEditingTag, setConfigPanelVisible, setEditorReady])

  // 切换编辑模式
  const handleModeChange = (value: string | number) => {
    const mode = value as 'mock' | 'onlyoffice'
    setEditorMode(mode)
    if (mode === 'onlyoffice') {
      // 切换到 OnlyOffice 模式时，提示加载模板
      if (!documentUrl) {
        setLoadModalVisible(true)
      }
    }
  }

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

    // 检查是否拖拽到文档区域
    const blockUid = over.id.toString().replace('block-', '')
    const indicatorData = active.data.current

    console.log('[Drag] 📊 Drop analysis', {
      blockUid,
      isIndicator: indicatorData?.type === 'indicator',
      indicatorPreview: indicatorData?.indicator ? {
        indicatorId: indicatorData.indicator.indicatorId,
        name: indicatorData.indicator.name,
        type: indicatorData.indicator.type
      } : null
    })

    if (indicatorData?.type === 'indicator' && blockUid) {
      const indicator = indicatorData.indicator as IndicatorMetadata

      if (editorMode === 'mock') {
        console.log('[Drag] 🎭 MOCK MODE - Adding to docBlocks')

        // mock 模式：直接添加到 docBlocks
        const detail = indicatorMap.get(indicator.indicatorId)
        const paramValues = detail ? getDefaultParamValues(detail) : {}

        console.log('[Drag] 📦 Creating DocTagItem', {
          indicator,
          detail: detail ? {
            indicatorId: detail.indicatorId,
            paramsCount: detail.params?.length
          } : null,
          paramValues
        })

        addTagToBlock(blockUid, {
          uid: '',
          indicatorId: indicator.indicatorId,
          code: indicator.code,
          field: indicator.field,
          name: indicator.name,
          type: indicator.type,
          chartType: indicator.chartType,
          paramValues,
        })
        message.success(`已插入「${indicator.name}」`)

        console.log('[Drag] ✅ MOCK MODE - Insert complete')

      } else if (editorMode === 'onlyoffice' && editorReady) {
        console.log('[Drag] 📄 ONLYOFFICE MODE - Sending to plugin')

        // OnlyOffice 模式：通过插件插入
        handleInsertIndicator(indicator)
      }
    } else {
      console.log('[Drag] ⚠️ Invalid drop target or not an indicator')
    }
  }

  // 处理指标插入（OnlyOffice 模式）
  const handleInsertIndicator = async (indicator: IndicatorMetadata) => {
    console.log('[InsertIndicator] 🚀 START', {
      mode: editorMode,
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

    if (editorMode === 'onlyoffice' && editorReady) {
      try {
        const tagItem = {
          uid: '',
          indicatorId: indicator.indicatorId,
          code: indicator.code,
          field: indicator.field,
          name: indicator.name,
          type: indicator.type,
          chartType: indicator.chartType,
          paramValues: {},
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
    } else {
      console.warn('[InsertIndicator] ⚠️ Editor not ready or not in onlyoffice mode')
    }
  }

  // 处理参数更新（OnlyOffice 模式）
  const handleUpdateParams = async (uid: string, paramValues: Record<string, any>) => {
    if (editorMode === 'onlyoffice' && editorReady) {
      try {
        await updateIndicatorParams(uid, paramValues)
        message.success('参数已更新')
      } catch (error) {
        message.error('更新失败')
      }
    }
  }

  // 处理标签删除（OnlyOffice 模式）
  const handleRemoveIndicator = async (uid: string) => {
    if (editorMode === 'onlyoffice' && editorReady) {
      try {
        await removeIndicatorFromOnlyOffice(uid)
        message.success('已删除')
      } catch (error) {
        message.error('删除失败')
      }
    }
  }

  // 保存模板（转换为原始模板）
  const handleSaveTemplate = async () => {
    if (editorMode === 'onlyoffice' && editorReady) {
      try {
        const result = await convertToRawTemplate()
        console.log('Raw template:', result)
        message.success('模板转换完成')
        // TODO: 提交到后端保存
      } catch (error) {
        message.error('转换失败')
      }
    } else {
      // mock 模式暂不支持保存
      message.info('模拟模式暂不支持保存')
    }
  }

  // 获取文档标签
  const handleGetTags = async () => {
    if (editorMode === 'onlyoffice' && editorReady) {
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

        {/* 次级工具栏：模式切换和操作按钮 */}
        <div className="editor-toolbar-secondary">
          <Space>
            <Segmented
              value={editorMode}
              onChange={handleModeChange}
              options={[
                { value: 'mock', label: '模拟编辑器', icon: <EditOutlined /> },
                { value: 'onlyoffice', label: 'OnlyOffice', icon: <FileWordOutlined /> },
              ]}
            />
            {editorMode === 'onlyoffice' && (
              <Space>
                <Button onClick={() => setLoadModalVisible(true)}>加载模板</Button>
                <Button icon={<EyeOutlined />} onClick={handleGetTags} disabled={!editorReady}>
                  查看标签
                </Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveTemplate} disabled={!editorReady}>
                  保存模板
                </Button>
              </Space>
            )}
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
                onIndicatorInsert={editorMode === 'onlyoffice' ? handleInsertIndicator : undefined}
              />
            )}
          </Sider>

          {/* 中间文档编辑区 */}
          <Content className="editor-content">
            {editorMode !== 'mock' ? (
              <DocEditor />
            ) : (
              documentUrl ? (
                <OnlyOfficeEditor
                  documentUrl={documentUrl}
                  documentKey={documentKey!}
                  documentTitle={documentTitle!}
                  onReady={() => setEditorReady(true)}
                />
              ) : (
                <div className="editor-placeholder">
                  <Empty description="请先加载模板文件" />
                  <Button type="primary" onClick={() => setLoadModalVisible(true)}>
                    加载模板
                  </Button>
                </div>
              )
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