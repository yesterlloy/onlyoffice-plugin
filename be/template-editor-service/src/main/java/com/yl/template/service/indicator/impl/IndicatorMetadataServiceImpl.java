package com.yl.template.service.indicator.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.dao.dto.IndicatorDetailVO;
import com.yl.template.dao.dto.IndicatorParamVO;
import com.yl.template.dao.entity.IndicatorMetadata;
import com.yl.template.dao.entity.IndicatorParams;
import com.yl.template.dao.mapper.IndicatorMetadataMapper;
import com.yl.template.dao.mapper.IndicatorParamsMapper;
import com.yl.template.service.indicator.IndicatorMetadataService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 指标元数据服务实现
 */
@Service
@RequiredArgsConstructor
public class IndicatorMetadataServiceImpl implements IndicatorMetadataService {

    private final IndicatorMetadataMapper metadataMapper;
    private final IndicatorParamsMapper paramsMapper;

    @Override
    public IndicatorDetailVO getIndicatorDetail(String indicatorId) {
        IndicatorMetadata metadata = metadataMapper.selectOne(
                new LambdaQueryWrapper<IndicatorMetadata>()
                        .eq(IndicatorMetadata::getIndicatorId, indicatorId)
        );

        if (metadata == null) {
            throw new BusinessException("指标不存在: " + indicatorId);
        }

        IndicatorDetailVO vo = new IndicatorDetailVO();
        vo.setId(metadata.getId());
        vo.setIndicatorId(metadata.getIndicatorId());
        vo.setCode(metadata.getCode());
        vo.setField(metadata.getField());
        vo.setName(metadata.getName());
        vo.setType(metadata.getType());
        vo.setChartType(metadata.getChartType());
        vo.setUnit(metadata.getUnit());
        vo.setPreviewValue(metadata.getPreviewValue());

        // 获取参数定义
        vo.setParams(getIndicatorParams(metadata.getId()));

        return vo;
    }

    @Override
    public List<IndicatorParamVO> getIndicatorParams(Long metadataId) {
        List<IndicatorParams> params = paramsMapper.selectList(
                new LambdaQueryWrapper<IndicatorParams>()
                        .eq(IndicatorParams::getIndicatorId, metadataId)
                        .orderByAsc(IndicatorParams::getSortOrder)
        );

        return params.stream().map(this::toParamVO).collect(Collectors.toList());
    }

    @Override
    public List<IndicatorDetailVO> getIndicatorsByType(String type) {
        List<IndicatorMetadata> list = metadataMapper.selectList(
                new LambdaQueryWrapper<IndicatorMetadata>()
                        .eq(IndicatorMetadata::getType, type)
                        .orderByAsc(IndicatorMetadata::getSortOrder)
        );

        return list.stream().map(m -> {
            IndicatorDetailVO vo = new IndicatorDetailVO();
            vo.setId(m.getId());
            vo.setIndicatorId(m.getIndicatorId());
            vo.setCode(m.getCode());
            vo.setField(m.getField());
            vo.setName(m.getName());
            vo.setType(m.getType());
            vo.setChartType(m.getChartType());
            vo.setUnit(m.getUnit());
            vo.setPreviewValue(m.getPreviewValue());
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public Map<String, IndicatorDetailVO> batchGetIndicatorDetail(List<String> indicatorIds) {
        if (indicatorIds == null || indicatorIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<IndicatorMetadata> list = metadataMapper.selectList(
                new LambdaQueryWrapper<IndicatorMetadata>()
                        .in(IndicatorMetadata::getIndicatorId, indicatorIds)
        );

        Map<String, IndicatorDetailVO> result = new HashMap<>();
        for (IndicatorMetadata m : list) {
            IndicatorDetailVO vo = new IndicatorDetailVO();
            vo.setId(m.getId());
            vo.setIndicatorId(m.getIndicatorId());
            vo.setCode(m.getCode());
            vo.setField(m.getField());
            vo.setName(m.getName());
            vo.setType(m.getType());
            vo.setChartType(m.getChartType());
            vo.setUnit(m.getUnit());
            vo.setPreviewValue(m.getPreviewValue());
            result.put(m.getIndicatorId(), vo);
        }

        return result;
    }

    private IndicatorParamVO toParamVO(IndicatorParams entity) {
        IndicatorParamVO vo = new IndicatorParamVO();
        vo.setParamKey(entity.getParamKey());
        vo.setParamLabel(entity.getParamLabel());
        vo.setInputType(entity.getInputType());
        vo.setDefaultValue(parseDefaultValue(entity.getDefaultValue(), entity.getInputType()));
        vo.setOptionsSource(entity.getOptionsSource());
        vo.setMinValue(entity.getMinValue());
        vo.setMaxValue(entity.getMaxValue());
        vo.setRequired(entity.getRequired() != null && entity.getRequired() == 1);

        // 解析 options JSON
        if (entity.getOptions() != null && !entity.getOptions().isEmpty()) {
            try {
                List<String> options = JSON.parseArray(entity.getOptions(), String.class);
                vo.setOptions(options);
            } catch (Exception e) {
                vo.setOptions(new ArrayList<>());
            }
        } else {
            vo.setOptions(new ArrayList<>());
        }

        return vo;
    }

    private Object parseDefaultValue(String value, String inputType) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        switch (inputType) {
            case "number":
                try {
                    return Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    return value;
                }
            case "switch":
                return "true".equalsIgnoreCase(value);
            case "multiselect":
                try {
                    return JSON.parseArray(value, String.class);
                } catch (Exception e) {
                    return new ArrayList<>();
                }
            default:
                return value;
        }
    }
}