package com.yl.template.oss.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.yl.template.oss.AliyunOssClient;
import com.yl.template.oss.LocalOssClient;
import com.yl.template.oss.OssClient;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OSS 客户端配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "oss")
public class OssClientConfig {

    /**
     * 存储类型: aliyun | local
     */
    private String type = "local";

    /**
     * 阿里云 OSS 配置
     */
    private AliyunConfig aliyun = new AliyunConfig();

    /**
     * 本地存储配置
     */
    private LocalConfig local = new LocalConfig();

    @Data
    public static class AliyunConfig {
        private String endpoint;
        private String bucketName;
        private String accessKeyId;
        private String accessKeySecret;
        private String customDomain;
    }

    @Data
    public static class LocalConfig {
        private String basePath = "./storage";
        private String apiBaseUrl = "http://localhost:8080/template-editor";
    }

    @Bean
    @ConditionalOnProperty(name = "oss.type", havingValue = "aliyun")
    public OSS ossClient() {
        return new OSSClientBuilder().build(aliyun.getEndpoint(), aliyun.getAccessKeyId(), aliyun.getAccessKeySecret());
    }

    @Bean
    @ConditionalOnProperty(name = "oss.type", havingValue = "aliyun")
    public OssClient aliyunOssClient(OSS ossClient) {
        return new AliyunOssClient(ossClient, aliyun.getBucketName(), aliyun.getEndpoint(), aliyun.getCustomDomain());
    }

    @Bean
    @ConditionalOnProperty(name = "oss.type", havingValue = "local", matchIfMissing = true)
    public OssClient localOssClient() {
        return new LocalOssClient(local.getBasePath(), local.getApiBaseUrl());
    }
}