package com.yl.template.ai;

import com.alibaba.fastjson2.JSON;
import com.yl.template.ai.config.AiClientConfig;
import com.yl.template.ai.exception.AiClientException;
import com.yl.template.ai.model.ChatCompletionRequest;
import com.yl.template.ai.model.ChatCompletionResponse;
import com.yl.template.ai.model.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;

import java.io.IOException;
import java.util.Collections;

/**
 * OpenAI 兼容接口客户端
 * 支持：Ollama、vLLM、LocalAI 等本地部署服务
 */
@Slf4j
public class OpenAiCompatibleClient {

    private final String baseUrl;
    private final String apiKey;
    private final OkHttpClient httpClient;
    private final String defaultModel;
    private final Double defaultTemperature;
    private final Integer defaultMaxTokens;

    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    public OpenAiCompatibleClient(String baseUrl, String apiKey, OkHttpClient httpClient, String defaultModel) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        this.httpClient = httpClient;
        this.defaultModel = defaultModel;
        this.defaultTemperature = 0.3;
        this.defaultMaxTokens = 1000;
    }

    public OpenAiCompatibleClient(String baseUrl, String apiKey, OkHttpClient httpClient,
                                   String defaultModel, Double defaultTemperature, Integer defaultMaxTokens) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        this.httpClient = httpClient;
        this.defaultModel = defaultModel;
        this.defaultTemperature = defaultTemperature != null ? defaultTemperature : 0.3;
        this.defaultMaxTokens = defaultMaxTokens != null ? defaultMaxTokens : 1000;
    }

    /**
     * 发送聊天补全请求
     */
    public ChatCompletionResponse chatCompletion(ChatCompletionRequest request) {
        String url = baseUrl + "/chat/completions";
        String body = JSON.toJSONString(request);

        log.debug("AI请求: POST {} body={}", url, body);

        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .post(RequestBody.create(body, JSON_MEDIA_TYPE))
                .header("Content-Type", "application/json");

        if (apiKey != null && !apiKey.isEmpty()) {
            requestBuilder.header("Authorization", "Bearer " + apiKey);
        }

        try (Response response = httpClient.newCall(requestBuilder.build()).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                log.error("AI请求失败: status={} body={}", response.code(), responseBody);
                throw new AiClientException("AI请求失败: " + response.code() + " - " + responseBody);
            }

            log.debug("AI响应: {}", responseBody);
            return JSON.parseObject(responseBody, ChatCompletionResponse.class);
        } catch (IOException e) {
            log.error("AI请求异常", e);
            throw new AiClientException("AI请求异常: " + e.getMessage(), e);
        }
    }

    /**
     * 简化调用：直接传入提示词生成内容
     */
    public String generate(String prompt) {
        return generate(prompt, null, null, null);
    }

    /**
     * 简化调用：指定模型和温度
     */
    public String generate(String prompt, String model, Double temperature, Integer maxTokens) {
        ChatCompletionRequest request = ChatCompletionRequest.of(
                model != null ? model : defaultModel,
                Collections.singletonList(ChatMessage.user(prompt)),
                temperature != null ? temperature : defaultTemperature,
                maxTokens != null ? maxTokens : defaultMaxTokens
        );

        ChatCompletionResponse response = chatCompletion(request);
        return response.getContent();
    }

    /**
     * 带系统提示词的调用
     */
    public String generateWithSystem(String systemPrompt, String userPrompt, String model, Double temperature, Integer maxTokens) {
        ChatCompletionRequest request = new ChatCompletionRequest();
        request.setModel(model != null ? model : defaultModel);
        request.setTemperature(temperature != null ? temperature : defaultTemperature);
        request.setMaxTokens(maxTokens != null ? maxTokens : defaultMaxTokens);
        request.setMessages(java.util.Arrays.asList(
                ChatMessage.system(systemPrompt),
                ChatMessage.user(userPrompt)
        ));

        ChatCompletionResponse response = chatCompletion(request);
        return response.getContent();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getDefaultModel() {
        return defaultModel;
    }
}