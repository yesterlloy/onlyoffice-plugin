package com.yl.template.api.config;

import com.yl.template.oss.config.OssClientConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web 配置：映射本地存储路径
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final OssClientConfig ossClientConfig;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if ("local".equalsIgnoreCase(ossClientConfig.getType())) {
            String basePath = ossClientConfig.getLocal().getBasePath();
            // 确保以 / 结尾
            if (!basePath.endsWith(File.separator)) {
                basePath += File.separator;
            }
            
            // 转换为文件协议路径
            String resourcePath = "file:" + new File(basePath).getAbsolutePath() + File.separator;
            
            // 将 /files/** 映射到本地目录
            registry.addResourceHandler("/files/**")
                    .addResourceLocations(resourcePath);
            
            System.out.println("本地文件映射已启动: /files/** -> " + resourcePath);
        }
    }
}