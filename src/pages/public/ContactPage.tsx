import { FileText, Megaphone, RefreshCcw, ShieldAlert, ShieldCheck } from 'lucide-react'

import { ActionLink } from '@/components/common/ActionLink'
import { Container } from '@/components/common/Container'
import { ContentSection } from '@/components/common/ContentSection'
import { PageHeader } from '@/components/common/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

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
        description="Canales oficiales de Prensa Metapán. Información sobre cómo contactar a la redacción cuando estén habilitados."
        path={paths.contact}
      />

      <PageHeader
        kicker="Contacto"
        title="Canales oficiales en habilitación."
        description="Estamos preparando los medios de contacto de la redacción. Esta página se actualizará únicamente con canales verificados."
        breadcrumbs={[
          { label: 'Inicio', to: paths.home },
          { label: 'Contacto' },
        ]}
      />

      <section aria-labelledby="contacto-estado-title">
        <Container className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16 lg:py-16">
          <div className="space-y-10">
            <div className="border border-rule bg-brand-soft/60 p-6">
              <ShieldAlert
                aria-hidden="true"
                size={22}
                strokeWidth={1.6}
                className="text-brand"
              />
              <h2
                id="contacto-estado-title"
                className="mt-3 font-serif text-2xl font-semibold tracking-[-0.02em]"
              >
                Todavía no hay correos, teléfonos ni redes sociales publicados.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Prensa Metapán no ha habilitado canales oficiales de contacto. No inventamos datos
                de atención ni publicamos cuentas no verificadas. Cuando existan, aparecerán en esta
                página con su identificación correspondiente.
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

            <ContentSection title="Cómo se habilitará el contacto">
              <p>
                El formulario de contacto y los canales oficiales se activarán junto con la capa de
                servicios del portal. Antes de recibir mensajes, se definirán el destino de los
                datos, el tiempo de conservación y los responsables de su revisión.
              </p>
              <p>
                No se habilitará ningún formulario que envíe información a un servicio no
                configurado. La prioridad es que cada canal sea real, seguro y verificable.
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
