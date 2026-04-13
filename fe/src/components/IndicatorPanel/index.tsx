import { useState, useMemo } from 'react'
import { Input, Tree, Tag, Typography, Button, Tooltip } from 'antd'
import { SearchOutlined, DatabaseOutlined, BarChartOutlined, RobotOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons'
import { useDraggable } from '@dnd-kit/core'
import type { IndicatorCategory, IndicatorMetadata, IndicatorType } from '@/types'
import type { TreeDataNode, TreeProps } from 'antd'
import './index.css'

const { Text } = Typography

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

// 指标类型标签映射
const typeLabels: Record<IndicatorType, string> = {
  text: '文本',
  number: '数值',
  percent: '百分比',
  date: '日期',
  chart: '图表',
  table: '表格',
  condition: '条件',
  ai_generate: 'AI',
}

interface DraggableIndicatorProps {
  indicator: IndicatorMetadata
  onInsert?: (indicator: IndicatorMetadata) => void
}

// 可拖拽的指标项
const DraggableIndicator = ({ indicator, onInsert }: DraggableIndicatorProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `indicator-${indicator.indicatorId}`,
    data: {
      type: 'indicator',
      indicator,
    },
  })

  const handleInsert = () => {
    onInsert?.(indicator)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`indicator-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="indicator-item-dot" style={{ background: typeColors[indicator.type] }} />
      <div className="indicator-item-content">
        <Text strong>{indicator.name}</Text>
        <Text type="secondary" className="indicator-item-meta">
          {indicator.code} · {indicator.previewValue || '-'}
        </Text>
      </div>
      <Tag color={typeColors[indicator.type]} className="indicator-item-tag">
        {typeLabels[indicator.type]}
      </Tag>
      {onInsert ? (
        <Tooltip title="点击插入">
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleInsert}
            className="indicator-item-insert"
          />
        </Tooltip>
      ) : (
        <span className="indicator-item-drag">⠿</span>
      )}
    </div>
  )
}

interface IndicatorPanelProps {
  categories: IndicatorCategory[]
  onIndicatorInsert?: (indicator: IndicatorMetadata) => void
}

const IndicatorPanel = ({ categories, onIndicatorInsert }: IndicatorPanelProps) => {
  const [searchText, setSearchText] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<string[]>(categories.map((c) => `cat-${c.id}`))

  // 过滤指标
  const filteredCategories = useMemo(() => {
    if (!searchText) return categories

    return categories
      .map((cat) => ({
        ...cat,
        indicators: cat.indicators.filter(
          (ind) =>
            ind.name.toLowerCase().includes(searchText.toLowerCase()) ||
            ind.code.toLowerCase().includes(searchText.toLowerCase()) ||
            ind.indicatorId.toLowerCase().includes(searchText.toLowerCase())
        ),
      }))
      .filter((cat) => cat.indicators.length > 0)
  }, [categories, searchText])

  // 构建树数据
  const treeData: TreeDataNode[] = filteredCategories.map((cat) => ({
    key: `cat-${cat.id}`,
    title: (
      <div className="category-title">
        <span>{cat.icon} {cat.name}</span>
        <Tag color="blue">{cat.indicators.length}</Tag>
      </div>
    ),
    children: cat.indicators.map((ind) => ({
      key: `ind-${ind.indicatorId}`,
      title: <DraggableIndicator indicator={ind} onInsert={onIndicatorInsert} />,
      isLeaf: true,
    })),
  }))

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    // 搜索时展开所有
    if (e.target.value) {
      setExpandedKeys(filteredCategories.map((c) => `cat-${c.id}`))
    }
  }

  return (
    <div className="indicator-panel">
      <div className="indicator-panel-header">
        <div className="indicator-panel-title">
          <DatabaseOutlined /> 指标库
        </div>
        <Input
          placeholder="搜索指标..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          allowClear
          className="indicator-search"
        />
      </div>

      <div className="indicator-panel-content">
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          selectable={false}
          blockNode
          className="indicator-tree"
        />
      </div>

      <div className="indicator-panel-footer">
        <div className="indicator-tip">
          💡 拖拽指标到文档中 → 点击 ⚙ 配置参数
        </div>
        <div className="indicator-tip">
          🤖 AI 指标支持在线预览生成内容
        </div>
      </div>
    </div>
  )
}

export default IndicatorPanel