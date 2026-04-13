package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * AI审核记录实体
 */
@Data
@TableName("t_ai_review")
public class AiReview implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long templateId;

    private String indicatorUid;

    private String indicatorName;

    private String generatedContent;

    private String status;

    private String reviewComment;

    private String reviewer;

    private LocalDateTime reviewAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}