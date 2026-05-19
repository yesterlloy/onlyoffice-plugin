import { useState, useMemo } from 'react'
import { Input, List, Typography, Button, Tooltip } from 'antd'
import { SearchOutlined, DatabaseOutlined, PlusOutlined } from '@ant-design/icons'
import type { Dataset } from '@/types'
import './index.css'

const { Text } = Typography

interface DatasetPanelProps {
  datasets: Dataset[]
  onDatasetInsert?: (dataset: Dataset) => void
  onDatasetSelect?: (dataset: Dataset) => void
  selectedDatasetId?: string
  disabled?: boolean
}

const DatasetPanel = ({ datasets, onDatasetInsert, onDatasetSelect, selectedDatasetId, disabled }: DatasetPanelProps) => {
  const [searchText, setSearchText] = useState('')

  // 过滤数据集
  const filteredDatasets = useMemo(() => {
    if (!searchText) return datasets

    return datasets.filter(
      (ds) =>
        ds.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ds.code.toLowerCase().includes(searchText.toLowerCase()) ||
        ds.id.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [datasets, searchText])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  return (
    <div className="dataset-panel">
      <div className="dataset-panel-header">
        <div className="dataset-panel-title">
          <DatabaseOutlined /> 数据集
        </div>
        <Input
          placeholder="搜索数据集..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          allowClear
          className="dataset-search"
        />
      </div>

      <div className="dataset-panel-content">
        <List
          dataSource={filteredDatasets}
          renderItem={(dataset) => (
            <List.Item
              className={`dataset-item ${selectedDatasetId === dataset.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onDatasetSelect?.(dataset)
                }
              }}
            >
              <div className="dataset-item-content">
                <Text strong>{dataset.name}</Text>
                <Text type="secondary" className="dataset-item-meta">
                  {dataset.code}
                </Text>
              </div>
              <Tooltip title={disabled ? "请等待编辑器加载" : "点击插入并选中"}>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!disabled) {
                      onDatasetInsert?.(dataset)
                    }
                  }}
                  className="dataset-item-insert"
                  disabled={disabled}
                />
              </Tooltip>
            </List.Item>
          )}
        />
      </div>

      <div className="dataset-panel-footer">
        <div className="dataset-tip">
          💡 点击添加数据集到文档，右侧配置指标和循环
        </div>
      </div>
    </div>
  )
}

export default DatasetPanel
