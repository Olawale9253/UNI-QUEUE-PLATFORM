package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.AppointmentResponse;
import com.uniqueeue.dto.response.AppointmentStatsResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AppointmentService;
import com.uniqueeue.service.AppointmentStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffAppointmentsController {

    private final AppointmentService appointmentService;
    private final AppointmentStatsService appointmentStatsService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My appointments",
                appointmentService.listAppointmentsForStaff(principal.getId())));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AppointmentStatsResponse>> stats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Appointment stats",
                appointmentStatsService.forStaff(principal.getId())));
    }
}