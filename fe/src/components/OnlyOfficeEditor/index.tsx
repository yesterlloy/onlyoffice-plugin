import { useEffect, useRef, useState, useCallback } from 'react'
import { Spin, message } from 'antd'
import config, { getDocServerApiUrl, getCallbackUrl } from '@/config'
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
 * 嵌入 OnlyOffice DocumentServer 编辑器
 */
const OnlyOfficeEditor = ({
  documentUrl,
  documentKey,
  documentTitle,
  onReady,
  onError,
}: OnlyOfficeEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初始化编辑器
  const initEditor = useCallback(() => {
    console.log('[OnlyOfficeEditor] Initializing editor with config:', {
      documentUrl,
      documentKey,
      documentTitle,
    })
    if (!containerRef.current || !(window as any).DocsAPI) {
      setError('OnlyOffice API 未加载')
      setLoading(false)
      return
    }

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
      height: '100%',
      width: '100%',
      type: 'desktop',
      events: {
        onDocumentReady: () => {
          console.log('[OnlyOfficeEditor] Document ready event received')
          setLoading(false)
          console.log('[OnlyOffice] Document ready')
          // 初始化桥接
          onlyOfficeBridge.init('onlyoffice-editor-container')
          onReady?.()
        },
        onInfo: (event: any) => {
          console.log('[OnlyOfficeEditor] Info event received:', event)
        },
        onError: (event: any) => {
          console.error('[OnlyOfficeEditor] Error event received:', event)
          const errorMsg = event?.data?.error || '编辑器加载失败'
          setError(errorMsg)
          setLoading(false)
          onError?.(new Error(errorMsg))
          console.error('[OnlyOffice] Error:', errorMsg)
        },
      },
    }

    try {
      editorRef.current = new (window as any).DocsAPI.DocEditor(containerRef.current, editorConfig)
    } catch (err) {
      const errorMsg = '编辑器初始化失败'
      setError(errorMsg)
      setLoading(false)
      onError?.(new Error(errorMsg))
      console.error('[OnlyOffice] Init error:', err)
    }
    console.log('[OnlyOfficeEditor] Editor initialization triggered', editorRef)
  }, [documentUrl, documentKey, documentTitle, onReady, onError])

  // 加载 OnlyOffice API 脚本
  useEffect(() => {
    const script = document.createElement('script')
    script.src = getDocServerApiUrl()
    script.onload = initEditor
    script.onerror = () => {
      setError('OnlyOffice API 脚本加载失败')
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      // 销毁编辑器和桥接
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor()
        } catch (e) {
          console.warn('[OnlyOffice] Destroy error:', e)
        }
      }
      onlyOfficeBridge.destroy()
      // 移除脚本（可选）
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [initEditor])

  // 监听插件消息
  useEffect(() => {
    // 编辑器就绪
    onlyOfficeBridge.on(MESSAGE_TYPES.EDITOR_READY, () => {
      message.success('编辑器已就绪')
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
  }, [])

  return (
    <div className="onlyoffice-editor-wrapper">
      {loading && (
        <div className="onlyoffice-loading">
          <Spin size="large" tip="正在加载编辑器..." />
        </div>
      )}
      {error && (
        <div className="onlyoffice-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        id="onlyoffice-editor-container"
        className="onlyoffice-editor-container"
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  )
}

export default OnlyOfficeEditor