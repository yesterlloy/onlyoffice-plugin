import { Empty } from 'antd'
import './DocTag.css'

/**
 * DocTag 组件 - 已废弃
 *
 * 该组件曾用于 mock 模式下的文档标签渲染。
 * 现在统一使用 OnlyOffice 编辑器，此组件不再使用。
 *
 * @deprecated
 */
const DocTag = () => {
  return (
    <Empty
      description="此组件已废弃"
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  )
}

export default DocTag