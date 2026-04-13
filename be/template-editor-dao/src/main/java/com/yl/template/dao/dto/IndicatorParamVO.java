package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * 指标参数定义VO
 */
@Data
public class IndicatorParamVO implements Serializable {

    private String paramKey;

    private String paramLabel;

    private String inputType;

    private Object defaultValue;

    private List<String> options;

    private String optionsSource;

    private BigDecimal minValue;

    private BigDecimal maxValue;

    private Boolean required;
}