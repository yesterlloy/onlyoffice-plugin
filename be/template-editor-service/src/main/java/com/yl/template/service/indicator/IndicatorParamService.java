package com.yl.template.service.indicator;

import com.yl.template.dao.dto.IndicatorParamVO;

import java.util.List;
import java.util.Map;

/**
 * 指标参数服务接口
 */
public interface IndicatorParamService {

    /**
     * 获取动态下拉选项
     */
    List<OptionVO> getDynamicOptions(String source);

    /**
     * 校验参数值合法性
     */
    void validateParamValues(Long metadataId, Map<String, Object> paramValues);

    /**
     * 下拉选项VO
     */
    class OptionVO {
        private String value;
        private String label;

        public OptionVO() {
        }

        public OptionVO(String value, String label) {
            this.value = value;
            this.label = label;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }
    }
}