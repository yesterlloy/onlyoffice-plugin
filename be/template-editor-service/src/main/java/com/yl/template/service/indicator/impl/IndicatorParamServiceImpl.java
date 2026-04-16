package com.yl.template.service.indicator.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.dao.entity.IndicatorParams;
import com.yl.template.dao.mapper.IndicatorParamsMapper;
import com.yl.template.service.indicator.IndicatorParamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 指标参数服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IndicatorParamServiceImpl implements IndicatorParamService {

    private final IndicatorParamsMapper paramsMapper;

    @Override
    public List<OptionVO> getDynamicOptions(String source) {
        // 根据 source 返回预定义的选项列表
        Map<String, List<OptionVO>> optionRegistry = buildOptionRegistry();
        List<OptionVO> options = optionRegistry.get(source);
        if (options == null) {
            log.warn("未找到动态选项来源: {}", source);
            return Collections.emptyList();
        }
        return options;
    }

    @Override
    public void validateParamValues(Long metadataId, Map<String, Object> paramValues) {
        LambdaQueryWrapper<IndicatorParams> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(IndicatorParams::getIndicatorId, metadataId);
        List<IndicatorParams> params = paramsMapper.selectList(wrapper);

        for (IndicatorParams param : params) {
            if (param.getRequired() == 1 && !paramValues.containsKey(param.getParamKey())) {
                throw new BusinessException("缺少必填参数: " + param.getParamLabel());
            }

            Object value = paramValues.get(param.getParamKey());
            if (value != null && param.getMinValue() != null && param.getMaxValue() != null) {
                try {
                    double num = Double.parseDouble(value.toString());
                    if (num < param.getMinValue().doubleValue() || num > param.getMaxValue().doubleValue()) {
                        throw new BusinessException("参数 " + param.getParamLabel() + " 超出范围: "
                                + param.getMinValue() + " ~ " + param.getMaxValue());
                    }
                } catch (NumberFormatException e) {
                    throw new BusinessException("参数 " + param.getParamLabel() + " 值格式错误");
                }
            }
        }
    }

    /**
     * 构建预定义选项注册表
     */
    private Map<String, List<OptionVO>> buildOptionRegistry() {
        Map<String, List<OptionVO>> registry = new HashMap<>();

        // 区域选项
        registry.put("region", Arrays.asList(
                new OptionVO("east", "华东区域"),
                new OptionVO("south", "华南区域"),
                new OptionVO("north", "华北区域"),
                new OptionVO("central", "华中区域"),
                new OptionVO("west", "西北区域"),
                new OptionVO("southwest", "西南区域"),
                new OptionVO("northeast", "东北区域")
        ));

        // 部门选项
        registry.put("department", Arrays.asList(
                new OptionVO("dept_a", "业务一部"),
                new OptionVO("dept_b", "业务二部"),
                new OptionVO("dept_c", "业务三部"),
                new OptionVO("dept_d", "技术支持部"),
                new OptionVO("dept_e", "综合管理部")
        ));

        // 业务类型选项
        registry.put("bizType", Arrays.asList(
                new OptionVO("type_a", "类型A"),
                new OptionVO("type_b", "类型B"),
                new OptionVO("type_c", "类型C"),
                new OptionVO("type_d", "类型D")
        ));

        // 状态选项
        registry.put("status", Arrays.asList(
                new OptionVO("normal", "正常"),
                new OptionVO("warning", "预警"),
                new OptionVO("abnormal", "异常")
        ));

        return registry;
    }
}
