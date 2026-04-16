package com.yl.template.service.document;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTCreator;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;

/**
 * OnlyOffice JWT Token 服务
 * 负责生成和验证 OnlyOffice 文档安全令牌
 * 详细参考：https://api.onlyoffice.com/editors/signature
 */
@Slf4j
@Service
public class OnlyOfficeTokenService {

    @Value("${onlyoffice.jwt-secret:}")
    private String jwtSecret;

    @Value("${onlyoffice.jwt-expire-hours:24}")
    private int jwtExpireHours;

    /**
     * 生成 OnlyOffice 编辑器 Token
     *
     * @param payload 编辑器配置 payload
     * @return JWT Token
     */
    public String generateEditorToken(Map<String, Object> payload) {
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            log.warn("[OnlyOffice] JWT Secret 未配置，Token 功能已禁用");
            return null;
        }
        log.debug("jwtSecret=" + jwtSecret);
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);

        JWTCreator.Builder builder = JWT.create()
                .withExpiresAt(new Date(System.currentTimeMillis() + jwtExpireHours * 3600_000L));

        // 将 payload 作为 claims 写入
        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                builder.withClaim(entry.getKey(), (Map<String, ?>) value);
            } else {
                builder.withClaim(entry.getKey(), String.valueOf(value));
            }
        }

        String token = builder.sign(algorithm);
        log.debug("[OnlyOffice] 生成编辑器 Token");
        return token;
    }

    /**
     * 生成 OnlyOffice 回调 Token
     *
     * @param payload 回调配置 payload
     * @return JWT Token
     */
    public String generateCallbackToken(Map<String, Object> payload) {
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            log.warn("[OnlyOffice] JWT Secret 未配置，Token 功能已禁用");
            return null;
        }

        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);

        JWTCreator.Builder builder = JWT.create()
                .withExpiresAt(new Date(System.currentTimeMillis() + jwtExpireHours * 3600_000L));

        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                builder.withClaim(entry.getKey(), (Map<String, ?>) value);
            } else {
                builder.withClaim(entry.getKey(), String.valueOf(value));
            }
        }

        String token = builder.sign(algorithm);
        log.debug("[OnlyOffice] 生成回调 Token");
        return token;
    }

    /**
     * 验证 OnlyOffice Token
     *
     * @param token JWT Token
     * @return 验证后的 DecodedJWT，验证失败返回 null
     */
    public DecodedJWT verifyToken(String token) {
        if (jwtSecret == null || jwtSecret.isEmpty() || token == null || token.isEmpty()) {
            return null;
        }

        try {
            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT decoded = verifier.verify(token);
            log.debug("[OnlyOffice] Token 验证成功");
            return decoded;
        } catch (JWTVerificationException e) {
            log.warn("[OnlyOffice] Token 验证失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 检查 Token 功能是否启用
     */
    public boolean isTokenEnabled() {
        return jwtSecret != null && !jwtSecret.isEmpty();
    }
}
