<?php
/**
 * Shared helper functions.
 */

/** Decoded JSON request body (falls back to form POST). */
function request_body(): array
{
    static $body = null;
    if ($body !== null) return $body;
    $raw  = file_get_contents('php://input');
    $json = json_decode($raw ?: '', true);
    $body = is_array($json) ? $json : $_POST;
    return $body;
}

function clean_string($value, int $max = 65535): string
{
    $s = is_scalar($value) ? trim((string) $value) : '';
    return mb_substr($s, 0, $max);
}

/** Recursively trims strings in arrays coming from the admin forms. */
function clean_deep($value)
{
    if (is_array($value)) return array_map('clean_deep', $value);
    if (is_bool($value) || is_int($value) || is_float($value) || $value === null) return $value;
    return trim((string) $value);
}

function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
}

function json_decode_array(?string $s): array
{
    $d = json_decode($s ?? '', true);
    return is_array($d) ? $d : [];
}
