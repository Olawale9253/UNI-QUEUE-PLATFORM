package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateFeedbackRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.FeedbackResponse;
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

    /** Student submits feedback for their own completed ticket. */
    @PostMapping("/user/feedback")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submit(
            @Valid @RequestBody CreateFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FeedbackResponse response = feedbackService.submit(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted", response));
    }

    /** Admin views all feedback for their university. */
    @GetMapping("/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Feedback", feedbackService.listForUniversity(principal.getUniversityId())));
    }

    /** Staff views feedback for tickets they served. */
    @GetMapping("/staff/feedback")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> myFeedback(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My feedback", feedbackService.listForStaff(principal.getId())));
    }
}