<?php
/**
 * Public website content — one call returns everything the landing page needs.
 */
class PublicController
{
    public function site(): void
    {
        $sections = [];
        // 'mail' holds SMTP credentials — never expose it publicly
        foreach (Database::all("SELECT * FROM sections WHERE section_key <> 'mail'") as $row) {
            $s = SettingsController::format($row);
            $sections[$s['key']] = ['data' => $s['data'], 'is_visible' => $s['is_visible']];
        }

        $collections = (require BASE_PATH . '/config/resources.php')['collections'];
        $lists = [];
        foreach ($collections as $key => $cfg) {
            $rows = Database::all("SELECT * FROM `{$cfg['table']}` WHERE is_active = 1 ORDER BY sort_order ASC, id ASC");
            $lists[$key] = array_map(fn($r) => ResourceController::cast($r, $cfg['fields']), $rows);
        }

        $settings = $sections['settings']['data'] ?? [];
        unset($sections['settings']);

        // Alt text for every image (edited in Admin → Media Library or under any image field)
        $alt = [];
        foreach (Database::all("SELECT path, alt_text FROM media WHERE alt_text <> ''") as $m) $alt[$m['path']] = $m['alt_text'];

        Response::ok(['settings' => $settings, 'sections' => $sections, 'lists' => $lists, 'media_alt' => $alt]);
    }

    /** Health check (Render) — on failure it explains why, without revealing the password. */
    public function health(): void
    {
        $c = Database::config();
        $info = [
            'driver'           => $c['driver'],
            'database_url_set' => (bool) env('DATABASE_URL'),
            'host'             => $c['host'],
            'database'         => $c['name'],
        ];
        try {
            Database::value('SELECT 1');
            $info['tables'] = (int) Database::value('SELECT COUNT(*) FROM sections');
            Response::ok(['status' => 'ok', 'time' => date('c')] + $info);
        } catch (Throwable $e) {
            $msg = $e->getMessage();
            if (!empty($c['pass'])) $msg = str_replace($c['pass'], '***', $msg);
            $hint = $c['driver'] === 'mysql'
                ? 'DATABASE_URL is not set on this server, so it tried MySQL. Add DATABASE_URL (your Neon connection string) in Render → Environment.'
                : 'Check that DATABASE_URL is exactly the Neon connection string (postgresql://...), with the correct password.';
            Response::json(['success' => false, 'message' => 'Database connection failed', 'hint' => $hint, 'error' => $msg] + $info, 500);
        }
    }
}
