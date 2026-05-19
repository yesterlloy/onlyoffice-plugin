package com.yl.template.dao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 数据集与指标关联实体
 */
@Data
@TableName("t_dataset_indicator")
public class DatasetIndicator implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String datasetId;

    private String indicatorId;

    private Integer sortOrder;

    private LocalDateTime createdAt;
}
