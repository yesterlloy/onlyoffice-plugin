package com.yl.template.api.controller;

import com.yl.template.common.response.Result;
import com.yl.template.dao.dto.DatasetVO;
import com.yl.template.service.dataset.DatasetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 数据集管理 Controller
 */
@Tag(name = "数据集管理", description = "数据集及其关联指标查询")
@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
public class DatasetController {

    private final DatasetService datasetService;

    @Operation(summary = "获取所有数据集", description = "获取系统内所有数据集及其包含的指标列表")
    @GetMapping
    public Result<List<DatasetVO>> getAllDatasets() {
        return Result.success(datasetService.getAllDatasets());
    }
}
