<?php
/** @var Router $router */

// ---------- Public ----------
$router->get('/api/health', [PublicController::class, 'health']);
$router->get('/api/site', [PublicController::class, 'site']);
$router->post('/api/contact', [ContactController::class, 'store']);

// ---------- Auth ----------
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/me', [AuthController::class, 'me'], true);
$router->post('/api/auth/logout', [AuthController::class, 'logout'], true);
$router->put('/api/auth/profile', [AuthController::class, 'updateProfile'], true);
$router->put('/api/auth/password', [AuthController::class, 'changePassword'], true);

// ---------- Admin ----------
$router->get('/api/admin/dashboard', [DashboardController::class, 'index'], true);

// Single-record sections (hero, about, headings, cta, contact, settings)
$router->get('/api/admin/sections', [SettingsController::class, 'index'], true);
$router->get('/api/admin/sections/{key}', [SettingsController::class, 'show'], true);
$router->put('/api/admin/sections/{key}', [SettingsController::class, 'update'], true);

// Email / SMTP settings
$router->get('/api/admin/mail', [MailController::class, 'show'], true);
$router->put('/api/admin/mail', [MailController::class, 'update'], true);
$router->post('/api/admin/mail/test', [MailController::class, 'test'], true);

// Media library
$router->get('/api/admin/media', [MediaController::class, 'index'], true);
$router->post('/api/admin/media', [MediaController::class, 'upload'], true);
$router->get('/api/admin/media/{id}', [MediaController::class, 'show'], true);
$router->put('/api/admin/media/{id}', [MediaController::class, 'update'], true);
$router->delete('/api/admin/media/{id}', [MediaController::class, 'destroy'], true);

// Enquiries
$router->get('/api/admin/enquiries', [ContactController::class, 'index'], true);
$router->get('/api/admin/enquiries/export', [ContactController::class, 'export'], true);
$router->put('/api/admin/enquiries/{id}', [ContactController::class, 'update'], true);
$router->delete('/api/admin/enquiries/{id}', [ContactController::class, 'destroy'], true);

// Repeatable collections: capabilities, services, why_items, projects, process_steps, testimonials
$router->get('/api/admin/collections/{resource}', [ResourceController::class, 'index'], true);
$router->post('/api/admin/collections/{resource}', [ResourceController::class, 'store'], true);
$router->put('/api/admin/collections/{resource}/reorder', [ResourceController::class, 'reorder'], true);
$router->put('/api/admin/collections/{resource}/{id}', [ResourceController::class, 'update'], true);
$router->post('/api/admin/collections/{resource}/{id}/duplicate', [ResourceController::class, 'duplicate'], true);
$router->delete('/api/admin/collections/{resource}/{id}', [ResourceController::class, 'destroy'], true);
