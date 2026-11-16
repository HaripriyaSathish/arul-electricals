<?php
/**
 * ARUL ELECTRICAL — database setup & seed.
 *
 *   php database/setup.php           Create missing tables, seed empty ones, import seed images
 *   php database/setup.php --fresh   DROP all website tables and start again (deletes enquiries too!)
 *
 * Default admin login: admin / admin123  (change it from Admin → My Account)
 */

if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Run from the command line.'); }

require __DIR__ . '/../backend/config/config.php';
$db = require __DIR__ . '/../backend/config/database.php';

$fresh = in_array('--fresh', $argv, true);

$server = new PDO("mysql:host={$db['host']};port={$db['port']};charset=utf8mb4", $db['user'], $db['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$server->exec("CREATE DATABASE IF NOT EXISTS `{$db['name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$server->exec("USE `{$db['name']}`");
$pdo = $server;

function say(string $m): void { echo $m . PHP_EOL; }

if ($fresh) {
    say('Dropping existing tables...');
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (['admin_sessions', 'admins', 'media', 'sections', 'capabilities', 'services', 'why_items', 'projects', 'process_steps', 'testimonials', 'contacts', 'hero'] as $t) {
        $pdo->exec("DROP TABLE IF EXISTS `$t`");
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}

// ---------- Schema ----------
$sql = file_get_contents(__DIR__ . '/arul_electricals.sql');
$sql = preg_replace('/^\s*--.*$/m', '', $sql);
foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
    if (stripos($stmt, 'CREATE DATABASE') === 0 || stripos($stmt, 'USE ') === 0) continue;
    $pdo->exec($stmt);

    // Non-destructive upgrade: add any columns missing from tables that already existed
    if (preg_match('/CREATE TABLE IF NOT EXISTS (\w+) \((.*)\)[^)]*$/s', $stmt, $m)) {
        $table = $m[1];
        $have  = array_column($pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(), 'Field');
        foreach (preg_split('/,\s*\n/', $m[2]) as $def) {
            $def = trim($def);
            if (!preg_match('/^(\w+)\s/', $def, $c) || in_array(strtoupper($c[1]), ['PRIMARY', 'INDEX', 'KEY', 'UNIQUE', 'FOREIGN'], true)) continue;
            if (in_array($c[1], $have, true)) continue;
            $def = preg_replace('/\s+(PRIMARY KEY|UNIQUE)\b.*$/i', '', $def);
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN $def");
            say("  + added column $table.{$c[1]}");
        }
    }
}
say('Tables ready.');

$isEmpty = fn(string $t) => (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn() === 0;
$insert = function (string $table, array $row) use ($pdo) {
    $cols = array_keys($row);
    $st = $pdo->prepare(sprintf('INSERT INTO `%s` (%s) VALUES (%s)', $table, '`' . implode('`,`', $cols) . '`', implode(',', array_fill(0, count($cols), '?'))));
    $st->execute(array_values($row));
};

// ---------- Admin ----------
if ($isEmpty('admins')) {
    $insert('admins', ['username' => 'admin', 'password' => password_hash('admin123', PASSWORD_DEFAULT), 'name' => 'Administrator']);
    say('Admin user created: admin / admin123');
}

// ---------- Media library (supplied design images) ----------
$images = [
    // file => [folder, alt text]
    'arul-electrical-logo.png'           => ['brand', 'ARUL ELECTRICAL logo'],
    'hero-substation-collage.png'        => ['hero', 'Engineers reviewing an HT substation with transformer, DG set and panel collage'],
    'engineers-substation-banner.png'    => ['hero', 'Engineers inspecting an outdoor electrical substation'],
    'field-engineers-substation.png'     => ['about', 'Certified field engineers at a substation'],
    'panel-workshop-team.png'            => ['about', 'Panel board manufacturing workshop team'],
    'technician-wiring-lt-panel.png'     => ['services', 'Technician wiring an LT switchgear panel'],
    'capability-ht-lt-contracting.png'   => ['capabilities', 'HT and LT electrical contracting'],
    'capability-transformer-solutions.png' => ['capabilities', 'Transformer solutions'],
    'capability-panel-board.png'         => ['capabilities', 'Panel board manufacturing'],
    'capability-documentation.png'       => ['capabilities', 'Documentation and approvals'],
    'service-new-ht-connection.png'      => ['services', 'New HT connection installation'],
    'service-panel-board.png'            => ['services', 'Panel board manufacturing'],
    'service-rule-45-32.png'             => ['services', 'Rule 45 and Rule 32 documentation'],
    'service-ht-lt-cable-laying.png'     => ['services', 'HT/LT cable laying'],
    'service-cable-tray.png'             => ['services', 'Cable tray installation'],
    'service-transformer.png'            => ['services', 'Transformer sales and installation'],
    'service-ht-panel.png'               => ['services', 'HT panel sales and installation'],
    'service-dg-sets.png'                => ['services', 'DG sales and installation'],
    'project-dual-transformer-yard.png'  => ['projects', 'Dual transformer 33kV substation yard'],
    'project-33kv-switchyard.png'        => ['projects', 'Outdoor 33kV switchyard'],
    'project-dg-synchronization.png'     => ['projects', 'DG synchronization room'],
    'project-cable-tray-facility.png'    => ['projects', 'Multi-tier cable tray installation'],
];

if (!is_dir(MEDIA_DIR)) mkdir(MEDIA_DIR, 0775, true);
$M = [];   // file => stored path
foreach ($images as $file => [$folder, $alt]) {
    $src = __DIR__ . '/seed_images/' . $file;
    if (!is_file($src)) { say("  ! missing seed image $file"); continue; }
    $path = MEDIA_URL_PREFIX . $file;
    // Already imported (possibly optimised to .webp by optimize_images.php)? Use the stored path.
    $exists = $pdo->prepare('SELECT path FROM media WHERE path = ? OR original_name = ? LIMIT 1');
    $exists->execute([$path, $file]);
    if ($row = $exists->fetch()) { $M[$file] = $row['path']; continue; }
    $M[$file] = $path;
    if (!is_file(MEDIA_DIR . '/' . $file)) copy($src, MEDIA_DIR . '/' . $file);
    [$w, $h] = getimagesize($src) ?: [null, null];
    $insert('media', [
        'file_name' => $file, 'original_name' => $file, 'path' => $path, 'mime' => 'image/png',
        'size' => filesize($src), 'width' => $w, 'height' => $h, 'alt_text' => $alt, 'folder' => $folder,
    ]);
}
say(count($M) . ' images in media library.');
$img = fn(string $f) => $M[$f] ?? '';

// ---------- Sections ----------
$sections = [
    'settings' => [
        'site_name'       => 'ARUL ELECTRICAL',
        'license_badge'   => 'Licensed',
        'tagline'         => 'A-Grade Electrical Contractors & Consultants',
        'logo'            => $img('arul-electrical-logo.png'),
        'favicon'         => $img('arul-electrical-logo.png'),
        'nav_cta_text'    => 'Request a Consultation',
        'phone'           => '+91 75503 43138',
        'phone_alt'       => '',
        'email'           => 'Info@arulelectricals.com',
        'address'         => "Arul Electricals, 2nd Floor, Above Exide Battery Showroom, Kothur Junction, Hosur - 635109",
        'map_enabled'     => true,
        'map_query'       => 'Kothur Junction, Hosur, Tamil Nadu 635109',
        'hours'           => 'Mon – Sat: 08:30 AM – 06:30 PM',
        'whatsapp'        => '917550343138',
        'whatsapp_message'=> 'Hello ARUL ELECTRICAL, I would like to enquire about your electrical services.',
        'show_whatsapp_button' => true,
        'show_call_button'     => true,
        'footer_about'    => 'A-Grade Electrical Contractors & Consultants specializing in HT/LT installations, custom switchgear panel manufacturing, statutory Rule 45 & Rule 32 compliance, and turnkey industrial electrical infrastructure.',
        'footer_tagline'  => 'Powering Industries. Engineering Reliable Connections.',
        'footer_badge'    => 'A-Grade Govt Licensed',
        'certifications'  => ['Class 1 Electrical Contractor', 'CEA & DISCOM Compliant', 'ISO Quality Certified'],
        'hotline_label'   => '24/7 Breakdown Hotline',
        'copyright'       => '© 2026 ARUL ELECTRICAL. All rights reserved. A-Grade Electrical Contractors & Consultants.',
        'facebook'        => '', 'linkedin' => '', 'youtube' => '', 'instagram' => '',
        'meta_title'      => 'ARUL ELECTRICAL | A-Grade HT & LT Electrical Contractors & Consultants',
        'meta_description'=> 'HT/LT electrical contracting, transformer & HT panel installation, panel board manufacturing, cable laying, DG sets and Rule 45 & 32 statutory documentation.',
    ],
    'hero' => [
        'badge'          => 'A-Grade Electrical Contractors & Consultants',
        'title'          => 'Powering Industries with Expert HT & LT Electrical Solutions.',
        'subtitle'       => 'Your trusted partner for professional electrical contracting and turnkey consultancy. We specialize in HT/LT installations, heavy transformer solutions, custom electrical panel manufacturing, underground cable infrastructure, and end-to-end statutory documentation support.',
        'primary_text'   => 'Request a Consultation',
        'primary_link'   => '#contact',
        'secondary_text' => 'View Our Services',
        'secondary_link' => '#services',
        'image'          => $img('hero-substation-collage.png'),
        'slide_seconds'  => '6',
        'slides'         => array_map(fn($f) => ['image' => $img($f)], ['project-dual-transformer-yard.png', 'technician-wiring-lt-panel.png', 'project-33kv-switchyard.png', 'project-dg-synchronization.png']),
        'features'       => [
            ['icon' => 'zap', 'text' => 'HT & LT Electrical Expertise'],
            ['icon' => 'factory', 'text' => 'Industrial Infrastructure'],
            ['icon' => 'clipboard-check', 'text' => 'Technical Docs & CEA Compliance'],
        ],
    ],
    'capabilities' => [
        'eyebrow'  => 'System Architecture',
        'title'    => 'Specialized Electrical Engineering Capabilities',
        'subtitle' => 'Core engineering disciplines that power industrial plants, commercial facilities and utility-grade substations.',
    ],
    'about' => [
        'eyebrow'     => 'About Our Company',
        'title'       => 'Engineering Reliable Electrical Infrastructure.',
        'since_year'  => '1987',
        'since_label' => 'Years of trusted electrical service',
        'description' => 'Since 1987, ARUL ELECTRICAL has been an A-Grade electrical contracting and engineering consultancy firm specializing in HT/LT electrical installations, panel board manufacturing, equipment supply & installation, and statutory documentation.',
        'image'       => $img('panel-workshop-team.png'),
        'badge_title' => 'Safety-First Execution',
        'badge_text'  => 'Strict CEIG safety standards, insulation testing and safe construction practices on every site.',
        'badge_label' => 'Industrial Standards Compliant',
        'points'      => [
            ['title' => 'Licensed A-Grade Contractor', 'text' => 'Authorized to execute HT & LT electrical works for industrial and commercial facilities.'],
            ['title' => 'In-house Design & Engineering', 'text' => 'Single-line diagram (SLD) preparation, earthing designs, and fault level calculations.'],
            ['title' => 'Quality-Focused Execution', 'text' => 'Rigorous testing using calibrated Meggers, Hi-Pot analyzers, and secondary injection kits.'],
        ],
        'button_text' => 'Schedule Site Audit',
        'button_link' => '#contact',
    ],
    'services' => [
        'eyebrow'  => 'Our Expertise',
        'title'    => 'Complete Electrical Contracting & Engineering Solutions',
        'subtitle' => 'From high-tension lines and custom switchgear engineering to statutory approvals and emergency power deployment.',
    ],
    'panel_feature' => [
        'eyebrow'     => 'Featured Capability',
        'title'       => 'In-House Panel Board Manufacturing',
        'description' => 'Custom-engineered PCC, MCC, APFC and AMF panels built in our own workshop — designed to your load calculations, assembled with quality switchgear components and tested before dispatch.',
        'image'       => $img('technician-wiring-lt-panel.png'),
        'points'      => ['PCC, MCC, APFC & AMF panels', 'Copper busbar design & sizing', 'Factory testing before dispatch', 'Installation & commissioning on site'],
        'button_text' => 'Request a Quote',
        'button_link' => '#contact',
    ],
    'why' => [
        'eyebrow'     => 'Why Choose Us',
        'title'       => 'Your Trusted Partner for Electrical Engineering Excellence.',
        'subtitle'    => 'We deliver electrical contracting and consultancy solutions designed to support complex industrial and commercial infrastructure requirements.',
        'stat_value'  => 'A-Grade Licensed',
        'stat_label'  => 'Electrical Contractors & Consultants',
        'image'       => $img('field-engineers-substation.png'),
        'image_title' => 'Qualified Field Engineers',
        'image_text'  => 'Technical staff experienced in HT switchgear, transformer commissioning and statutory sign-offs.',
    ],
    'projects' => [
        'eyebrow'  => 'Our Projects',
        'title'    => 'Delivering Electrical Solutions Across Every Project',
        'subtitle' => 'A look at the type of HT/LT substation, panel board and cable routing work we deliver.',
        'all_label'=> 'All Executions',
    ],
    'process' => [
        'eyebrow'  => 'Our Workflow',
        'title'    => 'From Planning to Powering – Our Process.',
        'subtitle' => 'A structured engineering approach that ensures every electrical project moves through planning, documentation, installation and final handover.',
    ],
    'testimonials' => [
        'eyebrow'  => 'Client Verifications',
        'title'    => 'Trusted Expertise. Reliable Electrical Solutions.',
        'subtitle' => 'What industrial infrastructure managers and factory operators say about our engineering support.',
    ],
    'cta' => [
        'badge'          => 'High Voltage Industrial Turnkey Contracting',
        'title'          => 'Planning Your Next Electrical Infrastructure Project?',
        'subtitle'       => 'Connect with ARUL ELECTRICAL for professional contracting, power equipment solutions, and turnkey technical consultancy.',
        'primary_text'   => 'Request a Consultation',
        'primary_link'   => '#contact',
        'secondary_text' => 'Contact Technical Team',
        'secondary_link' => 'whatsapp',
        'image'          => '',
    ],
    'contact' => [
        'eyebrow'           => 'Direct Access',
        'title'             => 'Let’s Discuss Your Electrical Project.',
        'subtitle'          => 'Speak directly with our senior electrical engineers regarding tenders, site inspections, and turnkey estimates.',
        'form_title'        => 'Project Technical Assessment Form',
        'form_subtitle'     => 'Complete the parameters below to receive a preliminary engineering estimate.',
        'voltage_options'   => ['LT (415V)', 'HT (11kV / 22kV / 33kV)', 'EHT (110kV & above)', 'Not sure yet'],
        'equipment_options' => ['Transformer Installation', 'HT Panel / VCB / RMU', 'PCC / MCC / APFC Panels', 'DG Set', 'HT/LT Cable Laying', 'Cable Tray', 'Rule 45 / 32 Documentation', 'Other'],
        'emergency_title'   => '24/7 Breakdown Support',
        'emergency_text'    => 'Immediate mobilization for industrial sub-station & transformer trip emergencies.',
        'success_message'   => 'Thank you! Our engineering team will contact you shortly.',
    ],
];
// Small labels & UI text — so every word on the website lives in the database
$labels = [
    'settings' => [
        'nav_home' => 'Home', 'nav_about' => 'About Us', 'nav_services' => 'Services', 'nav_projects' => 'Projects', 'nav_contact' => 'Contact',
        'footer_services_title' => 'Our Services', 'footer_links_title' => 'Quick Links', 'footer_contact_title' => 'Contact Us',
        'footer_about_title' => 'About ARUL ELECTRICAL', 'whatsapp_label' => 'WhatsApp us', 'call_label' => 'Call us',
        'meta_keywords' => 'electrical contractor Hosur, A-Grade electrical contractor, HT LT electrical contractor, HT connection, transformer installation, HT panel installation, panel board manufacturing, PCC MCC panels, DG set installation, cable laying, cable tray installation, Rule 45 Rule 32 approval, CEIG approval, ARUL ELECTRICAL',
        'og_image' => $img('project-dual-transformer-yard.png'),
    ],
    'capabilities'  => ['card_label' => 'Capability'],
    'services'      => ['card_label' => 'Service'],
    'about'         => ['since_prefix' => 'Since'],
    'panel_feature' => ['stamp_text' => 'Built in-house'],
    'projects'      => ['illustrative_label' => 'Illustrative image'],
    'process'       => ['phase_label' => 'Phase'],
    'contact'       => [
        'address_label' => 'Office address', 'phone_label' => 'Call us', 'email_label' => 'Email', 'hours_label' => 'Working hours',
        'directions_text' => 'Get directions', 'call_text' => 'Call now', 'email_text' => 'Send email', 'map_button' => 'Open in Google Maps',
        'label_name' => 'Full Name', 'label_company' => 'Company / Organization', 'label_phone' => 'Mobile Number', 'label_email' => 'Email Address',
        'label_voltage' => 'Voltage Requirement', 'label_equipment' => 'Equipment Requirement', 'label_location' => 'Project Site Location',
        'label_message' => 'Project Scope / Technical Requirements', 'select_placeholder' => 'Select…',
        'submit_text' => 'Submit Enquiry', 'privacy_note' => 'Your details are only used to respond to your enquiry.',
        'success_title' => 'Enquiry sent!', 'again_text' => 'Send another enquiry',
    ],
];
foreach ($labels as $k => $vals) $sections[$k] = ($sections[$k] ?? []) + $vals;

// Footer pop-ups: Privacy Policy, Terms of Service, Statutory Approvals (editable in Admin → Legal Pages)
$sections['legal'] = [
    'credit_text' => 'Designed & Developed by Vetri IT Systems',
    'credit_url'  => 'https://vetriitsystems.com/',
    'privacy_title' => 'Privacy Policy',
    'privacy' => <<<TXT
Last updated: November 2026

ARUL ELECTRICAL ("we", "us", "our") respects your privacy. This policy explains what information we collect through this website and how we use it.

## Information we collect
- Details you enter in the project enquiry form: name, company, mobile number, email address, voltage and equipment requirements, project site location and project scope.
- Basic technical data such as your IP address, used only to protect the website from spam and misuse.

## How we use your information
- To respond to your enquiry, prepare estimates, schedule site inspections and provide our electrical contracting and consultancy services.
- To contact you by phone, WhatsApp or email about your project.
- We do not sell, rent or trade your personal information to anyone.

## Sharing
Information is shared only with our engineering team and, where required for your project, with statutory authorities (such as the Electrical Inspectorate or the electricity distribution company) for approvals you have asked us to obtain.

## Data security & retention
Enquiries are stored securely and kept only as long as needed for the project, our records and legal obligations.

## Third-party services
This website shows a Google Map and links to WhatsApp. These services have their own privacy policies.

## Your choices
You may ask us to view, correct or delete your details at any time by contacting us using the details on this website.
TXT,
    'terms_title' => 'Terms of Service',
    'terms' => <<<TXT
Last updated: November 2026

By using this website you agree to the following terms.

## Website content
The information on this website is provided for general information about ARUL ELECTRICAL and our HT/LT electrical contracting, equipment supply, panel manufacturing and documentation services. While we take care to keep it accurate, it does not form a binding offer.

## Quotations & services
- Enquiries submitted through this website are not orders. All work is carried out only on the basis of a written quotation or work order agreed with the client.
- Technical specifications, timelines and prices are confirmed after site inspection and are subject to statutory approvals, site conditions and equipment availability.
- Statutory approval timelines depend on the respective authorities and are outside our control.

## Images
Some photographs on this website are illustrative and may not show actual client sites.

## Intellectual property
The text, logo, design and images on this website belong to ARUL ELECTRICAL or are used with permission and may not be copied without consent.

## Limitation of liability
ARUL ELECTRICAL is not liable for any loss arising from the use of information on this website. Electrical work must always be carried out by licensed professionals.

## Governing law
These terms are governed by the laws of India. Courts at Hosur / Krishnagiri, Tamil Nadu shall have jurisdiction.
TXT,
    'statutory_title' => 'Statutory Approvals',
    'statutory' => <<<TXT
ARUL ELECTRICAL is an A-Grade licensed electrical contractor and consultant. Every installation we execute is designed, tested and documented to meet Indian statutory requirements.

## Licensing
- A-Grade Electrical Contractor licence issued by the Electrical Licensing Board, Government of Tamil Nadu.
- Work supervised by certified electrical supervisors and carried out by licensed wiremen.
- Licence details are available on request.

## Regulations we comply with
- Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations.
- Indian Electricity Rules — including Rule 45 (licensed contractor execution) and Rule 32 (identification of earthed and neutral conductors).
- Relevant IS / IEC standards for switchgear, transformers, cables and earthing.

## Approvals we handle for clients
- Electrical Inspectorate (CEIG) drawing approval and safety inspection for HT installations.
- New HT service connection and load enhancement with the electricity distribution company (TANGEDCO / TNPDCL).
- Rule 45 & Rule 32 documentation, test reports and completion certificates.
- DG set and transformer energisation approvals.

## Testing & documentation
Insulation resistance (Megger), earth resistance, BDV oil testing, relay testing and Hi-Pot tests are carried out with calibrated instruments and handed over with the completion documents.
TXT,
];

// Email notifications (SMTP details are filled in from Admin → Site Settings → Email & SMTP)
$sections['mail'] = [
    'enabled'           => true,
    'notify_to'         => 'Info@arulelectricals.com',
    'from_email'        => 'Info@arulelectricals.com',
    'from_name'         => 'ARUL ELECTRICAL Website',
    'host'              => '',
    'port'              => 465,
    'encryption'        => 'ssl',
    'username'          => 'Info@arulelectricals.com',
    'password'          => '',
    'skip_ssl_verify'   => false,
    'send_confirmation' => false,
];

// Testimonials: only publish genuine, client-approved quotes (design handover) → hidden until added.
$hidden = ['testimonials', 'mail'];

foreach ($sections as $key => $data) {
    $existing = $pdo->prepare('SELECT data FROM sections WHERE section_key = ?');
    $existing->execute([$key]);
    $row = $existing->fetch();
    if (!$row) {
        $st = $pdo->prepare('INSERT INTO sections (section_key, data, is_visible) VALUES (?, ?, ?)');
        $st->execute([$key, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), in_array($key, $hidden, true) ? 0 : 1]);
        continue;
    }
    // Upgrade: add new keys only — never overwrite content edited in the admin panel
    $current = json_decode($row['data'], true) ?: [];
    $merged  = $current + $data;
    if (count($merged) !== count($current)) {
        $pdo->prepare('UPDATE sections SET data = ? WHERE section_key = ?')
            ->execute([json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $key]);
        say("  + new fields added to section '$key'");
    }
}
say('Sections seeded.');

// ---------- Collections ----------
$seed = function (string $table, array $rows) use ($isEmpty, $insert) {
    if (!$isEmpty($table)) return;
    foreach ($rows as $i => $r) $insert($table, $r + ['sort_order' => $i + 1, 'is_active' => 1]);
    say("  $table: " . count($rows));
};

$seed('capabilities', [
    ['title' => 'HT & LT Electrical Contracting', 'icon' => 'zap', 'image' => $img('service-ht-panel.png'), 'link_text' => 'Class 1 Execution',
     'description' => 'HT panel sales & installation, double pole structure sale & installation with approval.'],
    ['title' => 'Transformer Solutions', 'icon' => 'gauge', 'image' => $img('capability-transformer-solutions.png'), 'link_text' => 'Oil & Dry Type',
     'description' => 'Supply, civil plinth mounting, erection, vacuum oil filtration, BDV testing, earth mat grounding, and live charging of power transformers.'],
    ['title' => 'Panel Board Manufacturing', 'icon' => 'cpu', 'image' => $img('capability-panel-board.png'), 'link_text' => 'Built In-House',
     'description' => 'In-house custom manufacturing of PCC, MCC, synchronized APFC capacitors, AMF panels, and industrial VCB boards.'],
    ['title' => 'Documentation & Approvals', 'icon' => 'shield-check', 'image' => $img('capability-documentation.png'), 'link_text' => 'Statutory Filing',
     'description' => 'Statutory Indian Electricity Rules (Rule 45 & Rule 32) compliance, CEIG safety drawings, grid synchronization, and licensing assistance.'],
]);

$seed('services', [
    ['title' => 'New HT Connection Installation with Documentation', 'tag' => 'HT Grid', 'icon' => 'zap', 'image' => $img('service-new-ht-connection.png'),
     'description' => 'HT connection installation support with associated technical documentation, scheme drawings, and coordination for grid approval and sanctioning.'],
    ['title' => 'LT Installation', 'tag' => 'LT Systems', 'icon' => 'plug', 'image' => $img('technician-wiring-lt-panel.png'),
     'description' => 'Low-tension electrical installation solutions for industrial factory shopfloors, warehouses, and commercial facility power distribution.'],
    ['title' => 'Panel Board Manufacturing', 'tag' => 'PCC & MCC', 'icon' => 'cpu', 'image' => $img('service-panel-board.png'),
     'description' => 'Custom PCC, MCC, APFC and AMF panel boards manufactured in-house, engineered to your load requirements and tested before dispatch.'],
    ['title' => 'Rule 45 & Rule 32 Documentation and Approvals', 'tag' => 'Statutory', 'icon' => 'file-text', 'image' => $img('service-rule-45-32.png'),
     'description' => 'Preparation and submission of Rule 45 & Rule 32 documentation, safety drawings and liaison for statutory electrical approvals.'],
    ['title' => 'HT/LT Cable Laying', 'tag' => 'Underground', 'icon' => 'activity', 'image' => $img('service-ht-lt-cable-laying.png'),
     'description' => 'Precision underground trenching, HT XLPE jointing, LT armored cable pulling, end termination, and Megger insulation resistance testing.'],
    ['title' => 'Cable Tray Installation', 'tag' => 'GI Trays', 'icon' => 'layers', 'image' => $img('service-cable-tray.png'),
     'description' => 'Heavy-duty GI perforated and ladder-type cable tray routing with structural supports, clamps, and organized multi-tier bundling.'],
    ['title' => 'Transformer Sales & Installation', 'tag' => 'Transformer', 'icon' => 'gauge', 'image' => $img('service-transformer.png'),
     'description' => 'Transformer procurement, civil foundation alignment, marshalling box wiring, and full commissioning.'],
    ['title' => 'HT Panel Sales & Installation', 'tag' => 'Switchgear', 'icon' => 'settings', 'image' => $img('service-ht-panel.png'),
     'description' => 'Procurement and turnkey site installation of 11kV/22kV/33kV VCB panels, Ring Main Units (RMU), and protection relays.'],
    ['title' => 'DG Sales & Installation', 'tag' => 'Power Backup', 'icon' => 'battery', 'image' => $img('service-dg-sets.png'),
     'description' => 'Industrial diesel generator sets, automatic transfer switches (ATS/AMF), exhaust stacks, and synchronized standby solutions for uninterrupted operations.'],
]);

$seed('why_items', [
    ['title' => 'A-Grade Electrical Contracting', 'icon' => 'award', 'description' => 'Statutorily recognized license enabling our teams to handle a wide range of voltage classes and utility interconnections.'],
    ['title' => 'Technical Consultancy', 'icon' => 'headset', 'description' => 'Expert power engineering guidance on transformer sizing, demand factor estimation, and harmonic distortion mitigation.'],
    ['title' => 'HT/LT Infrastructure Expertise', 'icon' => 'zap', 'description' => 'Proven engineering methods for heavy busduct installations, overhead HT distribution lines, and internal LT raceways.'],
    ['title' => 'Documentation & Approval Support', 'icon' => 'file-text', 'description' => 'Turnkey statutory handling covering CEIG drawings, Rule 45 & Rule 32 submissions, and final electrical safety clearance.'],
    ['title' => 'Quality-Focused Execution', 'icon' => 'check-circle', 'description' => 'Quality switchgear components, copper busbars, and properly rated insulation on every installation.'],
    ['title' => 'Safety-Oriented Work Practices', 'icon' => 'hard-hat', 'description' => 'Lockout/Tagout (LOTO) protocols, calibrated safety equipment, and appropriate PPE during all operations.'],
]);

$seed('projects', [
    ['title' => 'Turnkey 33kV Substation & Dual Transformer Yard', 'client' => 'Industrial Plant', 'category' => 'HT/LT Substations', 'tag' => '33kV/433V Substation',
     'image' => $img('project-dual-transformer-yard.png'), 'is_featured' => 1, 'is_illustrative' => 1, 'link_text' => '',
     'description' => 'Complete design, CEIG approval liaison, civil plinth construction, equipment erection, and grid synchronization.'],
    ['title' => 'Multi-Tier Cable Tray & Armored Cabling', 'client' => 'Manufacturing Unit', 'category' => 'Cable Routing', 'tag' => 'Cable Infrastructure',
     'image' => $img('project-cable-tray-facility.png'), 'is_featured' => 0, 'is_illustrative' => 1, 'link_text' => 'Discuss a Similar Project',
     'description' => 'Ladder tray installation along with fire-barrier sealing and gland terminations.'],
    ['title' => 'PCC & MCC Panel Manufacturing', 'client' => 'Process Industry', 'category' => 'Panel Boards', 'tag' => 'Panel Manufacturing',
     'image' => $img('panel-workshop-team.png'), 'is_featured' => 0, 'is_illustrative' => 1, 'link_text' => 'Discuss a Similar Project',
     'description' => 'In-house fabrication, busbar assembly and testing of power and motor control centres.'],
    ['title' => 'DG Synchronization & AMF Control Room', 'client' => 'Critical Facility', 'category' => 'HT/LT Substations', 'tag' => 'Emergency Synchronization',
     'image' => $img('project-dg-synchronization.png'), 'is_featured' => 1, 'is_illustrative' => 1, 'link_text' => '',
     'description' => 'Synchronized standby generator sets with AMF panels for uninterrupted power continuity.'],
    ['title' => 'Outdoor 33kV Switchyard', 'client' => 'Utility Interconnection', 'category' => 'HT/LT Substations', 'tag' => 'Switchyard',
     'image' => $img('project-33kv-switchyard.png'), 'is_featured' => 0, 'is_illustrative' => 1, 'link_text' => 'Discuss a Similar Project',
     'description' => 'Gantry structures, isolators, CT/PT installation and outdoor transformer erection.'],
]);

$seed('process_steps', [
    ['title' => 'Requirement Discussion', 'phase' => 'Intake', 'icon' => 'users', 'description' => 'Understand project requirements, electrical loads and technical expectations.'],
    ['title' => 'Site Inspection', 'phase' => 'Survey', 'icon' => 'search', 'description' => 'Evaluate the site, existing infrastructure and installation requirements.'],
    ['title' => 'Technical Planning & Documentation', 'phase' => 'Engineering', 'icon' => 'compass', 'description' => 'Prepare layouts, electrical planning, technical documentation and approval submissions.'],
    ['title' => 'Installation & Execution', 'phase' => 'Build', 'icon' => 'wrench', 'description' => 'Execute HT/LT installation, cable infrastructure, equipment and panel-related work.'],
    ['title' => 'Testing & Handover', 'phase' => 'Commissioning', 'icon' => 'check-circle', 'description' => 'Complete applicable inspections, testing and project handover.'],
]);

say('Done. Start the API with:  php -d extension=gd -S localhost:8000 -t backend/uploads backend/index.php');
