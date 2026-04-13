package com.yl.template.api.controller;

import com.yl.template.common.response.Result;
import com.yl.template.dao.dto.IndicatorCategoryVO;
import com.yl.template.dao.dto.IndicatorDetailVO;
import com.yl.template.dao.dto.IndicatorParamVO;
import com.yl.template.service.indicator.IndicatorCategoryService;
import com.yl.template.service.indicator.IndicatorMetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 指标管理 Controller
 */
@Tag(name = "指标管理", description = "指标分类、指标元数据、参数定义")
@RestController
@RequestMapping("/api/indicators")
@RequiredArgsConstructor
public class IndicatorController {

    private final IndicatorCategoryService categoryService;
    private final IndicatorMetadataService metadataService;

    @Operation(summary = "获取指标分类树", description = "获取完整指标分类树（含分类下的指标列表）")
    @GetMapping("/categories")
    public Result<List<IndicatorCategoryVO>> getCategoryTree() {
        return Result.success(categoryService.getCategoryTreeWithIndicators());
    }

    @Operation(summary = "获取单个指标详情", description = "根据指标ID获取完整详情（含完整参数定义）")
    @GetMapping("/{indicatorId}")
    public Result<IndicatorDetailVO> getIndicatorDetail(@PathVariable String indicatorId) {
        return Result.success(metadataService.getIndicatorDetail(indicatorId));
    }

    @Operation(summary = "获取指标参数定义", description = "获取指标的参数定义列表")
    @GetMapping("/{indicatorId}/params")
    public Result<List<IndicatorParamVO>> getIndicatorParams(@PathVariable String indicatorId) {
        IndicatorDetailVO detail = metadataService.getIndicatorDetail(indicatorId);
        return Result.success(detail.getParams());
    }

    @Operation(summary = "按类型筛选指标", description = "根据类型筛选指标列表")
    @GetMapping("/type/{type}")
    public Result<List<IndicatorDetailVO>> getIndicatorsByType(@PathVariable String type) {
        return Result.success(metadataService.getIndicatorsByType(type));
    }
}