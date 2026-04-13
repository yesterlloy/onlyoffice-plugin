package com.yl.template.ai.config;

import com.yl.template.ai.OpenAiCompatibleClient;
import lombok.Data;
import okhttp3.OkHttpClient;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * AI 客户端配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "ai.local")
public class AiClientConfig {

    private String baseUrl;

    private String apiKey;

    private String defaultModel;

    private Double defaultTemperature = 0.3;

    private Integer defaultMaxTokens = 1000;

    private Timeout timeout;

    @Data
    public static class Timeout {
        private Integer connect = 10000;
        private Integer read = 60000;
    }

    @Bean
    public OkHttpClient okHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(timeout != null ? timeout.getConnect() : 10000, TimeUnit.MILLISECONDS)
                .readTimeout(timeout != null ? timeout.getRead() : 60000, TimeUnit.MILLISECONDS)
                .writeTimeout(timeout != null ? timeout.getRead() : 60000, TimeUnit.MILLISECONDS)
                .build();
    }

    @Bean
    public OpenAiCompatibleClient openAiCompatibleClient(OkHttpClient okHttpClient) {
        return new OpenAiCompatibleClient(
                baseUrl,
                apiKey,
                okHttpClient,
                defaultModel,
                defaultTemperature,
                defaultMaxTokens
        );
    }
}