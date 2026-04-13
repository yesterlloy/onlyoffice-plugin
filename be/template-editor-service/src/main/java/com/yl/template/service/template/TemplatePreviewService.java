package com.yl.template.service.template;

import java.util.Map;

/**
 * 模板预览服务接口
 */
public interface TemplatePreviewService {

    /**
     * 生成报告预览
     *
     * @param templateId 模板ID
     * @param period     报告期间
     * @param area       报告地区
     * @return 预览结果
     */
    PreviewResultVO generatePreview(Long templateId, String period, String area);

    /**
     * 执行模板表达式替换
     */
    String executeTemplateReplacement(String templateContent, Map<String, Object> indicatorValues);

    /**
     * 预览结果VO
     */
    class PreviewResultVO {
        private String previewUrl;
        private String generatedContent;
        private java.util.List<AiGeneratedSection> aiGeneratedSections;

        public String getPreviewUrl() {
            return previewUrl;
        }

        public void setPreviewUrl(String previewUrl) {
            this.previewUrl = previewUrl;
        }

        public String getGeneratedContent() {
            return generatedContent;
        }

        public void setGeneratedContent(String generatedContent) {
            this.generatedContent = generatedContent;
        }

        public java.util.List<AiGeneratedSection> getAiGeneratedSections() {
            return aiGeneratedSections;
        }

        public void setAiGeneratedSections(java.util.List<AiGeneratedSection> aiGeneratedSections) {
            this.aiGeneratedSections = aiGeneratedSections;
        }
    }

    /**
     * AI 生成段落
     */
    class AiGeneratedSection {
        private String uid;
        private String content;
        private String status;

        public String getUid() {
            return uid;
        }

        public void setUid(String uid) {
            this.uid = uid;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}