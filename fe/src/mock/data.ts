/**
 * Mock 数据 - 指标分类、指标元数据、参数定义等
 * 用于前端功能联调，无需启动后端
 */

import type { IndicatorCategory, IndicatorDetail, IndicatorParam, Datasource, TemplateFile } from '@/types'

// ============ 指标分类数据 ============

export const mockIndicatorCategories: IndicatorCategory[] = [
  {
    id: 1,
    name: '基础数据',
    icon: '📊',
    sortOrder: 1,
    indicators: [
      {
        id: 101,
        categoryId: 1,
        indicatorId: 'year',
        code: 'JK4816',
        field: 'year',
        name: '年份',
        type: 'text',
        previewValue: '2024',
        sortOrder: 1,
      },
      {
        id: 102,
        categoryId: 1,
        indicatorId: 'period',
        code: 'JK4816',
        field: 'period',
        name: '统计周期',
        type: 'text',
        previewValue: '第一季度',
        sortOrder: 2,
      },
      {
        id: 103,
        categoryId: 1,
        indicatorId: 'area',
        code: 'JK4816',
        field: 'area',
        name: '区域',
        type: 'text',
        previewValue: '全市',
        sortOrder: 3,
      },
      {
        id: 104,
        categoryId: 1,
        indicatorId: 'work_count',
        code: 'JK4816',
        field: 'work_count',
        name: '受理总量',
        type: 'number',
        unit: '宗',
        previewValue: '12580',
        sortOrder: 4,
      },
      {
        id: 105,
        categoryId: 1,
        indicatorId: 'work_count_prev',
        code: 'JK4816',
        field: 'work_count_prev',
        name: '上期受理总量',
        type: 'number',
        unit: '宗',
        previewValue: '11200',
        sortOrder: 5,
      },
      {
        id: 106,
        categoryId: 1,
        indicatorId: 'complete_rate',
        code: 'JK4816',
        field: 'complete_rate',
        name: '办结率',
        type: 'percent',
        unit: '%',
        previewValue: '92.5',
        sortOrder: 6,
      },
    ],
  },
  {
    id: 2,
    name: '诉求热点',
    icon: '🔥',
    sortOrder: 2,
    indicators: [
      {
        id: 201,
        categoryId: 2,
        indicatorId: 'top_types_chart',
        code: 'JK3008',
        field: 'top_types',
        name: '诉求类型分布图',
        type: 'chart',
        chartType: 'pie',
        sortOrder: 1,
      },
      {
        id: 202,
        categoryId: 2,
        indicatorId: 'top_areas_chart',
        code: 'JK3008',
        field: 'top_areas',
        name: '区域分布图',
        type: 'chart',
        chartType: 'bar',
        sortOrder: 2,
      },
      {
        id: 203,
        categoryId: 2,
        indicatorId: 'trend_chart',
        code: 'JK3009',
        field: 'trend',
        name: '诉求趋势图',
        type: 'chart',
        chartType: 'line',
        sortOrder: 3,
      },
      {
        id: 204,
        categoryId: 2,
        indicatorId: 'top_type_name',
        code: 'JK4816',
        field: 'top_type_name',
        name: '诉求热点名称',
        type: 'text',
        previewValue: '城市管理类',
        sortOrder: 4,
      },
      {
        id: 205,
        categoryId: 2,
        indicatorId: 'top_type_count',
        code: 'JK4816',
        field: 'top_type_count',
        name: '诉求热点数量',
        type: 'number',
        unit: '宗',
        previewValue: '4580',
        sortOrder: 5,
      },
    ],
  },
  {
    id: 3,
    name: '研判分析',
    icon: '🔍',
    sortOrder: 3,
    indicators: [
      {
        id: 301,
        categoryId: 3,
        indicatorId: 'overview_ai',
        code: 'AI001',
        field: 'overview',
        name: '本期概况分析',
        type: 'ai_generate',
        sortOrder: 1,
      },
      {
        id: 302,
        categoryId: 3,
        indicatorId: 'hotspot_ai',
        code: 'AI002',
        field: 'hotspot_analysis',
        name: '热点诉求分析',
        type: 'ai_generate',
        sortOrder: 2,
      },
      {
        id: 303,
        categoryId: 3,
        indicatorId: 'suggestion_ai',
        code: 'AI003',
        field: 'suggestion',
        name: '工作建议',
        type: 'ai_generate',
        sortOrder: 3,
      },
      {
        id: 304,
        categoryId: 3,
        indicatorId: 'summary_ai',
        code: 'AI004',
        field: 'summary',
        name: '本期总结',
        type: 'ai_generate',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 4,
    name: '对比分析',
    icon: '📈',
    sortOrder: 4,
    indicators: [
      {
        id: 401,
        categoryId: 4,
        indicatorId: 'work_compare',
        code: 'JK4816',
        field: 'work_compare',
        name: '受理量环比变化',
        type: 'number',
        unit: '%',
        previewValue: '+12.3',
        sortOrder: 1,
      },
      {
        id: 402,
        categoryId: 4,
        indicatorId: 'compare_chart',
        code: 'JK3010',
        field: 'compare',
        name: '本期与上期对比图',
        type: 'chart',
        chartType: 'bar',
        sortOrder: 2,
      },
      {
        id: 403,
        categoryId: 4,
        indicatorId: 'rate_compare',
        code: 'JK4816',
        field: 'rate_compare',
        name: '办结率环比变化',
        type: 'number',
        unit: '%',
        previewValue: '+5.2',
        sortOrder: 3,
      },
    ],
  },
  {
    id: 5,
    name: '条件判断',
    icon: '⚙️',
    sortOrder: 5,
    indicators: [
      {
        id: 501,
        categoryId: 5,
        indicatorId: 'has_increase',
        code: 'COND001',
        field: 'has_increase',
        name: '是否有增长',
        type: 'condition',
        sortOrder: 1,
      },
      {
        id: 502,
        categoryId: 5,
        indicatorId: 'is_high_rate',
        code: 'COND002',
        field: 'is_high_rate',
        name: '办结率是否达标',
        type: 'condition',
        sortOrder: 2,
      },
    ],
  },
]

// ============ 指标参数定义 ============

export const mockIndicatorParams: Record<string, IndicatorParam[]> = {
  // 图表类指标参数
  'top_types_chart': [
    {
      paramKey: 'dataSource',
      paramLabel: '数据接口',
      inputType: 'select',
      defaultValue: 'JK195981497926161032',
      options: ['JK195981497926161032', 'JK195981497926161033'],
      required: true,
    },
    {
      paramKey: 'title',
      paramLabel: '图表标题',
      inputType: 'text',
      defaultValue: '诉求类型分布',
      required: false,
    },
    {
      paramKey: 'showLegend',
      paramLabel: '显示图例',
      inputType: 'switch',
      defaultValue: true,
      required: false,
    },
    {
      paramKey: 'topN',
      paramLabel: '显示数量',
      inputType: 'number',
      defaultValue: 10,
      minValue: 5,
      maxValue: 20,
      required: false,
    },
  ],
  'top_areas_chart': [
    {
      paramKey: 'dataSource',
      paramLabel: '数据接口',
      inputType: 'select',
      defaultValue: 'JK195981497926161032',
      options: ['JK195981497926161032', 'JK195981497926161033'],
      required: true,
    },
    {
      paramKey: 'title',
      paramLabel: '图表标题',
      inputType: 'text',
      defaultValue: '区域分布',
      required: false,
    },
  ],
  'trend_chart': [
    {
      paramKey: 'dataSource',
      paramLabel: '数据接口',
      inputType: 'select',
      defaultValue: 'JK195981497926161034',
      options: ['JK195981497926161034', 'JK195981497926161035'],
      required: true,
    },
    {
      paramKey: 'periodCount',
      paramLabel: '周期数',
      inputType: 'number',
      defaultValue: 12,
      minValue: 6,
      maxValue: 24,
      required: false,
    },
  ],
  'compare_chart': [
    {
      paramKey: 'dataSource',
      paramLabel: '数据接口',
      inputType: 'select',
      defaultValue: 'JK195981497926161032',
      required: true,
    },
    {
      paramKey: 'compareFields',
      paramLabel: '对比字段',
      inputType: 'multiselect',
      defaultValue: ['work_count', 'complete_rate'],
      options: ['work_count', 'complete_rate', 'top_type_count'],
      required: true,
    },
  ],

  // 数值类指标参数
  'work_count': [
    {
      paramKey: 'dataSource',
      paramLabel: '数据接口',
      inputType: 'select',
      defaultValue: 'JK195981497926161032',
      options: ['JK195981497926161032', 'JK195981497926161033'],
      required: true,
    },
    {
      paramKey: 'unit',
      paramLabel: '单位',
      inputType: 'select',
      defaultValue: '宗',
      options: ['宗', '件', '万宗', '万件'],
      required: false,
    },
    {
      paramKey: 'decimal',
      paramLabel: '小数位数',
      inputType: 'number',
      defaultValue: 0,
      minValue: 0,
      maxValue: 4,
      required: false,
    },
  ],
  'complete_rate': [
    {
      paramKey: 'dataSource',
      paramLabel: '数据接口',
      inputType: 'select',
      defaultValue: 'JK195981497926161032',
      required: true,
    },
    {
      paramKey: 'decimal',
      paramLabel: '小数位数',
      inputType: 'number',
      defaultValue: 1,
      minValue: 0,
      maxValue: 2,
      required: false,
    },
  ],

  // AI 生成类指标参数
  'overview_ai': [
    {
      paramKey: 'promptTemplate',
      paramLabel: '提示词模板',
      inputType: 'textarea',
      defaultValue: '请根据以下数据，分析{period}{area}诉求受理的整体情况：\n\n受理总量：{data.work_count}宗\n办结率：{data.complete_rate}%\n上期受理量：{data.work_count_prev}宗\n\n请从受理量变化、办结情况等方面进行简要分析，字数控制在200字以内。',
      required: true,
    },
    {
      paramKey: 'modelName',
      paramLabel: '模型名称',
      inputType: 'select',
      defaultValue: 'qwen2.5-14b',
      options: ['qwen2.5-14b', 'qwen2.5-7b', 'deepseek-chat'],
      required: false,
    },
    {
      paramKey: 'temperature',
      paramLabel: '温度参数',
      inputType: 'number',
      defaultValue: 0.3,
      minValue: 0,
      maxValue: 1,
      required: false,
    },
    {
      paramKey: 'maxTokens',
      paramLabel: '最大Token数',
      inputType: 'number',
      defaultValue: 500,
      minValue: 100,
      maxValue: 2000,
      required: false,
    },
  ],
  'hotspot_ai': [
    {
      paramKey: 'promptTemplate',
      paramLabel: '提示词模板',
      inputType: 'textarea',
      defaultValue: '请分析本期诉求热点类型及其特点：\n\n热点类型：{data.top_type_name}\n热点数量：{data.top_type_count}宗\n占比：{data.top_type_rate}%\n\n请分析该热点类型的主要诉求内容、产生原因，字数控制在300字以内。',
      required: true,
    },
    {
      paramKey: 'modelName',
      paramLabel: '模型名称',
      inputType: 'select',
      defaultValue: 'qwen2.5-14b',
      options: ['qwen2.5-14b', 'qwen2.5-7b', 'deepseek-chat'],
      required: false,
    },
    {
      paramKey: 'temperature',
      paramLabel: '温度参数',
      inputType: 'number',
      defaultValue: 0.5,
      minValue: 0,
      maxValue: 1,
      required: false,
    },
  ],
  'suggestion_ai': [
    {
      paramKey: 'promptTemplate',
      paramLabel: '提示词模板',
      inputType: 'textarea',
      defaultValue: '根据本期诉求受理数据和分析结论，请提出3-5条工作建议：\n\n整体分析：{overview}\n热点分析：{hotspot_analysis}\n\n建议应具体、可操作，每条建议控制在50字以内。',
      required: true,
    },
    {
      paramKey: 'modelName',
      paramLabel: '模型名称',
      inputType: 'select',
      defaultValue: 'qwen2.5-14b',
      required: false,
    },
    {
      paramKey: 'temperature',
      paramLabel: '温度参数',
      inputType: 'number',
      defaultValue: 0.7,
      minValue: 0,
      maxValue: 1,
      required: false,
    },
  ],
  'summary_ai': [
    {
      paramKey: 'promptTemplate',
      paramLabel: '提示词模板',
      inputType: 'textarea',
      defaultValue: '请撰写本期数据研判报告的总结段落：\n\n主要数据：受理{data.work_count}宗，办结率{data.complete_rate}%\n环比变化：受理量{data.work_compare}%，办结率{data.rate_compare}%\n\n总结应概括本期整体情况、主要亮点和下一步方向，字数控制在150字以内。',
      required: true,
    },
    {
      paramKey: 'modelName',
      paramLabel: '模型名称',
      inputType: 'select',
      defaultValue: 'qwen2.5-14b',
      required: false,
    },
  ],
}

// ============ 指标详情（含参数） ============

export function getMockIndicatorDetail(indicatorId: string): IndicatorDetail | null {
  // 找到基础指标信息
  for (const category of mockIndicatorCategories) {
    const indicator = category.indicators.find(i => i.indicatorId === indicatorId)
    if (indicator) {
      return {
        ...indicator,
        params: mockIndicatorParams[indicatorId] || [],
      }
    }
  }
  return null
}

// ============ 数据接口 Mock 数据 ============

export const mockDatasources: Datasource[] = [
  {
    datasourceId: 'JK195981497926161032',
    name: '诉求基础数据接口',
    description: '获取诉求受理总量、办结率等基础数据',
    apiUrl: 'http://api.example.com/work/base',
    method: 'GET',
    status: 1,
  },
  {
    datasourceId: 'JK195981497926161033',
    name: '诉求分类数据接口',
    description: '获取诉求分类统计数据',
    apiUrl: 'http://api.example.com/work/types',
    method: 'GET',
    status: 1,
  },
  {
    datasourceId: 'JK195981497926161034',
    name: '诉求趋势数据接口',
    description: '获取诉求月度趋势数据',
    apiUrl: 'http://api.example.com/work/trend',
    method: 'GET',
    status: 1,
  },
  {
    datasourceId: 'JK195981497926161035',
    name: '区域分布数据接口',
    description: '获取各区域诉求分布数据',
    apiUrl: 'http://api.example.com/work/areas',
    method: 'GET',
    status: 1,
  },
]

// 数据接口调用 Mock 返回
export const mockDatasourceInvokeResults: Record<string, any> = {
  'JK195981497926161032': {
    work_count: 12580,
    work_count_prev: 11200,
    complete_rate: 92.5,
    work_compare: 12.3,
    rate_compare: 5.2,
    top_type_name: '城市管理类',
    top_type_count: 4580,
    top_type_rate: 36.3,
    year: '2024',
    period: '第一季度',
    area: '全市',
  },
  'JK195981497926161033': {
    types: [
      { name: '城市管理类', count: 4580, rate: 36.3 },
      { name: '民生保障类', count: 3200, rate: 25.4 },
      { name: '经济发展类', count: 2100, rate: 16.7 },
      { name: '公共服务类', count: 1800, rate: 14.3 },
      { name: '其他', count: 900, rate: 7.1 },
    ],
  },
  'JK195981497926161034': {
    trend: [
      { month: '2024-01', count: 3800 },
      { month: '2024-02', count: 4200 },
      { month: '2024-03', count: 4580 },
    ],
  },
  'JK195981497926161035': {
    areas: [
      { name: 'A区', count: 3500, rate: 27.8 },
      { name: 'B区', count: 2800, rate: 22.3 },
      { name: 'C区', count: 2200, rate: 17.5 },
      { name: 'D区', count: 1800, rate: 14.3 },
      { name: '其他', count: 2280, rate: 18.1 },
    ],
  },
}

// ============ 模板文件 Mock 数据 ============

export const mockTemplates: TemplateFile[] = [
  {
    id: 1,
    name: '数据研判季报模板',
    description: '用于生成季度数据研判分析报告',
    ossUrl: 'https://oss.example.com/templates/季报模板.docx',
    fileSize: 25600,
    version: 1,
    status: 1,
    createdBy: 'admin',
    createdAt: '2024-01-15 10:00:00',
  },
  {
    id: 2,
    name: '诉求热点分析模板',
    description: '用于分析诉求热点类型和分布',
    ossUrl: 'https://oss.example.com/templates/热点分析.docx',
    fileSize: 18500,
    version: 2,
    status: 1,
    createdBy: 'admin',
    createdAt: '2024-02-20 14:30:00',
  },
  {
    id: 3,
    name: '区域对比报告模板',
    description: '用于各区域诉求情况对比分析',
    ossUrl: 'https://oss.example.com/templates/区域对比.docx',
    fileSize: 22000,
    version: 1,
    status: 1,
    createdBy: 'admin',
    createdAt: '2024-03-10 09:00:00',
  },
]

// ============ AI 生成 Mock 结果 ============

export const mockAiResults: Record<string, string> = {
  'overview_ai': '本期全市诉求受理总量为12580宗，较上期增长12.3%，办结率达92.5%，较上期提升5.2个百分点。整体来看，诉求受理量保持增长态势，办结效率稳步提升，诉求处理工作取得较好成效。',
  'hotspot_ai': '本期诉求热点主要集中在城市管理类，共计4580宗，占比36.3%。该类诉求主要涉及市容环境、违建治理、交通秩序等方面。产生原因主要与城市发展快速推进、人口持续增加等因素相关，建议加强城市规划与管理协调。',
  'suggestion_ai': '1. 加强城市管理类诉求的快速响应机制，设立专项处理通道。\n2. 针对热点区域开展专项整治行动，预防同类诉求重复发生。\n3. 完善诉求数据分析体系，建立预警机制。\n4. 加强跨部门协调，提升复杂诉求的处理效率。\n5. 定期开展诉求办理质量评估，持续优化服务流程。',
  'summary_ai': '本期诉求受理工作整体表现良好，受理量稳步增长，办结率持续提升。城市管理类诉求仍为主要热点，需重点关注。建议下一步继续优化处理流程，加强预警预防，提升诉求办理质量和效率，为群众提供更优质的服务。',
}

// ============ 动态选项数据源 ============

export const mockDynamicOptions: Record<string, string[]> = {
  'datasource_list': [
    'JK195981497926161032',
    'JK195981497926161033',
    'JK195981497926161034',
    'JK195981497926161035',
  ],
  'model_list': [
    'qwen2.5-14b',
    'qwen2.5-7b',
    'deepseek-chat',
    'gpt-4o-mini',
  ],
  'unit_list': ['宗', '件', '万宗', '万件', '人次'],
  'area_list': ['全市', 'A区', 'B区', 'C区', 'D区'],
  'period_list': ['第一季度', '第二季度', '第三季度', '第四季度'],
}