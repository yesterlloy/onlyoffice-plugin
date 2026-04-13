package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AI提示词配置实体
 */
@Data
@TableName("t_ai_prompt_config")
public class AiPromptConfig implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long indicatorId;

    private String promptTemplate;

    private String datasourceIds;

    private String modelProvider;

    private String modelName;

    private BigDecimal temperature;

    private Integer maxTokens;

    private String outputFormat;

    private Integer reviewRequired;

    private String systemPrompt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}