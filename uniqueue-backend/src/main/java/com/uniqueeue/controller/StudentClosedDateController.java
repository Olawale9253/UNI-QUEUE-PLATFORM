package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.ClosedDateResponse;
import com.uniqueeue.dto.response.ClosedDatesView;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UniversityClosedDateRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Read-only endpoint so any authenticated user (student, staff, admin) can see
 * their university's holidays. Used by the student queue page to show
 * "Today is a holiday" banners and an upcoming closures list.
 */
@RestController
@RequestMapping("/api/closed-dates")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class StudentClosedDateController {

    private final UniversityClosedDateRepository closedDateRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<ClosedDatesView>> upcoming(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUniversity() == null) {
            return ResponseEntity.ok(ApiResponse.success("No university",
                    ClosedDatesView.builder()
                            .todayClosed(false)
                            .todayReason(null)
                            .upcoming(List.of())
                            .build()));
        }

        Long uniId = user.getUniversity().getId();
        LocalDate today = LocalDate.now();

        List<ClosedDateResponse> all = closedDateRepository
                .findByUniversityIdOrderByClosedDateAsc(uniId)
                .stream()
                .map(ClosedDateResponse::from)
                .toList();

        ClosedDateResponse todayEntry = all.stream()
                .filter(d -> today.equals(d.getClosedDate()))
                .findFirst()
                .orElse(null);

        List<ClosedDateResponse> upcoming = all.stream()
                .filter(d -> !d.getClosedDate().isBefore(today))
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Closed dates",
                ClosedDatesView.builder()
                        .todayClosed(todayEntry != null)
                        .todayReason(todayEntry != null ? todayEntry.getReason() : null)
                        .upcoming(upcoming)
                        .build()));
    }
}