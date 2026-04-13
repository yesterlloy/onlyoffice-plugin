-- =====================================================
-- 数据研判分析系统 - 制式报告模板编辑器数据库初始化脚本
-- Version: V1.0
-- Date: 2026-04-09
-- =====================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS template_editor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE template_editor;

-- =====================================================
-- 1. 指标分类表
-- =====================================================
DROP TABLE IF EXISTS t_indicator_category;
CREATE TABLE t_indicator_category (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    name            VARCHAR(50) NOT NULL COMMENT '分类名称',
    icon            VARCHAR(20) COMMENT '分类图标',
    sort_order      INT DEFAULT 0 COMMENT '排序序号',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指标分类表';

-- =====================================================
-- 2. 指标元数据表
-- =====================================================
DROP TABLE IF EXISTS t_indicator_metadata;
CREATE TABLE t_indicator_metadata (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    category_id     BIGINT NOT NULL COMMENT '所属分类ID',
    indicator_id    VARCHAR(50) NOT NULL COMMENT '指标唯一标识',
    code            VARCHAR(20) NOT NULL COMMENT '接口编码',
    field           VARCHAR(50) COMMENT '数据字段名',
    name            VARCHAR(100) NOT NULL COMMENT '指标显示名称',
    type            VARCHAR(20) NOT NULL COMMENT '指标类型：text/number/percent/date/chart/table/condition/ai_generate',
    chart_type      VARCHAR(20) COMMENT '图表类型：bar/pie/line',
    unit            VARCHAR(20) COMMENT '数值单位',
    preview_value   VARCHAR(200) COMMENT '预览示例值',
    sort_order      INT DEFAULT 0 COMMENT '排序序号',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_indicator_id (indicator_id),
    KEY idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指标元数据表';

-- =====================================================
-- 3. 指标参数定义表
-- =====================================================
DROP TABLE IF EXISTS t_indicator_params;
CREATE TABLE t_indicator_params (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    indicator_id    BIGINT NOT NULL COMMENT '关联指标元数据ID',
    param_key       VARCHAR(50) NOT NULL COMMENT '参数键',
    param_label     VARCHAR(100) NOT NULL COMMENT '参数显示名称',
    input_type      VARCHAR(20) NOT NULL COMMENT '控件类型：select/text/textarea/number/switch/color/multiselect',
    default_value   VARCHAR(500) COMMENT '默认值',
    options         VARCHAR(1000) COMMENT '下拉选项列表（JSON数组）',
    options_source  VARCHAR(100) COMMENT '动态选项来源',
    min_value       DECIMAL(10,2) COMMENT '最小值',
    max_value       DECIMAL(10,2) COMMENT '最大值',
    required        TINYINT DEFAULT 0 COMMENT '是否必填：0否 1是',
    sort_order      INT DEFAULT 0 COMMENT '排序序号',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_indicator (indicator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指标参数定义表';

-- =====================================================
-- 4. 模板文件表
-- =====================================================
DROP TABLE IF EXISTS t_template_file;
CREATE TABLE t_template_file (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    name            VARCHAR(200) NOT NULL COMMENT '模板名称',
    description     VARCHAR(500) COMMENT '模板描述',
    oss_key         VARCHAR(200) NOT NULL COMMENT 'OSS存储路径',
    oss_url         VARCHAR(500) COMMENT 'OSS访问URL',
    file_size       BIGINT COMMENT '文件大小（字节）',
    version         INT DEFAULT 1 COMMENT '版本号',
    status          TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    created_by      VARCHAR(50) COMMENT '创建人',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_by      VARCHAR(50) COMMENT '更新人',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板文件表';

-- =====================================================
-- 5. 数据接口注册表
-- =====================================================
DROP TABLE IF EXISTS t_datasource_registry;
CREATE TABLE t_datasource_registry (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    datasource_id   VARCHAR(50) NOT NULL COMMENT '数据接口ID',
    name            VARCHAR(200) NOT NULL COMMENT '接口名称',
    description     VARCHAR(500) COMMENT '接口描述',
    api_url         VARCHAR(500) NOT NULL COMMENT '接口地址',
    method          VARCHAR(10) DEFAULT 'GET' COMMENT '请求方法',
    auth_type       VARCHAR(20) COMMENT '认证类型：none/token/apikey',
    auth_config     VARCHAR(1000) COMMENT '认证配置（JSON）',
    timeout         INT DEFAULT 30000 COMMENT '超时时间（毫秒）',
    status          TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_datasource_id (datasource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据接口注册表';

-- =====================================================
-- 6. AI 提示词配置表
-- =====================================================
DROP TABLE IF EXISTS t_ai_prompt_config;
CREATE TABLE t_ai_prompt_config (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    indicator_id    BIGINT NOT NULL COMMENT '关联指标元数据ID',
    prompt_template TEXT NOT NULL COMMENT '提示词模板',
    datasource_ids  VARCHAR(500) COMMENT '关联数据接口ID列表（JSON数组）',
    model_provider  VARCHAR(50) DEFAULT 'local' COMMENT '模型服务标识',
    model_name      VARCHAR(100) COMMENT '具体模型名称',
    temperature     DECIMAL(3,2) DEFAULT 0.3 COMMENT '温度参数',
    max_tokens      INT DEFAULT 1000 COMMENT '最大Token数',
    output_format   VARCHAR(50) DEFAULT 'plain' COMMENT '输出格式：plain/paragraphs/list',
    review_required TINYINT DEFAULT 1 COMMENT '是否需人工审核：0否 1是',
    system_prompt   TEXT COMMENT '系统提示词',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_indicator (indicator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI提示词配置表';

-- =====================================================
-- 7. AI 审核记录表
-- =====================================================
DROP TABLE IF EXISTS t_ai_review;
CREATE TABLE t_ai_review (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    template_id     BIGINT NOT NULL COMMENT '关联模板ID',
    indicator_uid   VARCHAR(50) NOT NULL COMMENT '指标标签唯一标识',
    indicator_name  VARCHAR(100) COMMENT '指标名称',
    generated_content TEXT COMMENT '生成的AI内容',
    status          VARCHAR(20) DEFAULT 'pending' COMMENT '审核状态：pending/approved/rejected',
    review_comment  VARCHAR(500) COMMENT '审核意见',
    reviewer        VARCHAR(50) COMMENT '审核人',
    review_at       DATETIME COMMENT '审核时间',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_template (template_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI审核记录表';