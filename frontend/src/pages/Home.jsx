import { useCallback, useEffect, useState } from 'react'
import { PublicAPI } from '../api/endpoints'
import { errorMessage } from '../api/axiosInstance'
import { useFavicon } from '../hooks/useFetch'
import { useReveal, setAltMap, plain } from '../components/common/SiteBits'
import { mediaUrl } from '../utils/helpers'
import { SECTION_NAMES } from '../utils/constants'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import Loader from '../components/common/Loader'
import WhatsAppButton from '../components/common/WhatsAppButton'
import ScrollToTop from '../components/common/ScrollToTop'
import Hero from '../components/sections/Hero'
import Capabilities from '../components/sections/Capabilities'
import About from '../components/sections/About'
import Services from '../components/sections/Services'
import PanelFeature from '../components/sections/PanelFeature'
import WhyChooseUs from '../components/sections/WhyChooseUs'
import Projects from '../components/sections/Projects'
import Process from '../components/sections/Process'
import Testimonials from '../components/sections/Testimonials'
import CTA from '../components/sections/CTA'
import Contact from '../components/sections/Contact'
import Equipment from '../components/sections/Equipment'
import FAQ from '../components/sections/FAQ'

export default function Home() {
  const [site, setSite] = useState(null)
  const [error, setError] = useState(null)
  const [preset, setPreset] = useState(null)

  const load = useCallback(() => {
    setError(null)
    PublicAPI.site().then((r) => { setAltMap(r.data.media_alt); setSite(r.data) }).catch((e) => setError(errorMessage(e)))
  }, [])
  useEffect(() => { load() }, [load])

  const s = site?.settings || {}
  useFavicon(s.favicon || s.logo)
  useReveal([site])

  useEffect(() => {
    if (!site) return
    // SEO tags — all editable in Admin → Site Settings → SEO
    const title = s.meta_title || s.site_name || 'ARUL ELECTRICAL'
    document.title = title
    const setMeta = (attr, key, value) => {
      if (!value) return
      let el = document.head.querySelector(`meta[${attr}="${key}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.setAttribute('content', value)
    }
    const image = s.og_image ? mediaUrl(s.og_image) : ''
    setMeta('name', 'description', s.meta_description)
    setMeta('name', 'keywords', s.meta_keywords)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', s.meta_description)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:url', window.location.origin + '/')
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    // FAQ structured data (Google “FAQ” rich results) — built from Admin → FAQ
    const faqs = (site.sections.faq?.is_visible !== false ? site.sections.faq?.data?.items || [] : []).filter((q) => q?.question && q?.answer)
    let ld = document.getElementById('faq-jsonld')
    if (faqs.length) {
      if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'faq-jsonld'; document.head.appendChild(ld) }
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqs.map((q) => ({ '@type': 'Question', name: plain(q.question), acceptedAnswer: { '@type': 'Answer', text: plain(q.answer) } })),
      })
    } else if (ld) ld.remove()
    // honour a #hash in the URL after content loads
    if (window.location.hash) setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site])

  if (!site) return <Loader error={error} onRetry={load} />

  const sec = (k) => site.sections[k]?.data || {}
  const visible = (k) => site.sections[k] ? site.sections[k].is_visible !== false : true
  const list = (k) => site.lists[k] || []

  // 'Enquire' buttons on cards: pre-fill the form and note which section + card was clicked
  const enquire = (section) => (text) => {
    setPreset({ text, source: `${SECTION_NAMES[section] || section} → ${text}`, at: Date.now() })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="site">
      <Navbar settings={s} visible={visible} />
      <main>
        <Hero data={sec('hero')} settings={s} />
        {visible('capabilities') && <Capabilities data={sec('capabilities')} items={list('capabilities')} />}
        {visible('about') && <About data={sec('about')} siteName={s.site_name} />}
        {visible('services') && <Services data={sec('services')} items={list('services')} onEnquire={enquire('services')} />}
        {visible('equipment') && <Equipment data={sec('equipment')} onEnquire={enquire('equipment')} />}
        {visible('panel_feature') && <PanelFeature data={sec('panel_feature')} />}
        {visible('why') && <WhyChooseUs data={sec('why')} items={list('why_items')} />}
        {visible('projects') && <Projects data={sec('projects')} items={list('projects')} onEnquire={enquire('projects')} />}
        {visible('process') && <Process data={sec('process')} items={list('process_steps')} />}
        {visible('testimonials') && <Testimonials data={sec('testimonials')} items={list('testimonials')} />}
        {visible('cta') && <CTA data={sec('cta')} settings={s} />}
        {visible('faq') && <FAQ data={sec('faq')} settings={s} />}
        {visible('contact') && <Contact data={sec('contact')} settings={s} preset={preset} />}
      </main>
      <Footer settings={s} services={list('services')} visible={visible} legal={sec('legal')} />
      <WhatsAppButton settings={s} />
      <ScrollToTop />
    </div>
  )
}
