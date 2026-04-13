package com.yl.template.api;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * 模板编辑器后端服务启动类
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.yl.template")
@MapperScan("com.yl.template.dao.mapper")
public class TemplateEditorApplication {

    public static void main(String[] args) {
        SpringApplication.run(TemplateEditorApplication.class, args);
    }
}