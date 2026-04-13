package com.yl.template.oss.exception;

/**
 * OSS 客户端异常
 */
public class OssClientException extends RuntimeException {

    public OssClientException(String message) {
        super(message);
    }

    public OssClientException(String message, Throwable cause) {
        super(message, cause);
    }
}