<?php
/**
 * ARUL ELECTRICAL — apply the SEO content document (ARUL_ELECTRICAL_SEO_Content.docx) to the database.
 *
 *   Local MySQL:  php database/apply_seo_content.php
 *   Neon (Render): DATABASE_URL='postgresql://...' php -d extension=pdo_pgsql database/apply_seo_content.php
 *
 * Safe to run more than once. It only changes the fields listed below (other admin edits are kept).
 * Contact details (address, phone, email, working hours) are NOT changed — edit them in Admin → Site Settings.
 */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }

require __DIR__ . '/../backend/config/config.php';
$db = require __DIR__ . '/../backend/config/database.php';
$pg = $db['driver'] === 'pgsql';
$opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
if ($pg) {
    $dsn = "pgsql:host={$db['host']};port={$db['port']};dbname={$db['name']};sslmode={$db['sslmode']}";
    try { $pdo = new PDO($dsn, $db['user'], $db['pass'], $opts); }
    catch (PDOException $e) {
        if (!$db['options']) throw $e;
        $pdo = new PDO($dsn . ";options={$db['options']}", $db['user'], $db['pass'], $opts);   // older libpq: Neon endpoint id
    }
} else {
    $pdo = new PDO("mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset=utf8mb4", $db['user'], $db['pass'], $opts);
}
function say(string $m): void { echo $m . PHP_EOL; }
say('Database: ' . ($pg ? 'PostgreSQL (Neon)' : 'MySQL') . " {$db['name']}");

// ---------- schema: alt text column on image cards ----------
foreach (['capabilities', 'services', 'projects'] as $t) {
    if ($pg) {
        $pdo->exec("ALTER TABLE $t ADD COLUMN IF NOT EXISTS image_alt VARCHAR(255) DEFAULT ''");
    } else {
        $has = $pdo->query("SHOW COLUMNS FROM `$t` LIKE 'image_alt'")->fetch();
        if (!$has) $pdo->exec("ALTER TABLE `$t` ADD COLUMN image_alt VARCHAR(255) DEFAULT '' AFTER image");
    }
}
say('Columns ready.');

$M = 'uploads/media/';

// ---------- single sections (merged into what is already saved) ----------
$sections = [
    'settings' => [
        'meta_title'             => 'Industrial Electrical Contractor, Chennai | ARUL ELECTRICAL',
        'meta_description'       => 'ARUL Electrical Chennai: licensed A-Grade electrical contractor for HT/LT installation, panel manufacturing, transformers, DG sets and CEIG approvals.',
        'nav_equipment'          => 'Equipment',
        'footer_about'           => 'A-Grade licensed electrical contractors and consultants in Chennai, specialising in HT/LT installations, custom switchgear and panel manufacturing, statutory Rule 45 and Rule 32 compliance, and turnkey industrial electrical infrastructure.',
        'footer_tagline'         => 'Powering Industries. Engineering Reliable Connections.',
        'footer_badge'           => 'A-Grade Govt Licensed',
        'hotline_label'          => '24/7 Breakdown Hotline',
        'footer_button_text'     => 'Schedule Technical Audit',
        'certifications'         => ['Class 1 Electrical Contractor', 'CEA & DISCOM Compliant', 'ISO Quality Certified'],
        'footer_about_title'     => 'About ARUL ELECTRICAL',
        'footer_services_title'  => 'Engineering Services',
        'footer_services'        => ['HT Connection', 'HT/LT Installation', 'Panel Board Manufacturing', 'Rule 45 & 32 Documentation', 'HT/LT Cable Laying', 'Cable Tray', 'Transformers', 'HT Panels', 'DG Sets'],
        'footer_equipment_title' => 'Power Equipment',
        'footer_equipment'       => ['Transformers', 'HT Switchgear', 'Diesel Generator Sets', 'MCC & PCC Panels', 'APFC Panels'],
        'footer_links_title'     => 'Quick Links',
        'quick_consultation'     => 'Consultation',
        'footer_contact_title'   => 'Corporate Office',
        'social_title'           => 'Connect with us',
        'copyright'              => '© 2026 ARUL ELECTRICAL. All rights reserved. A-Grade Electrical Contractors & Consultants.',
        'legal_line'             => 'Central Electricity Authority statutory compliance certified.',
    ],
    'hero' => [
        'badge'          => 'A-Grade Electrical Contractors & Consultants',
        'title'          => 'Powering Industries with Reliable Electrical Solutions.',
        'subtitle'       => 'Your trusted partner for HT & LT electrical contracting, industrial power equipment, panel manufacturing and turnkey engineering services across Chennai.',
        'primary_text'   => 'Explore Our Services',
        'primary_link'   => '#services',
        'secondary_text' => 'Request a Consultation',
        'secondary_link' => '#contact',
        'features'       => [
            ['icon' => 'zap', 'text' => 'HT & LT Electrical Expertise'],
            ['icon' => 'factory', 'text' => 'Industrial Infrastructure'],
            ['icon' => 'clipboard-check', 'text' => 'Technical Docs & CEA Compliance'],
        ],
    ],
    'capabilities' => [
        'eyebrow'  => 'System Architecture',
        'title'    => 'Industrial Electrical Engineering Capabilities',
        'subtitle' => 'End-to-end industrial electrical solutions in Chennai, covering heavy industrial power distribution, panel engineering and turnkey electrical infrastructure for factories, plants and commercial facilities.',
    ],
    'about' => [
        'eyebrow'     => 'About Our Company',
        'title'       => 'Industrial Electrical Contracting Built for Reliability.',
        'description' => "ARUL ELECTRICAL is a premier A-Grade licensed electrical contractor and electrical engineering company in Chennai, specialising in HT/LT electrical installations, panel board manufacturing, heavy equipment supply and statutory compliance.\n\nAs an electrical contracting company and consultancy, we focus on technically planned industrial electrical systems with uncompromising workmanship. From initial grid load approvals to high-capacity step-down transformer commissioning, our engineers ensure faultless installations for plants, mills and commercial parks.",
        'points'      => [
            ['title' => 'Electrical Contracting Expertise', 'text' => 'Class-1 turnkey execution for manufacturing plants, heavy mills and commercial parks.'],
            ['title' => 'Technical Consultancy', 'text' => 'Single-line diagram (SLD) preparation, earthing designs and fault level calculations, backed by our electrical consultancy services and electrical engineering services.'],
            ['title' => 'Quality-Focused Execution', 'text' => 'Rigorous testing using calibrated Meggers, Hi-Pot analyzers and secondary injection kits.'],
        ],
        'badge_title' => 'Safety-First Protocols',
        'badge_text'  => 'Strict CEIG safety standards, zero-compromise insulation testing, and zero-accident construction policy.',
        'badge_label' => 'Industrial Standards Compliant',
        'button_text' => 'Schedule Site Audit',
        'image_alt'   => 'Technicians assembling a copper busbar switchboard in an electrical panel workshop',
    ],
    'services' => [
        'eyebrow'  => 'Our Expertise',
        'title'    => 'Complete Electrical Contracting & Engineering Solutions',
        'subtitle' => 'Industrial electrical contractor services in Chennai covering HT connections, LT installation, panel manufacturing, statutory approvals, cable infrastructure, transformers, HT panels and DG sets.',
    ],
    'equipment' => [
        'eyebrow'     => 'Equipment Catalog',
        'title'       => 'Industrial Power Equipment & Installation',
        'subtitle'    => 'Industrial power equipment supply and commissioning in Chennai, including transformers, HT switchgear and diesel generator sets.',
        'button_text' => 'Enquire Equipment',
        'items'       => [
            [
                'title' => 'Industrial Power Transformers', 'tag' => '',
                'description' => 'Power transformer supplier and installer in Chennai for high-capacity step-down and step-up transformers (100 kVA to 5000 kVA), with turnkey civil erection, oil filtration and protective earthing.',
                'points' => ['Oil Cooled (ONAN) & Dry Cast Resin', 'Off-Circuit Tap & OLTC Variants', 'Buchholz Relay & WTI/OTI Protection'],
                'image' => $M . 'capability-transformer-solutions.webp',
                'image_alt' => 'Oil-cooled power transformer on a concrete plinth in an outdoor transformer yard',
                'button_text' => 'Enquire Equipment',
            ],
            [
                'title' => 'HT Electrical Panels & Switchgear', 'tag' => '',
                'description' => 'Vacuum Circuit Breaker (VCB) panels, Ring Main Units (RMU) and custom Motor Control Centers, engineered to withstand high short-circuit levels.',
                'points' => ['Rated 11kV, 22kV, 33kV Class', 'Internal Arc Classified (IAC) Safety', 'Numerical Relay Integration'],
                'image' => $M . 'service-ht-panel.webp',
                'image_alt' => 'Row of HT switchgear panels with numerical relays in a switch room',
                'button_text' => 'Enquire Equipment',
            ],
            [
                'title' => 'Industrial Diesel Generator Sets', 'tag' => '',
                'description' => 'Heavy industrial silent DG sets for continuous and emergency standby backup, with generator synchronization, acoustic room treatment and fuel piping.',
                'points' => ['Capacities from 50 kVA to 2000 kVA', 'CPCB-IV+ Emission Compliant', 'Automatic AMF Synchronizing Panels'],
                'image' => $M . 'service-dg-sets.webp',
                'image_alt' => 'Silent diesel generator set in an enclosure beside an industrial building',
                'button_text' => 'Enquire Equipment',
            ],
        ],
    ],
    'panel_feature' => [
        'image_alt' => 'Electrician in a hard hat wiring an LT distribution panel in an industrial plant',
    ],
    'why' => [
        'eyebrow'     => 'Advantage Matrix',
        'title'       => 'Why Industries Choose ARUL ELECTRICAL',
        'subtitle'    => 'We deliver electrical contracting and electrical engineering consultancy services for complex industrial and commercial infrastructure in Chennai.',
        'stat_value'  => '100% Zero-Fault',
        'stat_label'  => 'Inspection Record Across Heavy Substations',
        'image_title' => 'A-Grade Certified Field Engineers',
        'image_text'  => 'Full-time technical staff licensed for HT switchgear, multi-MVA transformer commissioning, and CEIG statutory sign-offs.',
        'image_alt'   => 'Two engineers in hard hats and safety vests pointing at a high-voltage substation',
    ],
    'projects' => [
        'eyebrow'   => 'Track Record',
        'title'     => 'Industrial Electrical Projects Delivered with Precision',
        'subtitle'  => 'Industrial electrical projects covering substations, transformers, panel boards, cable infrastructure and DG synchronization.',
        'all_label' => 'All Executions',
    ],
    'process' => [
        'eyebrow'  => 'Our Workflow',
        'title'    => 'From Planning to Powering – Our Process.',
        'subtitle' => 'A structured approach to industrial electrical contracting and electrical construction that moves every project through planning, documentation, installation and final handover.',
    ],
    'testimonials' => [
        'eyebrow'  => 'Client Verifications',
        'title'    => 'Trusted by Industrial Engineering Teams',
        'subtitle' => 'What industrial infrastructure managers and factory operators say about our engineering support.',
    ],
    'cta' => [
        'badge'          => 'High Voltage Industrial Turnkey Contracting',
        'title'          => 'Planning Your Next Electrical Infrastructure Project?',
        'subtitle'       => 'Connect with ARUL ELECTRICAL in Chennai for industrial electrical contracting, power equipment supply and turnkey technical consultancy.',
        'primary_text'   => 'Request a Consultation',
        'secondary_text' => 'Contact Technical Team',
    ],
    'faq' => [
        'eyebrow'  => 'Frequently Asked Questions',
        'title'    => 'Industrial Electrical Questions, Answered.',
        'subtitle' => 'Planning a substation, panel board, transformer or DG set project? Find answers about our services, approvals and estimates below, or contact our technical team for help.',
        'items'    => [
            ['question' => 'What does an industrial electrical contractor in Chennai do?',
             'answer' => 'ARUL ELECTRICAL plans, installs, tests and commissions HT and LT electrical systems for industrial plants, including electrical substation installation, transformers, HT and LT panels, cable laying, cable trays and DG sets, along with the statutory documentation they need.'],
            ['question' => 'Are you a licensed electrical contractor?',
             'answer' => 'Yes. ARUL ELECTRICAL is an A-Grade government licensed electrical contractor and consultant, working to CEA and DISCOM requirements and CEIG statutory approvals.'],
            ['question' => 'Are you an electrical panel manufacturer in Chennai?',
             'answer' => "Yes. As an electrical panel manufacturer and control panel manufacturer, we build PCC panels, MCC panels, LT distribution panels, automatic power factor correction (APFC) panels, auto mains failure (AMF) panels, generator synchronization panels and HT VCB boards in-house, to each project's specification."],
            ['question' => 'Can you install and synchronize DG sets?',
             'answer' => 'Yes. We supply and install industrial diesel generator sets with ATS/AMF panels, and build DG synchronization panels for seamless grid-to-generator changeover and standby power.'],
            ['question' => 'Do you handle transformer installation and HT connection approvals?',
             'answer' => 'Yes. Our transformer installation covers civil plinth work, erection, oil filtration, testing and earthing. We also prepare Rule 45 and Rule 32 documentation and act as your CEIG approval consultant in Chennai for HT connection approvals.'],
            ['question' => 'How do I get an estimate for my project?',
             'answer' => 'Fill in the Project Technical Assessment Form or call our technical team with your voltage requirement, equipment needed, site location, sanctioned load in kVA and target completion timeline.'],
            ['question' => 'Where can I find licensed electrical contractors near me in Chennai?',
             'answer' => 'ARUL ELECTRICAL has its engineering office in the Guindy Industrial Zone, Chennai, Tamil Nadu. Contact our team to discuss your site, your requirements and a technical audit.'],
        ],
    ],
    'contact' => [
        'eyebrow'           => 'Direct Access',
        'title'             => 'Let’s Discuss Your Electrical Project.',
        'subtitle'          => 'Speak directly with our senior electrical engineers in Chennai regarding tenders, site inspections and turnkey estimates.',
        'emergency_title'   => '24/7 Emergency Support',
        'emergency_text'    => 'Immediate mobilization for industrial sub-station & transformer trip emergencies.',
        'form_title'        => 'Project Technical Assessment Form',
        'label_name'        => 'Full Name',
        'label_company'     => 'Company / Organization',
        'label_phone'       => 'Mobile Contact',
        'label_email'       => 'Email Address',
        'label_voltage'     => 'Voltage Requirement',
        'label_equipment'   => 'Equipment Requirement',
        'label_location'    => 'Project Site Location',
        'label_message'     => 'Project Scope & Technical Requirements',
        'voltage_options'   => ['HT (11kV / 22kV / 33kV)', 'LT (up to 1kV)', 'Not sure'],
        'equipment_options' => ['Transformer Installation', 'HT Panel / Switchgear', 'PCC / MCC Panel', 'APFC Panel', 'DG Set / Generator Synchronization', 'HT/LT Cable Laying', 'Cable Tray Installation', 'Rule 45 & Rule 32 Approvals', 'Other'],
        'submit_text'       => 'Submit Project Enquiry',
    ],
];

$get = $pdo->prepare('SELECT data FROM sections WHERE section_key = ?');
$upd = $pdo->prepare('UPDATE sections SET data = ? WHERE section_key = ?');
$ins = $pdo->prepare('INSERT INTO sections (section_key, data, is_visible) VALUES (?, ?, 1)');
foreach ($sections as $key => $values) {
    $get->execute([$key]);
    $row = $get->fetch();
    if ($row) {
        $data = array_merge(json_decode($row['data'], true) ?: [], $values);
        $upd->execute([json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $key]);
        say("  section $key: updated");
    } else {
        $ins->execute([$key, json_encode($values, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
        say("  section $key: added");
    }
}

// ---------- repeatable cards (matched by their order on the website) ----------
$cards = [
    'capabilities' => [
        ['title' => 'HT & LT Electrical Contracting', 'link_text' => 'Class 1 Execution', 'image' => $M . 'capability-ht-lt-contracting.webp',
         'description' => 'High-voltage grid connection, indoor and outdoor electrical substation installation, switchyard installation and a complete LT electrical power distribution system for industrial sites.',
         'image_alt' => 'Engineers in orange overalls working in an HT switchyard with substation structures'],
        ['title' => 'Transformer Solutions', 'link_text' => 'Oil & Dry Type',
         'description' => 'Transformer installation and supply, with civil plinth mounting, erection, vacuum oil filtration, BDV testing, earth mat grounding and live charging of power transformers.',
         'image_alt' => 'Oil-filled power transformer with bushings inside a substation yard'],
        ['title' => 'Panel Board Manufacturing', 'link_text' => 'CPRI Type Tested',
         'description' => 'In-house custom manufacturing of CPRI-compliant PCC and MCC panels, APFC (automatic power factor controller) panels, AMF (auto mains failure) panels, generator synchronization panels and industrial VCB boards.',
         'image_alt' => 'Rows of industrial electrical control panels in a panel manufacturing facility'],
        ['title' => 'Documentation & Approvals', 'link_text' => '100% Guaranteed Filing',
         'description' => 'Statutory Indian Electricity Rules (Rule 45 & Rule 32) compliance, CEIG approval drawings, grid synchronization and licensing assistance.',
         'image_alt' => 'Engineer in a hard hat reviewing electrical drawings on a tablet over a plan table'],
    ],
    'services' => [
        ['title' => 'New HT Connection Installation with Documentation',
         'description' => 'New HT connection installation with technical documentation, scheme drawings and coordination for grid approval and sanctioning.',
         'image_alt' => 'Two engineers in hard hats reviewing HT connection drawings at a substation'],
        ['title' => 'LT Electrical Installation',
         'description' => 'LT electrical installation services for industrial factory shopfloors, warehouses and commercial facility power distribution, completing your HT/LT electrical installation.',
         'image_alt' => 'Electrician in a hard hat wiring an LT distribution panel in an industrial plant'],
        ['title' => 'Panel Board Manufacturing',
         'description' => 'In-house electrical panel manufacturing for PCC, MCC, LT, APFC, AMF and DG synchronization panels, built to project specifications.',
         'image_alt' => 'Technician assembling a PCC and MCC panel board in a manufacturing workshop'],
        ['title' => 'Rule 45 & Rule 32 Documentation and Approvals',
         'description' => 'Technical documentation, statutory safety clearance, CEIG approval liaison and electrical statutory compliance support for mandatory Rule 45 and Rule 32 requirements.',
         'image_alt' => 'Engineers reviewing Rule 45 and Rule 32 documentation files and single-line diagrams'],
        ['title' => 'HT/LT Cable Laying',
         'description' => 'HT/LT cable laying in Chennai with underground trenching, XLPE jointing, armoured cable pulling, termination and Megger testing.',
         'image_alt' => 'Two engineers with a tablet at a substation planning underground HT and LT cable laying'],
        ['title' => 'Cable Tray Installation',
         'description' => 'Cable tray installation with heavy-duty GI perforated and ladder-type trays, structural supports, seismic clamps and organised multi-tier bundling.',
         'image_alt' => 'Technicians in orange suits routing cable trays beside a substation transformer yard'],
        ['title' => 'Transformer Sales & Installation',
         'description' => 'Transformer installation and supply of high-efficiency copper-wound transformers, with civil foundation alignment, marshalling box wiring and full commissioning.',
         'image_alt' => 'Engineers inspecting a power transformer at an outdoor substation'],
        ['title' => 'HT Panel Sales & Installation',
         'description' => 'HT panel supply and turnkey site installation of 11kV/22kV/33kV VCB panels, Ring Main Units (RMU) and protection relays.',
         'image_alt' => 'Engineers checking an HT panel with VCB switchgear and protection relays'],
        ['title' => 'DG Sales & Installation',
         'description' => 'DG set installation in Chennai and supply of industrial diesel generator sets, ATS/AMF panels, exhaust silencer stacks and synchronized standby systems for uninterrupted industrial continuity.',
         'image_alt' => 'Technician and engineer commissioning a yellow diesel generator set with its control panel'],
    ],
    'why_items' => [
        ['title' => 'A-Grade Electrical Contracting', 'description' => 'A statutorily recognised licence that enables our teams, as a government licensed electrical contractor, to handle unrestricted voltage classes and major utility interconnections.'],
        ['title' => 'Technical Consultancy', 'description' => 'Expert power engineering guidance on transformer sizing, demand factor estimation and harmonic distortion mitigation.'],
        ['title' => 'HT/LT Infrastructure Expertise', 'description' => 'Proven engineering methods for heavy busduct installations, overhead HT distribution lines and internal LT raceways.'],
        ['title' => 'Documentation & Approval Support', 'description' => 'Turnkey statutory handling covering CEIG drawings, Rule 45 & Rule 32 submissions and final electrical safety fitness clearance.'],
        ['title' => 'Quality-Focused Execution', 'description' => 'Use of premier tier-1 switchgear components, certified copper busbars and dual-layer thermal insulation sleeves.'],
        ['title' => 'Safety-Oriented Work Practices', 'description' => 'Mandatory Lockout/Tagout (LOTO) protocols, calibrated safety discharge sticks and specialised PPE during all operations.'],
    ],
    'projects' => [
        ['title' => 'Turnkey 33kV Substation & Dual 2500 kVA Transformer Yard', 'tag' => '33kV/433V Substation', 'client' => 'Automotive Industrial Plant',
         'description' => 'Complete design, CEIG approval liaison, civil plinth construction, equipment erection, and live grid synchronization.',
         'image_alt' => '33kV substation with a dual transformer yard and steel switchyard structures under a blue sky'],
        ['title' => '12,000m Multi-Tier Cable Tray & Armored Cabling', 'tag' => 'Cable Infrastructure', 'client' => 'Pharma Manufacturing Unit',
         'description' => 'Precision ladder tray installation along with fire-barrier sealing and high-grade gland terminations.',
         'image_alt' => 'Multi-tier cable trays carrying armoured cables through a manufacturing facility'],
        ['title' => '4000A Main Power Control Center (PCC) Panel', 'tag' => 'Panel Manufacturing', 'client' => 'Textile Processing Complex',
         'description' => 'Form 4b compartmentalized design with ACB protection and automated 12-step APFC harmonic filtration.',
         'image_alt' => 'Technicians testing a row of PCC and MCC panel boards in a panel workshop'],
        ['title' => '2 x 1500 kVA Automated DG Backup & AMF Synchronizing System', 'tag' => 'Emergency Synchronization', 'client' => 'IT Technology Campus',
         'description' => 'Seamless grid-to-generator auto transfer system with zero-break load transition and remote SCADA integration.',
         'image_alt' => 'Two diesel generators with an AMF synchronizing panel in a generator room'],
    ],
];

foreach ($cards as $table => $list) {
    $ids = array_column($pdo->query("SELECT id FROM $table ORDER BY sort_order, id")->fetchAll(), 'id');
    foreach ($list as $i => $values) {
        if (!isset($ids[$i])) { say("  ! $table: no card #" . ($i + 1) . ', skipped'); continue; }
        $set = implode(', ', array_map(fn($c) => "$c = ?", array_keys($values)));
        $pdo->prepare("UPDATE $table SET $set WHERE id = ?")->execute([...array_values($values), $ids[$i]]);
    }
    say("  $table: " . min(count($list), count($ids)) . ' cards updated');
}

// The document lists four projects. Hide any extra project cards (not deleted — switch them back on in Admin → Projects).
$ids = array_column($pdo->query('SELECT id FROM projects ORDER BY sort_order, id')->fetchAll(), 'id');
foreach (array_slice($ids, 4) as $id) $pdo->prepare('UPDATE projects SET is_active = 0 WHERE id = ?')->execute([$id]);
if (count($ids) > 4) say('  projects: ' . (count($ids) - 4) . ' extra card(s) hidden');

// ---------- Media Library alt text (used wherever an image has no card-specific alt text) ----------
$alts = [
    'arul-electrical-logo.png'              => 'ARUL ELECTRICAL logo, A-Grade licensed electrical contractors and consultants in Chennai',
    'engineers-substation-banner.webp'      => 'Engineers in hard hats reviewing plans beside a high-voltage substation transformer',
    'capability-ht-lt-contracting.webp'     => 'Engineers in orange overalls working in an HT switchyard with substation structures',
    'capability-transformer-solutions.webp' => 'Oil-filled power transformer with bushings inside a substation yard',
    'capability-panel-board.png'            => 'Rows of industrial electrical control panels in a panel manufacturing facility',
    'capability-documentation.png'          => 'Engineer in a hard hat reviewing electrical drawings on a tablet over a plan table',
    'panel-workshop-team.webp'              => 'Technicians assembling a copper busbar switchboard in an electrical panel workshop',
    'field-engineers-substation.webp'       => 'Two engineers in hard hats and safety vests pointing at a high-voltage substation',
    'service-new-ht-connection.webp'        => 'Two engineers in hard hats reviewing HT connection drawings at a substation',
    'technician-wiring-lt-panel.webp'       => 'Electrician in a hard hat wiring an LT distribution panel in an industrial plant',
    'service-panel-board.webp'              => 'Technician assembling a PCC and MCC panel board in a manufacturing workshop',
    'service-rule-45-32.webp'               => 'Engineers reviewing Rule 45 and Rule 32 documentation files and single-line diagrams',
    'service-ht-lt-cable-laying.webp'       => 'Two engineers with a tablet at a substation planning underground HT and LT cable laying',
    'service-cable-tray.webp'               => 'Technicians in orange suits routing cable trays beside a substation transformer yard',
    'service-transformer.webp'              => 'Engineers inspecting a power transformer at an outdoor substation',
    'service-ht-panel.webp'                 => 'Engineers checking an HT panel with VCB switchgear and protection relays',
    'service-dg-sets.webp'                  => 'Technician and engineer commissioning a yellow diesel generator set with its control panel',
    'project-dual-transformer-yard.webp'    => '33kV substation with a dual transformer yard and steel switchyard structures under a blue sky',
    'project-cable-tray-facility.webp'      => 'Multi-tier cable trays carrying armoured cables through a manufacturing facility',
    'project-dg-synchronization.webp'       => 'Two diesel generators with an AMF synchronizing panel in a generator room',
];
$st = $pdo->prepare('UPDATE media SET alt_text = ? WHERE path = ?');
$n = 0;
foreach ($alts as $file => $alt) { $st->execute([$alt, $M . $file]); $n += $st->rowCount(); }
say("  media alt text: $n images updated");

say('Done.');
