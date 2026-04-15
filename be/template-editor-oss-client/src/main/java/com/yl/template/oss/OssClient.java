package com.yl.template.oss;

import com.yl.template.oss.model.OssUploadResult;
import java.io.InputStream;

/**
 * OSS 客户端接口
 */
public interface OssClient {

    /**
     * 上传文件
     */
    OssUploadResult upload(String key, byte[] content);

    /**
     * 上传文件（指定 Content-Type）
     */
    OssUploadResult upload(String key, byte[] content, String contentType);

    /**
     * 上传文件（流式）
     */
    OssUploadResult upload(String key, InputStream inputStream, long size, String contentType);

    /**
     * 下载文件
     */
    byte[] download(String key);

    /**
     * 获取文件流
     */
    InputStream getInputStream(String key);

    /**
     * 删除文件
     */
    void delete(String key);

    /**
     * 检查文件是否存在
     */
    boolean exists(String key);

    /**
     * 生成访问 URL（带签名/加密，有效期1小时）
     */
    String generateUrl(String key);

    /**
     * 生成访问 URL（自定义有效期）
     */
    String generateUrl(String key, long expirationMillis);

    /**
     * 获取公开访问 URL
     */
    String getPublicUrl(String key);
}