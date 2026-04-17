package com.yl.template.service.document;

import com.yl.template.common.exception.BusinessException;
import com.yl.template.dao.entity.TemplateFile;
import com.yl.template.dao.mapper.TemplateFileMapper;
import com.yl.template.oss.OssClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * OnlyOffice 文档编辑服务
 * 负责生成编辑器配置、文档 Key 管理、编辑会话维护
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnlyOfficeDocumentService {

    private final TemplateFileMapper templateFileMapper;
    private final OssClient ossClient;
    private final OnlyOfficeTokenService tokenService;

    @Value("${onlyoffice.document-server.url:http://192.168.1.223:8888}")
    private String documentServerUrl;

    @Value("${onlyoffice.callback-base-url:http://192.168.1.223:8080/template-editor}")
    private String callbackBaseUrl;

    /**
     * 生成文档编辑配置
     */
    public EditorConfigVO generateEditorConfig(Long templateId, String userId, String userName) {
        TemplateFile template = templateFileMapper.selectById(templateId);
        if (template == null) {
            throw new BusinessException("模板不存在: " + templateId);
        }

        // 生成文档 Key：模板ID + 版本号 + 更新时间，确保版本变化时 Key 也变化
        String documentKey = generateDocumentKey(template);

        // 获取文档访问 URL
        String documentUrl = ossClient.generateUrl(template.getOssKey());

        // 构建回调 URL
        String callbackUrl = callbackBaseUrl + "/api/documents/" + templateId + "/callback";

        // 构建编辑器配置
        Map<String, Object> config = buildEditorConfig(template, documentKey, documentUrl, callbackUrl, userId, userName);

        // 如果启用了 JWT，生成 token
        String token = null;
        if (tokenService.isTokenEnabled()) {
            Map<String, Object> tokenPayload = new HashMap<>();
            tokenPayload.put("document", config.get("document"));
            tokenPayload.put("documentType", config.get("documentType"));
            tokenPayload.put("editorConfig", config.get("editorConfig"));
            token = tokenService.generateEditorToken(tokenPayload);
            log.info("[OnlyOffice] JWT Token 已启用");
        }

        EditorConfigVO vo = new EditorConfigVO();
        vo.setTemplateId(templateId);
        vo.setTemplateName(template.getName());
        vo.setDocumentKey(documentKey);
        vo.setDocumentUrl(documentUrl);
        vo.setDocumentServerUrl(documentServerUrl);
        vo.setCallbackUrl(callbackUrl);
        vo.setEditorConfig(config);
        vo.setToken(token);

        log.info("生成编辑器配置: templateId={}, documentKey={}", templateId, documentKey);
        return vo;
    }

    /**
     * 生成文档 Key
     */
    private String generateDocumentKey(TemplateFile template) {
        String timestamp = template.getUpdatedAt() != null
                ? template.getUpdatedAt().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "doc_" + template.getId() + "_v" + template.getVersion() + "_" + timestamp;
    }

    /**
     * 构建 OnlyOffice 编辑器配置
     */
    private Map<String, Object> buildEditorConfig(TemplateFile template, String documentKey,
                                                   String documentUrl, String callbackUrl,
                                                   String userId, String userName) {
        Map<String, Object> config = new HashMap<>();

        // 文档配置
        Map<String, Object> document = new HashMap<>();
        document.put("fileType", "docx");
        document.put("key", documentKey);
        document.put("title", template.getName());
        document.put("url", documentUrl);

        Map<String, Object> permissions = new HashMap<>();
        permissions.put("edit", true);
        permissions.put("download", true);
        permissions.put("print", true);
        permissions.put("save", true);
        document.put("permissions", permissions);
        config.put("document", document);

        config.put("documentType", "word");

        // 编辑器配置
        Map<String, Object> editorConfig = new HashMap<>();
        editorConfig.put("mode", "edit");
        editorConfig.put("lang", "zh-CN");
        editorConfig.put("callbackUrl", callbackUrl);

        // 用户信息
        Map<String, Object> user = new HashMap<>();
        user.put("id", userId);
        user.put("name", userName);
        editorConfig.put("user", user);

        // 自定义配置
        Map<String, Object> customization = new HashMap<>();
        customization.put("forcesave", true);
        customization.put("compactHeader", true);
        customization.put("chat", false);
        customization.put("feedback", false);
        editorConfig.put("customization", customization);

        config.put("editorConfig", editorConfig);

        return config;
    }

    /**
     * 编辑器配置 VO
     */
    public static class EditorConfigVO {
        private Long templateId;
        private String templateName;
        private String documentKey;
        private String documentUrl;
        private String documentServerUrl;
        private String callbackUrl;
        private Map<String, Object> editorConfig;
        private String token;

        public Long getTemplateId() { return templateId; }
        public void setTemplateId(Long templateId) { this.templateId = templateId; }
        public String getTemplateName() { return templateName; }
        public void setTemplateName(String templateName) { this.templateName = templateName; }
        public String getDocumentKey() { return documentKey; }
        public void setDocumentKey(String documentKey) { this.documentKey = documentKey; }
        public String getDocumentUrl() { return documentUrl; }
        public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }
        public String getDocumentServerUrl() { return documentServerUrl; }
        public void setDocumentServerUrl(String documentServerUrl) { this.documentServerUrl = documentServerUrl; }
        public String getCallbackUrl() { return callbackUrl; }
        public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }
        public Map<String, Object> getEditorConfig() { return editorConfig; }
        public void setEditorConfig(Map<String, Object> editorConfig) { this.editorConfig = editorConfig; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }
}
