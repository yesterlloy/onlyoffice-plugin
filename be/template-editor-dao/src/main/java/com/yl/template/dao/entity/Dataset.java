package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 数据集实体
 */
@Data
@TableName("t_dataset")
public class Dataset implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String datasetId;

    private String code;

    private String name;

    private String datasourceCode;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
