package com.yl.template.service.datasource.impl;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.dao.entity.DatasourceRegistry;
import com.yl.template.dao.mapper.DatasourceRegistryMapper;
import com.yl.template.service.datasource.DatasourceInvokeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 数据接口调用服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatasourceInvokeServiceImpl implements DatasourceInvokeService {

    private final DatasourceRegistryMapper datasourceRegistryMapper;

    // 简单缓存，用于预览时减少重复调用
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Override
    public Map<String, Object> invoke(String datasourceId, Map<String, Object> params) {
        // 检查缓存
        String cacheKey = buildCacheKey(datasourceId, params);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            log.debug("使用缓存数据: datasourceId={}", datasourceId);
            return cached.getData();
        }

        // 获取接口配置
        DatasourceRegistry registry = datasourceRegistryMapper.selectOne(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getDatasourceId, datasourceId)
                        .eq(DatasourceRegistry::getStatus, 1)
        );

        if (registry == null) {
            throw new BusinessException("数据接口不存在或已禁用: " + datasourceId);
        }

        // 构建请求
        try {
            Map<String, Object> data = executeRequest(registry, params);

            // 缓存结果（有效期5分钟）
            cache.put(cacheKey, new CacheEntry(data, System.currentTimeMillis() + 5 * 60 * 1000));

            return data;
        } catch (Exception e) {
            log.error("调用数据接口失败: datasourceId={}, error={}", datasourceId, e.getMessage(), e);
            throw new BusinessException("调用数据接口失败: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Map<String, Object>> batchInvoke(List<String> datasourceIds, Map<String, Object> params) {
        Map<String, Map<String, Object>> result = new HashMap<>();

        for (String datasourceId : datasourceIds) {
            try {
                result.put(datasourceId, invoke(datasourceId, params));
            } catch (Exception e) {
                log.warn("批量调用数据接口失败: datasourceId={}, error={}", datasourceId, e.getMessage());
                result.put(datasourceId, new HashMap<>());
            }
        }

        return result;
    }

    @Override
    public boolean testConnection(String datasourceId) {
        DatasourceRegistry registry = datasourceRegistryMapper.selectOne(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getDatasourceId, datasourceId)
        );

        if (registry == null) {
            return false;
        }

        try {
            executeRequest(registry, new HashMap<>());
            return true;
        } catch (Exception e) {
            log.warn("测试连接失败: datasourceId={}, error={}", datasourceId, e.getMessage());
            return false;
        }
    }

    private Map<String, Object> executeRequest(DatasourceRegistry registry, Map<String, Object> params) {
        String method = registry.getMethod() != null ? registry.getMethod().toUpperCase() : "GET";
        int timeout = registry.getTimeout() != null ? registry.getTimeout() : 30000;

        HttpRequest request;
        String url = registry.getApiUrl();

        if ("GET".equals(method)) {
            // GET 请求，参数拼接到 URL
            if (params != null && !params.isEmpty()) {
                String queryString = HttpUtil.toParams(params);
                url = url + (url.contains("?") ? "&" : "?") + queryString;
            }
            request = HttpRequest.get(url);
        } else {
            // POST 请求
            request = HttpRequest.post(url)
                    .body(JSON.toJSONString(params));
        }

        // 设置超时
        request.timeout(timeout);

        // 处理认证
        applyAuthentication(request, registry);

        // 发送请求
        HttpResponse response = request.execute();

        if (!response.isOk()) {
            throw new BusinessException("接口返回错误: " + response.getStatus());
        }

        // 解析响应
        String body = response.body();
        try {
            return JSON.parseObject(body, Map.class);
        } catch (Exception e) {
            // 如果不是 JSON，返回原始文本
            Map<String, Object> result = new HashMap<>();
            result.put("raw", body);
            return result;
        }
    }

    private void applyAuthentication(HttpRequest request, DatasourceRegistry registry) {
        String authType = registry.getAuthType();
        String authConfig = registry.getAuthConfig();

        if (authType == null || authType.isEmpty() || "none".equalsIgnoreCase(authType)) {
            return;
        }

        if (authConfig == null || authConfig.isEmpty()) {
            return;
        }

        try {
            JSONObject config = JSON.parseObject(authConfig);

            switch (authType.toLowerCase()) {
                case "token":
                    String token = config.getString("token");
                    String headerName = config.getString("headerName");
                    if (headerName == null) headerName = "Authorization";
                    if (token != null) {
                        request.header(headerName, token.startsWith("Bearer ") ? token : "Bearer " + token);
                    }
                    break;

                case "apikey":
                    String apiKey = config.getString("apiKey");
                    String keyHeader = config.getString("headerName");
                    if (keyHeader == null) keyHeader = "X-API-Key";
                    if (apiKey != null) {
                        request.header(keyHeader, apiKey);
                    }
                    break;

                default:
                    log.warn("未知的认证类型: {}", authType);
            }
        } catch (Exception e) {
            log.warn("解析认证配置失败: {}", e.getMessage());
        }
    }

    private String buildCacheKey(String datasourceId, Map<String, Object> params) {
        return datasourceId + ":" + (params != null ? params.hashCode() : 0);
    }

    private static class CacheEntry {
        private final Map<String, Object> data;
        private final long expireTime;

        public CacheEntry(Map<String, Object> data, long expireTime) {
            this.data = data;
            this.expireTime = expireTime;
        }

        public Map<String, Object> getData() {
            return data;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }
}