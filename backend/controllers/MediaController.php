<?php
/**
 * Media library — every website image is uploaded here and picked from here.
 */
class MediaController
{
    private function format(array $m): array
    {
        $m['id']     = (int) $m['id'];
        $m['size']   = (int) $m['size'];
        $m['width']  = $m['width'] === null ? null : (int) $m['width'];
        $m['height'] = $m['height'] === null ? null : (int) $m['height'];
        return $m;
    }

    /** Where is this image used on the website? */
    public static function usage(string $path): array
    {
        $used = [];
        $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $path) . '%';
        foreach (Database::all('SELECT section_key FROM sections WHERE data LIKE ?', [$like]) as $r) {
            $used[] = ['type' => 'section', 'key' => $r['section_key'], 'label' => $r['section_key']];
        }
        $collections = (require BASE_PATH . '/config/resources.php')['collections'];
        foreach ($collections as $key => $cfg) {
            foreach ($cfg['fields'] as $field => $f) {
                if ($f['type'] !== 'image') continue;
                $titleCol = array_key_first($cfg['fields']);
                $rows = Database::all("SELECT id, `$titleCol` AS title FROM `{$cfg['table']}` WHERE `$field` = ?", [$path]);
                foreach ($rows as $r) {
                    $used[] = ['type' => 'collection', 'key' => $key, 'id' => (int) $r['id'], 'label' => $r['title']];
                }
            }
        }
        return $used;
    }

    public function index(): void
    {
        $where = [];
        $params = [];
        if (!empty($_GET['path'])) {
            $where[] = 'path = ?';
            $params[] = $_GET['path'];
        }
        if (!empty($_GET['missing_alt'])) $where[] = "alt_text = ''";
        if (!empty($_GET['folder']) && $_GET['folder'] !== 'all') {
            $where[] = 'folder = ?';
            $params[] = $_GET['folder'];
        }
        if (!empty($_GET['q'])) {
            $l = Database::like();
            $where[] = "(original_name $l ? OR alt_text $l ? OR file_name $l ?)";
            $q = '%' . $_GET['q'] . '%';
            array_push($params, $q, $q, $q);
        }
        $sql = 'SELECT * FROM media' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY created_at DESC, id DESC';
        $items = array_map([$this, 'format'], Database::all($sql, $params));

        $counts = ['all' => (int) Database::value('SELECT COUNT(*) FROM media')];
        foreach (Database::all('SELECT folder, COUNT(*) c FROM media GROUP BY folder') as $r) $counts[$r['folder']] = (int) $r['c'];

        Response::ok([
            'items'      => $items,
            'counts'     => $counts,
            'folders'    => MEDIA_FOLDERS,
            'total_size' => (int) Database::value('SELECT COALESCE(SUM(size),0) FROM media'),
            'missing_alt' => (int) Database::value("SELECT COUNT(*) FROM media WHERE alt_text = ''"),
            'max_upload' => MAX_UPLOAD_BYTES,
        ]);
    }

    public function show(string $id): void
    {
        $m = Database::one('SELECT * FROM media WHERE id = ?', [(int) $id]);
        if (!$m) Response::error('Image not found.', 404);
        $m = $this->format($m);
        $m['usage'] = self::usage($m['path']);
        Response::ok($m);
    }

    public function upload(): void
    {
        if (empty($_FILES['files']) && empty($_FILES['file'])) Response::error('Choose at least one image to upload.', 422);
        $files  = Upload::normalize($_FILES['files'] ?? $_FILES['file']);
        $folder = in_array($_POST['folder'] ?? '', MEDIA_FOLDERS, true) ? $_POST['folder'] : 'general';

        $saved = [];
        $failed = [];
        foreach ($files as $file) {
            try {
                $info = Upload::image($file);
                $info['folder']   = $folder;
                $info['alt_text'] = ucfirst(trim(preg_replace('/[-_]+/', ' ', pathinfo($file['name'], PATHINFO_FILENAME))));
                $id = Database::insert('media', $info);
                $saved[] = $this->format(Database::one('SELECT * FROM media WHERE id = ?', [$id]));
            } catch (RuntimeException $e) {
                $failed[] = ['name' => $file['name'], 'error' => $e->getMessage()];
            }
        }
        if (!$saved) Response::error($failed[0]['error'] ?? 'Upload failed.', 422, $failed);

        $msg = count($saved) . ' image' . (count($saved) > 1 ? 's' : '') . ' uploaded' . ($failed ? ', ' . count($failed) . ' failed' : '') . '.';
        Response::ok(['items' => $saved, 'failed' => $failed], $msg, 201);
    }

    public function update(string $id): void
    {
        $m = Database::one('SELECT * FROM media WHERE id = ?', [(int) $id]);
        if (!$m) Response::error('Image not found.', 404);
        $in = request_body();
        $data = [];
        if (array_key_exists('alt_text', $in)) $data['alt_text'] = clean_string($in['alt_text'], 255);
        if (array_key_exists('original_name', $in) && clean_string($in['original_name']) !== '') $data['original_name'] = clean_string($in['original_name'], 255);
        if (isset($in['folder']) && in_array($in['folder'], MEDIA_FOLDERS, true)) $data['folder'] = $in['folder'];
        Database::update('media', $data, (int) $id);
        $this->show($id);
    }

    public function destroy(string $id): void
    {
        $m = Database::one('SELECT * FROM media WHERE id = ?', [(int) $id]);
        if (!$m) Response::error('Image not found.', 404);

        $usage = self::usage($m['path']);
        $force = filter_var($_GET['force'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if ($usage && !$force) {
            Response::error('This image is used on the website.', 409, ['usage' => $usage]);
        }

        Database::exec('DELETE FROM media WHERE id = ?', [(int) $id]);
        MediaStore::delete($m['file_name']);
        Response::ok(null, 'Image deleted.');
    }
}
