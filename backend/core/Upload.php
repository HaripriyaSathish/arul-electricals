<?php
/**
 * Saves an uploaded image into uploads/media and returns its metadata.
 * Every image on the website lives in the media library (uploads/media + `media` table).
 */
class Upload
{
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    /** @return array{file_name:string,original_name:string,path:string,mime:string,size:int,width:?int,height:?int} */
    public static function image(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $map = [
                UPLOAD_ERR_INI_SIZE  => 'File is larger than the server allows (php.ini upload_max_filesize).',
                UPLOAD_ERR_FORM_SIZE => 'File is too large.',
                UPLOAD_ERR_PARTIAL   => 'File was only partially uploaded. Please try again.',
                UPLOAD_ERR_NO_FILE   => 'No file was uploaded.',
            ];
            throw new RuntimeException($map[$file['error'] ?? 4] ?? 'Upload failed.');
        }
        if ($file['size'] > MAX_UPLOAD_BYTES) {
            throw new RuntimeException('Image is larger than ' . round(MAX_UPLOAD_BYTES / 1048576) . ' MB.');
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(self::ALLOWED[$mime])) {
            throw new RuntimeException('Only JPG, PNG, WEBP or GIF images are allowed.');
        }

        if (!is_dir(MEDIA_DIR)) mkdir(MEDIA_DIR, 0775, true);

        $base = pathinfo($file['name'], PATHINFO_FILENAME);
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($base)), '-') ?: 'image';
        $slug = substr($slug, 0, 60);
        $name = $slug . '-' . bin2hex(random_bytes(3)) . '.' . self::ALLOWED[$mime];

        if (!move_uploaded_file($file['tmp_name'], MEDIA_DIR . '/' . $name)) {
            throw new RuntimeException('Could not save the file. Check folder permissions for uploads/media.');
        }

        $size = (int) $file['size'];
        // Compress big photos to WebP automatically (needs PHP GD; skipped silently otherwise)
        if (class_exists('ImageOptimizer') && ($opt = ImageOptimizer::toWebp(MEDIA_DIR . '/' . $name))) {
            @unlink(MEDIA_DIR . '/' . $name);
            $name = basename($opt['file']);
            $mime = 'image/webp';
            $size = $opt['size'];
        }

        $dims = @getimagesize(MEDIA_DIR . '/' . $name) ?: [null, null];
        MediaStore::save($name, $mime); // keeps the file in the database on Render

        return [
            'file_name'     => $name,
            'original_name' => mb_substr($file['name'], 0, 255),
            'path'          => MEDIA_URL_PREFIX . $name,
            'mime'          => $mime,
            'size'          => $size,
            'width'         => $dims[0],
            'height'        => $dims[1],
        ];
    }

    /** Re-shape $_FILES['files'] (multiple) into a list of single-file arrays. */
    public static function normalize(array $files): array
    {
        if (!is_array($files['name'])) return [$files];
        $out = [];
        foreach ($files['name'] as $i => $n) {
            $out[] = [
                'name' => $n, 'type' => $files['type'][$i], 'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i], 'size' => $files['size'][$i],
            ];
        }
        return $out;
    }
}
