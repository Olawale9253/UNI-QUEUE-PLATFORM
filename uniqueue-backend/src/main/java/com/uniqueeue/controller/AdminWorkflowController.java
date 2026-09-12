package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateWorkflowRequest;
import com.uniqueeue.dto.request.UpdateWorkflowStepRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.WorkflowResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/workflows")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Workflows", workflowService.listForUniversity(principal.getUniversityId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Workflow", workflowService.getOne(id, principal.getUniversityId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkflowResponse>> create(
            @Valid @RequestBody CreateWorkflowRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workflow created",
                        workflowService.create(principal.getId(), principal.getUniversityId(), request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        workflowService.delete(id, principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted", null));
    }

    @PutMapping("/steps/{stepId}")
    public ResponseEntity<ApiResponse<WorkflowResponse>> updateStep(
            @PathVariable Long stepId,
            @Valid @RequestBody UpdateWorkflowStepRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Step updated", workflowService.updateStep(stepId, principal.getUniversityId(), request)));
    }
}