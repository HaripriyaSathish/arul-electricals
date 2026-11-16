<?php
/**
 * Admin login / logout / profile / password.
 */
class AuthController
{
    public function login(): void
    {
        $in = request_body();
        $errors = Validator::make($in, ['username' => 'required', 'password' => 'required']);
        if ($errors) Response::error('Enter your username and password.', 422, $errors);

        $admin = Database::one('SELECT * FROM admins WHERE username = ?', [clean_string($in['username'], 100)]);
        if (!$admin || !password_verify((string) $in['password'], $admin['password'])) {
            usleep(400000); // slow down guessing
            Response::error('Incorrect username or password.', 401);
        }

        // Tidy up expired sessions, then create a new one
        Database::exec('DELETE FROM admin_sessions WHERE expires_at < ' . Database::now());
        $token   = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + TOKEN_TTL_HOURS * 3600);
        Database::insert('admin_sessions', [
            'admin_id'   => $admin['id'],
            'token_hash' => hash('sha256', $token),
            'expires_at' => $expires,
        ]);
        Database::exec('UPDATE admins SET last_login = ' . Database::now() . ' WHERE id = ?', [$admin['id']]);

        Response::ok([
            'token'      => $token,
            'expires_at' => $expires,
            'admin'      => ['id' => (int) $admin['id'], 'username' => $admin['username'], 'name' => $admin['name'], 'last_login' => $admin['last_login']],
        ], 'Welcome back!');
    }

    public function me(): void
    {
        $a = AuthMiddleware::$admin;
        Response::ok(['id' => (int) $a['id'], 'username' => $a['username'], 'name' => $a['name'], 'last_login' => $a['last_login'], 'expires_at' => $a['expires_at']]);
    }

    public function logout(): void
    {
        Database::exec('DELETE FROM admin_sessions WHERE id = ?', [AuthMiddleware::$admin['session_id']]);
        Response::ok(null, 'Logged out.');
    }

    public function updateProfile(): void
    {
        $in = request_body();
        $errors = Validator::make($in, ['name' => 'required|max:150']);
        if ($errors) Response::error('Please fix the highlighted fields.', 422, $errors);
        Database::exec('UPDATE admins SET name = ? WHERE id = ?', [clean_string($in['name'], 150), AuthMiddleware::$admin['id']]);
        Response::ok(null, 'Profile updated.');
    }

    public function changePassword(): void
    {
        $in = request_body();
        $errors = Validator::make($in, ['current_password' => 'required', 'new_password' => 'required|min:8']);
        if (!$errors && ($in['new_password'] ?? '') !== ($in['confirm_password'] ?? '')) {
            $errors['confirm_password'] = 'Passwords do not match.';
        }
        if ($errors) Response::error('Please fix the highlighted fields.', 422, $errors);

        $admin = Database::one('SELECT * FROM admins WHERE id = ?', [AuthMiddleware::$admin['id']]);
        if (!password_verify((string) $in['current_password'], $admin['password'])) {
            Response::error('Current password is incorrect.', 422, ['current_password' => 'Current password is incorrect.']);
        }
        Database::exec('UPDATE admins SET password = ? WHERE id = ?', [password_hash($in['new_password'], PASSWORD_DEFAULT), $admin['id']]);
        // Sign out other devices
        Database::exec('DELETE FROM admin_sessions WHERE admin_id = ? AND id <> ?', [$admin['id'], AuthMiddleware::$admin['session_id']]);
        Response::ok(null, 'Password changed. Other devices have been signed out.');
    }
}
