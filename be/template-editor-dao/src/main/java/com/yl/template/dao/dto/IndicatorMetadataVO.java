package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 指标元数据VO
 */
@Data
public class IndicatorMetadataVO implements Serializable {

    private Long id;

    private Long categoryId;

    private String indicatorId;

    private String code;

    private String field;

    private String name;

    private String type;

    private String chartType;

    private String unit;

    private String previewValue;

    private Integer sortOrder;
}