package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateClosedDateRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.ClosedDateResponse;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.ClosedDateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/closed-dates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminClosedDateController {

    private final ClosedDateService closedDateService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClosedDateResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long universityId = universityIdOf(principal);
        return ResponseEntity.ok(ApiResponse.success(
                "Closed dates", closedDateService.list(universityId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClosedDateResponse>> create(
            @RequestBody @Valid CreateClosedDateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long universityId = universityIdOf(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Closed date added",
                closedDateService.create(universityId, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long universityId = universityIdOf(principal);
        closedDateService.delete(universityId, id);
        return ResponseEntity.ok(ApiResponse.success("Closed date removed", null));
    }

    private Long universityIdOf(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getUniversity() == null) {
            throw new ResourceNotFoundException("User has no university");
        }
        return user.getUniversity().getId();
    }
}