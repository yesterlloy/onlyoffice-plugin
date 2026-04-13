package com.yl.template.oss.model;

import lombok.Data;

/**
 * OSS 上传结果
 */
@Data
public class OssUploadResult {

    private String key;

    private String url;

    private Long size;

    public OssUploadResult() {
    }

    public OssUploadResult(String key, String url, Long size) {
        this.key = key;
        this.url = url;
        this.size = size;
    }
}