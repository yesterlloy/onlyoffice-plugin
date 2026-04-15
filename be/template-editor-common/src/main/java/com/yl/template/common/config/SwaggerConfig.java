package com.yl.template.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI 配置
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI templateEditorOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("模板编辑器 API")
                        .description("制式报告模板编辑器后端服务接口文档")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("yl")
                                .email("yl@example.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org")));
    }
}