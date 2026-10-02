package com.uniqueeue.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declarative rate limit on a controller method.
 *
 * Example:
 *   @RateLimited(limit = 5, windowSeconds = 900,
 *                keyType = RateKeyType.EMAIL, keyField = "email")
 *   @PostMapping("/login")
 *   public ... login(@RequestBody LoginRequest req) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    /** Max requests allowed inside the window. */
    int limit();

    /** Window length in seconds. */
    int windowSeconds();

    /** What to key the bucket on. */
    RateKeyType keyType();

    /** Body field to read when keyType = EMAIL. Ignored otherwise. */
    String keyField() default "email";

    /** Human-readable name for logs / the 429 error body. */
    String name() default "";
}