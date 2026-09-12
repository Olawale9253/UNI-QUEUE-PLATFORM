package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateAppointmentSlotRequest;
import com.uniqueeue.dto.request.UpdateAppointmentSlotRequest;
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
import java.util.Map;

@RestController
@RequestMapping("/api/staff/appointment-slots")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
public class StaffAppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentSlotResponse>> create(
            @Valid @RequestBody CreateAppointmentSlotRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Slot created",
                        appointmentService.createSlot(principal.getId(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentSlotResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My slots", appointmentService.listSlotsForStaff(principal.getId())));
    }

    @GetMapping("/{slotId}")
    public ResponseEntity<ApiResponse<AppointmentSlotResponse>> get(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Slot", appointmentService.getSlot(slotId, principal.getId())));
    }

    @PutMapping("/{slotId}")
    public ResponseEntity<ApiResponse<AppointmentSlotResponse>> update(
            @PathVariable Long slotId,
            @Valid @RequestBody UpdateAppointmentSlotRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Slot updated",
                appointmentService.updateSlot(principal.getId(), slotId, request)));
    }

    @DeleteMapping("/{slotId}")
    public ResponseEntity<ApiResponse<Object>> delete(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserPrincipal principal) {
        appointmentService.deleteSlot(principal.getId(), slotId);
        return ResponseEntity.ok(ApiResponse.success("Slot deleted", null));
    }

    @GetMapping("/{slotId}/appointments")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> listAppointments(
            @PathVariable Long slotId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Appointments",
                appointmentService.listAppointmentsForSlot(principal.getId(), slotId)));
    }

    @PostMapping("/appointments/{appointmentId}/complete")
    public ResponseEntity<ApiResponse<AppointmentResponse>> complete(
            @PathVariable Long appointmentId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String staffNotes = body != null ? body.get("staffNotes") : null;
        return ResponseEntity.ok(ApiResponse.success(
                "Appointment completed",
                appointmentService.completeByStaff(principal.getId(), appointmentId, staffNotes)));
    }

    @PostMapping("/appointments/{appointmentId}/no-show")
    public ResponseEntity<ApiResponse<AppointmentResponse>> noShow(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Marked no-show",
                appointmentService.noShowByStaff(principal.getId(), appointmentId)));
    }
}