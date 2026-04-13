package com.yl.template.dao.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * 模板保存DTO
 */
@Data
public class TemplateSaveDTO implements Serializable {

    private String name;

    private String description;

    private String content;

    private String createdBy;

    private java.util.List<IndicatorTagDTO> indicators;

    @Data
    public static class IndicatorTagDTO implements Serializable {
        private String uid;
        private String indicatorId;
        private Map<String, Object> paramValues;
    }
}