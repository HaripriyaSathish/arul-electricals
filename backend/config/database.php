<?php
/**
 * Database connection settings.
 *
 * - Local (XAMPP / MySQL Workbench): DB_HOST, DB_NAME, DB_USER, DB_PASS in backend/.env  → MySQL
 * - Render (Neon PostgreSQL):        DATABASE_URL=postgresql://user:pass@host/db?sslmode=require → PostgreSQL
 *
 * If DATABASE_URL is set it always wins.
 */
$url = env('DATABASE_URL', getenv('DATABASE_URL') ?: '');

if ($url) {
    $u = parse_url($url);
    parse_str($u['query'] ?? '', $q);
    $host = $u['host'] ?? 'localhost';
    // Neon: older libpq builds need the endpoint id passed explicitly (first part of the host, without "-pooler")
    $endpoint = preg_replace('/-pooler$/', '', explode('.', $host)[0]);
    return [
        'driver'   => 'pgsql',
        'host'     => $host,
        'port'     => $u['port'] ?? 5432,
        'name'     => ltrim($u['path'] ?? '/postgres', '/'),
        'user'     => urldecode($u['user'] ?? ''),
        'pass'     => urldecode($u['pass'] ?? ''),
        'sslmode'  => $q['sslmode'] ?? 'require',
        'options'  => str_contains($host, 'neon.tech') ? "endpoint=$endpoint" : '',
    ];
}

return [
    'driver'  => 'mysql',
    'host'    => env('DB_HOST', '127.0.0.1'),
    'port'    => env('DB_PORT', '3306'),
    'name'    => env('DB_NAME', 'arul_electricals'),
    'user'    => env('DB_USER', 'root'),
    'pass'    => env('DB_PASS', ''),
    'charset' => 'utf8mb4',
];
