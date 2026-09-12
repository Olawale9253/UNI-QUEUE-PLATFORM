package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.QueueResponse;
import com.uniqueeue.dto.response.TicketResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffController {

    private final TicketService ticketService;

    @GetMapping("/queues")
    public ResponseEntity<ApiResponse<List<QueueResponse>>> myQueues(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My queues", ticketService.listMyQueues(principal.getId())));
    }

    @GetMapping("/queues/{queueId}/tickets")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> tickets(
            @PathVariable Long queueId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tickets", ticketService.listQueueTickets(principal.getId(), queueId)));
    }

    @PostMapping("/queues/{queueId}/next")
    public ResponseEntity<ApiResponse<TicketResponse>> callNext(
            @PathVariable Long queueId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Next ticket called",
                ticketService.callNext(principal.getId(), queueId)));
    }

    @PostMapping("/tickets/{ticketId}/call")
    public ResponseEntity<ApiResponse<TicketResponse>> call(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket called", ticketService.callTicket(principal.getId(), ticketId)));
    }

    @PostMapping("/tickets/{ticketId}/serve")
    public ResponseEntity<ApiResponse<TicketResponse>> serve(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket served", ticketService.serveTicket(principal.getId(), ticketId)));
    }

    @PostMapping("/tickets/{ticketId}/complete")
    public ResponseEntity<ApiResponse<TicketResponse>> complete(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket completed", ticketService.completeTicket(principal.getId(), ticketId)));
    }

    @PostMapping("/tickets/{ticketId}/no-show")
    public ResponseEntity<ApiResponse<TicketResponse>> noShow(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket marked no-show", ticketService.noShowTicket(principal.getId(), ticketId)));
    }

    @PostMapping("/tickets/{ticketId}/transfer")
    public ResponseEntity<ApiResponse<TicketResponse>> transfer(
            @PathVariable Long ticketId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket transferred",
                ticketService.transferTicket(principal.getId(), ticketId, notes)));
    }

    @PostMapping("/tickets/{ticketId}/priority")
    public ResponseEntity<ApiResponse<TicketResponse>> setPriority(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Integer priority = body.get("priority");
        if (priority == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("priority is required"));
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Priority updated",
                ticketService.setPriority(principal.getId(), ticketId, priority)));
    }
}