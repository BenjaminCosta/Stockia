import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { InternalHeaderBackground } from '@/components/internal-header-background'

interface InfoSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

interface QuickLink {
  href: string
  label: string
  description: string
}

interface MetaItem {
  label: string
  value: string
}

interface Callout {
  eyebrow?: string
  title: string
  description: string
}

interface ComercioInfoPageProps {
  label: string
  title: string
  subtitle: string
  sections: InfoSection[]
  quickLinks?: QuickLink[]
  meta?: MetaItem[]
  callout?: Callout
  children?: ReactNode
}

interface ComercioInfoHeroProps {
  label: string
  title: string
  subtitle: string
}

export function ComercioInfoHero({ label, title, subtitle }: ComercioInfoHeroProps) {
  return (
    <InternalHeaderBackground className="px-4 md:px-8 pt-5 pb-10 md:pt-8 md:mx-4 md:mt-4 md:rounded-b-3xl md:shadow-lg">
      <div className="relative z-10 mx-auto w-full max-w-350 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="min-w-0 pl-6 md:pl-8">
          <Link
            href="/comercio"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 mb-4 transition-colors text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <p className="text-[#C8FF00]/60 text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] mb-1.5">{label}</p>
          <h1 className="font-heading font-bold text-2xl md:text-4xl text-white leading-tight mb-1 tracking-tight">{title}</h1>
          <p className="text-white/55 text-xs md:text-sm font-medium">{subtitle}</p>
        </div>
      </div>
    </InternalHeaderBackground>
  )
}

export function ComercioInfoPage({
  label,
  title,
  subtitle,
  sections,
  quickLinks = [],
  meta = [],
  callout,
  children,
}: ComercioInfoPageProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <ComercioInfoHero label={label} title={title} subtitle={subtitle} />

      <div className="mx-auto grid w-full max-w-350 gap-6 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {children}

          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-border bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground md:text-[15px]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <div className="mt-5 space-y-3">
                  {section.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-[#F7F8FA] px-4 py-3"
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#C8FF00] ring-4 ring-[#C8FF00]/20" />
                      <p className="text-sm leading-6 text-foreground">{bullet}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          {quickLinks.length > 0 && (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Accesos rápidos
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                {quickLinks.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 bg-white px-4 py-4 transition-colors hover:bg-[#F7F8FA] ${
                      index < quickLinks.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {meta.length > 0 && (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Referencia
              </p>
              <div className="mt-4 space-y-4">
                {meta.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[#F7F8FA] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {callout && (
            <div className="rounded-3xl bg-[#0B1A45] p-6 text-white shadow-[0_18px_44px_rgba(11,26,69,0.22)]">
              {callout.eyebrow && (
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8FF00]/75">
                  {callout.eyebrow}
                </p>
              )}
              <h3 className="mt-2 font-heading text-xl font-bold leading-tight">{callout.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{callout.description}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
