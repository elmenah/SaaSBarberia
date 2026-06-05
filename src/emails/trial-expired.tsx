import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface TrialExpiredEmailProps {
  ownerName:      string;
  barbershopName: string;
  billingUrl:     string;
}

export default function TrialExpiredEmail({
  ownerName      = "Hola",
  barbershopName = "Tu barbería",
  billingUrl     = "#",
}: TrialExpiredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu prueba gratuita de Mibarberia venció — elige tu plan para seguir</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            {/* Header */}
            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-3xl m-0 mb-1">💈</Text>
              <Heading className="text-white text-2xl font-bold m-0">
                Mibarberia
              </Heading>
            </Section>

            {/* Mensaje principal */}
            <Section className="bg-[#1a0a0a] border border-[#3f1f1f] rounded-xl px-6 py-5 mb-4">
              <Text className="text-[#f87171] text-base font-semibold m-0 mb-1">
                ⏰ Tu prueba gratuita venció
              </Text>
              <Text className="text-[#a1a1aa] text-sm m-0">
                El período de prueba de <strong className="text-white">{barbershopName}</strong> finalizó.
                Tu cuenta pasó al plan gratuito con funciones limitadas.
              </Text>
            </Section>

            {/* Saludo */}
            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{ownerName}</strong>, para seguir recibiendo WhatsApps automáticos,
                recordatorios y todos los beneficios de Mibarberia, elegí tu plan:
              </Text>
            </Section>

            {/* Qué se pierde */}
            <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-5 mb-6">
              <Text className="text-white text-sm font-semibold m-0 mb-3">
                Con el plan gratuito ya no tenés:
              </Text>
              {[
                "❌  WhatsApp de confirmación al agendar",
                "❌  Recordatorios automáticos 24h y 1h antes",
                "❌  Campañas de reactivación de clientes",
                "❌  Más de 1 barbero en tu equipo",
              ].map((item) => (
                <Text key={item} className="text-[#71717a] text-sm m-0 mb-1">
                  {item}
                </Text>
              ))}
            </Section>

            {/* CTA */}
            <Section className="text-center mb-6">
              <Button
                href={billingUrl}
                className="bg-[#CA8A04] text-black text-sm font-bold px-8 py-3 rounded-xl no-underline"
              >
                Elegir mi plan →
              </Button>
            </Section>

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[#525252] text-xs m-0">
                Powered by <strong className="text-[#737373]">Mibarberia</strong>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
