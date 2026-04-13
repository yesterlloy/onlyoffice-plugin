package com.yl.template.service.datasource;

import java.util.List;
import java.util.Map;

/**
 * 数据接口调用服务接口
 */
public interface DatasourceInvokeService {

    /**
     * 调用数据接口获取数据
     *
     * @param datasourceId 数据接口ID
     * @param params       调用参数
     * @return 接口返回的数据
     */
    Map<String, Object> invoke(String datasourceId, Map<String, Object> params);

    /**
     * 批量调用多个数据接口
     *
     * @param datasourceIds 接口ID列表
     * @param params        公共参数
     * @return Map<datasourceId, data>
     */
    Map<String, Map<String, Object>> batchInvoke(List<String> datasourceIds, Map<String, Object> params);

    /**
     * 测试数据接口连通性
     */
    boolean testConnection(String datasourceId);
}