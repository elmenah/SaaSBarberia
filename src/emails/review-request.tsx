import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Row, Column, Section, Text, Tailwind,
} from "@react-email/components";

interface ReviewRequestEmailProps {
  clientName:      string;
  barbershopName:  string;
  barberName:      string;
  serviceName:     string;
  /** URL de la página de reseña interna (siempre presente) */
  reviewUrl:       string;
  /** URL de Google Reviews — si está presente se muestran dos opciones */
  googleReviewUrl?: string;
}

export default function ReviewRequestEmail({
  clientName      = "Cliente",
  barbershopName  = "La Barbería",
  barberName      = "Tu barbero",
  serviceName     = "Corte",
  reviewUrl       = "#",
  googleReviewUrl,
}: ReviewRequestEmailProps) {
  const hasBoth = Boolean(googleReviewUrl);

  return (
    <Html>
      <Head />
      <Preview>¿Cómo te fue en {barbershopName}? Dejanos tu opinión ⭐</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            {/* Header */}
            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-3xl m-0 mb-1">⭐</Text>
              <Heading className="text-white text-2xl font-bold m-0">{barbershopName}</Heading>
            </Section>

            {/* Cuerpo */}
            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, ¿cómo te fue hoy?
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Acabás de visitar <strong className="text-white">{barbershopName}</strong> con{" "}
                <strong className="text-white">{barberName}</strong> para un{" "}
                <strong className="text-white">{serviceName}</strong>.
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Tu opinión nos ayuda a seguir mejorando. Solo te lleva 30 segundos. 🙏
              </Text>
            </Section>

            {/* CTA — dos opciones si hay Google, una sola si no */}
            {hasBoth ? (
              <>
                <Section className="mb-2 text-center">
                  <Text className="text-[#71717a] text-xs m-0 mb-3 uppercase tracking-wider">
                    ¿Dónde querés dejar tu reseña?
                  </Text>
                </Section>
                <Section className="mb-4">
                  <Row>
                    {/* Google */}
                    <Column className="pr-2">
                      <Button
                        href={googleReviewUrl}
                        className="w-full bg-[#ca8a04] text-black text-sm font-bold px-6 py-4 rounded-xl no-underline text-center block"
                      >
                        Google Maps
                      </Button>
                    </Column>
                    {/* Sitio propio */}
                    <Column className="pl-2">
                      <Button
                        href={reviewUrl}
                        className="w-full text-[#ca8a04] text-sm font-bold px-6 py-4 rounded-xl no-underline text-center block"
                        style={{ border: "1.5px solid #ca8a04", backgroundColor: "transparent" }}
                      >
                        En el sitio
                      </Button>
                    </Column>
                  </Row>
                </Section>
                <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-3 text-center mb-4">
                  <Text className="text-[#525252] text-xs m-0">
                    Las reseñas en Google ayudan a que otros clientes nos encuentren más fácil.
                  </Text>
                </Section>
              </>
            ) : (
              <>
                <Section className="text-center mb-4">
                  <Button
                    href={reviewUrl}
                    className="bg-[#ca8a04] text-black text-sm font-bold px-8 py-4 rounded-xl no-underline"
                  >
                    ⭐ Dejar mi opinión
                  </Button>
                </Section>
                <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-4 text-center mb-4">
                  <Text className="text-[#525252] text-xs m-0">
                    Las reseñas ayudan a otros clientes a elegir con confianza.
                  </Text>
                </Section>
              </>
            )}

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
