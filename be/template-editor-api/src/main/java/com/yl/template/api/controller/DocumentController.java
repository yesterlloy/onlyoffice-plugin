package com.yl.template.api.controller;

import com.yl.template.common.response.Result;
import com.yl.template.dao.dto.OnlyOfficeCallbackDTO;
import com.yl.template.service.document.OnlyOfficeDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * OnlyOffice 文档编辑 Controller
 */
@Tag(name = "文档编辑", description = "OnlyOffice 文档打开、回调、强制保存")
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final OnlyOfficeDocumentService documentService;

    @Operation(summary = "打开文档编辑器", description = "获取 OnlyOffice 编辑器配置，用于前端打开文档")
    @PostMapping("/open")
    public Result<OnlyOfficeDocumentService.EditorConfigVO> openDocument(
            @RequestBody OpenDocumentRequest request) {
        String userId = request.getUserId() != null ? request.getUserId() : "default-user";
        String userName = request.getUserName() != null ? request.getUserName() : "模板编辑员";
        return Result.success(documentService.generateEditorConfig(request.getTemplateId(), userId, userName));
    }

    @Operation(summary = "强制保存文档", description = "触发 OnlyOffice 强制保存文档")
    @PostMapping("/{templateId}/force-save")
    public Result<Void> forceSave(@PathVariable Long templateId) {
        documentService.forceSave(templateId);
        return Result.success();
    }

    @Operation(summary = "OnlyOffice 回调", description = "接收 OnlyOffice 文档保存回调")
    @PostMapping("/{templateId}/callback")
    public Map<String, Integer> documentCallback(
            @PathVariable Long templateId,
            @RequestBody OnlyOfficeCallbackDTO dto) {
        // 实际保存逻辑由 TemplateService 处理，这里做基本确认
        logCallback(templateId, dto);
        Map<String, Integer> result = new HashMap<>();
        result.put("error", 0);
        return result;
    }

    private void logCallback(Long templateId, OnlyOfficeCallbackDTO dto) {
        switch (dto.getStatus()) {
            case 1:
                // 文档正在编辑中
                break;
            case 2:
            case 6:
                // 文档已准备好保存 / 强制保存
                documentService.forceSave(templateId);
                break;
            case 3:
            case 7:
                // 保存错误
                break;
            case 4:
                // 文档未修改
                break;
            default:
                break;
        }
    }

    /**
     * 打开文档请求
     */
    @lombok.Data
    public static class OpenDocumentRequest {
        private Long templateId;
        private String userId;
        private String userName;
    }
}
