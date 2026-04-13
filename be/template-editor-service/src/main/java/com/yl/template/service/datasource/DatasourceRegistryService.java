package com.yl.template.service.datasource;

import com.yl.template.dao.dto.DatasourceVO;

import java.util.List;
import java.util.Map;

/**
 * 数据接口注册服务接口
 */
public interface DatasourceRegistryService {

    /**
     * 获取所有数据接口列表
     */
    List<DatasourceVO> getAllDatasources();

    /**
     * 注册新的数据接口
     */
    DatasourceVO registerDatasource(DatasourceCreateDTO dto);

    /**
     * 更新数据接口配置
     */
    DatasourceVO updateDatasource(String datasourceId, DatasourceUpdateDTO dto);

    /**
     * 删除数据接口
     */
    void deleteDatasource(String datasourceId);

    /**
     * 获取接口详情
     */
    DatasourceVO getDatasourceDetail(String datasourceId);

    /**
     * 数据接口创建DTO
     */
    class DatasourceCreateDTO {
        private String datasourceId;
        private String name;
        private String description;
        private String apiUrl;
        private String method;
        private String authType;
        private String authConfig;
        private Integer timeout;

        public String getDatasourceId() {
            return datasourceId;
        }

        public void setDatasourceId(String datasourceId) {
            this.datasourceId = datasourceId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getApiUrl() {
            return apiUrl;
        }

        public void setApiUrl(String apiUrl) {
            this.apiUrl = apiUrl;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public String getAuthType() {
            return authType;
        }

        public void setAuthType(String authType) {
            this.authType = authType;
        }

        public String getAuthConfig() {
            return authConfig;
        }

        public void setAuthConfig(String authConfig) {
            this.authConfig = authConfig;
        }

        public Integer getTimeout() {
            return timeout;
        }

        public void setTimeout(Integer timeout) {
            this.timeout = timeout;
        }
    }

    /**
     * 数据接口更新DTO
     */
    class DatasourceUpdateDTO {
        private String name;
        private String description;
        private String apiUrl;
        private String method;
        private String authType;
        private String authConfig;
        private Integer timeout;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getApiUrl() {
            return apiUrl;
        }

        public void setApiUrl(String apiUrl) {
            this.apiUrl = apiUrl;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public String getAuthType() {
            return authType;
        }

        public void setAuthType(String authType) {
            this.authType = authType;
        }

        public String getAuthConfig() {
            return authConfig;
        }

        public void setAuthConfig(String authConfig) {
            this.authConfig = authConfig;
        }

        public Integer getTimeout() {
            return timeout;
        }

        public void setTimeout(Integer timeout) {
            this.timeout = timeout;
        }
    }
}