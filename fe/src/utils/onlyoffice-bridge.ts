/**
 * OnlyOffice 编辑器桥接通信工具
 * 负责前端与 OnlyOffice 插件之间的通信
 *
 * 通信方式：postMessage 发送到 iframe
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
  private messageHandlers: Map<string, MessageCallback[]> = new Map()
  private initialized = false
  private messageListener: ((event: MessageEvent) => void) | null = null
  private messageId = 0
  private broadcastChannel: BroadcastChannel | null = null
  private editorFrame: HTMLIFrameElement | null = null

  /**
   * 初始化桥接
   */
  init(containerId: string = 'onlyoffice-editor-wrapper'): boolean {
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
        console.log(`${LOG_PREFIX} ✅ Editor iframe connected`)
        this.initialized = true
        this.emit('bridgeReady', { connected: true })
      } else {
        console.log(`${LOG_PREFIX} ⏳ Waiting for iframe...`)
        setTimeout(checkFrame, 500)
      }
    }

    checkFrame()

    // BroadcastChannel 用于接收插件响应
    try {
      this.broadcastChannel = new BroadcastChannel('onlyoffice-plugin-channel')
      this.broadcastChannel.onmessage = (event) => {
        console.log(`${LOG_PREFIX} 📡 BroadcastChannel response:`, event.data)
        this.handleBroadcastMessage(event.data)
      }
      console.log(`${LOG_PREFIX} ✅ BroadcastChannel initialized`)
    } catch (e) {
      console.warn(`${LOG_PREFIX} ⚠️ BroadcastChannel not available:`, e)
    }

    // 监听 postMessage（接收插件响应）
    this.messageListener = this.handleMessage.bind(this)
    window.addEventListener('message', this.messageListener)
    console.log(`${LOG_PREFIX} 📡 postMessage listener registered`)

    return true
  }

  /**
   * 处理 BroadcastChannel 消息（插件响应）
   */
  private handleBroadcastMessage(msg: PluginMessage): void {
    const { type, data } = msg
    if (!type) return
    console.log(`${LOG_PREFIX} 📥 BROADCAST RESPONSE`, { type, data })
    this.dispatchToHandlers(type, data)
  }

  /**
   * 发送消息给插件 - postMessage 到 iframe
   */
  send(type: string, data?: any): Promise<any> {
    this.messageId++
    const msgId = this.messageId
    const startTime = Date.now()

    console.log(`${LOG_PREFIX} 📤 [${msgId}] SEND`, { type, data })

    return new Promise((resolve, reject) => {
      if (!this.editorFrame?.contentWindow) {
        console.error(`${LOG_PREFIX} ❌ [${msgId}] Editor iframe not available`)
        reject(new Error('Editor iframe not available'))
        return
      }

      const callbackType = this.getResponseType(type)
      const timeout = setTimeout(() => {
        console.error(`${LOG_PREFIX} ⏰ [${msgId}] TIMEOUT`)
        this.off(callbackType, callback)
        reject(new Error(`Message timeout: ${type}`))
      }, 10000)

      const callback = (responseData: any) => {
        const elapsed = Date.now() - startTime
        console.log(`${LOG_PREFIX} 📥 [${msgId}] RESPONSE`, { callbackType, responseData, elapsed: `${elapsed}ms` })
        clearTimeout(timeout)
        this.off(callbackType, callback)
        resolve(responseData)
      }

      this.on(callbackType, callback)

      // 构建消息
      const message: PluginMessage = { type, data }

      // 发送 postMessage 到 iframe
      console.log(`${LOG_PREFIX} 📤 [${msgId}] postMessage to iframe`)
      this.editorFrame.contentWindow.postMessage(message, '*')
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
      }
    }
  }

  /**
   * 触发内部事件
   */
  private emit(type: string, data?: any): void {
    this.dispatchToHandlers(type, data)
  }

  /**
   * 分发消息到处理器
   */
  private dispatchToHandlers(type: string, data?: any): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
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
    return responseMap[requestType] || `${requestType}Done`
  }

  /**
   * 处理 postMessage 响应
   */
  private handleMessage(event: MessageEvent): void {
    const msg = event.data
    if (!msg || typeof msg !== 'object') return

    // 忽略来自自身的消息
    if (event.source === window) return

    const { type, data } = msg
    if (!type) return

    console.log(`${LOG_PREFIX} 📥 POSTMESSAGE RESPONSE`, { type, data, origin: event.origin })
    this.dispatchToHandlers(type, data)
  }

  /**
   * 销毁桥接
   */
  destroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener)
      this.messageListener = null
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
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
    return this.initialized
  }

  /**
   * 等待桥接就绪
   */
  waitForReady(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.initialized) {
        resolve(true)
        return
      }

      const timer = setTimeout(() => {
        this.off('bridgeReady', handler)
        reject(new Error('Wait timeout'))
      }, timeout)

      const handler = () => {
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