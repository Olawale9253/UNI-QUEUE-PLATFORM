package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.TicketResponse;
import com.uniqueeue.ratelimit.RateKeyType;
import com.uniqueeue.ratelimit.RateLimited;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'FRESHER')")
public class UserTicketController {

    private final TicketService ticketService;

    @PostMapping("/join")
    @RateLimited(limit = 10, windowSeconds = 60, keyType = RateKeyType.USER, name = "ticket-join")
    public ResponseEntity<ApiResponse<TicketResponse>> join(
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long queueId = body.get("queueId");
        if (queueId == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("queueId is required"));
        }
        TicketResponse ticket = ticketService.joinQueue(principal.getId(), queueId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Joined queue", ticket));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<TicketResponse>> active(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ticketService.getActiveTicket(principal.getId())
                .map(valueValue -> ResponseEntity.ok(ApiResponse.success("Active ticket", valueValue)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No active ticket", null)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> history(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket history", ticketService.getHistory(principal.getId())));
    }

    // 👇 FIXED: Matches the frontend POST /api/user/tickets/{id}/leave request
    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Object>> leaveQueue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ticketService.leaveQueue(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Left queue", null));
    }

    // Keeping the old DELETE mapping just in case you use it elsewhere
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ticketService.leaveQueue(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Left queue", null));
    }

    @PostMapping("/{id}/reschedule")
    @RateLimited(limit = 5, windowSeconds = 300, keyType = RateKeyType.USER, name = "ticket-reschedule")
    public ResponseEntity<ApiResponse<TicketResponse>> reschedule(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Turn rescheduled",
                ticketService.rescheduleMyTurn(principal.getId(), id)));
    }

    @PostMapping("/{id}/skip")
    @RateLimited(limit = 5, windowSeconds = 300, keyType = RateKeyType.USER, name = "ticket-skip")
    public ResponseEntity<ApiResponse<TicketResponse>> skip(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Turn skipped",
                ticketService.skipMyTurn(principal.getId(), id)));
    }
}