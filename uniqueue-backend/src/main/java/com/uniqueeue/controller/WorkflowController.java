package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateWorkflowRequest;
import com.uniqueeue.dto.request.UpdateWorkflowStepRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.StudentWorkflowResponse;
import com.uniqueeue.dto.response.WorkflowAnalyticsResponse;
import com.uniqueeue.dto.response.WorkflowProgressResponse;
import com.uniqueeue.dto.response.WorkflowResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    // ============================================================
    //  ADMIN ENDPOINTS
    // ============================================================

    @GetMapping("/admin/workflows")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> listForUniversity(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Workflows fetched",
                workflowService.listForUniversity(principal.getUniversityId())));
    }

    @PostMapping("/admin/workflows")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateWorkflowRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Workflow created",
                workflowService.create(principal.getId(), principal.getUniversityId(), request)));
    }

    @GetMapping("/admin/workflows/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> getOne(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Workflow fetched",
                workflowService.getOne(id, principal.getUniversityId())));
    }

    @DeleteMapping("/admin/workflows/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        workflowService.delete(id, principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted", null));
    }

    @PutMapping("/admin/workflows/steps/{stepId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowResponse>> updateStep(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long stepId,
            @RequestBody UpdateWorkflowStepRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Step updated",
                workflowService.updateStep(stepId, principal.getUniversityId(), request)));
    }

    @GetMapping("/admin/workflows/{id}/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowAnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Analytics fetched",
                workflowService.getAnalytics(id, principal.getUniversityId())));
    }

    // ============================================================
    //  STUDENT ENDPOINTS
    // ============================================================

    @GetMapping("/student/workflows/available")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> listAvailable(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Available workflows fetched",
                workflowService.listAvailableForStudent(principal.getId())));
    }

    @GetMapping("/student/workflows")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<List<StudentWorkflowResponse>>> listMine(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("My workflows fetched",
                workflowService.listMine(principal.getId())));
    }

    @GetMapping("/student/workflows/my-progress")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<WorkflowProgressResponse>> getMyProgress(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Progress fetched",
                workflowService.getMyProgress(principal.getId())));
    }

    @GetMapping("/student/workflows/{id}")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<StudentWorkflowResponse>> getMine(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Workflow fetched",
                workflowService.getMine(principal.getId(), id)));
    }

    @PostMapping("/student/workflows/{id}/start")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<StudentWorkflowResponse>> start(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Workflow started",
                workflowService.start(principal.getId(), id)));
    }

    @PostMapping("/student/workflows/{id}/abandon")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<Void>> abandon(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        workflowService.abandon(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Workflow abandoned", null));
    }

    // For legacy MyClearancePage.jsx
    @GetMapping("/user/workflows/{id}/progress")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<WorkflowProgressResponse>> getProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Progress fetched",
                workflowService.getProgress(principal.getId(), id)));
    }
}