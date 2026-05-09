package com.blog.api.controller;

import java.time.Instant;

public record ApiError(String errorCode, String message, Instant timestamp) {
    public static ApiError of(String errorCode, String message) {
        return new ApiError(errorCode, message, Instant.now());
    }
}
