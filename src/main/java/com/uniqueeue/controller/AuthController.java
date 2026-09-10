package com.uniqueeue.controller;

import com.uniqueeue.dto.request.LoginRequest;
import com.uniqueeue.dto.request.RegisterRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.AuthResponse;
import com.uniqueeue.model.University;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UniversityRepository universityRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", principal.getId());
        data.put("email", principal.getEmail());
        data.put("fullName", principal.getFullName());
        data.put("role", principal.getRole());
        data.put("universityId", principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Current user", data));
    }

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> universities() {
        List<Map<String, Object>> list = universityRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getName());
                    m.put("code", u.getCode());
                    m.put("emailDomain", u.getEmailDomain());
                    m.put("matricExample", u.getMatricExample());
                    m.put("matricDescription", u.getMatricDescription());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Universities", list));
    }
}