package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 指标详情VO（含完整参数定义）
 */
@Data
public class IndicatorDetailVO implements Serializable {

    private Long id;

    private String indicatorId;

    private String code;

    private String field;

    private String name;

    private String type;

    private String chartType;

    private String unit;

    private String previewValue;

    private List<IndicatorParamVO> params;
}