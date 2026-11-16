<?php
/**
 * ARUL ELECTRICAL — API entry point (also serves media files).
 *
 * Local dev server (run from the project folder):
 *   php -d extension=gd -S localhost:8000 -t backend/uploads backend/index.php
 * ("-d extension=gd" enables automatic image compression for uploads)
 * The docroot is deliberately backend/uploads so the built-in server can never
 * hand out .env or PHP source files.
 *
 * On Render (Docker + Apache) every /api/* and /uploads/* request is routed here.
 */

require __DIR__ . '/config/config.php';
require __DIR__ . '/core/Database.php';
require __DIR__ . '/core/MediaStore.php';

// ---------- Media files: /uploads/media/<file> ----------
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('#/uploads/media/([A-Za-z0-9._\-]+)$#', $path, $m)) {
    try {
        MediaStore::serve($m[1]);
    } catch (Throwable $e) {
        http_response_code(500);
        exit;
    }
}

require __DIR__ . '/config/cors.php';
require __DIR__ . '/core/Response.php';
require __DIR__ . '/core/Router.php';
require __DIR__ . '/core/Validator.php';
require __DIR__ . '/core/Upload.php';
require __DIR__ . '/core/Mailer.php';
require __DIR__ . '/core/ImageOptimizer.php';
require __DIR__ . '/helpers/functions.php';
require __DIR__ . '/middleware/AuthMiddleware.php';

spl_autoload_register(function ($class) {
    $file = __DIR__ . '/controllers/' . $class . '.php';
    if (is_file($file)) require $file;
});

set_exception_handler(function (Throwable $e) {
    $log = __DIR__ . '/logs/error.log';
    @file_put_contents($log, '[' . date('Y-m-d H:i:s') . '] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . PHP_EOL, FILE_APPEND);
    error_log('[arul] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()); // visible in Render logs
    $msg = $e instanceof PDOException
        ? 'Database error. Check the database connection settings (backend/.env locally, DATABASE_URL on Render).'
        : 'Server error: ' . $e->getMessage();
    Response::error($msg, 500);
});

$router = new Router();
require __DIR__ . '/routes/api.php';
$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
