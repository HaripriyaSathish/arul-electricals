/** Website navigation (href = section id). Links to hidden sections are removed automatically. */
export const NAV_LINKS = [
  { key: 'home', label: 'Home', href: '#home', section: 'hero' },
  { key: 'about', label: 'About Us', href: '#about', section: 'about' },
  { key: 'services', label: 'Services', href: '#services', section: 'services' },
  { key: 'equipment', label: 'Equipment', href: '#equipment', section: 'equipment' },
  { key: 'projects', label: 'Projects', href: '#projects', section: 'projects' },
  { key: 'contact', label: 'Contact', href: '#contact', section: 'contact' },
]

/** Footer “Quick links” column (labels can be renamed in Admin → Site Settings → Footer). */
export const FOOTER_QUICK_LINKS = [
  { key: 'about', label: 'About Us', href: '#about', section: 'about' },
  { key: 'capabilities', label: 'Capabilities', href: '#capabilities', section: 'capabilities' },
  { key: 'services', label: 'Services', href: '#services', section: 'services' },
  { key: 'equipment', label: 'Equipment', href: '#equipment', section: 'equipment' },
  { key: 'projects', label: 'Projects', href: '#projects', section: 'projects' },
  { key: 'process', label: 'Process', href: '#process', section: 'process' },
  { key: 'consultation', label: 'Consultation', href: '#contact', section: 'contact' },
]

export const MEDIA_FOLDER_LABELS = {
  all: 'All images',
  general: 'General',
  hero: 'Hero & banners',
  about: 'About',
  capabilities: 'Capabilities',
  services: 'Services',
  projects: 'Projects',
  team: 'People',
  brand: 'Logo & brand',
}

export const ENQUIRY_STATUS = {
  new: { label: 'New', tone: 'yellow' },
  read: { label: 'Seen', tone: 'violet' },
  replied: { label: 'Replied', tone: 'green' },
  closed: { label: 'Closed', tone: 'gray' },
}
