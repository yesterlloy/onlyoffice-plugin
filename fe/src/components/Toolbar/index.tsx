import { Button } from 'antd'
import { EyeOutlined, SaveOutlined } from '@ant-design/icons'
import './index.css'

const Toolbar = () => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-logo">
          模板编辑器
        </div>
      </div>

      <div className="toolbar-right">
        <Button type="default" icon={<EyeOutlined />}>
          预览
        </Button>

        <Button type="primary" icon={<SaveOutlined />}>
          保存
        </Button>
      </div>
    </div>
  )
}

export default Toolbar
