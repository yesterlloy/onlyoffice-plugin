package com.yl.template.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yl.template.dao.entity.AiPromptConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI提示词配置 Mapper
 */
@Mapper
public interface AiPromptConfigMapper extends BaseMapper<AiPromptConfig> {
}