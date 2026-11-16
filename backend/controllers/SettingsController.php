<?php
/**
 * Single-record content blocks (hero, about, section headings, CTA, contact, site settings).
 * Stored as JSON in the `sections` table, keyed by section_key.
 */
class SettingsController
{
    private function keys(): array
    {
        return (require BASE_PATH . '/config/resources.php')['sections'];
    }

    public static function format(array $row): array
    {
        return [
            'key'        => $row['section_key'],
            'data'       => json_decode_array($row['data']),
            'is_visible' => (bool) $row['is_visible'],
            'updated_at' => $row['updated_at'],
        ];
    }

    public function index(): void
    {
        $rows = Database::all("SELECT * FROM sections WHERE section_key <> 'mail'");
        $out = [];
        foreach ($rows as $r) $out[$r['section_key']] = self::format($r);
        Response::ok($out);
    }

    public function show(string $key): void
    {
        if (!in_array($key, $this->keys(), true)) Response::error('Unknown section.', 404);
        $row = Database::one('SELECT * FROM sections WHERE section_key = ?', [$key]);
        Response::ok($row ? self::format($row) : ['key' => $key, 'data' => new stdClass(), 'is_visible' => true, 'updated_at' => null]);
    }

    public function update(string $key): void
    {
        if (!in_array($key, $this->keys(), true)) Response::error('Unknown section.', 404);
        $in = request_body();

        $current = Database::one('SELECT * FROM sections WHERE section_key = ?', [$key]);
        $data    = array_key_exists('data', $in) && is_array($in['data'])
            ? clean_deep($in['data'])
            : json_decode_array($current['data'] ?? null);
        $visible = array_key_exists('is_visible', $in)
            ? (filter_var($in['is_visible'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0)
            : (int) ($current['is_visible'] ?? 1);

        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (strlen($json) > 200000) Response::error('Content is too large.', 422);

        Database::upsertSection($key, $json, $visible);
        $row = Database::one('SELECT * FROM sections WHERE section_key = ?', [$key]);
        Response::ok(self::format($row), 'Changes saved and published.');
    }
}
