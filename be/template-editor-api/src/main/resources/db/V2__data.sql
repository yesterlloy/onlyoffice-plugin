-- =====================================================
-- 数据研判分析系统 - 模拟指标数据
-- Date: 2026-04-16
-- =====================================================

USE onlyoffice;

-- =====================================================
-- 1. 指标分类
-- =====================================================
INSERT INTO t_indicator_category (id, name, icon, sort_order) VALUES
(1, '基础信息', '📋', 1),
(2, '数量统计', '📊', 2),
(3, '趋势分析', '📈', 3),
(4, '对比分析', '⚖️', 4),
(5, 'AI研判', '🤖', 5);

-- =====================================================
-- 2. 指标元数据
-- =====================================================

-- 分类1: 基础信息
INSERT INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, unit, preview_value, sort_order) VALUES
(1, 1, 'report_title', 'RPT-001', 'title', '报告标题', 'text', NULL, '2026年度数据研判分析报告', 1),
(2, 1, 'report_date', 'RPT-002', 'reportDate', '报告日期', 'date', NULL, '2026-04-16', 2),
(3, 1, 'report_author', 'RPT-003', 'author', '报告编制人', 'text', NULL, '张三', 3),
(4, 1, 'report_period', 'RPT-004', 'period', '统计周期', 'text', NULL, '2026年Q1', 4),
(5, 1, 'data_source', 'RPT-005', 'dataSource', '数据来源', 'text', NULL, '业务管理系统', 5);

-- 分类2: 数量统计
INSERT INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, chart_type, unit, preview_value, sort_order) VALUES
(6, 2, 'total_count', 'STAT-001', 'totalCount', '数据总量', 'number', NULL, '条', '128,456', 1),
(7, 2, 'valid_count', 'STAT-002', 'validCount', '有效数据量', 'number', NULL, '条', '115,203', 2),
(8, 2, 'valid_rate', 'STAT-003', 'validRate', '数据有效率', 'percent', NULL, '%', '89.7%', 3),
(9, 2, 'abnormal_count', 'STAT-004', 'abnormalCount', '异常数据量', 'number', NULL, '条', '3,251', 4),
(10, 2, 'abnormal_rate', 'STAT-005', 'abnormalRate', '异常率', 'percent', NULL, '%', '2.53%', 5),
(11, 2, 'coverage_chart', 'STAT-006', NULL, '数据覆盖率分布', 'chart', 'pie', NULL, NULL, 6);

-- 分类3: 趋势分析
INSERT INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, chart_type, unit, preview_value, sort_order) VALUES
(12, 3, 'monthly_trend', 'TREND-001', NULL, '月度数据趋势', 'chart', 'line', '条', NULL, 1),
(13, 3, 'growth_rate', 'TREND-002', 'growthRate', '环比增长率', 'percent', '%', '+12.5%', 2),
(14, 3, 'peak_value', 'TREND-003', 'peakValue', '峰值数据量', 'number', '条', '45,892', 3),
(15, 3, 'peak_date', 'TREND-004', 'peakDate', '峰值出现日期', 'date', NULL, '2026-03-15', 4),
(16, 3, 'trend_summary', 'TREND-005', 'trendSummary', '趋势研判摘要', 'ai_generate', NULL, '整体呈上升趋势...', 5);

-- 分类4: 对比分析
INSERT INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, chart_type, unit, preview_value, sort_order) VALUES
(17, 4, 'compare_table', 'COMP-001', NULL, '区域数据对比表', 'table', NULL, NULL, NULL, 1),
(18, 4, 'max_region', 'COMP-002', 'maxRegion', '最高值区域', 'text', NULL, NULL, '华东区域', 2),
(19, 4, 'max_value', 'COMP-003', 'maxValue', '最高值', 'number', NULL, '条', '38,921', 3),
(20, 4, 'min_region', 'COMP-004', 'minRegion', '最低值区域', 'text', NULL, NULL, '西北区域', 4),
(21, 4, 'min_value', 'COMP-005', 'minValue', '最低值', 'number', NULL, '条', '5,102', 5),
(22, 4, 'compare_chart', 'COMP-006', NULL, '区域对比柱状图', 'chart', 'bar', '条', NULL, 6);

-- 分类5: AI研判
INSERT INTO t_indicator_metadata (id, category_id, indicator_id, code, field, name, type, preview_value, sort_order) VALUES
(23, 5, 'ai_summary', 'AI-001', 'aiSummary', '综合研判结论', 'ai_generate', '经分析，本季度数据整体表现良好...', 1),
(24, 5, 'ai_risk', 'AI-002', 'aiRisk', '风险预警分析', 'ai_generate', '发现3项潜在风险点...', 2),
(25, 5, 'ai_suggestion', 'AI-003', 'aiSuggestion', '改进建议', 'ai_generate', '建议加强数据采集环节...', 3),
(26, 5, 'ai_key_findings', 'AI-004', 'aiKeyFindings', '关键发现', 'ai_generate', '本月异常数据集中在...', 4);

-- =====================================================
-- 3. 指标参数定义
-- =====================================================

-- 报告标题参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, required, sort_order) VALUES
(1, 1, 'prefix', '标题前缀', 'select', '无', 0, 1),
(2, 1, 'custom_suffix', '自定义后缀', 'text', '', 0, 2);

-- 统计周期参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(3, 4, 'period_type', '周期类型', 'select', 'quarter', '[{"label":"月度","value":"month"},{"label":"季度","value":"quarter"},{"label":"年度","value":"year"}]', 1, 1),
(4, 4, 'year', '年份', 'select', '2026', '[{"label":"2025","value":"2025"},{"label":"2026","value":"2026"},{"label":"2027","value":"2027"}]', 1, 2),
(5, 4, 'quarter', '季度', 'select', 'Q1', '[{"label":"Q1","value":"Q1"},{"label":"Q2","value":"Q2"},{"label":"Q3","value":"Q3"},{"label":"Q4","value":"Q4"}]', 0, 3);

-- 数据总量参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, required, sort_order) VALUES
(6, 6, 'date_range', '日期范围', 'text', '', 0, 1),
(7, 6, 'include_deleted', '包含已删除数据', 'switch', 'false', 0, 2);

-- 图表参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(8, 11, 'dimension', '统计维度', 'select', 'region', '[{"label":"按区域","value":"region"},{"label":"按类型","value":"type"},{"label":"按状态","value":"status"}]', 1, 1),
(9, 11, 'show_label', '显示数据标签', 'switch', 'true', 0, 2),
(10, 11, 'color_scheme', '配色方案', 'select', 'default', '[{"label":"默认","value":"default"},{"label":"暖色","value":"warm"},{"label":"冷色","value":"cool"}]', 0, 3);

-- 月度趋势参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(11, 12, 'time_range', '时间跨度', 'select', '12', '[{"label":"近3个月","value":"3"},{"label":"近6个月","value":"6"},{"label":"近12个月","value":"12"}]', 1, 1),
(12, 12, 'show_avg_line', '显示均值线', 'switch', 'true', 0, 2),
(13, 12, 'smooth', '平滑曲线', 'switch', 'false', 0, 3);

-- 对比分析参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(14, 17, 'compare_dimension', '对比维度', 'select', 'region', '[{"label":"区域","value":"region"},{"label":"部门","value":"dept"},{"label":"业务类型","value":"bizType"}]', 1, 1),
(15, 17, 'top_n', '显示数量', 'number', '5', 0, 2),
(16, 17, 'sort_order', '排序方式', 'select', 'desc', '[{"label":"降序","value":"desc"},{"label":"升序","value":"asc"}]', 0, 3);

-- AI研判参数
INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(17, 23, 'depth', '分析深度', 'select', 'standard', '[{"label":"概要","value":"brief"},{"label":"标准","value":"standard"},{"label":"深入","value":"deep"}]', 1, 1),
(18, 23, 'focus_area', '重点关注', 'multiselect', '', '[{"label":"数据质量","value":"quality"},{"label":"趋势变化","value":"trend"},{"label":"异常检测","value":"anomaly"},{"label":"关联性","value":"correlation"}]', 0, 2);

INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(19, 24, 'risk_level', '风险等级阈值', 'select', 'medium', '[{"label":"低","value":"low"},{"label":"中","value":"medium"},{"label":"高","value":"high"}]', 1, 1),
(20, 24, 'auto_classify', '自动分类', 'switch', 'true', 0, 2);

INSERT INTO t_indicator_params (id, indicator_id, param_key, param_label, input_type, default_value, options, required, sort_order) VALUES
(21, 25, 'suggestion_count', '建议数量', 'number', '3', 0, 1),
(22, 25, 'actionable', '可操作性要求', 'switch', 'true', 0, 2);

-- =====================================================
-- 4. 模板文件
-- =====================================================
INSERT INTO t_template_file (id, name, description, oss_key, oss_url, file_size, version, status, created_by) VALUES
(1, '月度数据研判报告模板', '标准月度数据研判分析报告模板，包含基础统计和趋势分析', 'templates/monthly_report_v2.docx', 'http://192.168.1.3:8888/templates/monthly_report_v2.docx', 256000, 2, 1, 'admin'),
(2, '季度综合分析报告模板', '季度综合分析模板，包含对比分析和AI研判结论', 'templates/quarterly_report_v1.docx', 'http://192.168.1.3:8888/templates/quarterly_report_v1.docx', 384000, 1, 1, 'admin'),
(3, '异常数据专项报告模板', '针对异常数据的专项分析报告模板', 'templates/anomaly_report_v1.docx', 'http://192.168.1.3:8888/templates/anomaly_report_v1.docx', 128000, 1, 1, 'admin');

-- =====================================================
-- 5. 数据接口注册
-- =====================================================
INSERT INTO t_datasource_registry (id, datasource_id, name, description, api_url, method, timeout, status) VALUES
(1, 'ds_total_count', '数据总量接口', '获取指定时间范围内的数据总量', 'http://192.168.1.3:8888/api/stats/total', 'GET', 30000, 1),
(2, 'ds_valid_rate', '有效率统计接口', '获取数据有效率及异常率统计', 'http://192.168.1.3:8888/api/stats/quality', 'GET', 30000, 1),
(3, 'ds_monthly_trend', '月度趋势数据接口', '获取月度数据趋势时间序列', 'http://192.168.1.3:8888/api/stats/trend', 'GET', 30000, 1),
(4, 'ds_region_compare', '区域对比数据接口', '获取各区域数据对比统计', 'http://192.168.1.3:8888/api/stats/region', 'GET', 30000, 1),
(5, 'ds_coverage', '覆盖率分布接口', '获取数据覆盖率分布数据', 'http://192.168.1.3:8888/api/stats/coverage', 'GET', 30000, 1);

-- =====================================================
-- 6. AI 提示词配置
-- =====================================================

-- 趋势研判摘要
INSERT INTO t_ai_prompt_config (id, indicator_id, prompt_template, model_provider, model_name, temperature, max_tokens, output_format, review_required, system_prompt) VALUES
(1, 16, '请根据以下数据趋势信息，撰写一段趋势研判摘要：\n\n数据总量：{{totalCount}}\n有效率：{{validRate}}\n环比增长率：{{growthRate}}\n峰值：{{peakValue}}（{{peakDate}}）\n\n要求：\n1. 简要描述整体趋势\n2. 指出关键变化点\n3. 给出趋势预判', 'local', 'qwen-turbo', 0.30, 500, 'paragraphs', 1, '你是一位资深数据分析师，擅长从数据中发现趋势和规律。请用客观、专业的语言撰写研判摘要。');

-- 综合研判结论
INSERT INTO t_ai_prompt_config (id, indicator_id, prompt_template, datasource_ids, model_provider, model_name, temperature, max_tokens, output_format, review_required, system_prompt) VALUES
(2, 23, '请综合分析以下数据，给出综合研判结论：\n\n【基础数据】\n数据总量：{{totalCount}}\n有效数据量：{{validCount}}\n数据有效率：{{validRate}}\n\n【趋势数据】\n环比增长率：{{growthRate}}\n峰值数据量：{{peakValue}}\n\n【区域对比】\n最高值区域：{{maxRegion}}（{{maxValue}}）\n最低值区域：{{minRegion}}（{{minValue}}）\n\n请从以下维度进行分析：\n1. 数据质量评估\n2. 趋势变化分析\n3. 区域差异分析\n4. 综合结论', '[1,2,3,4]', 'local', 'qwen-plus', 0.30, 1000, 'paragraphs', 1, '你是一位资深数据研判专家，擅长从多维度数据中提取关键信息并给出专业的研判结论。分析要客观、全面，结论要有数据支撑。');

-- 风险预警分析
INSERT INTO t_ai_prompt_config (id, indicator_id, prompt_template, datasource_ids, model_provider, model_name, temperature, max_tokens, output_format, review_required, system_prompt) VALUES
(3, 24, '请根据以下数据分析潜在风险：\n\n异常数据量：{{abnormalCount}}\n异常率：{{abnormalRate}}\n\n风险等级阈值：{{riskLevel}}\n\n请识别并分析：\n1. 数据质量风险\n2. 趋势异常风险\n3. 区域不平衡风险\n\n每个风险请说明：\n- 风险描述\n- 影响程度（高/中/低）\n- 建议应对措施', '[1,2]', 'local', 'qwen-plus', 0.40, 800, 'list', 1, '你是一位风险管理专家，擅长从数据中发现潜在风险。风险判断要基于数据事实，影响程度评估要合理，应对措施要具有可操作性。');

-- 改进建议
INSERT INTO t_ai_prompt_config (id, indicator_id, prompt_template, datasource_ids, model_provider, model_name, temperature, max_tokens, output_format, review_required, system_prompt) VALUES
(4, 25, '基于以下数据分析结果，提出改进建议：\n\n数据有效率：{{validRate}}\n异常率：{{abnormalRate}}\n环比增长率：{{growthRate}}\n\n请从以下方面提出建议：\n1. 数据采集环节\n2. 数据处理流程\n3. 数据质量管控\n4. 分析能力建设\n\n要求：\n- 建议数量：{{suggestionCount}}条\n- 每条建议需说明预期效果\n- 建议要具体可执行', '[1,2,3]', 'local', 'qwen-turbo', 0.50, 600, 'list', 1, '你是一位数据治理专家，擅长发现数据管理中的问题并提出改进建议。建议要务实、可操作，避免空泛的套话。');

-- =====================================================
-- 7. AI 审核记录（模拟数据）
-- =====================================================
INSERT INTO t_ai_review (id, template_id, indicator_uid, indicator_name, generated_content, status, review_comment, reviewer, review_at) VALUES
(1, 1, 'ai_summary_001', '综合研判结论', '经综合分析，本季度数据整体呈现稳定上升趋势。数据总量达到128,456条，较上季度增长12.5%，数据有效率为89.7%，保持在合理水平。华东区域表现最为突出，数据量占比达到30.2%。建议继续关注西北区域的数据采集工作。', 'approved', '分析全面，结论有据', '李审核', '2026-04-15 14:30:00'),
(2, 1, 'ai_risk_001', '风险预警分析', '发现以下潜在风险：\n1. 异常数据集中在3月中旬，可能与系统升级有关（影响程度：中）\n2. 西北区域数据量持续偏低，存在数据盲区风险（影响程度：高）\n3. 数据有效率虽在达标线以上，但呈现缓慢下降趋势（影响程度：低）', 'approved', '风险识别准确，建议补充应对措施', '李审核', '2026-04-15 15:00:00'),
(3, 2, 'ai_suggestion_001', '改进建议', '1. 建立异常数据自动标记机制，预期可降低异常率1-2个百分点\n2. 加强西北区域数据采集点建设，预期可提升该区域数据量30%以上\n3. 引入数据质量实时监控看板，预期可缩短问题发现时间50%', 'pending', NULL, NULL, NULL),
(4, 2, 'ai_summary_002', '综合研判结论', '2026年Q1数据研判报告显示：整体运行态势良好，各项核心指标均在正常范围内。数据规模持续扩大，质量管控初见成效。区域发展不均衡问题依然存在，需重点关注薄弱环节建设。', 'rejected', '过于笼统，需要更多具体数据支撑', '王审核', '2026-04-14 10:20:00'),
(5, 3, 'ai_key_findings_001', '关键发现', '本月异常数据主要集中在以下三个方面：\n1. 时间维度：3月12日-18日期间异常数据占比达全月的65%\n2. 区域维度：华东区域异常量最高但异常率最低，说明基数大\n3. 类型维度：类型C数据异常率显著高于其他类型，达到5.8%', 'pending', NULL, NULL, NULL);
