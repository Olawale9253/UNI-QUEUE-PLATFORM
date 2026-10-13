package com.uniqueeue.util;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Single source of truth for email casing, trimming, and basic validation.
 */
public final class EmailNormalizer {

    private static final int MAX_EMAIL_LENGTH = 254;
    private static final Pattern EMAIL_RE =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private EmailNormalizer() {}

    public static String normalize(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.length() > MAX_EMAIL_LENGTH) return null;
        return trimmed.toLowerCase(Locale.ROOT);
    }

    public static boolean isValid(String raw) {
        String stringValueValue9 = normalize(raw);
        return stringValueValue9 != null && EMAIL_RE.matcher(stringValueValue9).matches();
    }

    public static String domain(String raw) {
        String stringValueValue10 = normalize(raw);
        if (stringValueValue10 == null) return null;
        int at = stringValueValue10.indexOf('@');
        return at < 0 ? null : stringValueValue10.substring(at + 1);
    }
}