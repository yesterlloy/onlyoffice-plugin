-- =====================================================
-- V4: 为模板文件表增加原始文本内容和指标映射字段
-- Date: 2026-04-20
-- =====================================================

ALTER TABLE t_template_file 
ADD COLUMN raw_content LONGTEXT COMMENT 'OnlyOffice 转换为模板表达式后的原始文本内容' AFTER oss_url,
ADD COLUMN indicator_map LONGTEXT COMMENT '模板表达式与指标元数据的映射关系 (JSON)' AFTER raw_content;
