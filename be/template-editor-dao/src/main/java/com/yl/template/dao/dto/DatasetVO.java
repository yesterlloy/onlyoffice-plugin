package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 数据集VO
 */
@Data
public class DatasetVO implements Serializable {

    private String id;

    private String code;

    private String name;

    private String datasourceCode;

    private List<IndicatorMetadataVO> indicators;
}
