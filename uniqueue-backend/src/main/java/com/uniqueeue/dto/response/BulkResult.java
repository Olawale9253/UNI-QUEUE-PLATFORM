package com.uniqueeue.dto.response;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Generic per-item result for bulk admin operations.
 *
 *   processed  — total ids submitted
 *   succeeded  — how many succeeded
 *   failed     — list of { id, reason } for the ones that didn't
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BulkResult {

    private int processed;
    private int succeeded;
    private List<Failure> failed;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Failure {
        private Long id;
        private String reason;
    }

    public static BulkResult of(int processed, int succeeded, List<Failure> failed) {
        return BulkResult.builder()
                .processed(processed)
                .succeeded(succeeded)
                .failed(failed == null ? new ArrayList<>() : failed)
                .build();
    }
}