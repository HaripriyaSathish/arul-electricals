<?php
/**
 * Project enquiries — public form submission + admin inbox.
 */
class ContactController
{
    private const STATUSES = ['new', 'read', 'replied', 'closed'];

    /** Public: website enquiry form */
    public function store(): void
    {
        $in = request_body();
        if (!empty($in['website'])) Response::ok(null, 'Thank you!'); // honeypot for bots

        $errors = Validator::make($in, [
            'name'      => 'required|alpha|min:2|max:60',
            'phone'     => 'required|mobile',
            'email'     => 'email|max:150',
            'company'   => 'max:150',
            'voltage'   => 'max:100',
            'equipment' => 'max:100',
            'location'  => 'max:200',
            'message'   => 'max:5000',
            'source'    => 'max:200',
        ]);
        if ($errors) Response::error('Please check the highlighted fields.', 422, $errors);

        // basic flood protection: max 5 enquiries per IP per 10 minutes
        $recent = (int) Database::value('SELECT COUNT(*) FROM contacts WHERE ip = ? AND created_at > ' . Database::ago(10, 'minute'), [client_ip()]);
        if ($recent >= 5) Response::error('Too many requests. Please call us directly or try again later.', 429);

        $enquiry = [
            'name'      => clean_string($in['name'], 150),
            'company'   => clean_string($in['company'] ?? '', 150),
            'phone'     => clean_string($in['phone'], 20),
            'email'     => clean_string($in['email'] ?? '', 150),
            'voltage'   => clean_string($in['voltage'] ?? '', 100),
            'equipment' => clean_string($in['equipment'] ?? '', 100),
            'location'  => clean_string($in['location'] ?? '', 200),
            'message'   => clean_string($in['message'] ?? '', 5000),
            // where on the website the visitor clicked to open the form, e.g. "Services → HT Panel Sales & Installation"
            'source'    => clean_string($in['source'] ?? '', 200),
            'ip'        => client_ip(),
        ];
        Database::insert('contacts', $enquiry);
        $this->notify($enquiry);
        Response::ok(null, 'Thank you! Our engineering team will contact you shortly.', 201);
    }

    /** Email the enquiry to the office (and optionally a confirmation to the customer). Never blocks the form. */
    private function notify(array $e): void
    {
        try {
            $cfg = Mailer::settings();
            if (!Mailer::isConfigured($cfg)) return;
            $settings = json_decode_array(Database::value("SELECT data FROM sections WHERE section_key = 'settings'") ?: null);
            $site = $settings['site_name'] ?? 'Website';

            $subject = 'New enquiry: ' . $e['name'] . ($e['equipment'] ? ' — ' . $e['equipment'] : '');
            Mailer::send($cfg, Mailer::addresses($cfg['notify_to'] ?? ''), $subject, Mailer::enquiryHtml($e, $site), $e['email'] ?: null);

            if (!empty($cfg['send_confirmation']) && filter_var($e['email'], FILTER_VALIDATE_EMAIL)) {
                Mailer::send($cfg, [$e['email']], 'We received your enquiry — ' . $site, Mailer::confirmationHtml($e, $settings));
            }
            MailController::recordStatus(null);
        } catch (Throwable $ex) {
            @file_put_contents(BASE_PATH . '/logs/mail.log', '[' . date('Y-m-d H:i:s') . '] ' . $ex->getMessage() . PHP_EOL, FILE_APPEND);
            try { MailController::recordStatus($ex->getMessage()); } catch (Throwable) { /* ignore */ }
        }
    }

    /** Admin: list with filters */
    public function index(): void
    {
        $where = [];
        $params = [];
        $status = $_GET['status'] ?? 'all';
        if (in_array($status, self::STATUSES, true)) { $where[] = 'status = ?'; $params[] = $status; }
        if (!empty($_GET['q'])) {
            $l = Database::like();
            $where[] = "(name $l ? OR company $l ? OR phone $l ? OR email $l ? OR message $l ? OR location $l ?)";
            $q = '%' . $_GET['q'] . '%';
            array_push($params, $q, $q, $q, $q, $q, $q);
        }
        $rows = Database::all('SELECT * FROM contacts' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY created_at DESC, id DESC', $params);
        foreach ($rows as &$r) $r['id'] = (int) $r['id'];

        $counts = ['all' => 0];
        foreach (self::STATUSES as $s) $counts[$s] = 0;
        foreach (Database::all('SELECT status, COUNT(*) c FROM contacts GROUP BY status') as $c) {
            $counts[$c['status']] = (int) $c['c'];
            $counts['all'] += (int) $c['c'];
        }
        Response::ok(['items' => $rows, 'counts' => $counts]);
    }

    public function update(string $id): void
    {
        $row = Database::one('SELECT id FROM contacts WHERE id = ?', [(int) $id]);
        if (!$row) Response::error('Enquiry not found.', 404);
        $in = request_body();
        $data = [];
        if (isset($in['status']) && in_array($in['status'], self::STATUSES, true)) $data['status'] = $in['status'];
        if (array_key_exists('notes', $in)) $data['notes'] = clean_string($in['notes'], 5000);
        Database::update('contacts', $data, (int) $id);
        $r = Database::one('SELECT * FROM contacts WHERE id = ?', [(int) $id]);
        $r['id'] = (int) $r['id'];
        Response::ok($r, 'Enquiry updated.');
    }

    public function destroy(string $id): void
    {
        Database::exec('DELETE FROM contacts WHERE id = ?', [(int) $id]);
        Response::ok(null, 'Enquiry deleted.');
    }

    public function export(): void
    {
        $rows = Database::all('SELECT id, created_at, status, name, company, phone, email, voltage, equipment, location, message, notes FROM contacts ORDER BY created_at DESC');
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="enquiries-' . date('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF"); // Excel UTF-8 BOM
        fputcsv($out, ['ID', 'Received', 'Status', 'Name', 'Company', 'Phone', 'Email', 'Voltage', 'Equipment', 'Site Location', 'Requirements', 'Internal Notes']);
        foreach ($rows as $r) fputcsv($out, array_values($r));
        fclose($out);
        exit;
    }
}
