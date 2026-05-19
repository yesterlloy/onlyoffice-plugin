package com.yl.template.service.dataset;

import com.yl.template.dao.dto.DatasetVO;

import java.util.List;

/**
 * 数据集服务接口
 */
public interface DatasetService {

    /**
     * 获取所有数据集及其包含的指标
     * @return 数据集列表
     */
    List<DatasetVO> getAllDatasets();
}
