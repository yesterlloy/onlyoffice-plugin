import { useEffect, useRef } from 'react'
import { message } from 'antd'
import config, { getCallbackUrl } from '@/config'
import { onlyOfficeBridge, MESSAGE_TYPES } from '@/utils/onlyoffice-bridge'
import type { EditorConfigVO } from '@/types'
import './index.css'

interface OnlyOfficeEditorProps {
  documentId: string
  documentUrl: string
  documentKey: string
  documentTitle: string
  configVO?: EditorConfigVO | null // 新增
  onError?: (error: Error) => void
}

/**
 * OnlyOffice 编辑器组件
 * 纯原生 JS 加载 DocsAPI 逻辑，不依赖 @onlyoffice/document-editor-react
 */
const OnlyOfficeEditor = ({
  documentId,
  documentUrl,
  documentKey,
  documentTitle,
  configVO,
  onError,
}: OnlyOfficeEditorProps) => {
  const editorRef = useRef<any>(null)

  // 文档就绪事件
  const onDocumentReady = () => {
    console.log('[OnlyOfficeEditor] Document ready event received')

    // 获取 DocEditor 实例 - 通过 DocsAPI.instances
    try {
      const instances = (window as any).DocsAPI?.DocEditor?.instances
      if (instances) {
        const keys = Object.keys(instances)
        if (keys.length > 0) {
          editorRef.current = instances[keys[0]]
          ;(window as any).docEditor = editorRef.current
          console.log('[OnlyOfficeEditor] ✅ DocEditor instance saved:', editorRef.current)
        }
      }
    } catch (e) {
      console.warn('[OnlyOfficeEditor] Could not get DocEditor instance:', e)
    }

    // 初始化桥接 - postMessage 到 iframe
    onlyOfficeBridge.init('onlyoffice-editor-wrapper')
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
    const handleEditorReady = () => {
      console.log('[OnlyOfficeEditor] ✅ Plugin ready message received')
    }

    // 编辑器就绪
    onlyOfficeBridge.on(MESSAGE_TYPES.EDITOR_READY, handleEditorReady)

    return () => {
      console.log('[OnlyOfficeEditor] 🗑️ Component unmounting, cleaning up bridge listeners')
      onlyOfficeBridge.off(MESSAGE_TYPES.EDITOR_READY, handleEditorReady)
      ;(window as any).docEditor = null
    }
  }, [])

  // 合并编辑器配置
  const editorConfig = configVO ? {
    // 后端返回的配置已经包含了 document, documentType, editorConfig 等
    ...configVO.editorConfig,
    // JWT Token 需要在最外层
    token: configVO.token,
    // 覆盖/合并具体的 editorConfig 设置
    editorConfig: {
      ...(configVO.editorConfig.editorConfig as any),
      // 强制使用前端定义的插件配置
      plugins: {
        autostart: ['asc.template-doc-agent'],
        pluginsData: [config.pluginUrl],
      },
      // 使用后端返回的回调地址
      callbackUrl: configVO.callbackUrl,
    },
    // 强制使用前端定义的事件处理
    events: {
      onDocumentReady,
      onInfo,
      onError: onErrorEvent,
    },
  } : {
    // 回退到原来的硬编码逻辑 (可选，但为了向后兼容)
    document: {
      fileType: 'docx',
      key: documentKey,
      title: documentTitle,
      url: documentUrl,
      permissions: {
        edit: true,
        download: true,
        print: true,
        save: true,
      },
    },
    documentType: 'word',
    editorConfig: {
      mode: 'edit',
      lang: 'zh-CN',
      user: {
        id: 'uid-1',
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
          url: '/example',
        },
      },
      callbackUrl: getCallbackUrl(documentId),
    },
    token: config.token,
    events: {
      onDocumentReady: onDocumentReady,
      onInfo: onInfo,
      onError: onErrorEvent,
    },
  }

  // 动态加载 OnlyOffice 脚本并初始化
  useEffect(() => {
    let script: HTMLScriptElement | null = null
    let isDestroyed = false

    const initEditor = () => {
      if (isDestroyed) return
      if (!(window as any).DocsAPI) {
        onLoadComponentError(-3, 'DocsAPI 未定义')
        return
      }
      try {
        // 销毁已有实例以防冲突
        if (editorRef.current) {
          editorRef.current.destroyEditor()
          editorRef.current = null
        }

        // 清空容器重新创建
        const container = document.getElementById('onlyoffice-editor-iframe')
        if (!container) return

        console.log('[OnlyOfficeEditor] 🚀 Creating DocEditor with config:', editorConfig)
        const docEditor = new (window as any).DocsAPI.DocEditor('onlyoffice-editor-iframe', editorConfig)
        editorRef.current = docEditor
        ;(window as any).docEditor = docEditor
      } catch (err: any) {
        console.error('[OnlyOfficeEditor] DocEditor init failed:', err)
        onErrorEvent({ data: { error: err.message || '初始化编辑器失败' } })
      }
    }

    const loadScriptAndInit = () => {
      if ((window as any).DocsAPI) {
        initEditor()
        return
      }

      const scriptUrl = `${config.documentServerUrl}/web-apps/apps/api/documents/api.js`
      // 检测是否已有 script 节点
      const existingScript = document.querySelector(`script[src="${scriptUrl}"]`) as HTMLScriptElement
      if (existingScript) {
        const handleScriptLoad = () => {
          initEditor()
          existingScript.removeEventListener('load', handleScriptLoad)
        }
        existingScript.addEventListener('load', handleScriptLoad)
        return
      }

      script = document.createElement('script')
      script.src = scriptUrl
      script.async = true
      script.onload = () => {
        initEditor()
      }
      script.onerror = () => {
        onLoadComponentError(-2, 'DocumentServer 脚本加载失败')
      }
      document.head.appendChild(script)
    }

    loadScriptAndInit()

    return () => {
      isDestroyed = true
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor()
        } catch (e) {
          console.warn('[OnlyOfficeEditor] Error destroying editor during unmount:', e)
        }
        editorRef.current = null
        ;(window as any).docEditor = null
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [documentId, documentUrl, documentKey, documentTitle, configVO])

  return (
    <div className="onlyoffice-editor-wrapper" id="onlyoffice-editor-wrapper" >
      <div
        id="onlyoffice-editor-iframe"
        className="onlyoffice-editor-container"
      />
    </div>
  )
}

export default OnlyOfficeEditor