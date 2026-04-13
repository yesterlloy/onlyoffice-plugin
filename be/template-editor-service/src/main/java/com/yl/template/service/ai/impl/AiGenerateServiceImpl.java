package com.yl.template.service.ai.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONWriter.Feature;
import com.yl.template.ai.OpenAiCompatibleClient;
import com.yl.template.ai.model.ChatCompletionResponse;
import com.yl.template.dao.dto.AiPromptConfigVO;
import com.yl.template.service.ai.AiGenerateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AI 内容生成服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiGenerateServiceImpl implements AiGenerateService {

    private final OpenAiCompatibleClient aiClient;

    @Override
    public AiPreviewResultVO previewGenerate(AiPreviewDTO dto) {
        long startTime = System.currentTimeMillis();

        // 组装提示词
        String prompt = assemblePrompt(dto.getPromptTemplate(), dto.getContextData());

        // 调用 AI
        String modelName = dto.getModelName() != null ? dto.getModelName() : aiClient.getDefaultModel();
        ChatCompletionResponse response = aiClient.chatCompletion(
                com.yl.template.ai.model.ChatCompletionRequest.of(
                        modelName,
                        java.util.Collections.singletonList(
                                com.yl.template.ai.model.ChatMessage.user(prompt)
                        ),
                        dto.getTemperature() != null ? dto.getTemperature() : 0.3,
                        dto.getMaxTokens() != null ? dto.getMaxTokens() : 1000
                )
        );

        // 构建结果
        AiPreviewResultVO result = new AiPreviewResultVO();
        result.setGeneratedContent(response.getContent());
        result.setGenerationTime(System.currentTimeMillis() - startTime);

        if (response.getUsage() != null) {
            TokenUsage usage = new TokenUsage();
            usage.setPromptTokens(response.getUsage().getPromptTokens());
            usage.setCompletionTokens(response.getUsage().getCompletionTokens());
            usage.setTotalTokens(response.getUsage().getTotalTokens());
            result.setTokenUsage(usage);
        }

        log.info("AI预览生成完成: model={}, time={}ms", modelName, result.getGenerationTime());

        return result;
    }

    @Override
    public String generateContent(AiPromptConfigVO promptConfig, Map<String, Object> contextData) {
        // 组装提示词
        String prompt = assemblePrompt(promptConfig.getPromptTemplate(), contextData);

        // 获取模型配置
        String modelName = promptConfig.getModelName() != null ? promptConfig.getModelName() : aiClient.getDefaultModel();
        Double temperature = promptConfig.getTemperature() != null ? promptConfig.getTemperature().doubleValue() : 0.3;
        Integer maxTokens = promptConfig.getMaxTokens() != null ? promptConfig.getMaxTokens() : 1000;

        // 调用 AI
        String content = aiClient.generate(prompt, modelName, temperature, maxTokens);

        log.info("AI内容生成完成: model={}, length={}", modelName, content != null ? content.length() : 0);

        return content;
    }

    @Override
    public String assemblePrompt(String template, Map<String, Object> contextData) {
        if (template == null || template.isEmpty()) {
            return "";
        }

        if (contextData == null || contextData.isEmpty()) {
            return template;
        }

        String result = template;

        // 替换简单变量: {period}, {area}
        if (contextData.containsKey("period")) {
            result = result.replace("{period}", String.valueOf(contextData.get("period")));
        }
        if (contextData.containsKey("area")) {
            result = result.replace("{area}", String.valueOf(contextData.get("area")));
        }

        // 替换数据变量
        if (contextData.containsKey("data")) {
            Object dataObj = contextData.get("data");
            if (dataObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> dataMap = (Map<String, Object>) dataObj;

                // {data} → 全部数据 JSON
                result = result.replace("{data}", JSON.toJSONString(dataMap, Feature.PrettyFormat));

                // {data.JK4816} → 指定接口数据
                // {data.JK4816.work_count} → 指定字段
                result = replaceDataVariables(result, "data", dataMap);
            }
        }

        // 替换上期数据
        if (contextData.containsKey("prevData")) {
            Object prevDataObj = contextData.get("prevData");
            if (prevDataObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> prevDataMap = (Map<String, Object>) prevDataObj;
                result = replaceDataVariables(result, "prevData", prevDataMap);
            }
        }

        return result;
    }

    /**
     * 替换数据变量，支持嵌套访问
     */
    private String replaceDataVariables(String text, String prefix, Map<String, Object> data) {
        // 匹配 {prefix.xxx} 或 {prefix.xxx.yyy} 格式
        Pattern pattern = Pattern.compile("\\{" + prefix + "\\.([a-zA-Z0-9_]+)(?:\\.([a-zA-Z0-9_]+))?\\}");
        Matcher matcher = pattern.matcher(text);

        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1);
            String subKey = matcher.group(2);

            Object value = data.get(key);
            if (value != null && subKey != null && value instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> nestedMap = (Map<String, Object>) value;
                value = nestedMap.get(subKey);
            }

            String replacement = value != null ? String.valueOf(value) : "";
            matcher.appendReplacement(sb, replacement);
        }
        matcher.appendTail(sb);

        return sb.toString();
    }
}