package com.yl.template.service.ai.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yl.template.common.exception.BusinessException;
import com.yl.template.dao.entity.AiReview;
import com.yl.template.dao.mapper.AiReviewMapper;
import com.yl.template.service.ai.AiReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AI 审核管理服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiReviewServiceImpl implements AiReviewService {

    private final AiReviewMapper aiReviewMapper;

    @Override
    public List<AiReviewVO> getPendingReviews(Long templateId, String status) {
        LambdaQueryWrapper<AiReview> wrapper = new LambdaQueryWrapper<>();

        if (templateId != null) {
            wrapper.eq(AiReview::getTemplateId, templateId);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(AiReview::getStatus, status);
        }
        wrapper.orderByDesc(AiReview::getCreatedAt);

        List<AiReview> list = aiReviewMapper.selectList(wrapper);

        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public AiReviewVO approveReview(Long reviewId) {
        AiReview entity = aiReviewMapper.selectById(reviewId);
        if (entity == null) {
            throw new BusinessException("审核记录不存在: " + reviewId);
        }

        entity.setStatus("approved");
        entity.setReviewAt(LocalDateTime.now());
        aiReviewMapper.updateById(entity);

        log.info("AI审核通过: reviewId={}", reviewId);

        return toVO(entity);
    }

    @Override
    public AiReviewVO rejectReview(Long reviewId, String rejectReason) {
        AiReview entity = aiReviewMapper.selectById(reviewId);
        if (entity == null) {
            throw new BusinessException("审核记录不存在: " + reviewId);
        }

        entity.setStatus("rejected");
        entity.setReviewComment(rejectReason);
        entity.setReviewAt(LocalDateTime.now());
        aiReviewMapper.updateById(entity);

        log.info("AI审核拒绝: reviewId={}, reason={}", reviewId, rejectReason);

        return toVO(entity);
    }

    @Override
    public AiReviewVO editReview(Long reviewId, String newContent) {
        AiReview entity = aiReviewMapper.selectById(reviewId);
        if (entity == null) {
            throw new BusinessException("审核记录不存在: " + reviewId);
        }

        entity.setGeneratedContent(newContent);
        entity.setStatus("edited");
        entity.setReviewAt(LocalDateTime.now());
        aiReviewMapper.updateById(entity);

        log.info("AI审核编辑: reviewId={}", reviewId);

        return toVO(entity);
    }

    @Override
    public AiReviewVO createReview(Long templateId, String indicatorUid, String indicatorName, String generatedContent) {
        AiReview entity = new AiReview();
        entity.setTemplateId(templateId);
        entity.setIndicatorUid(indicatorUid);
        entity.setIndicatorName(indicatorName);
        entity.setGeneratedContent(generatedContent);
        entity.setStatus("pending");

        aiReviewMapper.insert(entity);

        log.info("创建AI审核记录: reviewId={}, templateId={}, indicatorUid={}", entity.getId(), templateId, indicatorUid);

        return toVO(entity);
    }

    private AiReviewVO toVO(AiReview entity) {
        AiReviewVO vo = new AiReviewVO();
        vo.setReviewId(entity.getId());
        vo.setTemplateId(entity.getTemplateId());
        vo.setIndicatorUid(entity.getIndicatorUid());
        vo.setIndicatorName(entity.getIndicatorName());
        vo.setGeneratedContent(entity.getGeneratedContent());
        vo.setStatus(entity.getStatus());
        vo.setReviewComment(entity.getReviewComment());
        vo.setReviewer(entity.getReviewer());
        if (entity.getCreatedAt() != null) {
            vo.setCreatedAt(entity.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        return vo;
    }
}