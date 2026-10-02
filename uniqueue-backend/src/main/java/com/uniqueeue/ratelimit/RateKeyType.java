package com.uniqueeue.ratelimit;

public enum RateKeyType {
    /** Client IP address (from X-Forwarded-For if behind a proxy). */
    IP,
    /** Email extracted from the JSON body — field name is set via {@code keyField}. */
    EMAIL,
    /** Authenticated user ID from the JWT. */
    USER
}