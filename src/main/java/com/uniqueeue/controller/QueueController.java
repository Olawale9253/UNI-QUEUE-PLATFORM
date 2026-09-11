package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.QueueResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queues")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QueueResponse>>> list(@AuthenticationPrincipal UserPrincipal principal) {
        Long universityId = principal.getUniversityId();
        List<QueueResponse> queues = queueService.listQueues(universityId, true);
        return ResponseEntity.ok(ApiResponse.success("Queues", queues));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QueueResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        QueueResponse queue = queueService.getQueue(id, principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Queue", queue));
    }
}