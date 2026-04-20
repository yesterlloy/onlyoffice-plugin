import { useEffect, useState } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/api'
import type { TemplateFile } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import './index.css'

const TemplateManagementPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<TemplateFile[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateFile | null>(null)
  const [form] = Form.useForm()

  // 加载模板列表
  const fetchTemplates = async (pageNum = page) => {
    setLoading(true)
    try {
      const result = await getTemplates({ page: pageNum, size, status: undefined })
      setDataSource(result.records)
      setTotal(result.total)
      setPage(pageNum)
    } catch {
      message.error('加载模板列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // 打开编辑器
  const handleConfigure = (record: TemplateFile) => {
    navigate(`/editor?templateId=${record.id}`)
  }

  // 打开新建/编辑弹窗
  const handleAdd = () => {
    setEditingTemplate(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: TemplateFile) => {
    setEditingTemplate(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    })
    setModalOpen(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: values.name,
          description: values.description,
        })
        message.success('模板更新成功')
      } else {
        await createTemplate({
          name: values.name,
          description: values.description,
          content: '',
          createdBy: 'admin',
        })
        message.success('模板创建成功')
      }
      setModalOpen(false)
      fetchTemplates()
    } catch {
      // 错误已在拦截器处理
    }
  }

  // 删除模板
  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id)
      message.success('模板删除成功')
      fetchTemplates()
    } catch {
      // 错误已在拦截器处理
    }
  }

  const columns: ColumnsType<TemplateFile> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (size?: number) => {
        if (!size) return '-'
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
        return `${(size / 1024 / 1024).toFixed(1)} MB`
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
    },
    // {
    //   title: '状态',
    //   dataIndex: 'status',
    //   key: 'status',
    //   width: 80,
    //   align: 'center',
    //   render: (status: number) => (
    //     <Tag color={status === 1 ? 'green' : 'red'}>
    //       {status === 1 ? '启用' : '禁用'}
    //     </Tag>
    //   ),
    // },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: TemplateFile) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleConfigure(record)}
          >
            配置
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该模板？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="template-management-page">
      <div className="page-header">
        <h2>模板管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建模板
        </Button>
      </div>

      <Table<TemplateFile>
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: false,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={(pagination) => {
          if (pagination.current && pagination.current !== page) {
            fetchTemplates(pagination.current)
          }
        }}
      />

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item name="description" label="模板描述">
            <Input.TextArea placeholder="请输入模板描述（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TemplateManagementPage
