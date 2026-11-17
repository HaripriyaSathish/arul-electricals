/**
 * Admin content configuration.
 * Each page describes the fields the admin can edit. Field types:
 *   text | textarea | link | image | icon | list | repeater | select | toggle | rating | email | phone
 * Options: label, help, placeholder, half (two per row), rows, folder (media folder for uploads), max, suggestions
 */

const HEADING = [
  { name: 'eyebrow', label: 'Small label above heading', placeholder: 'e.g. Our Expertise', half: true },
  { name: 'title', label: 'Section heading', type: 'textarea', rows: 2, required: true },
  { name: 'subtitle', label: 'Short introduction', type: 'textarea', rows: 3 },
]

export const PAGES = {
  hero: {
    path: 'hero', title: 'Hero Banner', icon: 'home', anchor: 'home', sectionKey: 'hero', canHide: false,
    description: 'The large banner visitors see first at the top of the homepage.',
    groups: [
      { title: 'Headline', icon: 'edit', fields: [
        { name: 'badge', label: 'Small badge text', placeholder: 'A-Grade Electrical Contractors & Consultants' },
        { name: 'title', label: 'Main headline', type: 'textarea', rows: 2, required: true, help: 'Keep it short and strong — about 6–10 words.' },
        { name: 'subtitle', label: 'Introduction paragraph', type: 'textarea', rows: 4 },
      ] },
      { title: 'Buttons', icon: 'link', fields: [
        { name: 'primary_text', label: 'Yellow button text', half: true },
        { name: 'primary_link', label: 'Yellow button link', type: 'link', half: true },
        { name: 'secondary_text', label: 'Outline button text', half: true },
        { name: 'secondary_link', label: 'Outline button link', type: 'link', half: true },
      ] },
      { title: 'Background image slider', icon: 'image', fields: [
        { name: 'slides', label: 'Slider images', type: 'repeater', max: 8, addLabel: 'Add slide image', itemLabel: 'Slide',
          help: 'Images fade from one to the next with a gentle zoom. Use wide landscape photos (at least 1600 px wide); a violet tint is added automatically.',
          fields: [{ name: 'image', label: 'Image', type: 'image', folder: 'hero' }, { name: 'brighten', label: 'Brighten this photo', type: 'toggle', help: 'Turn on for photos that are already dark or purple-tinted, so they look light like the design.' }] },
        { name: 'slide_seconds', label: 'Seconds per slide', half: true, placeholder: '6' },
      ] },
      { title: 'Highlight chips', icon: 'sparkles', fields: [
        { name: 'features', label: 'Chips under the buttons', type: 'repeater', max: 4, addLabel: 'Add chip', itemLabel: 'Chip',
          fields: [{ name: 'icon', label: 'Icon', type: 'icon', half: true }, { name: 'text', label: 'Text', half: true }] },
      ] },
    ],
  },

  capabilities: {
    path: 'capabilities', title: 'Capabilities', icon: 'layers', anchor: 'capabilities', sectionKey: 'capabilities',
    description: 'The four engineering capability cards shown below the hero.',
    collection: 'capabilities', headingFields: [...HEADING, { name: 'card_label', label: 'Small label on each card', half: true, placeholder: 'Capability', help: 'Shown as “Capability 01”, “Capability 02”…' }],
  },

  about: {
    path: 'about', title: 'About Us', icon: 'building', anchor: 'about', sectionKey: 'about',
    description: 'Company introduction with photo, highlight badge and key points.',
    groups: [
      { title: 'Heading & text', icon: 'edit', fields: [
        { name: 'eyebrow', label: 'Small label above heading', half: true },
        { name: 'title', label: 'Heading', type: 'textarea', rows: 2, required: true },
        { name: 'description', label: 'Company introduction', type: 'textarea', rows: 4, help: 'The company name is highlighted in yellow automatically.' },
      ] },
      { title: 'Experience highlight', icon: 'award', fields: [
        { name: 'since_year', label: 'Established year', half: true, placeholder: '1987', help: 'Shown as “Since 1987” on the photo. Leave empty to hide.' },
        { name: 'since_prefix', label: 'Text above the year', half: true, placeholder: 'Since' },
        { name: 'since_label', label: 'Text under the year', half: true, placeholder: 'Years of trusted electrical service' },
      ] },
      { title: 'Photo & badge card', icon: 'image', fields: [
        { name: 'image', label: 'Photo', type: 'image', folder: 'about' },
        { name: 'badge_title', label: 'Badge card title', half: true },
        { name: 'badge_label', label: 'Badge card yellow tag', half: true },
        { name: 'badge_text', label: 'Badge card text', type: 'textarea', rows: 2 },
      ] },
      { title: 'Key points', icon: 'check-circle', fields: [
        { name: 'points', label: 'Points (with tick marks)', type: 'repeater', max: 6, addLabel: 'Add point', itemLabel: 'Point',
          fields: [{ name: 'title', label: 'Title' }, { name: 'text', label: 'Description', type: 'textarea', rows: 2 }] },
      ] },
      { title: 'Button', icon: 'link', fields: [
        { name: 'button_text', label: 'Button text', half: true },
        { name: 'button_link', label: 'Button link', type: 'link', half: true },
      ] },
    ],
  },

  services: {
    path: 'services', title: 'Services', icon: 'wrench', anchor: 'services', sectionKey: 'services',
    description: 'The nine client service cards (3-column grid). Footer service links update automatically.',
    collection: 'services', headingFields: [...HEADING, { name: 'card_label', label: 'Small label on each card', half: true, placeholder: 'Service', help: 'Shown as “01 / Service”.' }],
  },

  panel_feature: {
    path: 'panel-feature', title: 'Panel Board Feature', icon: 'cpu', anchor: 'panel-feature', sectionKey: 'panel_feature',
    description: 'A large feature block highlighting Panel Board Manufacturing.',
    groups: [
      { title: 'Content', icon: 'edit', fields: [
        { name: 'eyebrow', label: 'Small label above heading', half: true },
        { name: 'title', label: 'Heading', type: 'textarea', rows: 2, required: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
        { name: 'points', label: 'Bullet points', type: 'list', max: 8, addLabel: 'Add bullet' },
      ] },
      { title: 'Photo & button', icon: 'image', fields: [
        { name: 'image', label: 'Workshop / manufacturing photo', type: 'image', folder: 'services' },
        { name: 'stamp_text', label: 'Label on the photo', half: true, placeholder: 'Built in-house' },
        { name: 'button_text', label: 'Button text', half: true },
        { name: 'button_link', label: 'Button link', type: 'link', half: true },
      ] },
    ],
  },

  why: {
    path: 'why-choose-us', title: 'Why Choose Us', icon: 'award', anchor: 'why', sectionKey: 'why',
    description: 'Company strengths shown on the violet background.',
    notice: 'Publish only client-verified claims (design handover guideline).',
    collection: 'why_items',
    headingFields: [
      ...HEADING,
      { name: 'stat_value', label: 'Highlight box — big text', half: true },
      { name: 'stat_label', label: 'Highlight box — small text', half: true },
      { name: 'image', label: 'Side photo', type: 'image', folder: 'about' },
      { name: 'image_title', label: 'Photo caption title', half: true },
      { name: 'image_text', label: 'Photo caption text', half: true },
    ],
  },

  projects: {
    path: 'projects', title: 'Projects', icon: 'factory', anchor: 'projects', sectionKey: 'projects',
    description: 'Project gallery with category filter tabs. Categories come from each project.',
    notice: 'Use real client project photos where possible. Tick “Illustrative image” for stock or sample photos — the website then labels them.',
    collection: 'projects',
    headingFields: [...HEADING, { name: 'all_label', label: '“Show all” tab label', half: true, placeholder: 'All Executions' }, { name: 'illustrative_label', label: 'Label for illustrative photos', half: true, placeholder: 'Illustrative image' }],
  },

  process: {
    path: 'process', title: 'Our Workflow', icon: 'workflow', anchor: 'process', sectionKey: 'process',
    description: 'The step-by-step timeline (recommended: six steps).',
    collection: 'process_steps', headingFields: [...HEADING, { name: 'phase_label', label: 'Word before the phase name', half: true, placeholder: 'Phase' }],
  },

  testimonials: {
    path: 'testimonials', title: 'Testimonials', icon: 'quote', anchor: 'testimonials', sectionKey: 'testimonials',
    description: 'Client reviews. Hidden automatically when there are none.',
    notice: 'Only add genuine, client-approved testimonials. Do not invent names, quotes, companies or ratings.',
    collection: 'testimonials', headingFields: HEADING,
  },

  cta: {
    path: 'call-to-action', title: 'Call to Action', icon: 'megaphone', anchor: 'cta', sectionKey: 'cta',
    description: 'The violet banner inviting visitors to request a consultation.',
    groups: [
      { title: 'Content', icon: 'edit', fields: [
        { name: 'badge', label: 'Small badge text' },
        { name: 'title', label: 'Heading', type: 'textarea', rows: 2, required: true },
        { name: 'subtitle', label: 'Supporting text', type: 'textarea', rows: 3 },
      ] },
      { title: 'Buttons', icon: 'link', fields: [
        { name: 'primary_text', label: 'Yellow button text', half: true },
        { name: 'primary_link', label: 'Yellow button link', type: 'link', half: true },
        { name: 'secondary_text', label: 'White button text', half: true },
        { name: 'secondary_link', label: 'Second button link', type: 'link', half: true, help: 'Type “whatsapp” to open WhatsApp chat (number & message from Site Settings), or “call” for the phone dialer.' },
      ] },
      { title: 'Background (optional)', icon: 'image', fields: [
        { name: 'image', label: 'Background photo', type: 'image', folder: 'hero', help: 'Leave empty for a plain violet banner.' },
      ] },
    ],
  },

  contact: {
    path: 'contact-section', title: 'Contact & Enquiry Form', icon: 'mail', anchor: 'contact', sectionKey: 'contact',
    description: 'Contact heading, enquiry form options and the emergency support card.',
    notice: 'Phone number, email and address are edited in Site Settings → Contact details.',
    groups: [
      { title: 'Heading', icon: 'edit', fields: HEADING },
      { title: 'Enquiry form', icon: 'clipboard-check', fields: [
        { name: 'form_title', label: 'Form title', half: true },
        { name: 'form_subtitle', label: 'Form subtitle', half: true },
        { name: 'voltage_options', label: 'Voltage requirement options', type: 'list', addLabel: 'Add option' },
        { name: 'equipment_options', label: 'Equipment requirement options', type: 'list', addLabel: 'Add option' },
        { name: 'success_message', label: 'Message shown after sending', type: 'textarea', rows: 2 },
      ] },
      { title: 'Contact card labels', icon: 'list', fields: [
        { name: 'address_label', label: 'Address card title', half: true },
        { name: 'directions_text', label: 'Directions link text', half: true },
        { name: 'phone_label', label: 'Phone card title', half: true },
        { name: 'call_text', label: 'Call link text', half: true },
        { name: 'email_label', label: 'Email card title', half: true },
        { name: 'email_text', label: 'Email link text', half: true },
        { name: 'hours_label', label: 'Working hours card title', half: true },
        { name: 'map_button', label: 'Map button text', half: true },
      ] },
      { title: 'Form labels & buttons', icon: 'edit', fields: [
        { name: 'label_name', label: 'Name field label', half: true },
        { name: 'label_company', label: 'Company field label', half: true },
        { name: 'label_phone', label: 'Mobile field label', half: true },
        { name: 'label_email', label: 'Email field label', half: true },
        { name: 'label_voltage', label: 'Voltage field label', half: true },
        { name: 'label_equipment', label: 'Equipment field label', half: true },
        { name: 'label_location', label: 'Site location field label', half: true },
        { name: 'label_message', label: 'Requirements field label', half: true },
        { name: 'select_placeholder', label: 'Dropdown placeholder', half: true },
        { name: 'submit_text', label: 'Submit button text', half: true },
        { name: 'privacy_note', label: 'Note under the button' },
        { name: 'success_title', label: 'Success heading', half: true },
        { name: 'again_text', label: '“Send another” button text', half: true },
      ] },
      { title: 'Emergency support card', icon: 'alert', fields: [
        { name: 'emergency_title', label: 'Title', half: true },
        { name: 'emergency_text', label: 'Text', half: true },
      ] },
    ],
  },
}

PAGES.legal = {
  path: 'legal', title: 'Footer & Legal Pages', icon: 'file-text', anchor: 'footer', sectionKey: 'legal', canHide: false,
  description: 'Privacy Policy, Terms of Service and Statutory Approvals — opened as pop-ups from the footer.',
  notice: 'Formatting: start a line with “## ” for a heading and “- ” for a bullet point. Leave an empty line between paragraphs.',
  groups: [
    { title: 'Privacy Policy', icon: 'lock', fields: [
      { name: 'privacy_title', label: 'Title', half: true },
      { name: 'privacy', label: 'Content', type: 'textarea', rows: 14 },
    ] },
    { title: 'Terms of Service', icon: 'file-text', fields: [
      { name: 'terms_title', label: 'Title', half: true },
      { name: 'terms', label: 'Content', type: 'textarea', rows: 14 },
    ] },
    { title: 'Statutory Approvals', icon: 'shield-check', fields: [
      { name: 'statutory_title', label: 'Title', half: true },
      { name: 'statutory', label: 'Content', type: 'textarea', rows: 14 },
    ] },
    { title: 'Developer credit', icon: 'link', fields: [
      { name: 'credit_text', label: 'Credit text', half: true },
      { name: 'credit_url', label: 'Credit link', type: 'link', half: true },
    ] },
  ],
}

/** Sidebar order for "Website content" (same order as the homepage). */
export const CONTENT_ORDER = ['hero', 'capabilities', 'about', 'services', 'panel_feature', 'why', 'projects', 'process', 'testimonials', 'cta', 'contact']

export const SETTINGS_PAGE = {
  title: 'Site Settings', icon: 'settings', sectionKey: 'settings', canHide: false,
  description: 'Logo, company details, contact information, footer and SEO — used across the whole website.',
  tabs: [
    { title: 'Brand & header', icon: 'sparkles', fields: [
      { name: 'logo', label: 'Logo', type: 'image', folder: 'brand', half: true, help: 'Square PNG with transparent background works best (at least 200×200 px).' },
      { name: 'favicon', label: 'Favicon (browser tab icon)', type: 'image', folder: 'brand', half: true, help: 'Used on the website and the admin panel. Square image, e.g. 64×64 px or larger.' },
      { name: 'site_name', label: 'Company name', half: true, required: true },
      { name: 'license_badge', label: 'Badge next to name', half: true, placeholder: 'Licensed' },
      { name: 'tagline', label: 'Tagline under the name' },
      { name: 'nav_cta_text', label: 'Header button text', half: true },
    ] },
    { title: 'Contact details', icon: 'phone', fields: [
      { name: 'phone', label: 'Main phone / hotline', type: 'phone', half: true, help: 'Used for the Call button, header and footer.' },
      { name: 'phone_alt', label: 'Second phone (optional)', type: 'phone', half: true },
      { name: 'email', label: 'Public email address', type: 'email', half: true },
      { name: 'hours', label: 'Working hours', half: true },
      { name: 'address', label: 'Office address', type: 'textarea', rows: 3, help: 'Press Enter for a new line.' },
    ] },
    { title: 'Call & WhatsApp buttons', icon: 'whatsapp', fields: [
      { name: 'show_call_button', label: 'Show floating Call button', type: 'toggle', half: true },
      { name: 'show_whatsapp_button', label: 'Show floating WhatsApp button', type: 'toggle', half: true },
      { name: 'whatsapp', label: 'WhatsApp number', half: true, help: 'Country code + number, digits only — e.g. 917550343138.' },
      { name: 'whatsapp_message', label: 'Ready-made WhatsApp message', type: 'textarea', rows: 3, help: 'This text is pre-filled when a visitor taps the WhatsApp button.' },
    ] },
    { title: 'Map', icon: 'map-pin', fields: [
      { name: 'map_enabled', label: 'Show Google Map in the contact section', type: 'toggle' },
      { name: 'map_query', label: 'Map location', help: 'An address or place name exactly as you would search it on Google Maps — or paste latitude,longitude (e.g. 12.7409,77.8253).' },
    ] },
    { title: 'Footer', icon: 'list', fields: [
      { name: 'footer_tagline', label: 'Footer tagline', half: true },
      { name: 'footer_badge', label: 'Footer badge', half: true },
      { name: 'hotline_label', label: 'Hotline box label', half: true },
      { name: 'footer_about', label: 'About the company (footer)', type: 'textarea', rows: 3 },
      { name: 'certifications', label: 'Certification badges', type: 'list', addLabel: 'Add badge' },
      { name: 'copyright', label: 'Copyright line' },
    ] },
    { title: 'Menu & labels', icon: 'menu', fields: [
      { name: 'nav_home', label: 'Menu: Home', half: true },
      { name: 'nav_about', label: 'Menu: About', half: true },
      { name: 'nav_services', label: 'Menu: Services', half: true },
      { name: 'nav_projects', label: 'Menu: Projects', half: true },
      { name: 'nav_contact', label: 'Menu: Contact', half: true },
      { name: 'footer_about_title', label: 'Footer heading: About', half: true },
      { name: 'footer_services_title', label: 'Footer heading: Services', half: true },
      { name: 'footer_links_title', label: 'Footer heading: Quick links', half: true },
      { name: 'footer_contact_title', label: 'Footer heading: Contact', half: true },
      { name: 'whatsapp_label', label: 'WhatsApp button tooltip', half: true },
      { name: 'call_label', label: 'Call button tooltip', half: true },
    ] },
    { title: 'Social links', icon: 'globe', fields: [
      { name: 'facebook', label: 'Facebook URL', type: 'link', half: true },
      { name: 'linkedin', label: 'LinkedIn URL', type: 'link', half: true },
      { name: 'youtube', label: 'YouTube URL', type: 'link', half: true },
      { name: 'instagram', label: 'Instagram URL', type: 'link', half: true },
    ] },
    { title: 'SEO', icon: 'search', key: 'seo', seoPreview: true, fields: [
      { name: 'meta_title', label: 'SEO title (browser tab & Google heading)', help: 'Best length: 50–60 characters.', counter: 60 },
      { name: 'meta_description', label: 'SEO description', type: 'textarea', rows: 3, help: 'Shown under the title in Google. Best length: 140–160 characters.', counter: 160 },
      { name: 'meta_keywords', label: 'SEO keywords', type: 'textarea', rows: 3, help: 'Comma-separated words people search for, e.g. “electrical contractor Hosur, HT panel installation”.' },
      { name: 'og_image', label: 'Social share image', type: 'image', folder: 'hero', help: 'Shown when the website link is shared on WhatsApp, Facebook or LinkedIn. Landscape, about 1200×630 px.' },
    ] },
  ],
}

/** Repeatable card types. */
export const COLLECTIONS = {
  capabilities: {
    singular: 'Capability', plural: 'Capabilities', titleField: 'title', subtitleField: 'description', imageField: 'image', iconField: 'icon',
    defaults: { icon: 'zap' },
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { name: 'image', label: 'Card image', type: 'image', folder: 'capabilities' },
      { name: 'icon', label: 'Icon', type: 'icon', half: true },
      { name: 'link_text', label: 'Footer text on card', half: true, placeholder: 'e.g. Oil & Dry Type' },
    ],
  },
  services: {
    singular: 'Service', plural: 'Services', titleField: 'title', subtitleField: 'description', imageField: 'image', iconField: 'icon', badgeField: 'tag',
    defaults: { icon: 'zap', button_text: 'Enquire Now' },
    fields: [
      { name: 'title', label: 'Service name', required: true },
      { name: 'tag', label: 'Image tag', half: true, placeholder: 'e.g. HT Grid' },
      { name: 'button_text', label: 'Button text', half: true, placeholder: 'Enquire Now' },
      { name: 'description', label: 'Short description', type: 'textarea', rows: 3 },
      { name: 'image', label: 'Service image', type: 'image', folder: 'services' },
      { name: 'icon', label: 'Icon', type: 'icon' },
    ],
  },
  why_items: {
    singular: 'Strength', plural: 'Strengths', titleField: 'title', subtitleField: 'description', iconField: 'icon',
    defaults: { icon: 'check-circle' },
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { name: 'icon', label: 'Icon', type: 'icon' },
    ],
  },
  projects: {
    singular: 'Project', plural: 'Projects', titleField: 'title', subtitleField: 'description', imageField: 'image', badgeField: 'category',
    defaults: { is_illustrative: false, is_featured: false },
    fields: [
      { name: 'title', label: 'Project title', required: true },
      { name: 'client', label: 'Client / site type', half: true, placeholder: 'e.g. Automotive Industrial Plant' },
      { name: 'category', label: 'Filter category', half: true, suggestionsFrom: 'category', help: 'Projects with the same category are grouped under one filter tab.' },
      { name: 'tag', label: 'Image tag', half: true, placeholder: 'e.g. 33kV/433V Substation' },
      { name: 'link_text', label: 'Link text (optional)', half: true, placeholder: 'e.g. Discuss a Similar Project' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { name: 'image', label: 'Project photo', type: 'image', folder: 'projects' },
      { name: 'is_featured', label: 'Large featured card', type: 'toggle', half: true, help: 'Shows this project in a wide card.' },
      { name: 'is_illustrative', label: 'Illustrative image', type: 'toggle', half: true, help: 'Labels the photo as illustrative (not an actual client site).' },
    ],
  },
  process_steps: {
    singular: 'Step', plural: 'Steps', titleField: 'title', subtitleField: 'description', iconField: 'icon', badgeField: 'phase', numbered: true,
    defaults: { icon: 'check-circle' },
    fields: [
      { name: 'title', label: 'Step title', required: true },
      { name: 'phase', label: 'Phase label', half: true, placeholder: 'e.g. Survey' },
      { name: 'icon', label: 'Icon', type: 'icon', half: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    ],
  },
  testimonials: {
    singular: 'Testimonial', plural: 'Testimonials', titleField: 'name', subtitleField: 'message', imageField: 'avatar',
    defaults: { rating: 5 },
    fields: [
      { name: 'name', label: 'Client name', required: true },
      { name: 'role', label: 'Designation', half: true },
      { name: 'company', label: 'Company', half: true },
      { name: 'message', label: 'Testimonial', type: 'textarea', rows: 4, required: true },
      { name: 'rating', label: 'Star rating', type: 'rating' },
      { name: 'avatar', label: 'Photo (optional)', type: 'image', folder: 'team' },
    ],
  },
}

/** Map a collection resource back to its admin page (for "used in" links). */
export const COLLECTION_PAGE = Object.fromEntries(
  Object.entries(PAGES).filter(([, p]) => p.collection).map(([k, p]) => [p.collection, k]),
)

export function usageLabel(u) {
  if (u.type === 'section') {
    if (u.key === 'settings') return { label: 'Site Settings', to: '/admin/settings' }
    const p = PAGES[u.key]
    return { label: p ? p.title : u.key, to: p ? `/admin/${p.path}` : '/admin' }
  }
  const pageKey = COLLECTION_PAGE[u.key]
  const p = PAGES[pageKey]
  return { label: `${p ? p.title : u.key} → ${u.label}`, to: p ? `/admin/${p.path}` : '/admin' }
}
