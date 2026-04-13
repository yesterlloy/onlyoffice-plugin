package com.yl.template.service.ai;

import com.yl.template.dao.dto.AiPromptConfigVO;

import java.util.Map;

/**
 * AI 内容生成服务接口
 */
public interface AiGenerateService {

    /**
     * 预览生成 AI 内容
     *
     * @param dto 预览请求
     * @return 生成结果
     */
    AiPreviewResultVO previewGenerate(AiPreviewDTO dto);

    /**
     * 正式生成 AI 内容
     *
     * @param promptConfig AI 提示词配置
     * @param contextData  数据上下文
     * @return 生成的文本内容
     */
    String generateContent(AiPromptConfigVO promptConfig, Map<String, Object> contextData);

    /**
     * 组装最终提示词
     *
     * @param template    提示词模板
     * @param contextData 变量值映射
     * @return 替换变量后的完整提示词
     */
    String assemblePrompt(String template, Map<String, Object> contextData);

    /**
     * AI 预览请求DTO
     */
    class AiPreviewDTO {
        private String promptTemplate;
        private java.util.List<String> dataSources;
        private String modelProvider;
        private String modelName;
        private Double temperature;
        private Integer maxTokens;
        private String outputFormat;
        private Map<String, Object> contextData;

        public String getPromptTemplate() {
            return promptTemplate;
        }

        public void setPromptTemplate(String promptTemplate) {
            this.promptTemplate = promptTemplate;
        }

        public java.util.List<String> getDataSources() {
            return dataSources;
        }

        public void setDataSources(java.util.List<String> dataSources) {
            this.dataSources = dataSources;
        }

        public String getModelProvider() {
            return modelProvider;
        }

        public void setModelProvider(String modelProvider) {
            this.modelProvider = modelProvider;
        }

        public String getModelName() {
            return modelName;
        }

        public void setModelName(String modelName) {
            this.modelName = modelName;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public Integer getMaxTokens() {
            return maxTokens;
        }

        public void setMaxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
        }

        public String getOutputFormat() {
            return outputFormat;
        }

        public void setOutputFormat(String outputFormat) {
            this.outputFormat = outputFormat;
        }

        public Map<String, Object> getContextData() {
            return contextData;
        }

        public void setContextData(Map<String, Object> contextData) {
            this.contextData = contextData;
        }
    }

    /**
     * AI 预览结果VO
     */
    class AiPreviewResultVO {
        private String generatedContent;
        private TokenUsage tokenUsage;
        private Long generationTime;

        public String getGeneratedContent() {
            return generatedContent;
        }

        public void setGeneratedContent(String generatedContent) {
            this.generatedContent = generatedContent;
        }

        public TokenUsage getTokenUsage() {
            return tokenUsage;
        }

        public void setTokenUsage(TokenUsage tokenUsage) {
            this.tokenUsage = tokenUsage;
        }

        public Long getGenerationTime() {
            return generationTime;
        }

        public void setGenerationTime(Long generationTime) {
            this.generationTime = generationTime;
        }
    }

    /**
     * Token 使用统计
     */
    class TokenUsage {
        private Integer promptTokens;
        private Integer completionTokens;
        private Integer totalTokens;

        public Integer getPromptTokens() {
            return promptTokens;
        }

        public void setPromptTokens(Integer promptTokens) {
            this.promptTokens = promptTokens;
        }

        public Integer getCompletionTokens() {
            return completionTokens;
        }

        public void setCompletionTokens(Integer completionTokens) {
            this.completionTokens = completionTokens;
        }

        public Integer getTotalTokens() {
            return totalTokens;
        }

        public void setTotalTokens(Integer totalTokens) {
            this.totalTokens = totalTokens;
        }
    }
}