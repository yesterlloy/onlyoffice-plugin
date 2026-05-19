package com.yl.template.service.dataset.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.dao.dto.DatasetVO;
import com.yl.template.dao.dto.IndicatorMetadataVO;
import com.yl.template.dao.entity.Dataset;
import com.yl.template.dao.entity.DatasetIndicator;
import com.yl.template.dao.entity.IndicatorMetadata;
import com.yl.template.dao.mapper.DatasetIndicatorMapper;
import com.yl.template.dao.mapper.DatasetMapper;
import com.yl.template.dao.mapper.IndicatorMetadataMapper;
import com.yl.template.service.dataset.DatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 数据集服务实现
 */
@Service
@RequiredArgsConstructor
public class DatasetServiceImpl implements DatasetService {

    private final DatasetMapper datasetMapper;
    private final DatasetIndicatorMapper datasetIndicatorMapper;
    private final IndicatorMetadataMapper indicatorMetadataMapper;

    @Override
    public List<DatasetVO> getAllDatasets() {
        // 1. 获取所有数据集
        List<Dataset> datasets = datasetMapper.selectList(null);
        if (datasets.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> datasetIds = datasets.stream().map(Dataset::getDatasetId).collect(Collectors.toList());

        // 2. 获取关联表
        List<DatasetIndicator> relations = datasetIndicatorMapper.selectList(
                new LambdaQueryWrapper<DatasetIndicator>()
                        .in(DatasetIndicator::getDatasetId, datasetIds)
                        .orderByAsc(DatasetIndicator::getDatasetId, DatasetIndicator::getSortOrder)
        );

        // 3. 获取指标元数据
        List<String> indicatorIds = relations.stream().map(DatasetIndicator::getIndicatorId).distinct().collect(Collectors.toList());
        Map<String, IndicatorMetadata> indicatorMap = null;
        if (!indicatorIds.isEmpty()) {
            List<IndicatorMetadata> metadataList = indicatorMetadataMapper.selectList(
                    new LambdaQueryWrapper<IndicatorMetadata>()
                            .in(IndicatorMetadata::getIndicatorId, indicatorIds)
            );
            indicatorMap = metadataList.stream().collect(Collectors.toMap(IndicatorMetadata::getIndicatorId, m -> m));
        }

        // 4. 组装VO
        List<DatasetVO> result = new ArrayList<>();
        Map<String, IndicatorMetadata> finalIndicatorMap = indicatorMap;
        for (Dataset dataset : datasets) {
            DatasetVO vo = new DatasetVO();
            vo.setId(dataset.getDatasetId());
            vo.setCode(dataset.getCode());
            vo.setName(dataset.getName());
            vo.setDatasourceCode(dataset.getDatasourceCode());

            List<IndicatorMetadataVO> indicatorVOs = new ArrayList<>();
            if (finalIndicatorMap != null) {
                // 根据关联表的顺序组装
                relations.stream()
                        .filter(r -> r.getDatasetId().equals(dataset.getDatasetId()))
                        .forEach(r -> {
                            IndicatorMetadata m = finalIndicatorMap.get(r.getIndicatorId());
                            if (m != null) {
                                IndicatorMetadataVO ivo = new IndicatorMetadataVO();
                                BeanUtils.copyProperties(m, ivo);
                                indicatorVOs.add(ivo);
                            }
                        });
            }
            vo.setIndicators(indicatorVOs);
            result.add(vo);
        }

        return result;
    }
}
