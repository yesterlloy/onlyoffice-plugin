# 前端项目与 OnlyOffice DocumentServer 集成指南

## 概述

前端项目需要与 OnlyOffice DocumentServer 建立双向通信：
1. **前端 → DocumentServer**：加载编辑器、传递文档
2. **前端 → 插件**：通过 postMessage 通信
3. **插件 → 前端**：回调通知

---

## 1. 集成架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           产品前端 (React)                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ 指标库面板    │    │ 文档编辑区    │    │ 配置面板     │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                              ↓ postMessage                          │
│                    ┌──────────────────────┐                        │
│                    │  OnlyOffice iframe   │                        │
│                    └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
                               ↓ HTTP API
┌─────────────────────────────────────────────────────────────────────┐
│                    OnlyOffice DocumentServer                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ DocService   │    │  编辑器核心   │    │  插件运行时  │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                              ↑ 插件加载                              │
│                    ┌──────────────────────┐                        │
│                    │  Template Doc Agent  │                        │
│                    └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. DocumentServer 部署

### 2.1 Docker 部署（推荐）

```bash
docker run -i -t -d -p 80:80 \
  --restart=always \
  -v /app/onlyoffice/DocumentServer/logs:/var/log/onlyoffice \
  -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data \
  -v /app/onlyoffice/DocumentServer/lib:/var/lib/onlyoffice \
  -v /app/onlyoffice/DocumentServer/db:/var/lib/postgresql \
  onlyoffice/documentserver
```

### 2.2 验证安装

访问 `http://your-server/` 看到 OnlyOffice 欢迎页面即安装成功。

### 2.3 上传插件到 DocumentServer

```bash
# 将插件复制到插件目录
docker cp ./template-doc-agent onlyoffice-document-server:/var/www/onlyoffice/documentserver/sdkjs-plugins/

# 重启服务
docker restart onlyoffice-document-server
```

---

## 3. 前端加载编辑器

### 3.1 方式一：使用 OnlyOffice 官方 React 组件

```bash
npm install @onlyoffice/document-editor-react
```

```tsx
import { DocumentEditor } from "@onlyoffice/document-editor-react";

function EditorPage() {
  return (
    <DocumentEditor
      id="doc-editor"
      documentServerUrl="http://your-documentserver/"
      config={{
        document: {
          fileType: "docx",
          key: "document_key_001",
          title: "数据研判季报.docx",
          url: "http://your-server/files/template.docx",
        },
        documentType: "word",
        editorConfig: {
          mode: "edit",
          lang: "zh-CN",
          plugins: {
            autostart: ["asc.{guid}.template-doc-agent"],
            pluginsData: [
              "http://your-server/plugins/template-doc-agent/config.json"
            ]
          },
          customization: {
            chat: false,
            compactHeader: true,
            feedback: false,
          }
        },
        height: "100%",
        width: "100%",
      }}
      events={{
        onDocumentReady: () => {
          console.log("Document is ready");
        },
      }}
    />
  );
}
```

### 3.2 方式二：原生 iframe 嵌入（推荐，更灵活）

```tsx
import { useEffect, useRef, useState } from 'react';

interface OnlyOfficeEditorProps {
  documentUrl: string;
  documentKey: string;
  documentTitle: string;
}

function OnlyOfficeEditor({ documentUrl, documentKey, documentTitle }: OnlyOfficeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // 加载 OnlyOffice API 脚本
    const script = document.createElement('script');
    script.src = 'http://your-documentserver/web-apps/apps/api/documents/api.js';
    script.onload = () => {
      initEditor();
    };
    document.body.appendChild(script);

    return () => {
      // 销毁编辑器
      if (editorRef.current) {
        editorRef.current.destroyEditor();
      }
    };
  }, []);

  const initEditor = () => {
    if (!containerRef.current || !(window as any).DocsAPI) return;

    const config = {
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
          name: '管理员',
        },
        plugins: {
          autostart: ['asc.{guid}.template-doc-agent'],
          pluginsData: [
            'http://your-server/plugins/template-doc-agent/config.json'
          ]
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
        callbackUrl: 'http://your-backend/api/templates/callback', // 保存回调
      },
      height: '100%',
      width: '100%',
      type: 'desktop',
    };

    // 初始化编辑器
    editorRef.current = new (window as any).DocsAPI.DocEditor(containerRef.current, config);
    setEditorReady(true);
  };

  return (
    <div 
      ref={containerRef} 
      id="onlyoffice-editor-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}

export default OnlyOfficeEditor;
```

---

## 4. 前端与插件通信

### 4.1 通信机制

```
┌─────────────────┐                    ┌─────────────────┐
│   产品前端       │                    │   OnlyOffice    │
│                 │   window.postMessage│   iframe        │
│  sendToPlugin() │ ──────────────────→ │                 │
│                 │                    │  插件接收        │
│                 │                    │  处理消息        │
│                 │ ←────────────────── │                 │
│  window.onmessage│  window.postMessage│  插件回复        │
└─────────────────┘                    └─────────────────┘
```

### 4.2 封装通信工具类

```typescript
// src/utils/onlyoffice-bridge.ts

interface PluginMessage {
  type: string;
  data?: any;
}

interface MessageCallback {
  (data: any): void;
}

class OnlyOfficeBridge {
  private editorFrame: HTMLIFrameElement | null = null;
  private messageHandlers: Map<string, MessageCallback[]> = new Map();
  private initialized = false;

  /**
   * 初始化桥接
   * @param iframeId iframe 元素 ID
   */
  init(iframeId: string = 'onlyoffice-editor') {
    // 获取 OnlyOffice iframe
    const findFrame = (): HTMLIFrameElement | null => {
      const container = document.getElementById('onlyoffice-editor-container');
      if (container) {
        return container.querySelector('iframe') as HTMLIFrameElement;
      }
      return document.getElementById(iframeId) as HTMLIFrameElement;
    };

    // 等待 iframe 加载
    const checkFrame = () => {
      this.editorFrame = findFrame();
      if (this.editorFrame) {
        this.initialized = true;
        console.log('[Bridge] Editor frame connected');
      } else {
        setTimeout(checkFrame, 500);
      }
    };

    checkFrame();

    // 监听插件消息
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * 发送消息给插件
   */
  send(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.editorFrame || !this.editorFrame.contentWindow) {
        reject(new Error('Editor frame not available'));
        return;
      }

      // 注册一次性回调
      const callbackType = type.replace(/(Indicator|Params|Tags|Raw|Visual)$/, 'Done');
      const timeout = setTimeout(() => {
        this.off(callbackType, callback);
        reject(new Error('Message timeout'));
      }, 10000);

      const callback = (responseData: any) => {
        clearTimeout(timeout);
        this.off(callbackType, callback);
        resolve(responseData);
      };

      this.on(callbackType, callback);

      // 发送消息
      const message: PluginMessage = { type, data };
      this.editorFrame.contentWindow.postMessage(message, '*');
      console.log('[Bridge] Sent:', type, data);
    });
  }

  /**
   * 监听消息
   */
  on(type: string, callback: MessageCallback) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(callback);
  }

  /**
   * 取消监听
   */
  off(type: string, callback: MessageCallback) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 处理接收的消息
   */
  private handleMessage(event: MessageEvent) {
    const { type, data } = event.data || {};
    if (!type) return;

    console.log('[Bridge] Received:', type, data);

    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(callback => callback(data));
    }
  }

  /**
   * 销毁
   */
  destroy() {
    window.removeEventListener('message', this.handleMessage.bind(this));
    this.messageHandlers.clear();
    this.initialized = false;
  }
}

// 单例导出
export const onlyOfficeBridge = new OnlyOfficeBridge();
```

### 4.3 在组件中使用

```tsx
// src/pages/TemplateEditor/index.tsx

import { useEffect, useState } from 'react';
import { onlyOfficeBridge } from '@/utils/onlyoffice-bridge';
import OnlyOfficeEditor from '@/components/OnlyOfficeEditor';
import IndicatorPanel from '@/components/IndicatorPanel';
import ConfigPanel from '@/components/ConfigPanel';

function TemplateEditorPage() {
  const [editorReady, setEditorReady] = useState(false);
  const [configPanelVisible, setConfigPanelVisible] = useState(false);
  const [currentTag, setCurrentTag] = useState<any>(null);

  useEffect(() => {
    // 初始化桥接
    onlyOfficeBridge.init();

    // 监听标签点击
    onlyOfficeBridge.on('tagClicked', (data) => {
      setCurrentTag(data);
      setConfigPanelVisible(true);
    });

    // 监听编辑器就绪
    onlyOfficeBridge.on('editorReady', () => {
      setEditorReady(true);
    });

    return () => {
      onlyOfficeBridge.destroy();
    };
  }, []);

  // 插入指标
  const handleInsertIndicator = async (indicator: any) => {
    try {
      const result = await onlyOfficeBridge.send('insertIndicator', {
        uid: `tag_${Date.now()}`,
        indicatorId: indicator.indicatorId,
        code: indicator.code,
        field: indicator.field,
        name: indicator.name,
        type: indicator.type,
        chartType: indicator.chartType,
        paramValues: {},
      });
      console.log('插入成功:', result);
    } catch (error) {
      console.error('插入失败:', error);
    }
  };

  // 保存参数
  const handleSaveParams = async (uid: string, paramValues: any) => {
    try {
      await onlyOfficeBridge.send('updateParams', { uid, paramValues });
      setConfigPanelVisible(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 保存模板
  const handleSaveTemplate = async () => {
    try {
      // 1. 转换为原始模板
      const result = await onlyOfficeBridge.send('convertToRaw');
      
      // 2. 提交到后端保存
      // await saveTemplate(result.content);
      
      console.log('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  return (
    <div className="template-editor">
      {/* 左侧指标库 */}
      <IndicatorPanel onDragEnd={handleInsertIndicator} />

      {/* 中间编辑器 */}
      <div className="editor-container">
        <OnlyOfficeEditor
          documentUrl="http://your-server/files/template.docx"
          documentKey={`key_${Date.now()}`}
          documentTitle="数据研判季报.docx"
        />
      </div>

      {/* 右侧配置面板 */}
      <ConfigPanel
        visible={configPanelVisible}
        tag={currentTag}
        onSave={handleSaveParams}
        onClose={() => setConfigPanelVisible(false)}
      />
    </div>
  );
}

export default TemplateEditorPage;
```

---

## 5. 插件加载配置

### 5.1 配置方式一：本地插件目录

```typescript
const editorConfig = {
  // ...
  editorConfig: {
    plugins: {
      // 自动启动插件
      autostart: ['asc.{guid}.template-doc-agent'],
      // 插件配置文件 URL
      pluginsData: [
        'http://your-documentserver/sdkjs-plugins/template-doc-agent/config.json'
      ]
    }
  }
};
```

### 5.2 配置方式二：远程插件 URL

```typescript
const editorConfig = {
  // ...
  editorConfig: {
    plugins: {
      autostart: ['asc.{guid}.template-doc-agent'],
      pluginsData: [
        'https://your-cdn.com/plugins/template-doc-agent/config.json'
      ]
    }
  }
};
```

### 5.3 插件配置文件 (config.json)

```json
{
  "name": "Template Document Agent",
  "guid": "asc.{your-guid}.template-doc-agent",
  "baseUrl": "https://your-cdn.com/plugins/template-doc-agent/",
  "variations": [
    {
      "description": "Template Document Agent",
      "url": "index.html",
      "icons": ["resources/icon.png"],
      "EditorsSupport": ["word"],
      "isVisual": false,
      "initDataType": "none"
    }
  ]
}
```

---

## 6. 文档 URL 配置

### 6.1 文档 URL 要求

OnlyOffice 需要通过 URL 获取文档，要求：

1. **可公开访问**（或通过签名 URL）
2. **支持 CORS**（跨域请求）
3. **返回正确的 Content-Type**

### 6.2 后端生成文档 URL

```java
// 后端 API：获取文档 URL
@GetMapping("/api/templates/{id}/url")
public Result<String> getTemplateUrl(@PathVariable Long id) {
    TemplateFile template = templateService.getById(id);
    
    // 生成带签名的 OSS URL（有效期 1 小时）
    String signedUrl = ossClient.generateUrl(template.getOssKey(), 3600 * 1000);
    
    return Result.success(signedUrl);
}
```

### 6.3 前端获取 URL

```typescript
async function loadDocument(templateId: number) {
  const { data: documentUrl } = await api.get(`/api/templates/${templateId}/url`);
  
  // 初始化编辑器
  initOnlyOfficeEditor({
    documentUrl,
    documentKey: `template_${templateId}_${Date.now()}`,
    documentTitle: '模板名称.docx',
  });
}
```

---

## 7. 保存回调

### 7.1 配置回调 URL

```typescript
const editorConfig = {
  document: {
    // ...
    url: documentUrl,
  },
  editorConfig: {
    // 保存回调 URL
    callbackUrl: 'http://your-backend/api/templates/callback',
    // 强制保存
    customization: {
      forcesave: true,
    }
  }
};
```

### 7.2 后端回调处理

```java
@PostMapping("/api/templates/callback")
public void templateCallback(HttpServletRequest request, HttpServletResponse response) {
    // OnlyOffice 回调参数
    String status = request.getParameter("status");
    String downloadUrl = request.getParameter("url");
    String key = request.getParameter("key");
    
    // status: 2 = 准备保存, 4 = 强制保存完成
    if ("2".equals(status) || "4".equals(status)) {
        // 下载文档并保存到 OSS
        templateService.saveDocument(key, downloadUrl);
    }
    
    // 返回 JSON 确认
    response.setContentType("application/json");
    response.getWriter().write("{\"error\":0}");
}
```

---

## 8. 完整集成示例

### 8.1 项目结构

```
fe/src/
├── components/
│   ├── OnlyOfficeEditor/
│   │   └── index.tsx          # 编辑器组件
│   └── ...
├── utils/
│   └── onlyoffice-bridge.ts   # 通信桥接
├── pages/
│   └── TemplateEditor/
│       └── index.tsx          # 编辑页
└── api/
    └── template.ts            # API 接口
```

### 8.2 环境配置

```env
# .env.development
VITE_DOCUMENTSERVER_URL=http://localhost:80
VITE_API_BASE_URL=http://localhost:8081/template-editor
VITE_PLUGIN_URL=http://localhost/sdkjs-plugins/template-doc-agent/config.json

# .env.production
VITE_DOCUMENTSERVER_URL=https://doc.your-domain.com
VITE_API_BASE_URL=https://api.your-domain.com/template-editor
VITE_PLUGIN_URL=https://cdn.your-domain.com/plugins/template-doc-agent/config.json
```

### 8.3 完整代码示例

```tsx
// src/components/OnlyOfficeEditor/index.tsx
import { useEffect, useRef } from 'react';

interface Props {
  documentUrl: string;
  documentKey: string;
  documentTitle: string;
  onReady?: () => void;
}

export default function OnlyOfficeEditor({
  documentUrl,
  documentKey,
  documentTitle,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // 加载 API
    const script = document.createElement('script');
    script.src = `${import.meta.env.VITE_DOCUMENTSERVER_URL}/web-apps/apps/api/documents/api.js`;
    script.onload = initEditor;
    document.body.appendChild(script);

    return () => {
      editorRef.current?.destroyEditor();
    };
  }, []);

  const initEditor = () => {
    if (!containerRef.current || !(window as any).DocsAPI) return;

    editorRef.current = new (window as any).DocsAPI.DocEditor(containerRef.current, {
      document: {
        fileType: 'docx',
        key: documentKey,
        title: documentTitle,
        url: documentUrl,
      },
      documentType: 'word',
      editorConfig: {
        mode: 'edit',
        lang: 'zh-CN',
        plugins: {
          autostart: ['asc.template-doc-agent'],
          pluginsData: [import.meta.env.VITE_PLUGIN_URL],
        },
        callbackUrl: `${import.meta.env.VITE_API_BASE_URL}/api/templates/callback`,
      },
      events: {
        onDocumentReady: () => {
          onReady?.();
        },
      },
    });
  };

  return (
    <div 
      ref={containerRef} 
      id="onlyoffice-editor-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}
```

---

## 9. 跨域与安全

### 9.1 CORS 配置

DocumentServer 需要配置 CORS 允许前端访问：

```nginx
# /etc/onlyoffice/documentserver/nginx/includes/ds-common.conf
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
```

### 9.2 JWT 安全（生产环境推荐）

```typescript
// 前端请求 JWT Token
const jwtToken = await api.get('/api/auth/onlyoffice-jwt');

const editorConfig = {
  document: { ... },
  editorConfig: { ... },
  token: jwtToken,  // JWT Token
};
```

```java
// 后端生成 JWT
@GetMapping("/api/auth/onlyoffice-jwt")
public String generateJwt(@RequestBody EditorConfig config) {
    return JwtUtils.generateToken(config, jwtSecret);
}
```

---

## 10. 故障排查

### 10.1 编辑器无法加载

| 问题 | 排查步骤 |
|------|----------|
| API.js 404 | 检查 DocumentServer 是否运行，URL 是否正确 |
| 文档加载失败 | 检查文档 URL 是否可访问，CORS 是否配置 |
| 插件加载失败 | 检查 config.json URL 是否正确，JSON 格式是否合法 |

### 10.2 消息通信失败

| 问题 | 排查步骤 |
|------|----------|
| 发送无响应 | 检查 iframe 是否正确获取，postMessage origin 是否匹配 |
| 接收不到消息 | 检查 window.addEventListener 是否正确绑定 |
| 消息格式错误 | 检查消息是否包含 type 字段 |

### 10.3 调试工具

```javascript
// 浏览器控制台查看 iframe
document.getElementById('onlyoffice-editor-container')?.querySelector('iframe');

// 手动发送测试消息
const frame = document.querySelector('#onlyoffice-editor-container iframe');
frame?.contentWindow?.postMessage({ type: 'getDocTags' }, '*');

// 监听所有消息
window.addEventListener('message', (e) => console.log('Message:', e.data));
```

---

## 11. 参考资源

- [OnlyOffice API Documentation](https://api.onlyoffice.com/editors/basic)
- [OnlyOffice Plugin Development](https://api.onlyoffice.com/plugin/basic)
- [OnlyOffice DocumentServer Docker](https://github.com/ONLYOFFICE/Docker-DocumentServer)