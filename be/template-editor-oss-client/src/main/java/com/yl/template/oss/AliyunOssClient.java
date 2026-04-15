package com.yl.template.oss;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.OSSObject;
import com.aliyun.oss.model.ObjectMetadata;
import com.yl.template.oss.exception.OssClientException;
import com.yl.template.oss.model.OssUploadResult;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Date;

/**
 * 阿里云 OSS 操作封装
 */
@Slf4j
public class AliyunOssClient implements OssClient {

    private final OSS ossClient;
    private final String bucketName;
    private final String endpoint;
    private final String customDomain;

    public AliyunOssClient(OSS ossClient, String bucketName, String endpoint, String customDomain) {
        this.ossClient = ossClient;
        this.bucketName = bucketName;
        this.endpoint = endpoint;
        this.customDomain = customDomain;
    }

    /**
     * 上传文件
     *
     * @param key     OSS 存储路径
     * @param content 文件内容
     * @return 上传结果
     */
    public OssUploadResult upload(String key, byte[] content) {
        return upload(key, content, "application/octet-stream");
    }

    /**
     * 上传文件（指定 Content-Type）
     *
     * @param key         OSS 存储路径
     * @param content     文件内容
     * @param contentType 内容类型
     * @return 上传结果
     */
    public OssUploadResult upload(String key, byte[] content, String contentType) {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(content.length);
            metadata.setContentType(contentType);

            ossClient.putObject(bucketName, key, new ByteArrayInputStream(content), metadata);

            String url = generateUrl(key);
            log.info("OSS上传成功: key={}, size={}", key, content.length);

            return new OssUploadResult(key, url, (long) content.length);
        } catch (Exception e) {
            log.error("OSS上传失败: key={}", key, e);
            throw new OssClientException("OSS上传失败: " + e.getMessage(), e);
        }
    }

    /**
     * 上传文件（流式）
     *
     * @param key      OSS 存储路径
     * @param inputStream 文件流
     * @param size     文件大小
     * @return 上传结果
     */
    public OssUploadResult upload(String key, InputStream inputStream, long size, String contentType) {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(size);
            metadata.setContentType(contentType);

            ossClient.putObject(bucketName, key, inputStream, metadata);

            String url = generateUrl(key);
            log.info("OSS上传成功: key={}, size={}", key, size);

            return new OssUploadResult(key, url, size);
        } catch (Exception e) {
            log.error("OSS上传失败: key={}", key, e);
            throw new OssClientException("OSS上传失败: " + e.getMessage(), e);
        }
    }

    /**
     * 下载文件
     *
     * @param key OSS 存储路径
     * @return 文件内容
     */
    public byte[] download(String key) {
        try {
            OSSObject object = ossClient.getObject(bucketName, key);
            try (InputStream is = object.getObjectContent()) {
                byte[] content = readAllBytes(is);
                log.info("OSS下载成功: key={}, size={}", key, content.length);
                return content;
            }
        } catch (Exception e) {
            log.error("OSS下载失败: key={}", key, e);
            throw new OssClientException("OSS下载失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取文件流
     *
     * @param key OSS 存储路径
     * @return 文件流
     */
    public InputStream getInputStream(String key) {
        try {
            OSSObject object = ossClient.getObject(bucketName, key);
            return object.getObjectContent();
        } catch (Exception e) {
            log.error("OSS获取文件流失败: key={}", key, e);
            throw new OssClientException("OSS获取文件流失败: " + e.getMessage(), e);
        }
    }

    /**
     * 删除文件
     *
     * @param key OSS 存储路径
     */
    public void delete(String key) {
        try {
            ossClient.deleteObject(bucketName, key);
            log.info("OSS删除成功: key={}", key);
        } catch (Exception e) {
            log.error("OSS删除失败: key={}", key, e);
            throw new OssClientException("OSS删除失败: " + e.getMessage(), e);
        }
    }

    /**
     * 检查文件是否存在
     *
     * @param key OSS 存储路径
     * @return 是否存在
     */
    public boolean exists(String key) {
        return ossClient.doesObjectExist(bucketName, key);
    }

    /**
     * 生成访问 URL（带签名，有效期1小时）
     *
     * @param key OSS 存储路径
     * @return 访问 URL
     */
    public String generateUrl(String key) {
        Date expiration = new Date(System.currentTimeMillis() + 3600 * 1000);
        return ossClient.generatePresignedUrl(bucketName, key, expiration).toString();
    }

    /**
     * 生成访问 URL（自定义有效期）
     *
     * @param key            OSS 存储路径
     * @param expirationMillis 有效期（毫秒）
     * @return 访问 URL
     */
    public String generateUrl(String key, long expirationMillis) {
        Date expiration = new Date(System.currentTimeMillis() + expirationMillis);
        return ossClient.generatePresignedUrl(bucketName, key, expiration).toString();
    }

    /**
     * 获取公开访问 URL（如果配置了自定义域名）
     *
     * @param key OSS 存储路径
     * @return 公开访问 URL
     */
    public String getPublicUrl(String key) {
        if (customDomain != null && !customDomain.isEmpty()) {
            return customDomain + (customDomain.endsWith("/") ? "" : "/") + key;
        }
        return "https://" + bucketName + "." + endpoint + "/" + key;
    }

    private byte[] readAllBytes(InputStream is) throws IOException {
        byte[] buffer = new byte[8192];
        int bytesRead;
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        while ((bytesRead = is.read(buffer)) != -1) {
            output.write(buffer, 0, bytesRead);
        }
        return output.toByteArray();
    }

    public String getBucketName() {
        return bucketName;
    }
}