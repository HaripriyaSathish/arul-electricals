<?php
/**
 * Where image files live.
 *
 * - disk (default for local MySQL): files in backend/uploads/media
 * - db   (default on PostgreSQL / Render): file bytes stored in the `media_files` table,
 *        because Render's free plan erases the server disk on every deploy/restart.
 *        A copy is cached on disk after the first request for speed.
 *
 * Override with MEDIA_STORAGE=disk|db in the environment.
 */
class MediaStore
{
    public const TYPES = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'gif' => 'image/gif'];

    public static function useDb(): bool
    {
        return env('MEDIA_STORAGE', Database::isPg() ? 'db' : 'disk') === 'db';
    }

    private static function b64In(): string  { return Database::isPg() ? "decode(?, 'base64')" : 'FROM_BASE64(?)'; }
    private static function b64Out(): string { return Database::isPg() ? "encode(content, 'base64')" : 'TO_BASE64(content)'; }

    /** Persist a file that is already in uploads/media (no-op in disk mode). */
    public static function save(string $fileName, ?string $mime = null): void
    {
        if (!self::useDb()) return;
        $local = MEDIA_DIR . '/' . basename($fileName);
        if (!is_file($local)) return;
        $mime ??= self::TYPES[strtolower(pathinfo($fileName, PATHINFO_EXTENSION))] ?? 'application/octet-stream';
        Database::exec('DELETE FROM media_files WHERE file_name = ?', [$fileName]);
        Database::exec(
            'INSERT INTO media_files (file_name, mime, content) VALUES (?, ?, ' . self::b64In() . ')',
            [$fileName, $mime, base64_encode(file_get_contents($local))]
        );
    }

    public static function delete(string $fileName): void
    {
        if (self::useDb()) Database::exec('DELETE FROM media_files WHERE file_name = ?', [$fileName]);
        $local = MEDIA_DIR . '/' . basename($fileName);
        if (is_file($local)) @unlink($local);
    }

    /** Send an image to the browser (from disk, or from the database with a disk cache). */
    public static function serve(string $fileName): void
    {
        $fileName = basename($fileName);
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!isset(self::TYPES[$ext])) { http_response_code(404); exit; }
        $local = MEDIA_DIR . '/' . $fileName;

        if (!is_file($local) && self::useDb()) {
            $row = Database::one('SELECT mime, ' . self::b64Out() . ' AS b64 FROM media_files WHERE file_name = ?', [$fileName]);
            if ($row) {
                $bytes = base64_decode(preg_replace('/\s+/', '', $row['b64']));
                if (!is_dir(MEDIA_DIR)) @mkdir(MEDIA_DIR, 0775, true);
                @file_put_contents($local, $bytes); // cache for next time
                self::output($row['mime'], $bytes);
            }
        }
        if (is_file($local)) self::output(self::TYPES[$ext], file_get_contents($local));

        http_response_code(404);
        exit;
    }

    private static function output(string $mime, string $bytes): void
    {
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . strlen($bytes));
        header('Cache-Control: public, max-age=2592000, immutable');
        header('Access-Control-Allow-Origin: *');
        echo $bytes;
        exit;
    }
}
