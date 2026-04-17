import { Button, message } from 'antd'
import { EyeOutlined, SaveOutlined } from '@ant-design/icons'
import './index.css'

// 声明全局变量以避免 TS 错误
declare global {
  interface Window {
    docEditor?: any
  }
}

const Toolbar = () => {
  const handleSave = () => {
    try {
      if (window.docEditor) {
        window.docEditor.serviceCommand('forceSave');
        message.info('正在请求保存文档...');
      } else {
        message.error('编辑器尚未就绪，无法保存');
      }
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存请求失败');
    }
  }

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

        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  )
}

export default Toolbar
