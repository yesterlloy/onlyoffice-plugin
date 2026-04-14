import { Empty } from 'antd'
import './index.css'

/**
 * DocEditor 组件 - 已废弃
 *
 * 该组件曾用于 mock 模式下的文档编辑区。
 * 现在统一使用 OnlyOffice 编辑器，此组件不再使用。
 *
 * @deprecated 请使用 OnlyOfficeEditor 组件
 */
const DocEditor = () => {
  return (
    <div className="doc-editor">
      <div className="doc-paper">
        <Empty
          description="此组件已废弃，请使用 OnlyOffice 编辑器"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    </div>
  )
}

export default DocEditor