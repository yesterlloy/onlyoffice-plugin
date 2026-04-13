import { useState } from 'react'
import { Tag, Button, Popconfirm, Tooltip } from 'antd'
import { SettingOutlined, DeleteOutlined, RobotOutlined, BarChartOutlined } from '@ant-design/icons'
import type { DocTagItem, IndicatorType } from '@/types'
import './DocTag.css'

// 指标类型颜色映射
const typeColors: Record<IndicatorType, string> = {
  text: '#52c41a',
  number: '#52c41a',
  percent: '#52c41a',
  date: '#52c41a',
  chart: '#1890ff',
  table: '#722ed1',
  condition: '#faad14',
  ai_generate: '#722ed1',
}

interface DocTagProps {
  item: DocTagItem
  onClick: () => void
  onDelete: () => void
  onConfig: () => void
}

const DocTag = ({ item, onClick, onDelete, onConfig }: DocTagProps) => {
  const isChart = item.type === 'chart'
  const isAi = item.type === 'ai_generate'
  const isCondition = item.type === 'condition'

  // 图表类型标签
  if (isChart) {
    return (
      <div className="doc-tag-chart" onClick={onClick}>
        <div className="doc-tag-chart-header">
          <BarChartOutlined /> {item.name}
          <div className="doc-tag-chart-actions">
            <Button size="small" type="text" icon={<SettingOutlined />} onClick={(e) => { e.stopPropagation(); onConfig() }} />
            <Popconfirm title="确认删除？" onConfirm={(e) => { e?.stopPropagation(); onDelete() }} onCancel={(e) => e?.stopPropagation()}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </div>
        </div>
        <div className="doc-tag-chart-preview">
          <div className="chart-placeholder">
            [图表预览区域]
          </div>
        </div>
        <div className="doc-tag-chart-params">
          {Object.entries(item.paramValues).slice(0, 3).map(([key, value]) => (
            <Tag key={key}>{key}: {String(value).slice(0, 15)}</Tag>
          ))}
        </div>
      </div>
    )
  }

  // AI 生成类型标签
  if (isAi) {
    return (
      <div className="doc-tag-ai" onClick={onClick}>
        <div className="doc-tag-ai-header">
          <RobotOutlined /> {item.name}
          <Tag color="purple">AI 生成</Tag>
          <div className="doc-tag-ai-actions">
            <Button size="small" type="text" icon={<SettingOutlined />} onClick={(e) => { e.stopPropagation(); onConfig() }} />
            <Popconfirm title="确认删除？" onConfirm={(e) => { e?.stopPropagation(); onDelete() }} onCancel={(e) => e?.stopPropagation()}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </div>
        </div>
        <div className="doc-tag-ai-prompt">
          <div className="doc-tag-ai-prompt-label">提示词模板</div>
          <div className="doc-tag-ai-prompt-content">
            {item.paramValues.promptTemplate?.slice(0, 100)}...
          </div>
        </div>
        <Button type="dashed" block className="doc-tag-ai-preview-btn">
          ✨ 点击预览 AI 生成内容
        </Button>
      </div>
    )
  }

  // 条件类型标签
  if (isCondition) {
    return (
      <div className="doc-tag-condition" onClick={onClick}>
        <Tag color="warning" icon={<SettingOutlined />}>
          条件：{item.name}
        </Tag>
        <div className="doc-tag-condition-actions">
          <Button size="small" type="text" icon={<SettingOutlined />} onClick={(e) => { e.stopPropagation(); onConfig() }} />
          <Popconfirm title="确认删除？" onConfirm={(e) => { e?.stopPropagation(); onDelete() }} onCancel={(e) => e?.stopPropagation()}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </div>
      </div>
    )
  }

  // 内联标签（文本、数值、百分比、日期）
  const typeIcon: Record<string, string> = {
    text: '📝',
    number: '🔢',
    percent: '📊',
    date: '📅',
  }

  return (
    <Tag
      className="doc-tag-inline"
      color={typeColors[item.type]}
      onClick={onClick}
      closable
      onClose={(e) => { e.preventDefault(); onDelete() }}
    >
      <span className="doc-tag-icon">{typeIcon[item.type]}</span>
      {item.name}
      {item.paramValues.unit && <span className="doc-tag-unit">({item.paramValues.unit})</span>}
      <SettingOutlined
        className="doc-tag-config"
        onClick={(e) => { e.stopPropagation(); onConfig() }}
      />
    </Tag>
  )
}

export default DocTag