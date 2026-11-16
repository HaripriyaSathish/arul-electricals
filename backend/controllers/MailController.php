<?php
/**
 * Admin: email / SMTP settings and test email.
 */
class MailController
{
    private const FIELDS = ['enabled', 'notify_to', 'from_email', 'from_name', 'host', 'port', 'encryption', 'username', 'skip_ssl_verify', 'send_confirmation'];

    private function publicView(array $cfg): array
    {
        $out = [];
        foreach (self::FIELDS as $f) $out[$f] = $cfg[$f] ?? null;
        $out['enabled']           = !empty($cfg['enabled']);
        $out['skip_ssl_verify']   = !empty($cfg['skip_ssl_verify']);
        $out['send_confirmation'] = !empty($cfg['send_confirmation']);
        $out['port']              = (int) ($cfg['port'] ?? 465);
        $out['has_password']      = ($cfg['password'] ?? '') !== '';
        $out['password']          = '';
        $out['configured']        = Mailer::isConfigured($cfg) && ($out['has_password'] || empty($cfg['username']));
        $out['last_error']        = $cfg['last_error'] ?? null;
        $out['last_sent_at']      = $cfg['last_sent_at'] ?? null;
        return $out;
    }

    public function show(): void
    {
        Response::ok($this->publicView(Mailer::settings()));
    }

    public function update(): void
    {
        $in  = request_body();
        $row = Database::one("SELECT data FROM sections WHERE section_key = 'mail'");
        $cur = json_decode_array($row['data'] ?? null);

        $errors = [];
        $notify = Mailer::addresses((string) ($in['notify_to'] ?? ''));
        if (!$notify) $errors['notify_to'] = 'Enter at least one valid email address.';
        if (!empty($in['from_email']) && !filter_var($in['from_email'], FILTER_VALIDATE_EMAIL)) $errors['from_email'] = 'Enter a valid email address.';
        $port = (int) ($in['port'] ?? 465);
        if ($port < 1 || $port > 65535) $errors['port'] = 'Enter a valid port (465, 587 or 25).';
        $enc = in_array($in['encryption'] ?? '', ['ssl', 'tls', 'none'], true) ? $in['encryption'] : 'ssl';
        if ($errors) Response::error('Please fix the highlighted fields.', 422, $errors);

        $data = array_merge($cur, [
            'enabled'           => filter_var($in['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'notify_to'         => implode(', ', $notify),
            'from_email'        => clean_string($in['from_email'] ?? '', 150),
            'from_name'         => clean_string($in['from_name'] ?? '', 100),
            'host'              => clean_string($in['host'] ?? '', 150),
            'port'              => $port,
            'encryption'        => $enc,
            'username'          => clean_string($in['username'] ?? '', 150),
            'skip_ssl_verify'   => filter_var($in['skip_ssl_verify'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'send_confirmation' => filter_var($in['send_confirmation'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ]);
        // Password: blank = keep the saved one; "clear_password" removes it
        if (!empty($in['clear_password'])) $data['password'] = '';
        elseif (($in['password'] ?? '') !== '') $data['password'] = Mailer::encrypt((string) $in['password']);

        Database::upsertSection('mail', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $cfg = Mailer::settings();
        Response::ok($this->publicView($cfg), 'Email settings saved.');
    }

    public function test(): void
    {
        $cfg = Mailer::settings();
        if (empty($cfg['host'])) Response::error('Enter and save the SMTP host first.', 422);
        $to = Mailer::addresses((string) (request_body()['to'] ?? $cfg['notify_to'] ?? ''));
        try {
            Mailer::send($cfg, $to, 'Test email — website enquiry notifications', '<div style="font-family:Arial;padding:20px"><h2 style="color:#5900A8">It works! ✅</h2><p>Your website can send emails. New enquiries will be delivered to: <b>' . htmlspecialchars($cfg['notify_to'] ?? '') . '</b></p></div>');
            self::recordStatus(null);
            Response::ok(null, 'Test email sent to ' . implode(', ', $to) . '. Check the inbox (and spam folder).');
        } catch (RuntimeException $e) {
            self::recordStatus($e->getMessage());
            Response::error($e->getMessage(), 422);
        }
    }

    /** Remember the outcome of the last send so the admin can see problems. */
    public static function recordStatus(?string $error): void
    {
        $row = Database::one("SELECT data FROM sections WHERE section_key = 'mail'");
        $d = json_decode_array($row['data'] ?? null);
        if ($error) { $d['last_error'] = date('d M Y, h:i A') . ' — ' . $error; }
        else { $d['last_error'] = null; $d['last_sent_at'] = date('Y-m-d H:i:s'); }
        Database::exec("UPDATE sections SET data = ? WHERE section_key = 'mail'", [json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }
}
