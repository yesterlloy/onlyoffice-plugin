import { useEffect, useState } from 'react'
import { Tabs, Form, Input, Select, InputNumber, Switch, Button, message, Divider, Popconfirm, Space, Empty, List, Typography, Tooltip } from 'antd'
import { SaveOutlined, RobotOutlined, DeleteOutlined, PlusOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useEditorStore } from '@/stores'
import { aiPreview } from '@/api'
import type { IndicatorDetail, IndicatorParam, AiPreviewResult, IndicatorMetadata } from '@/types'
import './index.css'

const { TextArea } = Input
const { Text } = Typography

// 预设颜色
const PRESET_COLORS = [
  '#4F7CFF', '#36D399', '#F87272', '#FBBD23', '#A78BFA',
  '#38BDF8', '#FB923C', '#E879A8', '#22D3EE', '#84CC16',
]

const ConfigPanel = () => {
  const {
    currentEditingTag,
    currentLoopConfig,
    setCurrentLoopConfig,
    selectedDataset,
    datasets,
    indicatorMap,
    updateIndicatorParams,
    applyLoopConfigToOnlyOffice,
    setLoopRegionInOnlyOffice,
    removeLoopEndInOnlyOffice,
    removeIndicatorFromOnlyOffice,
    insertIndicatorToOnlyOffice,
    editorReady
  } = useEditorStore()

  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('params')
  const [indicatorDetail, setIndicatorDetail] = useState<IndicatorDetail | null>(null)
  const [aiPreviewResult, setAiPreviewResult] = useState<AiPreviewResult | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)

  // 当编辑标签变化时，加载参数
  useEffect(() => {
    if (currentEditingTag && currentEditingTag.Tag.type !== 'dataset') {
      const detail = indicatorMap.get(currentEditingTag.Tag.indicatorId)
      setIndicatorDetail(detail || null)

      // 填充表单
      if (currentEditingTag.Tag.paramValues) {
        form.setFieldsValue({
          ...currentEditingTag.Tag.paramValues,
          isLoop: !!currentEditingTag.Tag.isLoopStart,
        })
      } else {
        form.setFieldsValue({
          isLoop: !!currentEditingTag.Tag.isLoopStart,
        })
      }

      if (currentEditingTag.Tag.type === 'ai_generate') {
        setActiveTab('params')
      }
    }
  }, [currentEditingTag, indicatorMap, form])

  // 处理指标插入
  const handleInsertIndicator = async (indicator: IndicatorMetadata) => {
    if (!editorReady) return;
    try {
      const detail = indicatorMap.get(indicator.indicatorId)
      const paramValues: Record<string, any> = {}
      detail?.params?.forEach(p => {
        if (p.defaultValue !== undefined) paramValues[p.paramKey] = p.defaultValue
      })

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
      await insertIndicatorToOnlyOffice(tagItem)
      message.success(`已插入「${indicator.name}」`)
    } catch (error) {
      console.error('Insert failed:', error)
      message.error('插入失败')
    }
  }

  // 保存循环区域配置
  const handleApplyLoop = async () => {
    try {
      const values = await form.validateFields()
      await applyLoopConfigToOnlyOffice({
        ...currentLoopConfig,
        indicatorId: values.indicatorId,
        startIndex: values.startIndex,
        endIndex: values.endIndex,
      })
      message.success('循环区域配置已更新')
      setCurrentLoopConfig(null)
    } catch (error) {
      message.error('应用配置失败')
    }
  }

  // 保存参数
  const handleSave = async () => {
    if (!currentEditingTag) return
    try {
      const values = await form.validateFields()
      await updateIndicatorParams(currentEditingTag, values)
      message.success('配置已保存')
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 删除指标
  const handleDelete = async () => {
    if (!currentEditingTag) return
    try {
      await removeIndicatorFromOnlyOffice(currentEditingTag)
      message.success('指标已删除')
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 设为循环开关变化
  const handleLoopToggle = async (checked: boolean) => {
    if (!currentEditingTag) return
    try {
      if (checked) {
        await setLoopRegionInOnlyOffice(currentEditingTag)
        message.success('已设为循环')
      } else {
        await removeLoopEndInOnlyOffice(currentEditingTag)
        message.success('已取消循环')
      }
    } catch (error) {
      message.error('操作失败')
      if (currentEditingTag.Tag?.type !== 'dataset') {
        form.setFieldsValue({ isLoop: !checked })
      }
    }
  }

  // AI 预览生成
  const handleAiPreview = async () => {
    if (!currentEditingTag) return
    const values = form.getFieldsValue()
    setAiGenerating(true)
    try {
      const result = await aiPreview({
        promptTemplate: values.promptTemplate || '',
        temperature: values.temperature || 0.3,
        maxTokens: values.maxLength || 500,
        contextData: { period: '2025年第一季度', area: '广州市', data: { JK4816: { work_count: 35821, mom_ratio: 12.5 } } },
      })
      setAiPreviewResult(result)
      message.success('AI 内容生成成功')
    } catch (error) {
      message.error('AI 生成失败')
    } finally {
      setAiGenerating(false)
    }
  }

  // ==================== 渲染逻辑 ====================

  // 优先级：当前在文档中选中的 Tag 优先于左侧边栏选中的数据集
  const isDocTagDataset = currentEditingTag?.Tag?.type === 'dataset'
  const activeDataset = isDocTagDataset
    ? {
        id: currentEditingTag.Tag.indicatorId,
        code: currentEditingTag.Tag.code,
        name: currentEditingTag.Tag.name,
        datasourceCode: currentEditingTag.Tag.paramValues?.datasourceCode,
        indicators: []
      }
    : selectedDataset

  const isDatasetSelected = isDocTagDataset || (!!selectedDataset && !currentEditingTag)
  const realDataset = activeDataset?.id ? datasets.find(d => d.id === activeDataset.id) || activeDataset : null

  if (isDatasetSelected && realDataset) {
    return (
      <div className="config-container">
        <div className="config-header">
          <DatabaseOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          <span>数据集配置</span>
        </div>
        
        <div className="config-content">
          <div className="config-indicator-info">
            <div className="config-indicator-name">{realDataset.name}</div>
            <div className="config-indicator-code">Code: {realDataset.code} | 数据源: {realDataset.datasourceCode}</div>
          </div>

          {currentEditingTag?.Tag?.type === 'dataset' && (
            <div style={{
              margin: '0 16px 16px',
              padding: '12px',
              background: '#f9f9f9',
              border: '1px solid #f0f0f0',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#262626' }}>设置为循环区域</div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>将此数据集标记为列表循环起点</div>
              </div>
              <Switch
                checked={!!currentEditingTag.Tag.isLoopStart}
                onChange={handleLoopToggle}
              />
            </div>
          )}

          <Tabs defaultActiveKey="indicators" items={[
            {
              key: 'indicators',
              label: '包含指标',
              children: (
                <div className="dataset-indicators-list">
                  <List
                    size="small"
                    dataSource={(realDataset as any).indicators || []}
                    renderItem={(indicator: IndicatorMetadata) => (
                      <List.Item className="dataset-indicator-item">
                        <div className="dataset-indicator-info">
                          <Text strong>{indicator.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{indicator.code}</Text>
                        </div>
                        <Tooltip title={!editorReady ? "请等待编辑器加载" : "插入到文档"}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleInsertIndicator(indicator)}
                            disabled={!editorReady}
                          />
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                </div>
              )
            },
            {
              key: 'loop',
              label: '循环配置',
              children: (
                <div className="dataset-loop-config">
                  {currentLoopConfig ? (
                    <Form form={form} layout="vertical" initialValues={{ startIndex: 0, endIndex: 10 }}>
                      <div className="loop-info-box">
                        <div><strong>循环范围：</strong>{currentLoopConfig.quote}</div>
                        <div><strong>当前文本：</strong>{currentLoopConfig.text}</div>
                      </div>
                      <Form.Item name="indicatorId" label="绑定列表指标" rules={[{ required: true }]}>
                        <Select placeholder="请选择列表指标">
                          {Array.from(indicatorMap.values()).map((ind) => (
                            <Select.Option key={ind.indicatorId} value={ind.code}>{ind.name} ({ind.code})</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name="startIndex" label="起始索引 (含)">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="endIndex" label="结束索引 (不含)">
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                      <Button type="primary" onClick={handleApplyLoop} block>应用循环配置</Button>
                    </Form>
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#888' }}>
                      请在文档中选择一个循环区域进行配置
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'advanced',
              label: '高级',
              children: (
                <Form layout="vertical" className="config-form">
                  <Form.Item label="转换表达式">
                    <div className="template-expression">
                      {`{{put("${realDataset.code}",data("${realDataset.datasourceCode}"))}}`}
                    </div>
                  </Form.Item>
                </Form>
              )
            }
          ]} />
        </div>
      </div>
    )
  }

  if (currentEditingTag && indicatorDetail) {
    const isAi = currentEditingTag.Tag.type === 'ai_generate'

    const renderParamControl = (param: IndicatorParam) => {
      switch (param.inputType) {
        case 'select': return <Select placeholder={`请选择${param.paramLabel}`}>{param.options?.map((opt) => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}</Select>
        case 'text': return <Input placeholder={`请输入${param.paramLabel}`} />
        case 'textarea': return (
          <div>
            <TextArea rows={6} placeholder="输入提示词模板..." style={{ fontFamily: 'monospace', lineHeight: 1.7 }} />
            {param.paramKey === 'promptTemplate' && (
              <div className="prompt-variables">
                <span className="prompt-variables-label">快速插入变量：</span>
                {['{period}', '{area}', '{data}', '{data.JK4816}'].map((v) => <Button key={v} size="small" type="dashed" className="prompt-var-btn">{v}</Button>)}
              </div>
            )}
          </div>
        )
        case 'number': return <InputNumber style={{ width: '100%' }} min={param.minValue} max={param.maxValue} placeholder={`请输入${param.paramLabel}`} />
        case 'switch': return <Switch />
        case 'color': return (
          <div className="color-picker-wrapper">
            {PRESET_COLORS.map((color) => <div key={color} className="color-item" style={{ background: color }} onClick={() => form.setFieldValue(param.paramKey, color)} />)}
          </div>
        )
        case 'multiselect': return <Select mode="multiple" placeholder={`请选择${param.paramLabel}`}>{param.options?.map((opt) => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}</Select>
        default: return <Input placeholder={`请输入${param.paramLabel}`} />
      }
    }

    return (
      <div className="config-container">
        <div className="config-header">
          {isAi && <RobotOutlined style={{ color: '#7c3aed', marginRight: 8 }} />}
          {!isAi && <span style={{ marginRight: 8 }}>⚙️</span>}
          <span>指标配置</span>
        </div>
        
        <div className="config-content">
          <div className="config-indicator-info">
            <div className="config-indicator-name">{indicatorDetail.name}</div>
            <div className="config-indicator-code">{indicatorDetail.code}</div>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
            {
              key: 'params',
              label: isAi ? '提示词与模型' : '接口参数',
              children: (
                <Form form={form} layout="vertical" className="config-form">
                  {indicatorDetail.params?.map((param) => (
                    <Form.Item key={param.paramKey} name={param.paramKey} label={param.paramLabel} rules={[{ required: param.required, message: `请输入${param.paramLabel}` }]}>
                      {renderParamControl(param)}
                    </Form.Item>
                  ))}
                  {isAi && (
                    <>
                      <Divider />
                      <Button type="primary" icon={<RobotOutlined />} onClick={handleAiPreview} loading={aiGenerating} block>✨ 预览 AI 生成内容</Button>
                      {aiPreviewResult && (
                        <div className="ai-preview-result">
                          <div className="ai-preview-header"><span>AI 生成预览</span><span className="ai-preview-time">{aiPreviewResult.generationTime}ms</span></div>
                          <div className="ai-preview-content">{aiPreviewResult.generatedContent}</div>
                        </div>
                      )}
                    </>
                  )}
                </Form>
              )
            },
            {
              key: 'display',
              label: '显示设置',
              children: (
                <Form form={form} layout="vertical" className="config-form">
                  <Form.Item name="displayName" label="显示名称"><Input placeholder="指标在文档中的显示名称" /></Form.Item>
                  <Form.Item name="fontSize" label="字体大小"><Select><Select.Option value={12}>12px</Select.Option><Select.Option value={14}>14px</Select.Option><Select.Option value={16}>16px</Select.Option></Select></Form.Item>
                </Form>
              )
            },
            {
              key: 'advanced',
              label: '高级',
              children: (
                <Form form={form} layout="vertical" className="config-form">
                  <Form.Item label="模板表达式">
                    <div className="template-expression">
                      {isAi ? `{{ai_generate("${currentEditingTag?.Tag?.field}", ...)}}` : `{{${currentEditingTag?.Tag?.code}.get("${currentEditingTag?.Tag?.field}")}}`}
                    </div>
                  </Form.Item>
                  <Form.Item name="cache" label="缓存策略"><Select defaultValue="none"><Select.Option value="none">不缓存</Select.Option><Select.Option value="1h">缓存 1 小时</Select.Option></Select></Form.Item>
                </Form>
              )
            }
          ]} />
        </div>
        
        <div className="config-footer">
          <Popconfirm title="确定要删除吗？" onConfirm={handleDelete} okText="确定" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />} type="text">删除</Button>
          </Popconfirm>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
          </Space>
        </div>
      </div>
    )
  }

  return (
    <div className="config-container">
      <div className="config-empty">
        <Empty description="请在左侧选择数据集，或在文档中选中标签" />
      </div>
    </div>
  )
}

export default ConfigPanel
