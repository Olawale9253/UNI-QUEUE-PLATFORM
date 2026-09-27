package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.AppointmentResponse;
import com.uniqueeue.dto.response.AppointmentSlotResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AppointmentService;
import com.uniqueeue.dto.response.AppointmentStatsResponse;
import com.uniqueeue.service.AppointmentStatsService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentStatsService appointmentStatsService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> listAppointments(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "University appointments",
                appointmentService.listAppointmentsForUniversity(principal.getUniversityId())));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AppointmentStatsResponse>> stats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Appointment stats",
                appointmentStatsService.forUniversity(principal.getUniversityId())));
    }

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<AppointmentSlotResponse>>> listSlots(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "University slots",
                appointmentService.listSlotsForUniversity(principal.getUniversityId())));
    }
}