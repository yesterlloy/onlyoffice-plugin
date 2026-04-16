import { useState } from 'react'
import { Button, Select, Space, Dropdown, Modal, Input, message } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  EyeOutlined,
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileAddOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useEditorStore } from '@/stores'
import { createTemplate } from '@/api'
import './index.css'

const Toolbar = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const { currentTemplateId: _currentTemplateId } = useEditorStore()

  // 格式按钮
  const formatButtons = [
    { key: 'bold', icon: <BoldOutlined />, title: '加粗' },
    { key: 'italic', icon: <ItalicOutlined />, title: '斜体' },
    { key: 'underline', icon: <UnderlineOutlined />, title: '下划线' },
  ]

  // 文件菜单
  const fileMenuItems: MenuProps['items'] = [
    {
      key: 'new',
      icon: <FileAddOutlined />,
      label: '新建模板',
    },
    {
      key: 'open',
      icon: <UploadOutlined />,
      label: '打开模板',
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: '导出模板',
    },
    { type: 'divider' },
    {
      key: 'save',
      icon: <SaveOutlined />,
      label: '保存',
    },
    {
      key: 'saveAs',
      icon: <SaveOutlined />,
      label: '另存为...',
    },
  ]

  // 处理保存
  const handleSave = async () => {
    if (!templateName.trim()) {
      message.warning('请输入模板名称')
      return
    }

    setSaving(true)
    try {
      await createTemplate({
        name: templateName,
        description: templateDesc,
        content: '模板内容占位符',
        createdBy: 'admin',
      })
      message.success('模板保存成功')
      setSaveModalOpen(false)
      setTemplateName('')
      setTemplateDesc('')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {/* Logo */}
        <div className="toolbar-logo">
          📊 模板编辑器
        </div>

        {/* 分隔线 */}
        <div className="toolbar-divider" />

        {/* 格式按钮 */}
        <Space size={2}>
          {formatButtons.map((btn) => (
            <Button
              key={btn.key}
              type="text"
              icon={btn.icon}
              title={btn.title}
              className="toolbar-btn"
            />
          ))}
        </Space>

        <div className="toolbar-divider" />

        {/* 样式选择 */}
        <Select
          defaultValue="body"
          size="small"
          style={{ width: 100 }}
          options={[
            { value: 'body', label: '正文' },
            { value: 'h1', label: '标题 1' },
            { value: 'h2', label: '标题 2' },
            { value: 'h3', label: '标题 3' },
          ]}
        />

        <Select
          defaultValue="default"
          size="small"
          style={{ width: 100 }}
          options={[
            { value: 'default', label: '默认字体' },
            { value: 'songti', label: '宋体' },
            { value: 'heiti', label: '黑体' },
            { value: 'kaiti', label: '楷体' },
          ]}
        />
      </div>

      <div className="toolbar-right">
        {/* 文件菜单 */}
        <Dropdown menu={{ items: fileMenuItems }} trigger={['click']}>
          <Button type="text">文件</Button>
        </Dropdown>

        {/* 预览按钮 */}
        <Button type="default" icon={<EyeOutlined />}>
          预览
        </Button>

        {/* 保存按钮 */}
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => setSaveModalOpen(true)}
        >
          保存模板
        </Button>
      </div>

      {/* 保存弹窗 */}
      <Modal
        title="保存模板"
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <div className="save-modal-content">
          <div className="save-modal-field">
            <label>模板名称</label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="请输入模板名称"
            />
          </div>
          <div className="save-modal-field">
            <label>模板描述</label>
            <Input.TextArea
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="请输入模板描述（可选）"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Toolbar