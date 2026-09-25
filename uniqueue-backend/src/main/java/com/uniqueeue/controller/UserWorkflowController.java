package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.StudentWorkflowResponse;
import com.uniqueeue.dto.response.WorkflowResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/workflows")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'FRESHER')")
public class UserWorkflowController {

    private final WorkflowService workflowService;

    /** Workflows available in the student's university. */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> available(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Available workflows",
                workflowService.listAvailableForStudent(principal.getId())));
    }

    /** Student's own workflow progress entries. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentWorkflowResponse>>> mine(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My workflows", workflowService.listMine(principal.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentWorkflowResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Workflow progress", workflowService.getMine(principal.getId(), id)));
    }

    @PostMapping("/{workflowId}/start")
    public ResponseEntity<ApiResponse<StudentWorkflowResponse>> start(
            @PathVariable Long workflowId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workflow started",
                        workflowService.start(principal.getId(), workflowId)));
    }

    @PostMapping("/{id}/abandon")
    public ResponseEntity<ApiResponse<Object>> abandon(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        workflowService.abandon(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Workflow abandoned", null));
    }
}