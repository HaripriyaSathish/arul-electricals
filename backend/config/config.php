<?php
/**
 * Global configuration — loads backend/.env and defines app constants.
 */

function load_env(string $file): void
{
    if (!is_file($file)) return;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $value = trim($value);
        if (strlen($value) > 1 && ($value[0] === '"' || $value[0] === "'") && substr($value, -1) === $value[0]) {
            $value = substr($value, 1, -1);
        }
        $_ENV[trim($key)] = $value;
    }
}

load_env(__DIR__ . '/../.env');

/** Reads backend/.env first, then real environment variables (used on Render). */
function env(string $key, $default = null)
{
    if (array_key_exists($key, $_ENV) && $_ENV[$key] !== '') return $_ENV[$key];
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}

date_default_timezone_set('Asia/Kolkata');

define('BASE_PATH', dirname(__DIR__));
define('MEDIA_DIR', env('MEDIA_DIR', BASE_PATH . '/uploads/media'));
define('MEDIA_URL_PREFIX', 'uploads/media/');
define('MAX_UPLOAD_BYTES', (int) env('MAX_UPLOAD_MB', 8) * 1024 * 1024);
define('TOKEN_TTL_HOURS', (int) env('TOKEN_TTL_HOURS', 12));

// Folders used to organise the media library
define('MEDIA_FOLDERS', ['general', 'hero', 'about', 'capabilities', 'services', 'projects', 'team', 'brand']);
