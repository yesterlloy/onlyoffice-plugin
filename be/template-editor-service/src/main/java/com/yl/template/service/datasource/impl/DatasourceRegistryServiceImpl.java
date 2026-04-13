package com.yl.template.service.datasource.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.dao.dto.DatasourceVO;
import com.yl.template.dao.entity.DatasourceRegistry;
import com.yl.template.dao.mapper.DatasourceRegistryMapper;
import com.yl.template.service.datasource.DatasourceRegistryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 数据接口注册服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatasourceRegistryServiceImpl implements DatasourceRegistryService {

    private final DatasourceRegistryMapper datasourceRegistryMapper;

    @Override
    public List<DatasourceVO> getAllDatasources() {
        List<DatasourceRegistry> list = datasourceRegistryMapper.selectList(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getStatus, 1)
                        .orderByAsc(DatasourceRegistry::getDatasourceId)
        );

        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public DatasourceVO registerDatasource(DatasourceCreateDTO dto) {
        // 检查是否已存在
        DatasourceRegistry existing = datasourceRegistryMapper.selectOne(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getDatasourceId, dto.getDatasourceId())
        );

        if (existing != null) {
            throw new BusinessException("数据接口已存在: " + dto.getDatasourceId());
        }

        DatasourceRegistry entity = new DatasourceRegistry();
        entity.setDatasourceId(dto.getDatasourceId());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setApiUrl(dto.getApiUrl());
        entity.setMethod(dto.getMethod() != null ? dto.getMethod() : "GET");
        entity.setAuthType(dto.getAuthType());
        entity.setAuthConfig(dto.getAuthConfig());
        entity.setTimeout(dto.getTimeout() != null ? dto.getTimeout() : 30000);
        entity.setStatus(1);

        datasourceRegistryMapper.insert(entity);
        log.info("注册数据接口成功: datasourceId={}", entity.getDatasourceId());

        return toVO(entity);
    }

    @Override
    public DatasourceVO updateDatasource(String datasourceId, DatasourceUpdateDTO dto) {
        DatasourceRegistry entity = datasourceRegistryMapper.selectOne(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getDatasourceId, datasourceId)
        );

        if (entity == null) {
            throw new BusinessException("数据接口不存在: " + datasourceId);
        }

        if (dto.getName() != null) {
            entity.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            entity.setDescription(dto.getDescription());
        }
        if (dto.getApiUrl() != null) {
            entity.setApiUrl(dto.getApiUrl());
        }
        if (dto.getMethod() != null) {
            entity.setMethod(dto.getMethod());
        }
        if (dto.getAuthType() != null) {
            entity.setAuthType(dto.getAuthType());
        }
        if (dto.getAuthConfig() != null) {
            entity.setAuthConfig(dto.getAuthConfig());
        }
        if (dto.getTimeout() != null) {
            entity.setTimeout(dto.getTimeout());
        }

        datasourceRegistryMapper.updateById(entity);
        log.info("更新数据接口成功: datasourceId={}", datasourceId);

        return toVO(entity);
    }

    @Override
    public void deleteDatasource(String datasourceId) {
        DatasourceRegistry entity = datasourceRegistryMapper.selectOne(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getDatasourceId, datasourceId)
        );

        if (entity == null) {
            throw new BusinessException("数据接口不存在: " + datasourceId);
        }

        entity.setStatus(0);
        datasourceRegistryMapper.updateById(entity);

        log.info("删除数据接口成功: datasourceId={}", datasourceId);
    }

    @Override
    public DatasourceVO getDatasourceDetail(String datasourceId) {
        DatasourceRegistry entity = datasourceRegistryMapper.selectOne(
                new LambdaQueryWrapper<DatasourceRegistry>()
                        .eq(DatasourceRegistry::getDatasourceId, datasourceId)
        );

        if (entity == null) {
            throw new BusinessException("数据接口不存在: " + datasourceId);
        }

        return toVO(entity);
    }

    private DatasourceVO toVO(DatasourceRegistry entity) {
        DatasourceVO vo = new DatasourceVO();
        vo.setDatasourceId(entity.getDatasourceId());
        vo.setName(entity.getName());
        vo.setDescription(entity.getDescription());
        vo.setApiUrl(entity.getApiUrl());
        vo.setMethod(entity.getMethod());
        vo.setStatus(entity.getStatus());
        return vo;
    }
}