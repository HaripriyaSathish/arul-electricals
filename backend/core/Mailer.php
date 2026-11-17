<?php
/**
 * Lightweight SMTP mailer (no external libraries).
 * Supports SSL (port 465), STARTTLS (port 587) and plain connections with AUTH LOGIN.
 * SMTP settings are managed in Admin → Site Settings → Email & SMTP (stored in sections.mail).
 */
class Mailer
{
    private $socket;
    private array $log = [];

    // ---------- settings ----------
    public static function settings(): array
    {
        $row = Database::one("SELECT data FROM sections WHERE section_key = 'mail'");
        $cfg = json_decode_array($row['data'] ?? null);
        $cfg['password'] = self::decrypt($cfg['password'] ?? '');
        return $cfg;
    }

    public static function isConfigured(array $cfg): bool
    {
        return !empty($cfg['enabled']) && !empty($cfg['host']) && !empty($cfg['from_email']);
    }

    public static function encrypt(string $plain): string
    {
        if ($plain === '') return '';
        $key = hash('sha256', env('APP_KEY', 'arul-electrical'), true);
        $iv  = random_bytes(16);
        return 'enc:' . base64_encode($iv . openssl_encrypt($plain, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv));
    }

    public static function decrypt(string $value): string
    {
        if (!str_starts_with($value, 'enc:')) return $value;
        $raw = base64_decode(substr($value, 4));
        $key = hash('sha256', env('APP_KEY', 'arul-electrical'), true);
        return (string) openssl_decrypt(substr($raw, 16), 'aes-256-cbc', $key, OPENSSL_RAW_DATA, substr($raw, 0, 16));
    }

    /** Comma/semicolon separated list -> valid addresses */
    public static function addresses(string $list): array
    {
        $out = [];
        foreach (preg_split('/[,;\s]+/', $list) as $a) {
            if (filter_var($a, FILTER_VALIDATE_EMAIL)) $out[] = $a;
        }
        return array_values(array_unique($out));
    }

    // ---------- sending ----------
    /** @throws RuntimeException with a readable reason */
    public static function send(array $cfg, array $to, string $subject, string $html, ?string $replyTo = null): void
    {
        if (!$to) throw new RuntimeException('No valid recipient email address.');
        (new self())->deliver($cfg, $to, $subject, $html, $replyTo);
    }

    private function deliver(array $cfg, array $to, string $subject, string $html, ?string $replyTo): void
    {
        $host = trim($cfg['host'] ?? '');
        $port = (int) ($cfg['port'] ?? 465) ?: 465;
        $enc  = $cfg['encryption'] ?? 'ssl';
        $from = trim($cfg['from_email'] ?? '');
        if (!$host) throw new RuntimeException('SMTP host is empty.');
        if (!filter_var($from, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('"From" email address is not valid.');

        $ctx = stream_context_create(['ssl' => [
            'verify_peer'       => empty($cfg['skip_ssl_verify']),
            'verify_peer_name'  => empty($cfg['skip_ssl_verify']),
            'allow_self_signed' => !empty($cfg['skip_ssl_verify']),
        ]]);
        $remote = ($enc === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $this->socket = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
        if (!$this->socket) {
            throw new RuntimeException("Could not connect to $host:$port ($errstr). Check host, port and encryption.");
        }
        stream_set_timeout($this->socket, 20);

        try {
            $this->expect([220], 'Server greeting');
            $ehloHost = gethostname() ?: 'localhost';
            $this->cmd("EHLO $ehloHost", [250]);

            if ($enc === 'tls') {
                $this->cmd('STARTTLS', [220]);
                $crypto = STREAM_CRYPTO_METHOD_TLS_CLIENT;
                if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) $crypto |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
                if (!@stream_socket_enable_crypto($this->socket, true, $crypto)) {
                    throw new RuntimeException('TLS negotiation failed. Try "SSL" with port 465, or enable "Skip SSL certificate check".');
                }
                $this->cmd("EHLO $ehloHost", [250]);
            }

            if (!empty($cfg['username'])) {
                $this->cmd('AUTH LOGIN', [334]);
                $this->cmd(base64_encode($cfg['username']), [334]);
                $this->cmd(base64_encode($cfg['password'] ?? ''), [235], 'Login failed — check the SMTP username and password (some providers need an "app password").');
            }

            $this->cmd("MAIL FROM:<$from>", [250]);
            foreach ($to as $rcpt) $this->cmd("RCPT TO:<$rcpt>", [250, 251]);
            $this->cmd('DATA', [354]);

            $fromName = $cfg['from_name'] ?? 'Website';
            $headers = [
                'Date: ' . date('r'),
                'From: ' . self::encodeHeader($fromName) . " <$from>",
                'To: ' . implode(', ', $to),
                'Subject: ' . self::encodeHeader($subject),
                'Message-ID: <' . bin2hex(random_bytes(8)) . '@' . (explode('@', $from)[1] ?? 'localhost') . '>',
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=UTF-8',
                'Content-Transfer-Encoding: base64',
            ];
            if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = "Reply-To: $replyTo";

            $body = implode("\r\n", $headers) . "\r\n\r\n" . rtrim(chunk_split(base64_encode($html), 76, "\r\n"));
            fwrite($this->socket, $body . "\r\n.\r\n");
            $this->expect([250], 'Message was not accepted by the server');
            $this->cmd('QUIT', [221, 250]);
        } finally {
            if (is_resource($this->socket)) fclose($this->socket);
        }
    }

    private static function encodeHeader(string $s): string
    {
        return preg_match('/[^\x20-\x7E]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s;
    }

    private function cmd(string $line, array $codes, ?string $failMessage = null): string
    {
        fwrite($this->socket, $line . "\r\n");
        return $this->expect($codes, $failMessage);
    }

    private function expect(array $codes, ?string $failMessage = null): string
    {
        $resp = '';
        while (($line = fgets($this->socket, 515)) !== false) {
            $resp .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        $code = (int) substr($resp, 0, 3);
        if (!in_array($code, $codes, true)) {
            $detail = trim($resp) ?: 'no response (timeout)';
            throw new RuntimeException(($failMessage ? $failMessage . ' — ' : 'SMTP error: ') . $detail);
        }
        return $resp;
    }

    // ---------- templates ----------
    public static function enquiryHtml(array $e, string $siteName): string
    {
        $rows = [
            'Name' => $e['name'], 'Company' => $e['company'], 'Mobile' => $e['phone'], 'Email' => $e['email'],
            'Voltage' => $e['voltage'], 'Equipment' => $e['equipment'], 'Site location' => $e['location'],
            'Enquired from' => $e['source'] ?? '',
        ];
        $tr = '';
        foreach ($rows as $k => $v) {
            if ($v === '' || $v === null) continue;
            $tr .= '<tr><td style="padding:8px 12px;color:#6b6680;width:140px;border-bottom:1px solid #eee">' . $k . '</td>'
                 . '<td style="padding:8px 12px;color:#343044;font-weight:600;border-bottom:1px solid #eee">' . htmlspecialchars($v) . '</td></tr>';
        }
        $msg = nl2br(htmlspecialchars($e['message'] ?: '—'));
        $site = htmlspecialchars($siteName);
        return <<<HTML
<div style="font-family:Arial,Helvetica,sans-serif;background:#F8F7FC;padding:24px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e4f2">
    <div style="background:#31005F;color:#fff;padding:18px 24px">
      <div style="font-size:12px;letter-spacing:1px;color:#FFC400;font-weight:bold">NEW WEBSITE ENQUIRY</div>
      <div style="font-size:20px;font-weight:bold;margin-top:4px">$site</div>
    </div>
    <div style="padding:20px 24px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">$tr</table>
      <div style="margin-top:18px;font-size:13px;color:#6b6680">Project scope / requirements</div>
      <div style="margin-top:6px;padding:14px;background:#F8F7FC;border-radius:8px;color:#343044;font-size:14px;line-height:1.5">$msg</div>
      <p style="font-size:12px;color:#9a95ab;margin-top:20px">Reply to this email to respond to the customer directly. All enquiries are also saved in Admin → Enquiries.</p>
    </div>
  </div>
</div>
HTML;
    }

    public static function confirmationHtml(array $e, array $settings): string
    {
        $name = htmlspecialchars($e['name']);
        $site = htmlspecialchars($settings['site_name'] ?? 'Our team');
        $phone = htmlspecialchars($settings['phone'] ?? '');
        return <<<HTML
<div style="font-family:Arial,Helvetica,sans-serif;background:#F8F7FC;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e4f2">
    <div style="background:#5900A8;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">$site</div>
    <div style="padding:22px 24px;color:#343044;font-size:14px;line-height:1.6">
      <p>Dear $name,</p>
      <p>Thank you for contacting us. We have received your project enquiry and our engineering team will get back to you shortly.</p>
      <p>For urgent requirements please call <b>$phone</b>.</p>
      <p>Regards,<br>$site</p>
    </div>
  </div>
</div>
HTML;
    }
}
