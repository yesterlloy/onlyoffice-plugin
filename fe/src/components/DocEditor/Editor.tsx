import { Typography, Empty, message } from 'antd'
import { useEditorStore } from '@/stores'
import type { DocBlock, DocTagItem } from '@/types'
import DocTag from './DocTag'
import './index.css'
import { useDroppable } from '@dnd-kit/core'

const { Title, Paragraph } = Typography

const DocEditor = () => {
  const {
    docBlocks,
    removeTagFromBlock,
    setSelectedTagUid,
    setConfigPanelVisible,
    setCurrentEditingTag,
  } = useEditorStore()

  // 点击标签
  const handleTagClick = (tag: DocTagItem) => {
    setSelectedTagUid(tag.uid)
    setCurrentEditingTag(tag)
    setConfigPanelVisible(true)
  }

  // 删除标签
  const handleTagDelete = (tagUid: string) => {
    removeTagFromBlock(tagUid)
  }

  // 配置标签
  const handleTagConfig = (tag: DocTagItem) => {
    setCurrentEditingTag(tag)
    setConfigPanelVisible(true)
  }

  return (
    <div className="doc-editor">
      <div className="doc-paper">
        {docBlocks.map((block) => (
          <DocBlockRender
            key={block.uid}
            block={block}
            onTagClick={handleTagClick}
            onTagDelete={handleTagDelete}
            onTagConfig={handleTagConfig}
          />
        ))}

        {/* 底部拖放区域 */}
        <div className="doc-block doc-block-empty">
          <Empty description="拖拽指标到此处添加新段落" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      </div>
    </div>
  )
}

// 文档块渲染组件
interface DocBlockRenderProps {
  block: DocBlock
  onTagClick: (tag: DocTagItem) => void
  onTagDelete: (tagUid: string) => void
  onTagConfig: (tag: DocTagItem) => void
}

const DocBlockRender = ({ block, onTagClick, onTagDelete, onTagConfig }: DocBlockRenderProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `block-${block.uid}`,
  })

  if (block.type === 'heading') {
    const level = block.level || 2
    const fontSize = level === 1 ? 22 : level === 2 ? 18 : 15

    return (
      <div
        ref={setNodeRef}
        className={`doc-block doc-heading ${isOver ? 'doc-block-over' : ''}`}
      >
        <Title
          level={level as any}
          style={{
            fontSize,
            marginBottom: level <= 2 ? 12 : 8,
            borderBottom: level <= 2 ? '2px solid #ff4d4f' : 'none',
            paddingBottom: level <= 2 ? 6 : 0,
            textAlign: level === 1 ? 'center' : 'left',
          }}
        >
          {block.content}
        </Title>
        {block.items.length > 0 && (
          <div className="doc-tags">
            {block.items.map((item) => (
              <DocTag
                key={item.uid}
                item={item}
                onClick={() => onTagClick(item)}
                onDelete={() => onTagDelete(item.uid)}
                onConfig={() => onTagConfig(item)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`doc-block doc-paragraph ${isOver ? 'doc-block-over' : ''}`}
    >
      {block.items.length > 0 ? (
        <div className="doc-tags">
          {block.items.map((item) => (
            <DocTag
              key={item.uid}
              item={item}
              onClick={() => onTagClick(item)}
              onDelete={() => onTagDelete(item.uid)}
              onConfig={() => onTagConfig(item)}
            />
          ))}
        </div>
      ) : (
        <Paragraph type="secondary" style={{ minHeight: 28 }}>
          {block.content || '\u00A0'}
        </Paragraph>
      )}
    </div>
  )
}

export default DocEditor