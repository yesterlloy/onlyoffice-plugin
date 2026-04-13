package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 指标参数定义实体
 */
@Data
@TableName("t_indicator_params")
public class IndicatorParams implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long indicatorId;

    private String paramKey;

    private String paramLabel;

    private String inputType;

    private String defaultValue;

    private String options;

    private String optionsSource;

    private BigDecimal minValue;

    private BigDecimal maxValue;

    private Integer required;

    private Integer sortOrder;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}