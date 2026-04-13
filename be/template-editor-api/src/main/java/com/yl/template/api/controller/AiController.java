package com.yl.template.api.controller;

import com.yl.template.common.response.Result;
import com.yl.template.service.ai.AiGenerateService;
import com.yl.template.service.ai.AiReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 生成 Controller
 */
@Tag(name = "AI 生成", description = "AI 预览生成、审核管理")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiGenerateService generateService;
    private final AiReviewService reviewService;

    @Operation(summary = "预览 AI 生成内容", description = "编辑模板时预览 AI 生成内容")
    @PostMapping("/preview")
    public Result<AiGenerateService.AiPreviewResultVO> previewGenerate(@RequestBody AiGenerateService.AiPreviewDTO dto) {
        return Result.success(generateService.previewGenerate(dto));
    }

    @Operation(summary = "获取待审核列表", description = "获取待审核的 AI 内容列表")
    @GetMapping("/reviews")
    public Result<List<AiReviewService.AiReviewVO>> getReviews(
            @RequestParam(required = false) Long templateId,
            @RequestParam(required = false) String status) {
        return Result.success(reviewService.getPendingReviews(templateId, status));
    }

    @Operation(summary = "审核通过", description = "审核通过 AI 内容")
    @PostMapping("/reviews/{reviewId}/approve")
    public Result<AiReviewService.AiReviewVO> approveReview(@PathVariable Long reviewId) {
        return Result.success(reviewService.approveReview(reviewId));
    }

    @Operation(summary = "审核拒绝", description = "审核拒绝 AI 内容")
    @PostMapping("/reviews/{reviewId}/reject")
    public Result<AiReviewService.AiReviewVO> rejectReview(
            @PathVariable Long reviewId,
            @RequestBody RejectRequest request) {
        return Result.success(reviewService.rejectReview(reviewId, request.getReason()));
    }

    @Operation(summary = "编辑 AI 内容", description = "编辑修改 AI 内容")
    @PutMapping("/reviews/{reviewId}/edit")
    public Result<AiReviewService.AiReviewVO> editReview(
            @PathVariable Long reviewId,
            @RequestBody EditRequest request) {
        return Result.success(reviewService.editReview(reviewId, request.getContent()));
    }

    /**
     * 拒绝请求
     */
    @lombok.Data
    public static class RejectRequest {
        private String reason;
    }

    /**
     * 编辑请求
     */
    @lombok.Data
    public static class EditRequest {
        private String content;
    }
}