package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 指标元数据实体
 */
@Data
@TableName("t_indicator_metadata")
public class IndicatorMetadata implements Serializable {

    @TableId(type = IdType.AUTO)
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

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}