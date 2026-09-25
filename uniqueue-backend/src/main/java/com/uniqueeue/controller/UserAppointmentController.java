package com.uniqueeue.controller;

import com.uniqueeue.dto.request.BookAppointmentRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.AppointmentResponse;
import com.uniqueeue.dto.response.AppointmentSlotResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'FRESHER')")
public class UserAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<AppointmentSlotResponse>>> available(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Available slots",
                appointmentService.listAvailableSlotsForStudent(principal.getId())));
    }

    @PostMapping("/book")
    public ResponseEntity<ApiResponse<AppointmentResponse>> book(
            @Valid @RequestBody BookAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booked",
                        appointmentService.book(principal.getId(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> mine(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My appointments",
                appointmentService.listMine(principal.getId())));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> upcoming(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Upcoming appointments",
                appointmentService.listUpcoming(principal.getId())));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Appointment cancelled",
                appointmentService.cancelByStudent(principal.getId(), id)));
    }
}