-- =====================================================
-- 数据研判分析系统 - V5 新增数据集功能
-- Date: 2026-05-18
-- =====================================================

USE onlyoffice;

-- =====================================================
-- 1. 数据集表
-- =====================================================
DROP TABLE IF EXISTS t_dataset;
CREATE TABLE t_dataset (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    dataset_id      VARCHAR(50) NOT NULL COMMENT '数据集唯一标识',
    code            VARCHAR(50) NOT NULL COMMENT '数据集code',
    name            VARCHAR(100) NOT NULL COMMENT '数据集名称',
    datasource_code VARCHAR(100) NOT NULL COMMENT '数据源code',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_dataset_id (dataset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据集表';

-- =====================================================
-- 2. 数据集与指标关联表
-- =====================================================
DROP TABLE IF EXISTS t_dataset_indicator;
CREATE TABLE t_dataset_indicator (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    dataset_id      VARCHAR(50) NOT NULL COMMENT '数据集唯一标识',
    indicator_id    VARCHAR(50) NOT NULL COMMENT '指标唯一标识',
    sort_order      INT DEFAULT 0 COMMENT '排序序号',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_dataset_indicator (dataset_id, indicator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据集与指标关联表';

-- =====================================================
-- 3. 补充数据集所需的指标元数据
-- =====================================================
-- 基础诉求数据集关联指标 (关联分类 2: 数量统计)
INSERT IGNORE INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, chart_type, unit, preview_value, sort_order) VALUES
(101, 2, 'year', 'JK4816', 'year', '年份', 'text', NULL, NULL, '2026', 1),
(104, 2, 'work_count', 'JK4816', 'work_count', '受理总量', 'number', NULL, '宗', '12580', 2),
(106, 2, 'complete_rate', 'JK4816', 'complete_rate', '办结率', 'percent', NULL, '%', '92.5%', 3);

-- 分类诉求数据集关联指标 (关联分类 4: 对比分析)
INSERT IGNORE INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, chart_type, unit, preview_value, sort_order) VALUES
(201, 4, 'top_types_chart', 'JK3008', 'top_types', '诉求类型分布图', 'chart', 'pie', NULL, NULL, 1),
(202, 4, 'top_areas_chart', 'JK3008', 'top_areas', '区域分布图', 'chart', 'bar', NULL, NULL, 2);

-- 热点诉求监测数据集关联指标 (关联分类 3: 趋势分析)
INSERT IGNORE INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, chart_type, unit, preview_value, sort_order) VALUES
(301, 3, 'hot_topic', 'JK9999', 'hot_topic', '热点事件名称', 'text', NULL, NULL, '燃气费争议', 1),
(302, 3, 'alert_level', 'JK9999', 'alert_level', '预警级别', 'text', NULL, NULL, '红色预警', 2),
(303, 3, 'increase_rate', 'JK9999', 'increase_rate', '增长趋势', 'percent', NULL, '%', '156.4%', 3);

-- =====================================================
-- 4. 初始化模拟数据集
-- =====================================================
INSERT INTO t_dataset (dataset_id, code, name, datasource_code) VALUES
('DS001', 'JK4816', '基础诉求数据集', 'JK1958333647587164160'),
('DS002', 'JK3008', '分类诉求数据集', 'JK1958333647587164161'),
('DS003', 'JK9999', '热点诉求监测数据集', 'JK1958333647587164162');

-- =====================================================
-- 5. 初始化关联关系
-- =====================================================
INSERT INTO t_dataset_indicator (dataset_id, indicator_id, sort_order) VALUES
('DS001', 'year', 1),
('DS001', 'work_count', 2),
('DS001', 'complete_rate', 3),
('DS002', 'top_types_chart', 1),
('DS002', 'top_areas_chart', 2),
('DS003', 'hot_topic', 1),
('DS003', 'alert_level', 2),
('DS003', 'increase_rate', 3);
