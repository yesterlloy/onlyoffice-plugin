package com.yl.template.service.indicator;

import com.yl.template.dao.dto.IndicatorCategoryVO;

import java.util.List;

/**
 * 指标分类服务接口
 */
public interface IndicatorCategoryService {

    /**
     * 获取完整指标分类树（含分类下的指标列表）
     */
    List<IndicatorCategoryVO> getCategoryTreeWithIndicators();

    /**
     * 获取所有分类（不含指标）
     */
    List<IndicatorCategoryVO> getAllCategories();
}