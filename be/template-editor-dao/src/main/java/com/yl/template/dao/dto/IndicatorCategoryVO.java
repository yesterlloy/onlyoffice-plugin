package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 指标分类VO（含指标列表）
 */
@Data
public class IndicatorCategoryVO implements Serializable {

    private Long id;

    private String name;

    private String icon;

    private Integer sortOrder;

    private List<IndicatorMetadataVO> indicators;
}