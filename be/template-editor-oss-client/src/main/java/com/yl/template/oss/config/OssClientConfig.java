package com.yl.template.oss.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.yl.template.oss.AliyunOssClient;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OSS 客户端配置
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssClientConfig {

    private String endpoint;

    private String bucketName;

    private String accessKeyId;

    private String accessKeySecret;

    private String customDomain;

    @Bean
    public OSS ossClient() {
        return new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
    }

    @Bean
    public AliyunOssClient aliyunOssClient(OSS ossClient) {
        return new AliyunOssClient(ossClient, bucketName, endpoint, customDomain);
    }
}