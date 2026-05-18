import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface ReviewRequestEmailProps {
  clientName:     string;
  barbershopName: string;
  barberName:     string;
  serviceName:    string;
  reviewUrl:      string;
}

export default function ReviewRequestEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  barberName     = "Tu barbero",
  serviceName    = "Corte",
  reviewUrl      = "#",
}: ReviewRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>¿Cómo te fue en {barbershopName}? Dejanos tu opinión ⭐</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-3xl m-0 mb-1">⭐</Text>
              <Heading className="text-white text-2xl font-bold m-0">{barbershopName}</Heading>
            </Section>

            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, ¿cómo te fue hoy?
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Acabás de visitar <strong className="text-white">{barbershopName}</strong> con{" "}
                <strong className="text-white">{barberName}</strong> para un <strong className="text-white">{serviceName}</strong>.
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Tu opinión nos ayuda a seguir mejorando. Solo te lleva 30 segundos. 🙏
              </Text>
            </Section>

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

            <Section className="text-center">
              <Text className="text-[#525252] text-xs m-0">
                Powered by <strong className="text-[#737373]">BarberOS</strong>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
