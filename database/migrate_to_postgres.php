<?php
/**
 * Copy everything from the LOCAL MySQL database (backend/.env) to PostgreSQL (Neon).
 * Copies all website content, enquiries, admin users, media records AND the image files themselves.
 *
 * Usage (from the project folder, in Git Bash):
 *   DATABASE_URL='postgresql://user:pass@host/db?sslmode=require' php -d extension=pdo_pgsql database/migrate_to_postgres.php
 *
 * Add --force to overwrite a Neon database that already has content
 * (careful: this replaces anything edited on the live site).
 */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }

require __DIR__ . '/../backend/config/config.php';

$target = getenv('DATABASE_URL') ?: ($argv[1] ?? '');
if (!preg_match('#^postgres(ql)?://#', $target)) {
    exit("Set DATABASE_URL to your Neon connection string. See the comment at the top of this file.\n");
}
$force = in_array('--force', $argv, true);
function say(string $m): void { echo $m . PHP_EOL; }

// ---------- source: local MySQL (ignore DATABASE_URL while reading the local config) ----------
putenv('DATABASE_URL');
unset($_ENV['DATABASE_URL']);
$my = require __DIR__ . '/../backend/config/database.php';
$src = new PDO("mysql:host={$my['host']};port={$my['port']};dbname={$my['name']};charset=utf8mb4", $my['user'], $my['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
say("Source: MySQL {$my['name']} @ {$my['host']}");

// ---------- target: PostgreSQL ----------
putenv('DATABASE_URL=' . $target);
$_ENV['DATABASE_URL'] = $target;
$pg = require __DIR__ . '/../backend/config/database.php';
$dsn = "pgsql:host={$pg['host']};port={$pg['port']};dbname={$pg['name']};sslmode={$pg['sslmode']}";
$pgOpts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => true];
try {
    $dst = new PDO($dsn, $pg['user'], $pg['pass'], $pgOpts);
} catch (PDOException $e) {
    // older libpq without SNI: Neon needs the endpoint id passed explicitly
    if (!$pg['options'] || stripos($e->getMessage(), 'Endpoint ID') === false) throw $e;
    $dst = new PDO($dsn . ";options={$pg['options']}", $pg['user'], $pg['pass'], $pgOpts);
}
say("Target: PostgreSQL {$pg['name']} @ {$pg['host']}");

// ---------- schema ----------
$dst->exec(file_get_contents(__DIR__ . '/postgres.sql'));
say('Schema ready.');

$hasContent = (int) $dst->query('SELECT COUNT(*) FROM sections')->fetchColumn() > 0;
if ($hasContent && !$force) {
    exit("\nNeon already has website content. Nothing was changed.\nRe-run with --force to REPLACE it with your local MySQL data.\n");
}

// ---------- data ----------
$tables = ['admins', 'media', 'sections', 'capabilities', 'services', 'why_items', 'projects', 'process_steps', 'testimonials', 'contacts'];
$dst->beginTransaction();
$dst->exec('TRUNCATE ' . implode(', ', [...$tables, 'admin_sessions', 'media_files']) . ' RESTART IDENTITY CASCADE');

foreach ($tables as $t) {
    $pgCols = $dst->query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$t' ORDER BY ordinal_position")->fetchAll(PDO::FETCH_COLUMN);
    $myCols = array_column($src->query("SHOW COLUMNS FROM `$t`")->fetchAll(), 'Field');
    $cols = array_values(array_intersect($pgCols, $myCols));

    $rows = $src->query('SELECT `' . implode('`,`', $cols) . "` FROM `$t`")->fetchAll();
    if ($rows) {
        $sql = sprintf('INSERT INTO "%s" (%s) VALUES (%s)', $t, '"' . implode('","', $cols) . '"', implode(',', array_fill(0, count($cols), '?')));
        $st = $dst->prepare($sql);
        foreach ($rows as $r) $st->execute(array_values($r));
    }
    if (in_array('id', $cols, true)) {
        $dst->exec("SELECT setval(pg_get_serial_sequence('$t', 'id'), COALESCE((SELECT MAX(id) FROM \"$t\"), 1), (SELECT COUNT(*) > 0 FROM \"$t\"))");
    }
    say(sprintf('  %-14s %3d rows', $t, count($rows)));
}

// ---------- image files ----------
$st = $dst->prepare("INSERT INTO media_files (file_name, mime, content) VALUES (?, ?, decode(?, 'base64'))");
$copied = $bytes = 0;
foreach ($src->query('SELECT file_name, mime FROM media')->fetchAll() as $m) {
    $file = MEDIA_DIR . '/' . basename($m['file_name']);
    if (!is_file($file)) { say("  ! image file missing locally: {$m['file_name']}"); continue; }
    $data = file_get_contents($file);
    $st->execute([$m['file_name'], $m['mime'], base64_encode($data)]);
    $copied++;
    $bytes += strlen($data);
}
$dst->commit();
say(sprintf('  %-14s %3d images (%.1f MB)', 'media_files', $copied, $bytes / 1048576));

say("\nDone. Neon now has all your local data.");
