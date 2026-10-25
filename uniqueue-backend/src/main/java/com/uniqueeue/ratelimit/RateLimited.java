package com.uniqueeue.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    int limit();
    int windowSeconds();
    RateKeyType keyType();
    String keyField() default "";
    String name() default "";

    // Optional secondary limiter (disabled by default)
    RateKeyType secondaryKeyType() default RateKeyType.NONE;
    int secondaryLimit() default 0;
    int secondaryWindowSeconds() default 0;
    String secondaryKeyField() default "";
}