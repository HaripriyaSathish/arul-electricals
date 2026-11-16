<?php
/**
 * Converts large JPG/PNG images to compressed WebP (max 1920px wide) so pages load fast.
 * Needs the PHP GD extension. If GD is not enabled, images are kept as they are.
 *
 * Enable GD permanently: in php.ini remove the ";" in front of "extension=gd" and restart PHP/Apache.
 */
class ImageOptimizer
{
    public const MAX_WIDTH = 1920;
    public const QUALITY   = 80;

    public static function available(): bool
    {
        return function_exists('imagewebp') && function_exists('imagecreatefrompng');
    }

    /**
     * Optimise $srcFile into a .webp next to it. Returns new file info, or null when not worth it / not possible.
     * @return array{file:string,size:int,width:int,height:int}|null
     */
    public static function toWebp(string $srcFile, int $minBytes = 120000): ?array
    {
        if (!self::available() || !is_file($srcFile)) return null;
        $info = @getimagesize($srcFile);
        if (!$info) return null;
        [$w, $h] = $info;
        $mime = $info['mime'];
        if (!in_array($mime, ['image/png', 'image/jpeg'], true)) return null;
        if (filesize($srcFile) < $minBytes && $w <= self::MAX_WIDTH) return null;

        $img = $mime === 'image/png' ? @imagecreatefrompng($srcFile) : @imagecreatefromjpeg($srcFile);
        if (!$img) return null;

        if ($w > self::MAX_WIDTH) {
            $nh = (int) round($h * self::MAX_WIDTH / $w);
            $resized = imagecreatetruecolor(self::MAX_WIDTH, $nh);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, self::MAX_WIDTH, $nh, $w, $h);
            imagedestroy($img);
            $img = $resized;
            [$w, $h] = [self::MAX_WIDTH, $nh];
        } else {
            imagepalettetotruecolor($img);
            imagealphablending($img, false);
            imagesavealpha($img, true);
        }

        $dest = preg_replace('/\.(png|jpe?g)$/i', '', $srcFile) . '.webp';
        $ok = imagewebp($img, $dest, self::QUALITY);
        imagedestroy($img);
        if (!$ok || !is_file($dest)) return null;

        // Only keep the WebP if it is actually smaller
        if (filesize($dest) >= filesize($srcFile)) { @unlink($dest); return null; }
        return ['file' => $dest, 'size' => filesize($dest), 'width' => $w, 'height' => $h];
    }

    /** Replace a media path everywhere it is used (sections JSON + collection image columns). */
    public static function replaceReferences(string $old, string $new): int
    {
        $n = 0;
        foreach (Database::all('SELECT section_key, data FROM sections WHERE data LIKE ?', ['%' . $old . '%']) as $r) {
            $data = str_replace(
                [json_encode($old, JSON_UNESCAPED_SLASHES), str_replace('/', '\/', json_encode($old))],
                json_encode($new, JSON_UNESCAPED_SLASHES),
                $r['data']
            );
            Database::exec('UPDATE sections SET data = ? WHERE section_key = ?', [$data, $r['section_key']]);
            $n++;
        }
        $collections = (require BASE_PATH . '/config/resources.php')['collections'];
        foreach ($collections as $cfg) {
            foreach ($cfg['fields'] as $field => $f) {
                if ($f['type'] !== 'image') continue;
                $n += Database::exec("UPDATE `{$cfg['table']}` SET `$field` = ? WHERE `$field` = ?", [$new, $old]);
            }
        }
        return $n;
    }
}
