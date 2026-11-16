<?php
/**
 * PDO wrapper that works with both MySQL (local) and PostgreSQL (Neon on Render).
 * Write SQL in MySQL style with `backticks`; they are converted for PostgreSQL automatically.
 * Use the small helpers (now(), ago(), like(), upsertSection()) where the two databases differ.
 */
class Database
{
    private static ?PDO $pdo = null;
    private static ?array $cfg = null;

    public static function config(): array
    {
        return self::$cfg ??= require BASE_PATH . '/config/database.php';
    }

    public static function isPg(): bool
    {
        return self::config()['driver'] === 'pgsql';
    }

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $c = self::config();
            $opts = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];
            if ($c['driver'] === 'pgsql') {
                $dsn = "pgsql:host={$c['host']};port={$c['port']};dbname={$c['name']};sslmode={$c['sslmode']}";
                if (!empty($c['options'])) $dsn .= ";options={$c['options']}";
                // Neon's connection pooler works best with client-side prepared statements
                $opts[PDO::ATTR_EMULATE_PREPARES] = true;
            } else {
                $dsn = "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset={$c['charset']}";
                $opts[PDO::ATTR_EMULATE_PREPARES] = false;
            }
            self::$pdo = new PDO($dsn, $c['user'], $c['pass'], $opts);
        }
        return self::$pdo;
    }

    /** Convert MySQL-style identifiers for PostgreSQL. */
    private static function sql(string $sql): string
    {
        return self::isPg() ? str_replace('`', '"', $sql) : $sql;
    }

    public static function query(string $sql, array $params = []): PDOStatement
    {
        $st = self::pdo()->prepare(self::sql($sql));
        $st->execute($params);
        return $st;
    }

    public static function all(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::query($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function value(string $sql, array $params = [])
    {
        return self::query($sql, $params)->fetchColumn();
    }

    public static function exec(string $sql, array $params = []): int
    {
        return self::query($sql, $params)->rowCount();
    }

    public static function insert(string $table, array $data): int
    {
        $cols = array_keys($data);
        $sql  = sprintf(
            'INSERT INTO `%s` (%s) VALUES (%s)',
            $table,
            implode(',', array_map(fn($c) => "`$c`", $cols)),
            implode(',', array_fill(0, count($cols), '?'))
        );
        if (self::isPg()) {
            return (int) self::value($sql . ' RETURNING id', array_values($data));
        }
        self::exec($sql, array_values($data));
        return (int) self::pdo()->lastInsertId();
    }

    public static function update(string $table, array $data, int $id): void
    {
        if (!$data) return;
        $set = implode(',', array_map(fn($c) => "`$c` = ?", array_keys($data)));
        self::exec("UPDATE `$table` SET $set WHERE id = ?", [...array_values($data), $id]);
    }

    // ---------- portable SQL fragments ----------

    /** Current local time (Asia/Kolkata) — PostgreSQL on Neon runs in UTC. */
    public static function now(): string
    {
        return self::isPg() ? "(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')" : 'NOW()';
    }

    /** "now minus N minute|day" */
    public static function ago(int $n, string $unit): string
    {
        return self::isPg()
            ? '(' . self::now() . " - INTERVAL '$n {$unit}s')"
            : 'NOW() - INTERVAL ' . $n . ' ' . strtoupper($unit);
    }

    /** Today's date minus N days. */
    public static function dateAgo(int $days): string
    {
        return self::isPg() ? '(CAST(' . self::now() . " AS DATE) - $days)" : "(CURDATE() - INTERVAL $days DAY)";
    }

    /** Case-insensitive LIKE operator. */
    public static function like(): string
    {
        return self::isPg() ? 'ILIKE' : 'LIKE';
    }

    /** Insert or update a row in `sections`. Pass $visible = null to keep the current visibility. */
    public static function upsertSection(string $key, string $json, ?int $visible = null): void
    {
        $exists = self::value('SELECT COUNT(*) FROM sections WHERE section_key = ?', [$key]);
        if ($exists) {
            if ($visible === null) {
                self::exec('UPDATE sections SET data = ?, updated_at = ' . self::now() . ' WHERE section_key = ?', [$json, $key]);
            } else {
                self::exec('UPDATE sections SET data = ?, is_visible = ?, updated_at = ' . self::now() . ' WHERE section_key = ?', [$json, $visible, $key]);
            }
        } else {
            self::exec('INSERT INTO sections (section_key, data, is_visible) VALUES (?, ?, ?)', [$key, $json, $visible ?? 1]);
        }
    }
}
