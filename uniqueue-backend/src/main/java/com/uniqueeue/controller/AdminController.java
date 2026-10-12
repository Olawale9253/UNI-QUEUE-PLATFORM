package com.uniqueeue.controller;

import com.uniqueeue.dto.request.BulkIdsRequest;
import com.uniqueeue.dto.request.CreateQueueRequest;
import com.uniqueeue.dto.request.CreateStaffRequest;
import com.uniqueeue.dto.request.UpdateQueueRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.BulkResult;
import com.uniqueeue.dto.response.QueueResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.QueueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final QueueService queueService;

    // ---------- QUEUES ----------

    @GetMapping("/queues")
    public ResponseEntity<ApiResponse<List<QueueResponse>>> listQueues(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queues", queueService.listQueues(principal.getUniversityId(), false)));
    }

    @PostMapping("/queues")
    public ResponseEntity<ApiResponse<QueueResponse>> createQueue(
            @Valid @RequestBody CreateQueueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        QueueResponse created = queueService.createQueue(
                principal.getUniversityId(), principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Queue created", created));
    }

    @PutMapping("/queues/{id}")
    public ResponseEntity<ApiResponse<QueueResponse>> updateQueue(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQueueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queue updated",
                queueService.updateQueue(id, principal.getUniversityId(), request)));
    }

    @DeleteMapping("/queues/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteQueue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        queueService.deleteQueue(id, principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Queue deleted", null));
    }

    // ---------- STAFF ----------

    @GetMapping("/staff")
    public ResponseEntity<ApiResponse<List<QueueResponse.StaffInfo>>> listStaff(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Staff", queueService.listStaff(principal.getUniversityId())));
    }

    @PostMapping("/staff")
    public ResponseEntity<ApiResponse<QueueResponse.StaffInfo>> createStaff(
            @Valid @RequestBody CreateStaffRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        QueueResponse.StaffInfo staff = queueService.createStaff(
                principal.getUniversityId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff created", staff));
    }

    @PostMapping("/queues/{queueId}/staff/{staffId}")
    public ResponseEntity<ApiResponse<QueueResponse>> assignStaff(
            @PathVariable Long queueId,
            @PathVariable Long staffId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Staff assigned",
                queueService.assignStaff(queueId, principal.getUniversityId(), staffId)));
    }

    @DeleteMapping("/queues/{queueId}/staff/{staffId}")
    public ResponseEntity<ApiResponse<QueueResponse>> unassignStaff(
            @PathVariable Long queueId,
            @PathVariable Long staffId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Staff unassigned",
                queueService.unassignStaff(queueId, principal.getUniversityId(), staffId)));
    }

    // ---------- BULK ----------

    @PostMapping("/bulk/staff/remove-from-all-queues")
    public ResponseEntity<ApiResponse<BulkResult>> bulkRemoveStaff(
            @RequestBody BulkIdsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Staff removed from all queues",
                queueService.bulkUnassignStaffFromAllQueues(
                        principal.getUniversityId(), request.getIds())));
    }

    @PostMapping("/bulk/queues/activate")
    public ResponseEntity<ApiResponse<BulkResult>> bulkActivateQueues(
            @RequestBody BulkIdsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queues activated",
                queueService.bulkSetQueuesActive(
                        principal.getUniversityId(), request.getIds(), true)));
    }

    @PostMapping("/bulk/queues/deactivate")
    public ResponseEntity<ApiResponse<BulkResult>> bulkDeactivateQueues(
            @RequestBody BulkIdsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queues deactivated",
                queueService.bulkSetQueuesActive(
                        principal.getUniversityId(), request.getIds(), false)));
    }

    @PostMapping("/bulk/queues/delete")
    public ResponseEntity<ApiResponse<BulkResult>> bulkDeleteQueues(
            @RequestBody BulkIdsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queues deleted",
                queueService.bulkDeleteQueues(
                        principal.getUniversityId(), request.getIds())));
    }
}