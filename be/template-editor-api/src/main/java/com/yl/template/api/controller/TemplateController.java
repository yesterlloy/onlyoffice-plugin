package com.yl.template.api.controller;

import com.yl.template.common.response.PageResult;
import com.yl.template.common.response.Result;
import com.yl.template.dao.dto.TemplateFileVO;
import com.yl.template.dao.dto.TemplateSaveDTO;
import com.yl.template.service.template.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.OutputStream;

/**
 * 模板管理 Controller
 */
@Tag(name = "模板管理", description = "模板 CRUD、预览、下载")
@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @Operation(summary = "获取模板列表", description = "分页获取模板列表")
    @GetMapping
    public Result<PageResult<TemplateFileVO>> listTemplates(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status) {
        return Result.success(templateService.listTemplates(page, size, status));
    }

    @Operation(summary = "获取模板详情", description = "获取模板详情（含 OSS URL）")
    @GetMapping("/{id}")
    public Result<TemplateFileVO> getTemplateDetail(@PathVariable Long id) {
        return Result.success(templateService.getTemplateDetail(id));
    }

    @Operation(summary = "创建模板", description = "创建新模板")
    @PostMapping
    public Result<TemplateFileVO> createTemplate(@RequestBody TemplateSaveDTO dto) {
        return Result.success(templateService.createTemplate(dto));
    }

    @Operation(summary = "更新模板", description = "更新模板内容")
    @PutMapping("/{id}")
    public Result<TemplateFileVO> updateTemplate(@PathVariable Long id, @RequestBody TemplateSaveDTO dto) {
        return Result.success(templateService.updateTemplate(id, dto));
    }

    @Operation(summary = "删除模板", description = "删除模板（软删除）")
    @DeleteMapping("/{id}")
    public Result<Void> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return Result.success();
    }

    @Operation(summary = "下载模板文件", description = "下载模板原始文件")
    @GetMapping("/{id}/download")
    public void downloadTemplate(@PathVariable Long id, HttpServletResponse response) {
        try {
            byte[] content = templateService.getTemplateContent(id);
            TemplateFileVO detail = templateService.getTemplateDetail(id);

            response.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + detail.getName() + ".docx\"");
            response.setContentLength(content.length);

            OutputStream out = response.getOutputStream();
            out.write(content);
            out.flush();
        } catch (Exception e) {
            throw new RuntimeException("下载模板失败", e);
        }
    }
}