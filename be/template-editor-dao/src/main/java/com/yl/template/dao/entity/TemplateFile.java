package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 模板文件实体
 */
@Data
@TableName("t_template_file")
public class TemplateFile implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String description;

    private String ossKey;

    private String ossUrl;

    private String rawContent;

    private String indicatorMap;

    private Long fileSize;

    private Integer version;

    private Integer status;

    private String createdBy;

    private LocalDateTime createdAt;

    private String updatedBy;

    private LocalDateTime updatedAt;
}