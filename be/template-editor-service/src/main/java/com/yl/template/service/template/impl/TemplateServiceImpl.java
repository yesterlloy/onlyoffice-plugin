package com.yl.template.service.template.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.common.response.PageResult;
import com.yl.template.dao.dto.TemplateFileVO;
import com.yl.template.dao.dto.TemplateSaveDTO;
import com.yl.template.dao.entity.TemplateFile;
import com.yl.template.dao.mapper.TemplateFileMapper;
import com.yl.template.oss.AliyunOssClient;
import com.yl.template.service.template.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 模板服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final TemplateFileMapper templateFileMapper;
    private final AliyunOssClient ossClient;

    private static final String TEMPLATE_PATH_PREFIX = "templates/";

    @Override
    public PageResult<TemplateFileVO> listTemplates(Integer page, Integer size, Integer status) {
        Page<TemplateFile> pageParam = new Page<>(page, size);

        LambdaQueryWrapper<TemplateFile> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(TemplateFile::getStatus, status);
        }
        wrapper.orderByDesc(TemplateFile::getCreatedAt);

        Page<TemplateFile> result = templateFileMapper.selectPage(pageParam, wrapper);

        List<TemplateFileVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return PageResult.of(records, result.getTotal(), page, size);
    }

    @Override
    public TemplateFileVO createTemplate(TemplateSaveDTO dto) {
        TemplateFile entity = new TemplateFile();
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setVersion(1);
        entity.setStatus(1);
        entity.setCreatedBy(dto.getCreatedBy());
        entity.setCreatedAt(LocalDateTime.now());

        // 上传模板内容到 OSS
        if (dto.getContent() != null && !dto.getContent().isEmpty()) {
            String ossKey = generateOssKey(dto.getName(), "docx");
            byte[] content = dto.getContent().getBytes();
            ossClient.upload(ossKey, content);

            entity.setOssKey(ossKey);
            entity.setOssUrl(ossClient.getPublicUrl(ossKey));
            entity.setFileSize((long) content.length);
        }

        templateFileMapper.insert(entity);
        log.info("创建模板成功: id={}, name={}", entity.getId(), entity.getName());

        return toVO(entity);
    }

    @Override
    public TemplateFileVO updateTemplate(Long id, TemplateSaveDTO dto) {
        TemplateFile entity = templateFileMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException("模板不存在: " + id);
        }

        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setUpdatedBy(dto.getCreatedBy());
        entity.setUpdatedAt(LocalDateTime.now());

        // 如果有新内容，上传到 OSS
        if (dto.getContent() != null && !dto.getContent().isEmpty()) {
            String ossKey = generateOssKey(dto.getName(), "docx");
            byte[] content = dto.getContent().getBytes();
            ossClient.upload(ossKey, content);

            entity.setOssKey(ossKey);
            entity.setOssUrl(ossClient.getPublicUrl(ossKey));
            entity.setFileSize((long) content.length);
            entity.setVersion(entity.getVersion() + 1);
        }

        templateFileMapper.updateById(entity);
        log.info("更新模板成功: id={}, name={}", entity.getId(), entity.getName());

        return toVO(entity);
    }

    @Override
    public void deleteTemplate(Long id) {
        TemplateFile entity = templateFileMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException("模板不存在: " + id);
        }

        // 软删除：标记状态为禁用
        entity.setStatus(0);
        entity.setUpdatedAt(LocalDateTime.now());
        templateFileMapper.updateById(entity);

        log.info("删除模板成功: id={}", id);
    }

    @Override
    public TemplateFileVO getTemplateDetail(Long id) {
        TemplateFile entity = templateFileMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException("模板不存在: " + id);
        }

        TemplateFileVO vo = toVO(entity);
        // 生成带签名的访问 URL
        vo.setOssUrl(ossClient.generateUrl(entity.getOssKey()));

        return vo;
    }

    @Override
    public byte[] getTemplateContent(Long id) {
        TemplateFile entity = templateFileMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException("模板不存在: " + id);
        }

        return ossClient.download(entity.getOssKey());
    }

    @Override
    public Map<String, Object> getTemplateIndicatorMapping(Long templateId) {
        // TODO: 从模板内容中解析指标映射
        return new HashMap<>();
    }

    private TemplateFileVO toVO(TemplateFile entity) {
        TemplateFileVO vo = new TemplateFileVO();
        vo.setId(entity.getId());
        vo.setName(entity.getName());
        vo.setDescription(entity.getDescription());
        vo.setOssUrl(entity.getOssUrl());
        vo.setFileSize(entity.getFileSize());
        vo.setVersion(entity.getVersion());
        vo.setStatus(entity.getStatus());
        vo.setCreatedBy(entity.getCreatedBy());
        if (entity.getCreatedAt() != null) {
            vo.setCreatedAt(entity.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        return vo;
    }

    private String generateOssKey(String name, String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String safeName = name.replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]", "_");
        return TEMPLATE_PATH_PREFIX + timestamp + "/" + safeName + "." + extension;
    }
}