import { useEffect, useState } from 'react'
import { Drawer, Tabs, Form, Input, Select, InputNumber, Switch, Button, message, Divider } from 'antd'
import { SaveOutlined, RobotOutlined } from '@ant-design/icons'
import { useEditorStore } from '@/stores'
import { aiPreview } from '@/api'
import type { IndicatorDetail, IndicatorParam, AiPreviewResult } from '@/types'
import './index.css'

const { TextArea } = Input

// 预设颜色
const PRESET_COLORS = [
  '#4F7CFF', '#36D399', '#F87272', '#FBBD23', '#A78BFA',
  '#38BDF8', '#FB923C', '#E879A8', '#22D3EE', '#84CC16',
]

interface ConfigPanelProps {}

const ConfigPanel = ({}: ConfigPanelProps) => {
  const {
    currentEditingTag,
    configPanelVisible,
    setConfigPanelVisible,
    indicatorMap,
    updateIndicatorParams,
  } = useEditorStore()

  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('params')
  const [indicatorDetail, setIndicatorDetail] = useState<IndicatorDetail | null>(null)
  const [aiPreviewResult, setAiPreviewResult] = useState<AiPreviewResult | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)

  // 当编辑标签变化时，加载参数
  useEffect(() => {
    if (currentEditingTag && configPanelVisible) {
      const detail = indicatorMap.get(currentEditingTag.Tag.indicatorId)
      setIndicatorDetail(detail || null)

      // 填充表单
      if (currentEditingTag.Tag.paramValues) {
        form.setFieldsValue(currentEditingTag.Tag.paramValues)
      }

      // AI 类型默认显示提示词 Tab
      if (currentEditingTag.Tag.type === 'ai_generate') {
        setActiveTab('params')
      }
    }
  }, [currentEditingTag, configPanelVisible, indicatorMap, form])

  // 关闭面板
  const handleClose = () => {
    setConfigPanelVisible(false)
  }

  // 保存参数
  const handleSave = async () => {
    if (!currentEditingTag) return

    try {
      const values = await form.validateFields()
      console.log('currentEditingTag', currentEditingTag)
      await updateIndicatorParams(currentEditingTag.Tag?.uid, values)
      message.success('配置已保存')
      handleClose()
    } catch (error) {
      message.error('保存失败')
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
        contextData: {
          period: '2025年第一季度',
          area: '广州市',
          data: {
            JK4816: { work_count: 35821, mom_ratio: 12.5 },
          },
        },
      })
      setAiPreviewResult(result)
      message.success('AI 内容生成成功')
    } catch (error) {
      message.error('AI 生成失败')
    } finally {
      setAiGenerating(false)
    }
  }

  if (!currentEditingTag || !indicatorDetail) {
    return null
  }

  const isAi = currentEditingTag.Tag?.type === 'ai_generate'

  // 渲染参数控件
  const renderParamControl = (param: IndicatorParam) => {
    switch (param.inputType) {
      case 'select':
        return (
          <Select placeholder={`请选择${param.paramLabel}`}>
            {param.options?.map((opt) => (
              <Select.Option key={opt} value={opt}>
                {opt}
              </Select.Option>
            ))}
          </Select>
        )

      case 'text':
        return <Input placeholder={`请输入${param.paramLabel}`} />

      case 'textarea':
        return (
          <div>
            <TextArea
              rows={6}
              placeholder="输入提示词模板..."
              style={{ fontFamily: 'monospace', lineHeight: 1.7 }}
            />
            {param.paramKey === 'promptTemplate' && (
              <div className="prompt-variables">
                <span className="prompt-variables-label">快速插入变量：</span>
                {['{period}', '{area}', '{data}', '{data.JK4816}'].map((v) => (
                  <Button key={v} size="small" type="dashed" className="prompt-var-btn">
                    {v}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )

      case 'number':
        return (
          <InputNumber
            style={{ width: '100%' }}
            min={param.minValue}
            max={param.maxValue}
            placeholder={`请输入${param.paramLabel}`}
          />
        )

      case 'switch':
        return <Switch />

      case 'color':
        return (
          <div className="color-picker-wrapper">
            {PRESET_COLORS.map((color) => (
              <div
                key={color}
                className="color-item"
                style={{ background: color }}
                onClick={() => form.setFieldValue(param.paramKey, color)}
              />
            ))}
          </div>
        )

      case 'multiselect':
        return (
          <Select mode="multiple" placeholder={`请选择${param.paramLabel}`}>
            {param.options?.map((opt) => (
              <Select.Option key={opt} value={opt}>
                {opt}
              </Select.Option>
            ))}
          </Select>
        )

      default:
        return <Input placeholder={`请输入${param.paramLabel}`} />
    }
  }

  const tabsItems = [
    {
      key: 'params',
      label: isAi ? '提示词与模型' : '接口参数',
      children: (
        <Form form={form} layout="vertical" className="config-form">
          {indicatorDetail.params?.map((param) => (
            <Form.Item
              key={param.paramKey}
              name={param.paramKey}
              label={param.paramLabel}
              rules={[{ required: param.required, message: `请输入${param.paramLabel}` }]}
            >
              {renderParamControl(param)}
            </Form.Item>
          ))}

          {isAi && (
            <>
              <Divider />
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={handleAiPreview}
                loading={aiGenerating}
                block
              >
                ✨ 预览 AI 生成内容
              </Button>

              {aiPreviewResult && (
                <div className="ai-preview-result">
                  <div className="ai-preview-header">
                    <span>AI 生成预览</span>
                    <span className="ai-preview-time">{aiPreviewResult.generationTime}ms</span>
                  </div>
                  <div className="ai-preview-content">
                    {aiPreviewResult.generatedContent}
                  </div>
                </div>
              )}
            </>
          )}
        </Form>
      ),
    },
    {
      key: 'display',
      label: '显示设置',
      children: (
        <Form form={form} layout="vertical" className="config-form">
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="指标在文档中的显示名称" />
          </Form.Item>
          <Form.Item name="fontSize" label="字体大小">
            <Select>
              <Select.Option value={12}>12px</Select.Option>
              <Select.Option value={14}>14px</Select.Option>
              <Select.Option value={16}>16px</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'advanced',
      label: '高级',
      children: (
        <Form form={form} layout="vertical" className="config-form">
          <Form.Item label="模板表达式">
            <div className="template-expression">
              {isAi
                ? `{{ai_generate("${currentEditingTag.Tag.field}", ...)}}`
                : `{{${currentEditingTag.Tag.code}.get("${currentEditingTag.Tag.field}")}}`}
            </div>
          </Form.Item>
          <Form.Item name="cache" label="缓存策略">
            <Select defaultValue="none">
              <Select.Option value="none">不缓存（每次重新生成）</Select.Option>
              <Select.Option value="1h">缓存 1 小时</Select.Option>
              <Select.Option value="24h">缓存 24 小时</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="emptyHandle" label="空值处理">
            <Select defaultValue="placeholder">
              <Select.Option value="placeholder">显示占位提示</Select.Option>
              <Select.Option value="hide">隐藏该段</Select.Option>
              <Select.Option value="custom">自定义文本</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <Drawer
      title={
        <div className="config-drawer-title">
          {isAi && <RobotOutlined style={{ color: '#7c3aed' }} />}
          <span>指标参数配置</span>
        </div>
      }
      placement="right"
      width={380}
      open={configPanelVisible}
      onClose={handleClose}
      footer={
        <div className="config-drawer-footer">
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存配置
          </Button>
        </div>
      }
      className={`config-drawer ${isAi ? 'ai-config' : ''}`}
    >
      <div className="config-indicator-info">
        <div className="config-indicator-name">{indicatorDetail.name}</div>
        <div className="config-indicator-code">{indicatorDetail.code}</div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabsItems} />
    </Drawer>
  )
}

export default ConfigPanel