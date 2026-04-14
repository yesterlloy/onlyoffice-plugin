import { useEffect } from 'react'
import { message } from 'antd'
import { DocumentEditor } from '@onlyoffice/document-editor-react'
import config, { getCallbackUrl } from '@/config'
import { onlyOfficeBridge, MESSAGE_TYPES } from '@/utils/onlyoffice-bridge'
import './index.css'

interface OnlyOfficeEditorProps {
  documentUrl: string
  documentKey: string
  documentTitle: string
  onReady?: () => void
  onError?: (error: Error) => void
}

/**
 * OnlyOffice 编辑器组件
 * 使用 @onlyoffice/document-editor-react 官方组件
 */
const OnlyOfficeEditor = ({
  documentUrl,
  documentKey,
  documentTitle,
  onReady,
  onError,
}: OnlyOfficeEditorProps) => {

  // 文档就绪事件
  const onDocumentReady = () => {
    console.log('[OnlyOfficeEditor] Document ready event received')
    // 初始化桥接
    onlyOfficeBridge.init('onlyoffice-editor-container')
    onReady?.()
  }

  // 信息事件
  const onInfo = (event: any) => {
    console.log('[OnlyOfficeEditor] Info event received:', event)
  }

  // 错误事件
  const onErrorEvent = (event: any) => {
    console.error('[OnlyOfficeEditor] Error event received:', event)
    const errorMsg = event?.data?.error || '编辑器加载失败'
    onError?.(new Error(errorMsg))
    message.error(errorMsg)
  }

  // 组件加载错误
  const onLoadComponentError = (errorCode: number, errorDescription: string) => {
    console.error('[OnlyOfficeEditor] Component load error:', errorCode, errorDescription)
    let errorMsg = ''
    switch (errorCode) {
      case -1:
        errorMsg = `未知错误: ${errorDescription}`
        break
      case -2:
        errorMsg = 'DocumentServer 加载失败，请检查服务是否正常运行'
        break
      case -3:
        errorMsg = 'DocsAPI 未定义，请检查 DocumentServer 配置'
        break
      default:
        errorMsg = errorDescription
    }
    onError?.(new Error(errorMsg))
    message.error(errorMsg)
  }

  // 监听插件消息
  useEffect(() => {
    // 编辑器就绪
    onlyOfficeBridge.on(MESSAGE_TYPES.EDITOR_READY, () => {
      message.success('插件已就绪')
    })

    // 标签点击
    onlyOfficeBridge.on(MESSAGE_TYPES.TAG_CLICKED, (data) => {
      console.log('[Editor] Tag clicked:', data)
      // TODO: 触发配置面板
    })

    // 错误处理
    onlyOfficeBridge.on(MESSAGE_TYPES.INSERT_ERROR, (data) => {
      message.error(`插入失败: ${data.error}`)
    })
    onlyOfficeBridge.on(MESSAGE_TYPES.REMOVE_ERROR, (data) => {
      message.error(`删除失败: ${data.error}`)
    })
    onlyOfficeBridge.on(MESSAGE_TYPES.UPDATE_ERROR, (data) => {
      message.error(`更新失败: ${data.error}`)
    })

    return () => {
      onlyOfficeBridge.destroy()
    }
  }, [])

  // 编辑器配置
  const editorConfig = {
    document: {
      fileType: 'docx',
      key: documentKey,
      title: documentTitle,
      url: documentUrl,
      permissions: {
        edit: true,
        download: true,
        print: true,
      },
    },
    documentType: 'word',
    token: config.token,
    editorConfig: {
      mode: 'edit',
      lang: 'zh-CN',
      user: {
        id: 'user_001',
        name: '模板编辑员',
      },
      plugins: {
        autostart: ['asc.template-doc-agent'],
        pluginsData: [config.pluginUrl],
      },
      customization: {
        chat: false,
        compactHeader: true,
        feedback: false,
        forcesave: true,
        goback: {
          url: '/templates',
        },
      },
      callbackUrl: getCallbackUrl(),
    },
    events: {
      onDocumentReady: onDocumentReady,
      onInfo: onInfo,
      onError: onErrorEvent,
    },
  }
  console.log('editorConfig=', editorConfig)

  return (
    <div className="onlyoffice-editor-wrapper">
      <DocumentEditor
        id="onlyoffice-editor-container"
        documentServerUrl={config.documentServerUrl}
        config={editorConfig}
        token={config.token}
        onLoadComponentError={onLoadComponentError}
      />
    </div>
  )
}

export default OnlyOfficeEditor