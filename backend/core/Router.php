<?php
/**
 * Minimal router: method + path pattern with {params}; optional auth guard.
 */
class Router
{
    private array $routes = [];

    public function add(string $method, string $path, array $handler, bool $auth = false): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', rtrim($path, '/')) . '/?$#';
        $this->routes[] = compact('method', 'regex', 'handler', 'auth');
    }

    public function get(string $p, array $h, bool $a = false): void    { $this->add('GET', $p, $h, $a); }
    public function post(string $p, array $h, bool $a = false): void   { $this->add('POST', $p, $h, $a); }
    public function put(string $p, array $h, bool $a = false): void    { $this->add('PUT', $p, $h, $a); }
    public function delete(string $p, array $h, bool $a = false): void { $this->add('DELETE', $p, $h, $a); }

    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        // Works both at domain root and inside a sub folder (e.g. /arul_electricals/backend/api/...)
        $pos = strpos($path, '/api/');
        if ($pos !== false) $path = substr($path, $pos);
        $path = '/' . trim($path, '/');

        $methodMismatch = false;
        foreach ($this->routes as $r) {
            if (!preg_match($r['regex'], $path, $m)) continue;
            if ($r['method'] !== $method) { $methodMismatch = true; continue; }

            if ($r['auth']) AuthMiddleware::handle();
            $params = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            [$class, $fn] = $r['handler'];
            (new $class())->$fn(...array_values($params));
            return;
        }
        $methodMismatch
            ? Response::error('Method not allowed', 405)
            : Response::error('Endpoint not found', 404);
    }
}
