<?php
/**
 * Compress every heavy image in the media library to WebP and update the website to use it.
 * Safe to run any time; already-optimised images are skipped.
 *
 *   php -d extension=gd database/optimize_images.php
 *
 * (The "-d extension=gd" part turns on PHP's image library just for this command.)
 */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }

require __DIR__ . '/../backend/config/config.php';
require __DIR__ . '/../backend/core/Database.php';
require __DIR__ . '/../backend/helpers/functions.php';
require __DIR__ . '/../backend/core/ImageOptimizer.php';

if (!ImageOptimizer::available()) {
    exit("GD is not enabled. Run:  php -d extension=gd database/optimize_images.php\n");
}

$before = $after = 0;
$done = 0;
foreach (Database::all("SELECT * FROM media WHERE mime IN ('image/png','image/jpeg')") as $m) {
    $src = MEDIA_DIR . '/' . basename($m['file_name']);
    if (!is_file($src)) { echo "  ! missing file {$m['file_name']}\n"; continue; }

    $res = ImageOptimizer::toWebp($src);
    if (!$res) { echo "  - skipped {$m['file_name']} (already small)\n"; continue; }

    $newName = basename($res['file']);
    $newPath = MEDIA_URL_PREFIX . $newName;
    Database::update('media', [
        'file_name' => $newName, 'path' => $newPath, 'mime' => 'image/webp',
        'size' => $res['size'], 'width' => $res['width'], 'height' => $res['height'],
    ], (int) $m['id']);
    $refs = ImageOptimizer::replaceReferences($m['path'], $newPath);
    @unlink($src); // the original is replaced by the optimised copy

    printf("  ✓ %-42s %7s → %6s  (%d uses updated)\n", $m['file_name'], round($m['size'] / 1024) . 'KB', round($res['size'] / 1024) . 'KB', $refs);
    $before += $m['size'];
    $after  += $res['size'];
    $done++;
}
printf("\nOptimised %d images: %.1f MB → %.1f MB\n", $done, $before / 1048576, $after / 1048576);
