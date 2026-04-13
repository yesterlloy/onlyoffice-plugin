package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 模板文件VO
 */
@Data
public class TemplateFileVO implements Serializable {

    private Long id;

    private String name;

    private String description;

    private String ossUrl;

    private Long fileSize;

    private Integer version;

    private Integer status;

    private String createdBy;

    private String createdAt;
}