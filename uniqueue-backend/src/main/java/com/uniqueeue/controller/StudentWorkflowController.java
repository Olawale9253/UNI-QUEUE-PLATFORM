package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.WorkflowProgressResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/workflows")
@RequiredArgsConstructor
public class StudentWorkflowController {

    private final WorkflowService workflowService;

    @GetMapping("/my-progress")
    public ResponseEntity<ApiResponse<WorkflowProgressResponse>> myProgress(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My workflow progress",
                workflowService.getMyProgress(principal.getId())));
    }
}