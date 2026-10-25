package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateFeedbackRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.FeedbackResponse;
import com.uniqueeue.dto.response.StaffFeedbackSummaryResponse;
import com.uniqueeue.ratelimit.RateKeyType;
import com.uniqueeue.ratelimit.RateLimited;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/user/feedback")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    @RateLimited(limit = 5, windowSeconds = 60, keyType = RateKeyType.USER, name = "feedback")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submit(
            @Valid @RequestBody CreateFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FeedbackResponse response = feedbackService.submit(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted", response));
    }

    @GetMapping("/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Feedback", feedbackService.listForUniversity(principal.getUniversityId())));
    }

    @GetMapping("/staff/feedback")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> myFeedback(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My feedback", feedbackService.listForStaff(principal.getId())));
    }

    @GetMapping("/staff/feedback/me")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<StaffFeedbackSummaryResponse>> myFeedbackSummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My feedback summary", feedbackService.getStaffSummary(principal.getId())));
    }

    @GetMapping("/super-admin/feedback")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(
                "All platform feedback", feedbackService.listAll()));
    }
}