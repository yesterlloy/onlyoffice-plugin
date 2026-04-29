import { Button, message } from 'antd'
import { EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { MESSAGE_TYPES, onlyOfficeBridge } from '../../utils/onlyoffice-bridge'
import './index.css'

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
        <Button 
          type="default" 
          onClick={() => onlyOfficeBridge.send(MESSAGE_TYPES.SET_LOOP_REGION, { id: 1})}
        >
          设置为循环区域
        </Button>

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
