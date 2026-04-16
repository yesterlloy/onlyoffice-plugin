package com.yl.template.service.template.impl;

import cn.hutool.http.HttpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.common.response.PageResult;
import com.yl.template.dao.dto.OnlyOfficeCallbackDTO;
import com.yl.template.dao.dto.TemplateFileVO;
import com.yl.template.dao.dto.TemplateSaveDTO;
import com.yl.template.dao.entity.TemplateFile;
import com.yl.template.dao.mapper.TemplateFileMapper;
import com.yl.template.oss.OssClient;
import com.yl.template.service.template.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
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
    private final OssClient ossClient;

    private static final String TEMPLATE_PATH_PREFIX = "templates/";

    @Override
    public void handleOnlyOfficeCallback(Long id, OnlyOfficeCallbackDTO dto) {
        log.info("收到 OnlyOffice 回调: id={}, status={}", id, dto.getStatus());

        // status 2: 文档已准备好保存
        // status 6: 强制保存
        if (dto.getStatus() == 2 || dto.getStatus() == 6) {
            TemplateFile entity = templateFileMapper.selectById(id);
            if (entity == null) {
                log.error("回调处理失败，模板不存在: id={}", id);
                return;
            }

            String downloadUrl = dto.getUrl();
            log.info("开始从 OnlyOffice 下载更新后的文档: {}", downloadUrl);

            try {
                // 下载文档字节流
                byte[] content = HttpUtil.downloadBytes(downloadUrl);
                if (content == null || content.length == 0) {
                    log.error("下载文档失败，内容为空: {}", downloadUrl);
                    return;
                }

                // 上传到 OSS (使用新 key 以保留历史版本或覆盖)
                String ossKey = generateOssKey(entity.getName(), "docx");
                ossClient.upload(ossKey, content);

                // 更新实体信息
                entity.setOssKey(ossKey);
                entity.setOssUrl(ossClient.getPublicUrl(ossKey));
                entity.setFileSize((long) content.length);
                entity.setVersion(entity.getVersion() + 1);
                entity.setUpdatedAt(LocalDateTime.now());

                templateFileMapper.updateById(entity);
                log.info("OnlyOffice 回调处理成功，模板已更新: id={}, version={}", id, entity.getVersion());

            } catch (Exception e) {
                log.error("OnlyOffice 回调处理异常: id={}, error={}", id, e.getMessage(), e);
            }
        }
    }

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
        String content = StringUtils.trimToEmpty(dto.getContent());
        if (StringUtils.isNotBlank(content)) {
            String ossKey = generateOssKey(dto.getName(), "docx");
            byte[] contentBytes = content.getBytes();
            ossClient.upload(ossKey, contentBytes);
            entity.setOssKey(ossKey);
            entity.setOssUrl(ossClient.getPublicUrl(ossKey));
            entity.setFileSize((long) contentBytes.length);
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
        String newContent = StringUtils.trimToEmpty(dto.getContent());
        if (StringUtils.isNotBlank(newContent)) {
            String ossKey = generateOssKey(dto.getName(), "docx");
            byte[] content = newContent.getBytes();
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

    @Override
    public TemplateService.TemplateUrlVO getTemplateUrl(Long id) {
        TemplateFile entity = templateFileMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException("模板不存在: " + id);
        }
        TemplateService.TemplateUrlVO vo = new TemplateService.TemplateUrlVO();
        vo.setUrl(ossClient.generateUrl(entity.getOssKey()));
        vo.setName(entity.getName());
        return vo;
    }

    @Override
    public TemplateFileVO uploadTemplate(String name, String description, byte[] content, String createdBy) {
        String ossKey = generateOssKey(name, "docx");
        ossClient.upload(ossKey, content);

        TemplateFile entity = new TemplateFile();
        entity.setName(name);
        entity.setDescription(description);
        entity.setOssKey(ossKey);
        entity.setOssUrl(ossClient.getPublicUrl(ossKey));
        entity.setFileSize((long) content.length);
        entity.setVersion(1);
        entity.setStatus(1);
        entity.setCreatedBy(createdBy);
        entity.setCreatedAt(LocalDateTime.now());

        templateFileMapper.insert(entity);
        log.info("上传模板文件成功: id={}, name={}", entity.getId(), entity.getName());

        return toVO(entity);
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