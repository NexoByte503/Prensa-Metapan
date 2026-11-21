import { ExternalLink, FileText, Mail, Megaphone, MessageCircle, Phone, RefreshCcw, ShieldCheck } from 'lucide-react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { ContentSection } from '@/components/common/ContentSection'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'
import { siteConfig } from '@/config/site'

const contactPurposes = [
  {
    title: 'Información de interés público',
    description:
      'Datos, documentos o testimonios que ayuden a comprender un hecho relevante para la comunidad.',
    icon: Megaphone,
  },
  {
    title: 'Correcciones y aclaraciones',
    description:
      'Solicitudes para revisar un dato publicado. La corrección se documentará de forma visible.',
    icon: RefreshCcw,
  },
  {
    title: 'Contexto y documentos',
    description:
      'Material de apoyo que permita verificar antecedentes, cifras o decisiones públicas.',
    icon: FileText,
  },
] as const

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contacto"
        description={`Contacta a Prensa Metapán por WhatsApp al ${siteConfig.contactPhone.display}, por correo o Facebook.`}
        path={paths.contact}
      />

      <PageHeader
        kicker="Contacto"
        title="Contacta a la redacción."
        description={`Escríbenos por WhatsApp al ${siteConfig.contactPhone.display}, por correo a ${siteConfig.contactEmail} o Facebook.`}
        breadcrumbs={[
          { label: 'Inicio', to: paths.home },
          { label: 'Contacto' },
        ]}
      />

      <section aria-labelledby="contacto-estado-title">
        <Container className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16 lg:py-16">
          <div className="space-y-10">
            <div className="border border-rule bg-brand-soft/60 p-6">
              <Phone
                aria-hidden="true"
                size={22}
                strokeWidth={1.6}
                className="text-brand"
              />
              <h2
                id="contacto-estado-title"
                className="mt-3 font-serif text-2xl font-semibold tracking-[-0.02em]"
              >
                Canales oficiales de contacto
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Comunícate con la redacción por WhatsApp, correo electrónico o Facebook.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <a
                  href={siteConfig.contactWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Escribir por WhatsApp a Prensa Metapán al ${siteConfig.contactPhone.display}`}
                  className="inline-flex min-h-12 items-center gap-2 border border-ink bg-ink px-4 py-3 text-sm font-semibold text-paper transition-colors hover:bg-brand-dark"
                >
                  <MessageCircle aria-hidden="true" size={17} strokeWidth={1.8} />
                  {siteConfig.contactPhone.display}
                </a>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="inline-flex min-h-12 items-center gap-2 border border-rule-strong bg-paper-strong px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
                  Correo electrónico
                </a>
                <a
                  href={siteConfig.contactFacebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 border border-rule-strong bg-paper-strong px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  <ExternalLink aria-hidden="true" size={17} strokeWidth={1.8} />
                  Facebook
                </a>
              </div>
              <p className="mt-3 break-all text-xs text-ink-muted">
                {siteConfig.contactEmail}
              </p>
            </div>

            <section aria-labelledby="motivos-title">
              <h2
                id="motivos-title"
                className="border-t-2 border-ink pt-4 font-serif text-2xl font-semibold tracking-[-0.02em]"
              >
                Qué podrás enviar a la redacción
              </h2>

              <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-3">
                {contactPurposes.map((purpose) => (
                  <div key={purpose.title} className="bg-paper-strong p-5">
                    <purpose.icon
                      aria-hidden="true"
                      size={19}
                      strokeWidth={1.6}
                      className="text-brand"
                    />
                    <h3 className="mt-4 font-serif text-lg font-semibold leading-snug">
                      {purpose.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      {purpose.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <ContentSection title="Cómo comunicarte">
              <p>
                Puedes escribir por WhatsApp al número publicado, enviar un correo o contactarnos
                por Facebook para compartir información, solicitar una corrección o consultar sobre
                el proyecto. Actualmente no hay formulario de contacto.
              </p>
              <p>
                Todo material pasa por un proceso de verificación editorial antes de publicarse.
              </p>
            </ContentSection>

            <ContentSection title="Qué necesitamos para revisar un caso">
              <ul className="list-disc space-y-2 pl-5">
                <li>Una descripción clara de los hechos y su relevancia pública.</li>
                <li>Documentos o fuentes que permitan contrastar la información.</li>
                <li>Un medio de respuesta que puedas verificar.</li>
              </ul>
              <p>
                La recepción de un mensaje no implica publicación inmediata. Todo material pasa por
                un proceso de verificación editorial.
              </p>
            </ContentSection>
          </div>

          <aside className="space-y-8 self-start">
            <div className="bg-night p-5 text-paper">
              <ShieldCheck
                aria-hidden="true"
                size={20}
                strokeWidth={1.6}
                className="text-brand-light"
              />
              <h2 className="mt-3 font-serif text-xl font-semibold">Aviso de seguridad</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Prensa Metapán no solicita pagos, contraseñas ni datos financieros. Desconfía de
                cualquier cuenta o mensaje que use nuestro nombre sin estar publicado en esta
                página.
              </p>
            </div>

            <div className="border-t border-rule pt-4">
              <h2 className="font-serif text-xl font-semibold tracking-[-0.02em]">
                Mientras tanto
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Puedes conocer el propósito del proyecto y los principios que guiarán la cobertura.
              </p>
              <div className="mt-4 space-y-2">
                <ActionLink to={paths.about} variant="secondary" className="w-full">
                  Sobre el proyecto
                </ActionLink>
                <ActionLink to={paths.editorialPolicy} variant="secondary" className="w-full">
                  Política editorial
                </ActionLink>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  )
}
