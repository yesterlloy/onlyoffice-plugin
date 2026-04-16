-- =====================================================
-- 数据研判分析系统 - 允许模板初始无文件（oss_key 默认为空字符串）
-- Date: 2026-04-16
-- =====================================================

USE onlyoffice;

ALTER TABLE t_template_file MODIFY COLUMN oss_key VARCHAR(200) DEFAULT '' COMMENT 'OSS存储路径';
