package com.yl.template.service.indicator.impl;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.dao.dto.IndicatorCategoryVO;
import com.yl.template.dao.dto.IndicatorMetadataVO;
import com.yl.template.dao.entity.IndicatorCategory;
import com.yl.template.dao.entity.IndicatorMetadata;
import com.yl.template.dao.mapper.IndicatorCategoryMapper;
import com.yl.template.dao.mapper.IndicatorMetadataMapper;
import com.yl.template.service.indicator.IndicatorCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 指标分类服务实现
 */
@Service
@RequiredArgsConstructor
public class IndicatorCategoryServiceImpl implements IndicatorCategoryService {

    private final IndicatorCategoryMapper categoryMapper;
    private final IndicatorMetadataMapper metadataMapper;

    @Override
    public List<IndicatorCategoryVO> getCategoryTreeWithIndicators() {
        // 查询所有分类
        List<IndicatorCategory> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<IndicatorCategory>()
                        .orderByAsc(IndicatorCategory::getSortOrder)
        );

        // 查询所有指标
        List<IndicatorMetadata> allIndicators = metadataMapper.selectList(
                new LambdaQueryWrapper<IndicatorMetadata>()
                        .orderByAsc(IndicatorMetadata::getSortOrder)
        );

        // 按分类ID分组
        Map<Long, List<IndicatorMetadata>> indicatorMap = allIndicators.stream()
                .collect(Collectors.groupingBy(IndicatorMetadata::getCategoryId));

        // 组装结果
        List<IndicatorCategoryVO> result = new ArrayList<>();
        for (IndicatorCategory category : categories) {
            IndicatorCategoryVO vo = new IndicatorCategoryVO();
            vo.setId(category.getId());
            vo.setName(category.getName());
            vo.setIcon(category.getIcon());
            vo.setSortOrder(category.getSortOrder());

            List<IndicatorMetadata> indicators = indicatorMap.getOrDefault(category.getId(), new ArrayList<>());
            vo.setIndicators(indicators.stream().map(this::toMetadataVO).collect(Collectors.toList()));

            result.add(vo);
        }

        return result;
    }

    @Override
    public List<IndicatorCategoryVO> getAllCategories() {
        List<IndicatorCategory> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<IndicatorCategory>()
                        .orderByAsc(IndicatorCategory::getSortOrder)
        );

        return categories.stream().map(c -> {
            IndicatorCategoryVO vo = new IndicatorCategoryVO();
            vo.setId(c.getId());
            vo.setName(c.getName());
            vo.setIcon(c.getIcon());
            vo.setSortOrder(c.getSortOrder());
            return vo;
        }).collect(Collectors.toList());
    }

    private IndicatorMetadataVO toMetadataVO(IndicatorMetadata entity) {
        IndicatorMetadataVO vo = new IndicatorMetadataVO();
        vo.setId(entity.getId());
        vo.setCategoryId(entity.getCategoryId());
        vo.setIndicatorId(entity.getIndicatorId());
        vo.setCode(entity.getCode());
        vo.setField(entity.getField());
        vo.setName(entity.getName());
        vo.setType(entity.getType());
        vo.setChartType(entity.getChartType());
        vo.setUnit(entity.getUnit());
        vo.setPreviewValue(entity.getPreviewValue());
        vo.setSortOrder(entity.getSortOrder());
        return vo;
    }
}