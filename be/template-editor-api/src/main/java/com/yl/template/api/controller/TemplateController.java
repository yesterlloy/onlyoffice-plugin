package com.yl.template.api.controller;

import com.yl.template.dao.dto.OnlyOfficeCallbackDTO;
import com.yl.template.dao.dto.TemplateFileVO;
import com.yl.template.dao.dto.TemplateSaveDTO;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yl.template.common.response.PageResult;
import com.yl.template.common.response.Result;

import java.util.HashMap;
import java.util.Map;
import com.yl.template.service.template.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import org.springframework.web.multipart.MultipartFile;

/**
 * 模板管理 Controller
 */
@Tag(name = "模板管理", description = "模板 CRUD、预览、下载")
@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @Operation(summary = "OnlyOffice 回调", description = "接收 OnlyOffice 文档保存回调")
    @PostMapping("/{id}/callback")
    public Map<String, Integer> onlyOfficeCallback(@PathVariable Long id, @RequestBody OnlyOfficeCallbackDTO dto) {
        templateService.handleOnlyOfficeCallback(id, dto);
        // OnlyOffice 要求返回 {"error": 0} 表示接收成功
        Map<String, Integer> result = new HashMap<>();
        result.put("error", 0);
        return result;
    }

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
        } catch (IOException e) {
            throw new RuntimeException("下载模板失败", e);
        }
    }

    @Operation(summary = "获取模板文档 URL", description = "获取模板文档 URL（用于 OnlyOffice 编辑器）")
    @GetMapping("/{id}/url")
    public Result<TemplateService.TemplateUrlVO> getTemplateUrl(@PathVariable Long id) {
        return Result.success(templateService.getTemplateUrl(id));
    }

    @Operation(summary = "上传模板文件", description = "上传 .docx 模板文件到 OSS")
    @PostMapping("/upload")
    public Result<TemplateFileVO> uploadTemplate(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "") String name,
            @RequestParam(required = false, defaultValue = "") String description,
            @RequestParam(required = false, defaultValue = "admin") String createdBy) {
        try {
            String fileName = name.isEmpty() ? file.getOriginalFilename() : name;
            return Result.success(templateService.uploadTemplate(fileName, description, file.getBytes(), createdBy));
        } catch (IOException e) {
            throw new RuntimeException("上传模板文件失败", e);
        }
    }
}