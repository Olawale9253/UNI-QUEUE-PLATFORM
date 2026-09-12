package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.QueueEstimateResponse;
import com.uniqueeue.dto.response.QueueResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.QueueService;
import com.uniqueeue.service.TicketService;
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
    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QueueResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queues", queueService.listQueues(principal.getUniversityId(), true)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QueueResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queue", queueService.getQueue(id, principal.getUniversityId())));
    }

    @GetMapping("/{id}/estimate")
    public ResponseEntity<ApiResponse<QueueEstimateResponse>> estimate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Queue estimate", ticketService.estimate(id)));
    }
}