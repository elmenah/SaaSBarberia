import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface ReengagementEmailProps {
  clientName:     string;
  barbershopName: string;
  daysSinceVisit: number;
  bookingUrl?:    string;
}

export default function ReengagementEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  daysSinceVisit = 30,
  bookingUrl,
}: ReengagementEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Te extrañamos en {barbershopName} — ¡volvé cuando quieras! 💈</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-3xl m-0 mb-1">💈</Text>
              <Heading className="text-white text-2xl font-bold m-0">{barbershopName}</Heading>
            </Section>

            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, hace {daysSinceVisit} días que no te vemos.
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Te extrañamos en {barbershopName}. Si necesitás un corte o simplemente arreglarte,
                ya sabés dónde estamos. 😊
              </Text>
            </Section>

            {bookingUrl && (
              <Section className="text-center mb-4">
                <Button href={bookingUrl}
                  className="bg-[#ca8a04] text-black text-sm font-bold px-8 py-4 rounded-xl no-underline">
                  Reservar mi turno
                </Button>
              </Section>
            )}

            <Section className="text-center">
              <Text className="text-[#525252] text-xs m-0">
                Si no querés recibir más emails, ignorá este mensaje.
              </Text>
              <Text className="text-[#525252] text-xs m-0 mt-2">
                Powered by <strong className="text-[#737373]">BarberOS</strong>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
