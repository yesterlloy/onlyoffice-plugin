/**
 * 应用配置
 */

interface AppConfig {
  /** OnlyOffice DocumentServer 地址 */
  documentServerUrl: string
  /** 后端 API 基础地址 */
  apiBaseUrl: string
  /** 插件配置文件 URL */
  pluginUrl: string
  /** 是否为开发模式 */
  isDev: boolean
  /** 是否使用 Mock 数据（前端联调模式） */
  useMock: boolean
  token?: string // 可选的认证 token
}

let ip = '192.168.1.223'

// 开发环境配置
const devConfig: AppConfig = {
  documentServerUrl: `http://${ip}:8888/`,
  apiBaseUrl: `http://${ip}:8888/example`,
  pluginUrl: `http://${ip}:8888/sdkjs-plugins/template-doc-agent/config.json`,
  token: 'io2SNULV1lLc3gbWsqbDF1KtRD7SoQwJ',
  isDev: true,
  useMock: true, // 开发模式默认使用 Mock 数据
}

// 生产环境配置
const prodConfig: AppConfig = {
  documentServerUrl: 'https://doc.your-domain.com',
  apiBaseUrl: 'https://api.your-domain.com/template-editor',
  pluginUrl: 'https://cdn.your-domain.com/plugins/template-doc-agent/config.json',
  token: 'io2SNULV1lLc3gbWsqbDF1KtRD7SoQwJ',
  isDev: false,
  useMock: false,
}

// 根据环境选择配置
const config = import.meta.env.DEV ? devConfig : prodConfig

export default config

// 导出配置项（便于单独使用）
export const {
  documentServerUrl,
  apiBaseUrl,
  pluginUrl,
  isDev,
  useMock,
} = config

/**
 * 获取 API 完整地址
 */
export function getApiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith('/') ? path : '/' + path}`
}

/**
 * 获取 DocumentServer API 脚本地址
 */
export function getDocServerApiUrl(): string {
  return `${documentServerUrl}/web-apps/apps/api/documents/api.js`
}

/**
 * 获取模板回调地址
 */
export function getCallbackUrl(documentId: string): string {
  return getApiUrl(`/api/templates/${documentId}/callback`)
}

/**
 * 更新配置（用于运行时动态修改，如从后端获取配置）
 */
export function updateConfig(newConfig: Partial<AppConfig>): void {
  Object.assign(config, newConfig)
}

/**
 * 设置 Mock 模式
 */
export function setMockMode(enabled: boolean): void {
  config.useMock = enabled
}