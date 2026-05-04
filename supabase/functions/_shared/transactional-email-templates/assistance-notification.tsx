import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Garanticon'

interface AssistanceNotificationProps {
  nombre?: string
  telefono?: string
  email?: string
  matricula?: string
  numero_poliza?: string
  tipo?: string
  descripcion?: string
}

const AssistanceNotificationEmail = ({
  nombre,
  telefono,
  email,
  matricula,
  numero_poliza,
  tipo,
  descripcion,
}: AssistanceNotificationProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Nueva consulta de asistencia en {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nueva consulta de asistencia</Heading>
        <Text style={text}>
          Se ha recibido una nueva solicitud desde el formulario de asistencia de {SITE_NAME}.
        </Text>
        <Hr style={hr} />
        <Section>
          <Text style={row}><strong>Tipo:</strong> {tipo || '—'}</Text>
          <Text style={row}><strong>Nombre:</strong> {nombre || '—'}</Text>
          <Text style={row}><strong>Teléfono:</strong> {telefono || '—'}</Text>
          <Text style={row}><strong>Email:</strong> {email || '—'}</Text>
          <Text style={row}><strong>Matrícula:</strong> {matricula || '—'}</Text>
          <Text style={row}><strong>Nº póliza:</strong> {numero_poliza || '—'}</Text>
        </Section>
        <Hr style={hr} />
        <Heading as="h2" style={h2}>Mensaje</Heading>
        <Text style={message}>{descripcion || '—'}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AssistanceNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Nueva consulta (${data?.tipo || 'general'}) — ${data?.nombre || 'Garanticon'}`,
  to: 'info@garanticon.es',
  displayName: 'Aviso interno de asistencia',
  previewData: {
    nombre: 'Juan Pérez',
    telefono: '600123456',
    email: 'cliente@example.com',
    matricula: '1234ABC',
    numero_poliza: 'GC-202605-0001',
    tipo: 'averia',
    descripcion: 'Ruido extraño en el motor al arrancar en frío.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0a0a0a', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: 'bold', color: '#0a0a0a', margin: '16px 0 8px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.5', margin: '0 0 12px' }
const row = { fontSize: '14px', color: '#222', margin: '6px 0' }
const message = { fontSize: '14px', color: '#222', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#eaeaea', margin: '16px 0' }