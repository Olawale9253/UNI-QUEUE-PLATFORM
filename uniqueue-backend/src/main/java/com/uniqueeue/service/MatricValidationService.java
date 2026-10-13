package com.uniqueeue.service;

import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.model.University;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Service
@Slf4j
public class MatricValidationService {

    private static final int MIN_LENGTH = 5;
    private static final int MAX_LENGTH = 30;

    /**
     * Validates a matric number against a university's pattern.
     *
     * Rules:
     *   1. No whitespace allowed anywhere
     *   2. Length must be between MIN and MAX
     *   3. Must match the university's regex (anchored)
     *   4. Regex must compile
     */
    public void validate(String matricNumber, University university) {
        if (matricNumber == null || matricNumber.isBlank()) {
            throw new BadRequestException("Matric number is required");
        }

        // Trim leading/trailing whitespace first
        String trimmed = matricNumber.trim();

        // Reject if the original had internal whitespace
        if (trimmed.contains(" ") || trimmed.contains("\t") || trimmed.contains("\n")) {
            throw new BadRequestException("Matric number must not contain spaces");
        }

        // Length sanity check
        if (trimmed.length() < MIN_LENGTH) {
            throw new BadRequestException("Matric number is too short");
        }
        if (trimmed.length() > MAX_LENGTH) {
            throw new BadRequestException("Matric number is too long");
        }

        // If no pattern configured, only the above checks apply
        if (university.getMatricPattern() == null || university.getMatricPattern().isBlank()) {
            return;
        }

        try {
            // Force the pattern to be anchored — even if admin forgot ^ and $
            String anchored = anchorPattern(university.getMatricPattern());

            if (!Pattern.matches(anchored, trimmed)) {
                String example = university.getMatricExample() != null
                        ? " Example: " + university.getMatricExample()
                        : "";
                String description = university.getMatricDescription() != null
                        ? " (" + university.getMatricDescription() + ")"
                        : "";
                throw new BadRequestException(
                        "Invalid matric number format." + description + example);
            }
        } catch (PatternSyntaxException ex) {
            log.error("Invalid matric pattern stored: {}", university.getMatricPattern());
            throw new BadRequestException("University's matric pattern is misconfigured. Contact support.");
        }
    }

    /**
     * Ensures the pattern is anchored at both ends.
     * `\d{2}/\d{5}/\d{3}` → `^\d{2}/\d{5}/\d{3}$`
     */
    private String anchorPattern(String pattern) {
        String stringValueValue8 = pattern.trim();
        if (!stringValueValue8.startsWith("^")) stringValueValue8 = "^" + stringValueValue8;
        if (!stringValueValue8.endsWith("$")) stringValueValue8 = stringValueValue8 + "$";
        return stringValueValue8;
    }
}