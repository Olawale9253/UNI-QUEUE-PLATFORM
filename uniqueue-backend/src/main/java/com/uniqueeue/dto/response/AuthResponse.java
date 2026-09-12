package com.uniqueeue.dto.response;

import com.uniqueeue.enums.Role;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private Long userId;
    private String email;
    private String fullName;
    private Role role;
    private Long universityId;
}