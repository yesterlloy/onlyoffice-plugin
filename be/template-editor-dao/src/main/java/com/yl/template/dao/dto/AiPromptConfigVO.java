package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * AI提示词配置VO
 */
@Data
public class AiPromptConfigVO implements Serializable {

    private Long id;

    private Long indicatorId;

    private String promptTemplate;

    private String datasourceIds;

    private String modelProvider;

    private String modelName;

    private BigDecimal temperature;

    private Integer maxTokens;

    private String outputFormat;

    private Boolean reviewRequired;

    private String systemPrompt;
}