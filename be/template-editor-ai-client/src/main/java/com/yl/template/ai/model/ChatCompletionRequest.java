package com.yl.template.ai.model;

import lombok.Data;

import java.util.List;

/**
 * 聊天补全请求
 */
@Data
public class ChatCompletionRequest {

    private String model;

    private List<ChatMessage> messages;

    private Double temperature;

    private Integer maxTokens;

    private Boolean stream = false;

    public static ChatCompletionRequest of(String model, List<ChatMessage> messages, Double temperature, Integer maxTokens) {
        ChatCompletionRequest request = new ChatCompletionRequest();
        request.setModel(model);
        request.setMessages(messages);
        request.setTemperature(temperature);
        request.setMaxTokens(maxTokens);
        return request;
    }
}