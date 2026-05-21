import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface BirthdayEmailProps {
  clientName:     string;
  barbershopName: string;
  bookingUrl?:    string;
}

export default function BirthdayEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  bookingUrl,
}: BirthdayEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>🎂 ¡Feliz cumpleaños, {clientName}! Un regalo de {barbershopName}</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-4xl m-0 mb-2">🎂</Text>
              <Heading className="text-white text-2xl font-bold m-0">{barbershopName}</Heading>
            </Section>

            <Section className="bg-[#1c1400] border border-[#ca8a04] rounded-xl px-6 py-5 mb-4 text-center">
              <Text className="text-[#fbbf24] text-lg font-bold m-0">¡Feliz cumpleaños!</Text>
            </Section>

            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, ¡hoy es tu día especial!
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Todo el equipo de <strong className="text-white">{barbershopName}</strong> te desea un muy feliz cumpleaños.
                Como regalo, te ofrecemos un descuento especial en tu próxima visita. 🎁
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Presentá este email al llegar y el descuento se aplica automáticamente.
              </Text>
            </Section>

            {bookingUrl && (
              <Section className="text-center mb-4">
                <Button href={bookingUrl}
                  className="bg-[#ca8a04] text-black text-sm font-bold px-8 py-4 rounded-xl no-underline">
                  Reservar mi turno de cumpleaños
                </Button>
              </Section>
            )}

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
