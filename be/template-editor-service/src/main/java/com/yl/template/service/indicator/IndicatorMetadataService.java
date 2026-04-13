package com.yl.template.service.indicator;

import com.yl.template.dao.dto.IndicatorDetailVO;
import com.yl.template.dao.dto.IndicatorParamVO;

import java.util.List;
import java.util.Map;

/**
 * 指标元数据服务接口
 */
public interface IndicatorMetadataService {

    /**
     * 根据指标ID获取完整详情（含参数定义）
     */
    IndicatorDetailVO getIndicatorDetail(String indicatorId);

    /**
     * 获取指标的参数定义列表
     */
    List<IndicatorParamVO> getIndicatorParams(Long metadataId);

    /**
     * 根据类型筛选指标
     */
    List<IndicatorDetailVO> getIndicatorsByType(String type);

    /**
     * 批量获取指标详情
     */
    Map<String, IndicatorDetailVO> batchGetIndicatorDetail(List<String> indicatorIds);
}