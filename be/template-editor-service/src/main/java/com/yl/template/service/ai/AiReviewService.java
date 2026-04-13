package com.yl.template.service.ai;

import com.yl.template.dao.entity.AiReview;

import java.util.List;

/**
 * AI 审核管理服务接口
 */
public interface AiReviewService {

    /**
     * 获取待审核的 AI 内容列表
     *
     * @param templateId 模板ID
     * @param status     审核状态
     * @return 审核列表
     */
    List<AiReviewVO> getPendingReviews(Long templateId, String status);

    /**
     * 审核通过
     */
    AiReviewVO approveReview(Long reviewId);

    /**
     * 审核拒绝
     */
    AiReviewVO rejectReview(Long reviewId, String rejectReason);

    /**
     * 编辑修改 AI 内容
     */
    AiReviewVO editReview(Long reviewId, String newContent);

    /**
     * 创建审核记录
     */
    AiReviewVO createReview(Long templateId, String indicatorUid, String indicatorName, String generatedContent);

    /**
     * AI 审核VO
     */
    class AiReviewVO {
        private Long reviewId;
        private Long templateId;
        private String indicatorUid;
        private String indicatorName;
        private String generatedContent;
        private String status;
        private String reviewComment;
        private String reviewer;
        private String createdAt;

        public Long getReviewId() {
            return reviewId;
        }

        public void setReviewId(Long reviewId) {
            this.reviewId = reviewId;
        }

        public Long getTemplateId() {
            return templateId;
        }

        public void setTemplateId(Long templateId) {
            this.templateId = templateId;
        }

        public String getIndicatorUid() {
            return indicatorUid;
        }

        public void setIndicatorUid(String indicatorUid) {
            this.indicatorUid = indicatorUid;
        }

        public String getIndicatorName() {
            return indicatorName;
        }

        public void setIndicatorName(String indicatorName) {
            this.indicatorName = indicatorName;
        }

        public String getGeneratedContent() {
            return generatedContent;
        }

        public void setGeneratedContent(String generatedContent) {
            this.generatedContent = generatedContent;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getReviewComment() {
            return reviewComment;
        }

        public void setReviewComment(String reviewComment) {
            this.reviewComment = reviewComment;
        }

        public String getReviewer() {
            return reviewer;
        }

        public void setReviewer(String reviewer) {
            this.reviewer = reviewer;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
    }
}