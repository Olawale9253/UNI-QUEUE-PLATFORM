package com.uniqueeue.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateClosedDateRequest {

    @NotNull(message = "closedDate is required")
    private LocalDate closedDate;

    @Size(max = 255)
    private String reason;
}