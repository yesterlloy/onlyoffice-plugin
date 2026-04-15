package com.yl.template.oss;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import com.yl.template.oss.exception.OssClientException;
import com.yl.template.oss.model.OssUploadResult;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.InputStream;

/**
 * 本地文件存储实现
 */
@Slf4j
public class LocalOssClient implements OssClient {

    private final String basePath;
    private final String apiBaseUrl;

    public LocalOssClient(String basePath, String apiBaseUrl) {
        this.basePath = basePath;
        this.apiBaseUrl = apiBaseUrl;
        // 确保目录存在
        FileUtil.mkdir(basePath);
    }

    @Override
    public OssUploadResult upload(String key, byte[] content) {
        return upload(key, content, "application/octet-stream");
    }

    @Override
    public OssUploadResult upload(String key, byte[] content, String contentType) {
        try {
            File dest = new File(basePath, key);
            FileUtil.writeBytes(content, dest);
            
            String url = generateUrl(key);
            log.info("本地文件上传成功: key={}, size={}", key, content.length);
            
            return new OssUploadResult(key, url, (long) content.length);
        } catch (Exception e) {
            log.error("本地文件上传失败: key={}", key, e);
            throw new OssClientException("本地文件上传失败: " + e.getMessage(), e);
        }
    }

    @Override
    public OssUploadResult upload(String key, InputStream inputStream, long size, String contentType) {
        try {
            File dest = new File(basePath, key);
            FileUtil.writeFromStream(inputStream, dest);
            
            String url = generateUrl(key);
            log.info("本地文件上传成功: key={}, size={}", key, size);
            
            return new OssUploadResult(key, url, size);
        } catch (Exception e) {
            log.error("本地文件上传失败: key={}", key, e);
            throw new OssClientException("本地文件上传失败: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] download(String key) {
        try {
            File file = new File(basePath, key);
            return FileUtil.readBytes(file);
        } catch (Exception e) {
            log.error("本地文件下载失败: key={}", key, e);
            throw new OssClientException("本地文件下载失败: " + e.getMessage(), e);
        }
    }

    @Override
    public InputStream getInputStream(String key) {
        try {
            File file = new File(basePath, key);
            return FileUtil.getInputStream(file);
        } catch (Exception e) {
            log.error("本地文件获取流失败: key={}", key, e);
            throw new OssClientException("本地文件获取流失败: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            File file = new File(basePath, key);
            FileUtil.del(file);
            log.info("本地文件删除成功: key={}", key);
        } catch (Exception e) {
            log.error("本地文件删除失败: key={}", key, e);
            throw new OssClientException("本地文件删除失败: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String key) {
        return FileUtil.exist(new File(basePath, key));
    }

    @Override
    public String generateUrl(String key) {
        return getPublicUrl(key);
    }

    @Override
    public String generateUrl(String key, long expirationMillis) {
        return getPublicUrl(key);
    }

    @Override
    public String getPublicUrl(String key) {
        String baseUrl = apiBaseUrl;
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }
        return baseUrl + "files/" + key;
    }
}