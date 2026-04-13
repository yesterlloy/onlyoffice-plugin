/**
 * OnlyOffice 编辑器桥接通信工具
 * 负责前端与 OnlyOffice 插件之间的 postMessage 通信
 */

interface PluginMessage {
  type: string
  data?: any
}

interface MessageCallback {
  (data: any): void
}

// 调试日志前缀
const LOG_PREFIX = '[Bridge]'

class OnlyOfficeBridge {
  private editorFrame: HTMLIFrameElement | null = null
  private messageHandlers: Map<string, MessageCallback[]> = new Map()
  private initialized = false
  private messageListener: ((event: MessageEvent) => void) | null = null
  private messageId = 0 // 用于追踪消息

  /**
   * 初始化桥接
   * @param containerId 编辑器容器元素 ID
   */
  init(containerId: string = 'onlyoffice-editor-container'): boolean {
    console.log(`${LOG_PREFIX} 🚀 Initializing bridge, containerId:`, containerId)

    // 获取 OnlyOffice iframe
    const findFrame = (): HTMLIFrameElement | null => {
      const container = document.getElementById(containerId)
      if (container) {
        return container.querySelector('iframe') as HTMLIFrameElement
      }
      return null
    }

    // 等待 iframe 加载
    const checkFrame = (): void => {
      this.editorFrame = findFrame()
      if (this.editorFrame) {
        this.initialized = true
        console.log(`${LOG_PREFIX} ✅ Editor frame connected`, {
          iframe: this.editorFrame,
          contentWindow: this.editorFrame.contentWindow ? 'available' : 'unavailable'
        })
        // 触发就绪事件
        this.emit('bridgeReady', { connected: true })
      } else {
        console.log(`${LOG_PREFIX} ⏳ Waiting for iframe...`)
        setTimeout(checkFrame, 500)
      }
    }

    checkFrame()

    // 监听插件消息
    this.messageListener = this.handleMessage.bind(this)
    window.addEventListener('message', this.messageListener)
    console.log(`${LOG_PREFIX} 📡 Message listener registered`)

    return true
  }

  /**
   * 发送消息给插件
   * @param type 消息类型
   * @param data 消息数据
   * @returns Promise 响应结果
   */
  send(type: string, data?: any): Promise<any> {
    this.messageId++
    const msgId = this.messageId
    const startTime = Date.now()

    console.log(`${LOG_PREFIX} 📤 [${msgId}] SEND START`, {
      type,
      data: JSON.stringify(data, null, 2),
      timestamp: new Date().toISOString()
    })

    return new Promise((resolve, reject) => {
      if (!this.editorFrame || !this.editorFrame.contentWindow) {
        console.error(`${LOG_PREFIX} ❌ [${msgId}] Editor frame not available`)
        reject(new Error(`${LOG_PREFIX} Editor frame not available`))
        return
      }

      // 注册一次性回调
      const callbackType = this.getResponseType(type)
      const timeout = setTimeout(() => {
        console.error(`${LOG_PREFIX} ⏰ [${msgId}] TIMEOUT after 10s`, {
          type,
          callbackType
        })
        this.off(callbackType, callback)
        reject(new Error(`${LOG_PREFIX} Message timeout: ${type}`))
      }, 10000)

      const callback = (responseData: any) => {
        const elapsed = Date.now() - startTime
        console.log(`${LOG_PREFIX} 📥 [${msgId}] RECEIVE RESPONSE`, {
          callbackType,
          data: responseData,
          elapsed: `${elapsed}ms`
        })
        clearTimeout(timeout)
        this.off(callbackType, callback)
        resolve(responseData)
      }

      this.on(callbackType, callback)

      // 发送消息
      const message: PluginMessage = { type, data }
      const messageJson = JSON.stringify(message)

      console.log(`${LOG_PREFIX} 📤 [${msgId}] POSTING TO IFRAME`, {
        targetOrigin: '*',
        messageLength: messageJson.length,
        messagePreview: messageJson.substring(0, 200) + (messageJson.length > 200 ? '...' : '')
      })

      this.editorFrame.contentWindow.postMessage(message, '*')

      console.log(`${LOG_PREFIX} 📤 [${msgId}] SEND COMPLETE`, {
        type,
        waitingFor: callbackType
      })
    })
  }

  /**
   * 监听消息
   */
  on(type: string, callback: MessageCallback): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(callback)
    console.log(`${LOG_PREFIX} 📻 Registered listener for:`, type)
  }

  /**
   * 取消监听
   */
  off(type: string, callback: MessageCallback): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(callback)
      if (index > -1) {
        handlers.splice(index, 1)
        console.log(`${LOG_PREFIX} 📻 Removed listener for:`, type)
      }
    }
  }

  /**
   * 触发内部事件
   */
  private emit(type: string, data?: any): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      console.log(`${LOG_PREFIX} 🔔 Emitting internal event:`, type, data)
      handlers.forEach(callback => callback(data))
    }
  }

  /**
   * 获取响应消息类型
   */
  private getResponseType(requestType: string): string {
    const responseMap: Record<string, string> = {
      insertIndicator: 'insertDone',
      removeIndicator: 'removeDone',
      updateParams: 'updateDone',
      getDocTags: 'allTags',
      convertToRaw: 'convertDone',
      convertToVisual: 'convertDone',
    }
    const responseType = responseMap[requestType] || `${requestType}Done`
    console.log(`${LOG_PREFIX} 🔄 Response mapping:`, requestType, '→', responseType)
    return responseType
  }

  /**
   * 处理接收的消息
   */
  private handleMessage(event: MessageEvent): void {
    // 详细的消息来源信息
    console.log(`${LOG_PREFIX} 📨 RAW MESSAGE RECEIVED`, {
      origin: event.origin,
      source: event.source === window ? 'self' : (event.source === this.editorFrame?.contentWindow ? 'iframe' : 'unknown'),
      dataPreview: JSON.stringify(event.data).substring(0, 300)
    })

    // 安全检查（生产环境应验证 origin）
    // if (event.origin !== 'https://your-onlyoffice-domain') return

    const { type, data } = event.data || {}
    if (!type) {
      console.log(`${LOG_PREFIX} 📨 Message has no type, skipping`)
      return
    }

    console.log(`${LOG_PREFIX} 📥 PARSED MESSAGE`, {
      type,
      data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
      timestamp: new Date().toISOString()
    })

    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      console.log(`${LOG_PREFIX} 🔔 Calling ${handlers.length} handlers for:`, type)
      handlers.forEach(callback => callback(data))
    } else {
      console.warn(`${LOG_PREFIX} ⚠️ No handlers registered for:`, type)
    }
  }

  /**
   * 销毁桥接
   */
  destroy(): void {
    console.log(`${LOG_PREFIX} 🗑️ Destroying bridge`)
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener)
      this.messageListener = null
    }
    this.messageHandlers.clear()
    this.initialized = false
    this.editorFrame = null
    console.log(`${LOG_PREFIX} 🗑️ Bridge destroyed`)
  }

  /**
   * 获取初始化状态
   */
  isInitialized(): boolean {
    console.log(`${LOG_PREFIX} 📊 isInitialized:`, this.initialized)
    return this.initialized
  }

  /**
   * 等待桥接就绪
   */
  waitForReady(timeout: number = 30000): Promise<boolean> {
    console.log(`${LOG_PREFIX} ⏳ Waiting for ready, timeout:`, timeout)
    return new Promise((resolve, reject) => {
      if (this.initialized) {
        console.log(`${LOG_PREFIX} ✅ Already initialized`)
        resolve(true)
        return
      }

      const timer = setTimeout(() => {
        console.error(`${LOG_PREFIX} ⏰ Wait timeout`)
        this.off('bridgeReady', handler)
        reject(new Error(`${LOG_PREFIX} Wait timeout`))
      }, timeout)

      const handler = () => {
        console.log(`${LOG_PREFIX} ✅ Bridge ready`)
        clearTimeout(timer)
        resolve(true)
      }

      this.on('bridgeReady', handler)
    })
  }
}

// 单例导出
export const onlyOfficeBridge = new OnlyOfficeBridge()

// 消息类型常量
export const MESSAGE_TYPES = {
  // 前端 → 插件
  INSERT_INDICATOR: 'insertIndicator',
  REMOVE_INDICATOR: 'removeIndicator',
  UPDATE_PARAMS: 'updateParams',
  GET_DOC_TAGS: 'getDocTags',
  CONVERT_TO_RAW: 'convertToRaw',
  CONVERT_TO_VISUAL: 'convertToVisual',

  // 插件 → 前端
  INSERT_DONE: 'insertDone',
  REMOVE_DONE: 'removeDone',
  UPDATE_DONE: 'updateDone',
  ALL_TAGS: 'allTags',
  CONVERT_DONE: 'convertDone',
  TAG_CLICKED: 'tagClicked',
  EDITOR_READY: 'editorReady',
  BRIDGE_READY: 'bridgeReady',

  // 错误
  INSERT_ERROR: 'insertError',
  REMOVE_ERROR: 'removeError',
  UPDATE_ERROR: 'updateError',
}