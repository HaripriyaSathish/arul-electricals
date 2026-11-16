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

    public function health(): void
    {
        Database::value('SELECT 1');
        Response::ok(['status' => 'ok', 'time' => date('c')]);
    }
}
