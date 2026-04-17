package com.yl.template.api.controller;

import com.yl.template.common.response.Result;
import com.yl.template.dao.dto.OnlyOfficeCallbackDTO;
import com.yl.template.service.document.OnlyOfficeDocumentService;
import com.yl.template.service.document.OnlyOfficeTokenService;
import com.yl.template.service.template.TemplateService;
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
    private final OnlyOfficeTokenService tokenService;
    private final TemplateService templateService;

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
            @RequestBody OnlyOfficeCallbackDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        // 验证 JWT Token
        if (tokenService.isTokenEnabled()) {
            String token = null;
            if (authorization != null && authorization.startsWith("Bearer ")) {
                token = authorization.substring(7);
            }
            if (token == null || tokenService.verifyToken(token) == null) {
                Map<String, Integer> result = new HashMap<>();
                result.put("error", 6); // OnlyOffice 错误码：令牌无效
                return result;
            }
        }

        templateService.handleOnlyOfficeCallback(templateId, dto);
        Map<String, Integer> result = new HashMap<>();
        result.put("error", 0);
        return result;
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
