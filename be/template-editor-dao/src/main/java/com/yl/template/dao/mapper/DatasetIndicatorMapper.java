package com.yl.template.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yl.template.dao.entity.DatasetIndicator;
import org.apache.ibatis.annotations.Mapper;

/**
 * 数据集与指标关联 Mapper
 */
@Mapper
public interface DatasetIndicatorMapper extends BaseMapper<DatasetIndicator> {
}
