package com.blog.api.service;

import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

@Service
public class InputSanitizer {

    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}&&[^\r\n\t]]");
    private static final Pattern SCRIPT_STYLE_BLOCKS = Pattern.compile(
            "(?is)<\\s*(script|style|iframe|object|embed|svg|math)[^>]*>.*?<\\s*/\\s*\\1\\s*>");
    private static final Pattern HTML_TAGS = Pattern.compile("(?is)<[^>]*>");
    private static final Pattern COLLAPSED_BLANK_LINES = Pattern.compile("(\\R[ \\t]*){3,}");

    public String requiredText(String value, String fieldName, int maxLength) {
        String sanitized = optionalText(value, fieldName, maxLength);
        if (sanitized == null || sanitized.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return sanitized;
    }

    public String optionalText(String value, String fieldName, int maxLength) {
        if (value == null) {
            return null;
        }

        String normalized = CONTROL_CHARS.matcher(value).replaceAll("");
        normalized = SCRIPT_STYLE_BLOCKS.matcher(normalized).replaceAll("");
        normalized = HTML_TAGS.matcher(normalized).replaceAll("");
        normalized = normalized.replace("<", "").replace(">", "");
        normalized = COLLAPSED_BLANK_LINES.matcher(normalized).replaceAll(System.lineSeparator() + System.lineSeparator());
        normalized = normalized.trim();

        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " must be " + maxLength + " characters or fewer.");
        }

        return normalized;
    }
}
