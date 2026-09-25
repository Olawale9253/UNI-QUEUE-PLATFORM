package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailChangeRequest {

    @NotBlank(message = "New email is required")
    @Email(message = "New email must be valid")
    private String newEmail;

    @NotBlank(message = "Password is required")
    private String password;
}