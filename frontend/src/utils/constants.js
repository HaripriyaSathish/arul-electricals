/** Website navigation (href = section id). Links to hidden sections are removed automatically. */
export const NAV_LINKS = [
  { key: 'home', label: 'Home', href: '#home', section: 'hero' },
  { key: 'about', label: 'About Us', href: '#about', section: 'about' },
  { key: 'services', label: 'Services', href: '#services', section: 'services' },
  { key: 'projects', label: 'Projects', href: '#projects', section: 'projects' },
  { key: 'contact', label: 'Contact', href: '#contact', section: 'contact' },
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
