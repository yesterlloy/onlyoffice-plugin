package com.yl.template.service.template;

import com.yl.template.common.response.PageResult;
import com.yl.template.dao.dto.OnlyOfficeCallbackDTO;
import com.yl.template.dao.dto.TemplateFileVO;
import com.yl.template.dao.dto.TemplateSaveDTO;

import java.util.Map;

/**
 * 模板服务接口
 */
public interface TemplateService {

    /**
     * 处理 OnlyOffice 回调
     */
    void handleOnlyOfficeCallback(Long id, OnlyOfficeCallbackDTO dto);

    /**
     * 分页查询模板列表
     */
    PageResult<TemplateFileVO> listTemplates(Integer page, Integer size, Integer status);

    /**
     * 创建新模板
     */
    TemplateFileVO createTemplate(TemplateSaveDTO dto);

    /**
     * 更新模板
     */
    TemplateFileVO updateTemplate(Long id, TemplateSaveDTO dto);

    /**
     * 删除模板
     */
    void deleteTemplate(Long id);

    /**
     * 获取模板详情
     */
    TemplateFileVO getTemplateDetail(Long id);

    /**
     * 获取模板文件内容
     */
    byte[] getTemplateContent(Long id);

    /**
     * 获取模板指标映射
     */
    Map<String, Object> getTemplateIndicatorMapping(Long templateId);

    /**
     * 获取模板文档 URL（用于 OnlyOffice 编辑器）
     */
    TemplateUrlVO getTemplateUrl(Long id);

    /**
     * 上传模板文件
     */
    TemplateFileVO uploadTemplate(String name, String description, byte[] content, String createdBy);

    /**
     * 模板 URL VO
     */
    class TemplateUrlVO {
        private String url;
        private String name;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}