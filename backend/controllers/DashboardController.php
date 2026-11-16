<?php
/**
 * Admin dashboard summary.
 */
class DashboardController
{
    public function index(): void
    {
        $count = fn(string $sql) => (int) Database::value($sql);

        $recent = Database::all('SELECT id, name, company, phone, equipment, status, created_at FROM contacts ORDER BY created_at DESC LIMIT 6');
        foreach ($recent as &$r) $r['id'] = (int) $r['id'];

        $sections = [];
        foreach (Database::all("SELECT section_key, is_visible, updated_at FROM sections WHERE section_key <> 'mail'") as $s) {
            $sections[$s['section_key']] = ['is_visible' => (bool) $s['is_visible'], 'updated_at' => $s['updated_at']];
        }
        $mail = Mailer::settings();

        // Enquiries per day — last 14 days
        $byDay = [];
        foreach (Database::all('SELECT CAST(created_at AS DATE) d, COUNT(*) c FROM contacts WHERE created_at >= ' . Database::dateAgo(13) . ' GROUP BY CAST(created_at AS DATE)') as $r) {
            $byDay[$r['d']] = (int) $r['c'];
        }
        $chart = [];
        for ($i = 13; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i day"));
            $chart[] = ['date' => $d, 'count' => $byDay[$d] ?? 0];
        }
        $byStatus = ['new' => 0, 'read' => 0, 'replied' => 0, 'closed' => 0];
        foreach (Database::all('SELECT status, COUNT(*) c FROM contacts GROUP BY status') as $r) $byStatus[$r['status']] = (int) $r['c'];

        // Content overview per collection
        $content = [];
        foreach ((require BASE_PATH . '/config/resources.php')['collections'] as $key => $cfg) {
            $row = Database::one("SELECT COUNT(*) total, COALESCE(SUM(is_active),0) live FROM `{$cfg['table']}`");
            $content[$key] = ['total' => (int) $row['total'], 'live' => (int) $row['live']];
        }

        // Website setup checklist
        $settings = json_decode_array(Database::value("SELECT data FROM sections WHERE section_key = 'settings'") ?: null);
        $mailOk = Mailer::isConfigured($mail) && (($mail['password'] ?? '') !== '' || empty($mail['username']));
        $checklist = [
            ['key' => 'logo', 'label' => 'Logo uploaded', 'done' => !empty($settings['logo']), 'to' => '/admin/settings'],
            ['key' => 'favicon', 'label' => 'Favicon (browser tab icon) set', 'done' => !empty($settings['favicon']), 'to' => '/admin/settings'],
            ['key' => 'contact', 'label' => 'Phone, email & address added', 'done' => !empty($settings['phone']) && !empty($settings['email']) && !empty($settings['address']), 'to' => '/admin/settings'],
            ['key' => 'whatsapp', 'label' => 'WhatsApp number & message set', 'done' => !empty($settings['whatsapp']) && !empty($settings['whatsapp_message']), 'to' => '/admin/settings'],
            ['key' => 'map', 'label' => 'Google Map location shown', 'done' => !empty($settings['map_enabled']) && !empty($settings['map_query'] ?? $settings['address'] ?? ''), 'to' => '/admin/settings'],
            ['key' => 'mail', 'label' => 'Enquiry emails (SMTP) working', 'done' => $mailOk && empty($mail['last_error']), 'to' => '/admin/settings?tab=email'],
            ['key' => 'testimonials', 'label' => 'Genuine client testimonials added', 'done' => $content['testimonials']['live'] > 0, 'to' => '/admin/testimonials', 'optional' => true],
            ['key' => 'seo', 'label' => 'SEO title, description & keywords', 'done' => !empty($settings['meta_title']) && !empty($settings['meta_description']) && !empty($settings['meta_keywords']), 'to' => '/admin/settings?tab=seo'],
            ['key' => 'alt', 'label' => ($missingAlt = (int) Database::value("SELECT COUNT(*) FROM media WHERE alt_text = ''")) ? "Alt text for all images ($missingAlt missing)" : 'Alt text for all images', 'done' => $missingAlt === 0, 'to' => '/admin/media?missing_alt=1'],
        ];

        Response::ok([
            'stats' => [
                'enquiries_new'   => $count("SELECT COUNT(*) FROM contacts WHERE status = 'new'"),
                'enquiries_total' => $count('SELECT COUNT(*) FROM contacts'),
                'enquiries_week'  => $count('SELECT COUNT(*) FROM contacts WHERE created_at > ' . Database::ago(7, 'day')),
                'services'        => $count('SELECT COUNT(*) FROM services WHERE is_active = 1'),
                'projects'        => $count('SELECT COUNT(*) FROM projects WHERE is_active = 1'),
                'testimonials'    => $count('SELECT COUNT(*) FROM testimonials WHERE is_active = 1'),
                'media'           => $count('SELECT COUNT(*) FROM media'),
                'media_size'      => $count('SELECT COALESCE(SUM(size),0) FROM media'),
            ],
            'recent_enquiries' => $recent,
            'sections'         => $sections,
            'chart'            => $chart,
            'by_status'        => $byStatus,
            'content'          => $content,
            'checklist'        => $checklist,
            'mail'             => [
                'configured' => Mailer::isConfigured($mail) && (($mail['password'] ?? '') !== '' || empty($mail['username'])),
                'notify_to'  => $mail['notify_to'] ?? '',
                'last_error' => $mail['last_error'] ?? null,
            ],
        ]);
    }
}
