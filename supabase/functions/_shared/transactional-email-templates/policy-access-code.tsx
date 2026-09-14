import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'

const SITE_NAME = 'Garanticon'

interface Props {
  codigo?: string
  numero_poliza?: string
  minutos?: number
}

const PolicyAccessCodeEmail = ({ codigo, numero_poliza, minutos }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Código de verificación</Heading>
        <Text style={text}>
          Has solicitado acceder a los datos completos y al contrato de tu póliza
          {numero_poliza ? ` ${numero_poliza}` : ''}. Introduce este código para continuar:
        </Text>
        <Section>
          <Text style={code}>{codigo || '------'}</Text>
        </Section>
        <Text style={text}>
          El código caduca en {minutos ?? 10} minutos y solo puede usarse una vez.
          Si no has solicitado este acceso, ignora este mensaje.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f6f6f6', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '32px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1C1C2E' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#333333' }
const code = {
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  color: '#F97316',
  textAlign: 'center' as const,
}
const hr = { borderColor: '#e6e6e6', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#888888' }

export const template = {
  component: PolicyAccessCodeEmail,
  subject: 'Tu código de verificación — Garanticon',
  displayName: 'Código de acceso a póliza',
  previewData: { codigo: '123456', numero_poliza: 'GC-202601-0001', minutos: 10 },
}
