package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 数据接口注册实体
 */
@Data
@TableName("t_datasource_registry")
public class DatasourceRegistry implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String datasourceId;

    private String name;

    private String description;

    private String apiUrl;

    private String method;

    private String authType;

    private String authConfig;

    private Integer timeout;

    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}