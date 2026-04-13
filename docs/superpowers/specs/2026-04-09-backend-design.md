# 数据研判分析系统 - 制式报告模板编辑器后端设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 版本 | V1.0 |
| 日期 | 2026-04-09 |
| 状态 | 待审核 |
| 作者 | Claude |

---

## 1. 项目概述

### 1.1 项目定位

制式报告模板编辑器后端服务，为前端模板编辑器提供数据支撑和业务逻辑处理。采用三端分离架构中的"产品后端"角色。

### 1.2 核心功能

- **指标元数据管理**：指标分类、指标定义、参数配置
- **模板管理**：模板存储、版本管理、报告预览
- **数据接口代理**：外部数据接口注册与调用
- **AI 内容生成**：基于提示词模板的 LLM 内容生成与审核

### 1.3 技术栈

| 技术选型 | 版本 |
|----------|------|
| Java | 11 |
| Spring Boot | 2.7.18 |
| MyBatis-Plus | 3.5.5 |
| MySQL | 8.0 |
| Maven | 多模块架构 |
| 阿里云 OSS | 3.17.4 |
| OkHttp | 4.12.0（AI调用） |

---

## 2. 项目结构

### 2.1 Maven 模块划分

```
be/
├── pom.xml                          # 父 POM（依赖版本管理）
│
├── template-editor-common/          # 公共模块
│   ├── config/                      # 配置类（MyBatis-Plus、全局异常）
│   ├── exception/                   # 自定义异常
│   ├── response/                    # 统一响应封装
│   ├── utils/                       # 工具类
│   └── constants/                   # 常量定义
│
├── template-editor-dao/             # 数据访问模块
│   ├── entity/                      # 实体类
│   ├── mapper/                      # Mapper 接口
│   └── dto/                         # 数据传输对象
│
├── template-editor-service/         # 业务服务模块
│   ├── indicator/                   # 指标服务
│   ├── template/                    # 模板服务
│   ├── datasource/                  # 数据接口服务
│   └── ai/                          # AI 生成服务
│
├── template-editor-ai-client/       # AI 客户端模块
│   ├── OpenAiCompatibleClient.java  # OpenAI 兼容接口客户端
│   ├── config/                      # AI 配置
│   └── model/                       # 请求/响应模型
│
├── template-editor-oss-client/      # OSS 客户端模块
│   ├── AliyunOssClient.java         # 阿里云 OSS 操作封装
│   ├── config/                      # OSS 配置
│   └── model/                       # 上传/下载模型
│
└── template-editor-api/             # API 接口模块（启动入口）
    ├── controller/                  # REST Controller
    ├── TemplateEditorApplication.java
    └── resources/
        ├── application.yml
        ├── application-dev.yml
        ├── application-prod.yml
        └── db/V1__init_schema.sql
```

### 2.2 模块依赖关系

```
api → service → dao → common
          ↓
     ai-client → common
          ↓
     oss-client → common
```

---

## 3. 数据库设计

### 3.1 表结构总览

| 表名 | 说明 |
|------|------|
| t_indicator_category | 指标分类表 |
| t_indicator_metadata | 指标元数据表 |
| t_indicator_params | 指标参数定义表 |
| t_template_file | 模板文件表 |
| t_datasource_registry | 数据接口注册表 |
| t_ai_prompt_config | AI 提示词配置表 |

### 3.2 详细表结构

#### t_indicator_category（指标分类表）

```sql
CREATE TABLE t_indicator_category (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(50) NOT NULL COMMENT '分类名称',
    icon            VARCHAR(20) COMMENT '分类图标',
    sort_order      INT DEFAULT 0 COMMENT '排序序号',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_name (name)
);
```

#### t_indicator_metadata（指标元数据表）

```sql
CREATE TABLE t_indicator_metadata (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id     BIGINT NOT NULL COMMENT '所属分类ID',
    indicator_id    VARCHAR(50) NOT NULL COMMENT '指标唯一标识',
    code            VARCHAR(20) NOT NULL COMMENT '接口编码',
    field           VARCHAR(50) COMMENT '数据字段名',
    name            VARCHAR(100) NOT NULL COMMENT '指标显示名称',
    type            VARCHAR(20) NOT NULL COMMENT '指标类型',
    chart_type      VARCHAR(20) COMMENT '图表类型',
    unit            VARCHAR(20) COMMENT '数值单位',
    preview_value   VARCHAR(200) COMMENT '预览示例值',
    sort_order      INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_indicator_id (indicator_id),
    KEY idx_category (category_id)
);
```

#### t_indicator_params（指标参数定义表）

```sql
CREATE TABLE t_indicator_params (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    indicator_id    BIGINT NOT NULL COMMENT '关联指标元数据ID',
    param_key       VARCHAR(50) NOT NULL COMMENT '参数键',
    param_label     VARCHAR(100) NOT NULL COMMENT '参数显示名称',
    input_type      VARCHAR(20) NOT NULL COMMENT '控件类型',
    default_value   VARCHAR(500) COMMENT '默认值',
    options         VARCHAR(1000) COMMENT '下拉选项列表',
    options_source  VARCHAR(100) COMMENT '动态选项来源',
    min_value       DECIMAL(10,2) COMMENT '最小值',
    max_value       DECIMAL(10,2) COMMENT '最大值',
    required        TINYINT DEFAULT 0 COMMENT '是否必填',
    sort_order      INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_indicator (indicator_id)
);
```

#### t_template_file（模板文件表）

```sql
CREATE TABLE t_template_file (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(200) NOT NULL COMMENT '模板名称',
    description     VARCHAR(500) COMMENT '模板描述',
    oss_key         VARCHAR(200) NOT NULL COMMENT 'OSS存储路径',
    oss_url         VARCHAR(500) COMMENT 'OSS访问URL',
    file_size       BIGINT COMMENT '文件大小',
    version         INT DEFAULT 1 COMMENT '版本号',
    status          TINYINT DEFAULT 1 COMMENT '状态',
    created_by      VARCHAR(50) COMMENT '创建人',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(50) COMMENT '更新人',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_status (status)
);
```

#### t_datasource_registry（数据接口注册表）

```sql
CREATE TABLE t_datasource_registry (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    datasource_id   VARCHAR(50) NOT NULL COMMENT '数据接口ID',
    name            VARCHAR(200) NOT NULL COMMENT '接口名称',
    description     VARCHAR(500) COMMENT '接口描述',
    api_url         VARCHAR(500) NOT NULL COMMENT '接口地址',
    method          VARCHAR(10) DEFAULT 'GET' COMMENT '请求方法',
    auth_type       VARCHAR(20) COMMENT '认证类型',
    auth_config     VARCHAR(1000) COMMENT '认证配置',
    timeout         INT DEFAULT 30000 COMMENT '超时时间',
    status          TINYINT DEFAULT 1 COMMENT '状态',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_datasource_id (datasource_id)
);
```

#### t_ai_prompt_config（AI 提示词配置表）

```sql
CREATE TABLE t_ai_prompt_config (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    indicator_id    BIGINT NOT NULL COMMENT '关联指标元数据ID',
    prompt_template TEXT NOT NULL COMMENT '提示词模板',
    datasource_ids  VARCHAR(500) COMMENT '关联数据接口ID列表',
    model_provider  VARCHAR(50) DEFAULT 'local' COMMENT '模型服务标识',
    model_name      VARCHAR(100) COMMENT '具体模型名称',
    temperature     DECIMAL(3,2) DEFAULT 0.3 COMMENT '温度参数',
    max_tokens      INT DEFAULT 1000 COMMENT '最大Token数',
    output_format   VARCHAR(50) DEFAULT 'plain' COMMENT '输出格式',
    review_required TINYINT DEFAULT 1 COMMENT '是否需人工审核',
    system_prompt   TEXT COMMENT '系统提示词',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_indicator (indicator_id)
);
```

---

## 4. API 接口设计

### 4.1 接口总览

| 模块 | 基础路径 | 说明 |
|------|----------|------|
| 指标管理 | `/api/indicators` | 指标分类、元数据、参数定义 |
| 模板管理 | `/api/templates` | 模板 CRUD、预览、下载 |
| 数据接口 | `/api/datasources` | 接口注册、调用代理 |
| AI 生成 | `/api/ai` | AI 预览、审核管理 |

### 4.2 指标管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/indicators/categories` | 获取指标分类树 |
| GET | `/api/indicators/{indicatorId}` | 获取单个指标详情 |
| GET | `/api/indicators/{indicatorId}/params` | 获取指标参数定义 |
| GET | `/api/indicators/params/options` | 获取动态下拉选项 |

### 4.3 模板管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/templates` | 分页获取模板列表 |
| GET | `/api/templates/{id}` | 获取模板详情 |
| POST | `/api/templates` | 创建模板 |
| PUT | `/api/templates/{id}` | 更新模板 |
| DELETE | `/api/templates/{id}` | 删除模板 |
| POST | `/api/templates/{id}/preview` | 生成报告预览 |
| GET | `/api/templates/{id}/download` | 下载模板文件 |

### 4.4 数据接口 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/datasources` | 获取数据接口列表 |
| GET | `/api/datasources/{datasourceId}` | 获取接口详情 |
| POST | `/api/datasources` | 注册数据接口 |
| PUT | `/api/datasources/{datasourceId}` | 更新接口配置 |
| DELETE | `/api/datasources/{datasourceId}` | 删除接口 |
| POST | `/api/datasources/{datasourceId}/invoke` | 调用数据接口 |

### 4.5 AI 生成 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/preview` | 预览 AI 生成内容 |
| GET | `/api/ai/reviews` | 获取待审核列表 |
| POST | `/api/ai/reviews/{reviewId}/approve` | 审核通过 |
| POST | `/api/ai/reviews/{reviewId}/reject` | 审核拒绝 |
| PUT | `/api/ai/reviews/{reviewId}/edit` | 编辑修改内容 |

---

## 5. 服务层设计

### 5.1 模块划分

```
service/
├── indicator/
│   ├── IndicatorCategoryService.java
│   ├── IndicatorMetadataService.java
│   └── IndicatorParamService.java
│
├── template/
│   ├── TemplateService.java
│   └── TemplatePreviewService.java
│
├── datasource/
│   ├── DatasourceRegistryService.java
│   └── DatasourceInvokeService.java
│
└── ai/
    ├── AiGenerateService.java
    └── AiReviewService.java
```

### 5.2 核心流程

#### 报告预览流程

```
1. 加载模板 → 从 OSS 下载模板原始内容
2. 解析指标 → 解析 {{...}} 表达式，识别指标类型
3. 获取数据：
   - text/number/chart → 调用数据接口获取数据
   - ai_generate → 调用 LLM 生成内容
4. 替换表达式 → 将数据填充到模板
5. 生成报告 → 上传预览文件到 OSS，返回 URL
```

#### AI 内容生成流程

```
1. 获取提示词配置 → 从 t_ai_prompt_config 加载
2. 获取关联数据 → 调用 datasource_ids 中的接口
3. 组装提示词 → 替换 {variable} 变量占位符
4. 调用 LLM → 通过 OpenAI 兼容接口请求本地模型
5. 处理结果 → 按输出格式处理，生成审核记录
```

---

## 6. 外部集成

### 6.1 AI 模型调用（OpenAI 兼容接口）

配置项：
- `ai.local.base-url`: 本地模型服务地址（如 `http://localhost:11434/v1`）
- `ai.local.default-model`: 默认模型名称
- `ai.local.api-key`: API Key（可选）

请求格式与 OpenAI API 完全一致：
```
POST /v1/chat/completions
{
  "model": "qwen2.5-14b",
  "messages": [{"role": "user", "content": "..."}],
  "temperature": 0.3,
  "max_tokens": 500
}
```

### 6.2 阿里云 OSS 存储

配置项：
- `aliyun.oss.endpoint`: OSS 区域节点
- `aliyun.oss.bucket-name`: 存储桶名称
- `aliyun.oss.access-key-id`: 访问密钥 ID
- `aliyun.oss.access-key-secret`: 访问密钥 Secret

核心操作：
- 模板上传：`templates/{year}/{templateId}.docx`
- 预览文件：`preview/{templateId}/{timestamp}.docx`
- URL 生成：带签名，有效期 1 小时

---

## 7. 配置管理

### 7.1 环境区分

| 环境 | 配置文件 | 说明 |
|------|----------|------|
| 开发 | application-dev.yml | 本地数据库、本地模型 |
| 生产 | application-prod.yml | 环境变量注入敏感配置 |

### 7.2 关键配置项

```yaml
# 数据库
spring.datasource.url: jdbc:mysql://...
spring.datasource.username/password

# OSS
aliyun.oss.endpoint/bucket-name/access-key-id/access-key-secret

# AI
ai.local.base-url/default-model/timeout

# 服务端口
server.port: 8080
server.servlet.context-path: /template-editor
```

---

## 8. 待确认事项

1. **指标初始数据**：是否需要在 Phase 1 中录入文档中的示例指标数据？
2. **管理后台**：是否需要同时开发指标/数据接口的管理后台页面（前端）？
3. **认证鉴权**：API 是否需要集成统一的认证系统（如 JWT）？

---

## 9. 下一步计划

完成本设计文档审核后，进入实现阶段：

1. 搭建项目骨架（POM、目录结构）
2. 实现数据库初始化脚本
3. 实现 DAO 层（Entity、Mapper）
4. 实现 Service 层
5. 实现 Controller 层
6. 集成 AI/OSS 客户端
7. 编写单元测试
8. 集成测试与联调