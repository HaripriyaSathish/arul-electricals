<?php
/**
 * Generic CRUD for every repeatable website collection (services, projects, ...).
 */
class ResourceController
{
    private function config(string $resource): array
    {
        $all = (require BASE_PATH . '/config/resources.php')['collections'];
        if (!isset($all[$resource])) Response::error('Unknown content type.', 404);
        return $all[$resource];
    }

    public static function cast(array $row, array $fields): array
    {
        $row['id']         = (int) $row['id'];
        $row['sort_order'] = (int) $row['sort_order'];
        $row['is_active']  = (bool) $row['is_active'];
        foreach ($fields as $name => $f) {
            if ($f['type'] === 'bool') $row[$name] = (bool) $row[$name];
            if ($f['type'] === 'int')  $row[$name] = $row[$name] === null ? null : (int) $row[$name];
        }
        return $row;
    }

    /** Validates + normalises the incoming body. $partial = only fields present are checked. */
    private function payload(array $cfg, bool $partial): array
    {
        $in = request_body();
        $data = [];
        $errors = [];

        foreach ($cfg['fields'] as $name => $f) {
            if (!array_key_exists($name, $in)) {
                if (!$partial && !empty($f['required'])) $errors[$name] = ucfirst(str_replace('_', ' ', $name)) . ' is required.';
                continue;
            }
            $v = $in[$name];
            switch ($f['type']) {
                case 'bool':
                    $data[$name] = filter_var($v, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
                    break;
                case 'int':
                    $n = ($v === '' || $v === null) ? null : (int) $v;
                    if ($n !== null && isset($f['min'])) $n = max($f['min'], min($f['max'] ?? $n, $n));
                    $data[$name] = $n;
                    break;
                default:
                    $s = clean_string($v);
                    if (!empty($f['required']) && $s === '') $errors[$name] = ucfirst(str_replace('_', ' ', $name)) . ' is required.';
                    if (isset($f['max']) && mb_strlen($s) > $f['max']) $errors[$name] = 'Maximum ' . $f['max'] . ' characters.';
                    $data[$name] = $s;
            }
        }
        if (array_key_exists('is_active', $in)) {
            $data['is_active'] = filter_var($in['is_active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        }
        if ($errors) Response::error('Please fix the highlighted fields.', 422, $errors);
        return $data;
    }

    private function find(array $cfg, int $id): array
    {
        $row = Database::one("SELECT * FROM `{$cfg['table']}` WHERE id = ?", [$id]);
        if (!$row) Response::error($cfg['label'] . ' not found.', 404);
        return self::cast($row, $cfg['fields']);
    }

    public function index(string $resource): void
    {
        $cfg  = $this->config($resource);
        $rows = Database::all("SELECT * FROM `{$cfg['table']}` ORDER BY sort_order ASC, id ASC");
        Response::ok(array_map(fn($r) => self::cast($r, $cfg['fields']), $rows));
    }

    public function store(string $resource): void
    {
        $cfg  = $this->config($resource);
        $data = $this->payload($cfg, false);
        $data['sort_order'] = (int) Database::value("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM `{$cfg['table']}`");
        if (!isset($data['is_active'])) $data['is_active'] = 1;
        $id = Database::insert($cfg['table'], $data);
        Response::ok($this->find($cfg, $id), $cfg['label'] . ' added.', 201);
    }

    public function update(string $resource, string $id): void
    {
        $cfg = $this->config($resource);
        $this->find($cfg, (int) $id);
        Database::update($cfg['table'], $this->payload($cfg, true), (int) $id);
        Response::ok($this->find($cfg, (int) $id), $cfg['label'] . ' saved.');
    }

    public function duplicate(string $resource, string $id): void
    {
        $cfg = $this->config($resource);
        $row = $this->find($cfg, (int) $id);
        $data = [];
        foreach ($cfg['fields'] as $name => $f) $data[$name] = is_bool($row[$name]) ? (int) $row[$name] : $row[$name];
        $first = array_key_first($cfg['fields']);
        $data[$first] = mb_substr($data[$first] . ' (copy)', 0, 200);
        $data['is_active']  = 0;
        $data['sort_order'] = (int) Database::value("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM `{$cfg['table']}`");
        $newId = Database::insert($cfg['table'], $data);
        Response::ok($this->find($cfg, $newId), 'Copy created (hidden until you publish it).', 201);
    }

    public function destroy(string $resource, string $id): void
    {
        $cfg = $this->config($resource);
        $this->find($cfg, (int) $id);
        Database::exec("DELETE FROM `{$cfg['table']}` WHERE id = ?", [(int) $id]);
        Response::ok(null, $cfg['label'] . ' deleted.');
    }

    public function reorder(string $resource): void
    {
        $cfg = $this->config($resource);
        $ids = request_body()['ids'] ?? [];
        if (!is_array($ids)) Response::error('Invalid order.', 422);
        $pdo = Database::pdo();
        $pdo->beginTransaction();
        foreach (array_values($ids) as $i => $id) {
            Database::exec("UPDATE `{$cfg['table']}` SET sort_order = ? WHERE id = ?", [$i + 1, (int) $id]);
        }
        $pdo->commit();
        Response::ok(null, 'Order saved.');
    }
}
