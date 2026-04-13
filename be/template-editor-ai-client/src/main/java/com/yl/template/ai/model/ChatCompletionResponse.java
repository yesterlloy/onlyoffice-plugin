package com.yl.template.ai.model;

import lombok.Data;

import java.util.List;

/**
 * 聊天补全响应
 */
@Data
public class ChatCompletionResponse {

    private String id;

    private String object;

    private Long created;

    private String model;

    private List<Choice> choices;

    private Usage usage;

    @Data
    public static class Choice {
        private Integer index;
        private ChatMessage message;
        private String finishReason;
    }

    @Data
    public static class Usage {
        private Integer promptTokens;
        private Integer completionTokens;
        private Integer totalTokens;
    }

    public String getContent() {
        if (choices != null && !choices.isEmpty()) {
            ChatMessage msg = choices.get(0).getMessage();
            return msg != null ? msg.getContent() : null;
        }
        return null;
    }
}