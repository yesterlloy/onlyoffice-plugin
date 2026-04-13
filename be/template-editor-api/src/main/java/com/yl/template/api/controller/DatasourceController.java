package com.yl.template.api.controller;

import com.yl.template.common.response.Result;
import com.yl.template.dao.dto.DatasourceVO;
import com.yl.template.service.datasource.DatasourceInvokeService;
import com.yl.template.service.datasource.DatasourceRegistryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据接口 Controller
 */
@Tag(name = "数据接口", description = "数据接口注册、调用代理")
@RestController
@RequestMapping("/api/datasources")
@RequiredArgsConstructor
public class DatasourceController {

    private final DatasourceRegistryService registryService;
    private final DatasourceInvokeService invokeService;

    @Operation(summary = "获取数据接口列表", description = "获取所有已注册的数据接口列表")
    @GetMapping
    public Result<List<DatasourceVO>> getAllDatasources() {
        return Result.success(registryService.getAllDatasources());
    }

    @Operation(summary = "获取数据接口详情", description = "获取单个数据接口详情")
    @GetMapping("/{datasourceId}")
    public Result<DatasourceVO> getDatasourceDetail(@PathVariable String datasourceId) {
        return Result.success(registryService.getDatasourceDetail(datasourceId));
    }

    @Operation(summary = "注册数据接口", description = "注册新的数据接口")
    @PostMapping
    public Result<DatasourceVO> registerDatasource(@RequestBody DatasourceRegistryService.DatasourceCreateDTO dto) {
        return Result.success(registryService.registerDatasource(dto));
    }

    @Operation(summary = "更新数据接口", description = "更新数据接口配置")
    @PutMapping("/{datasourceId}")
    public Result<DatasourceVO> updateDatasource(
            @PathVariable String datasourceId,
            @RequestBody DatasourceRegistryService.DatasourceUpdateDTO dto) {
        return Result.success(registryService.updateDatasource(datasourceId, dto));
    }

    @Operation(summary = "删除数据接口", description = "删除数据接口")
    @DeleteMapping("/{datasourceId}")
    public Result<Void> deleteDatasource(@PathVariable String datasourceId) {
        registryService.deleteDatasource(datasourceId);
        return Result.success();
    }

    @Operation(summary = "调用数据接口", description = "调用数据接口获取数据")
    @PostMapping("/{datasourceId}/invoke")
    public Result<Map<String, Object>> invokeDatasource(
            @PathVariable String datasourceId,
            @RequestBody(required = false) Map<String, Object> params) {
        if (params == null) {
            params = new HashMap<>();
        }
        return Result.success(invokeService.invoke(datasourceId, params));
    }

    @Operation(summary = "测试接口连通性", description = "测试数据接口连通性")
    @GetMapping("/{datasourceId}/test")
    public Result<Boolean> testConnection(@PathVariable String datasourceId) {
        return Result.success(invokeService.testConnection(datasourceId));
    }
}