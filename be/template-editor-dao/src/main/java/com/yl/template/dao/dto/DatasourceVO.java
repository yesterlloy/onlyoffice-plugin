package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 数据接口VO
 */
@Data
public class DatasourceVO implements Serializable {

    private String datasourceId;

    private String name;

    private String description;

    private String apiUrl;

    private String method;

    private Integer status;
}