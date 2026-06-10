import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface AppointmentConfirmationEmailProps {
  clientName:     string;
  barbershopName: string;
  barbershopAddress?: string;
  barberName:     string;
  serviceName:    string;
  startsAt:       Date | string;
  totalPrice:     number;
  bookingUrl?:    string;
  timezone?:      string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-419", {
    style:                 "currency",
    currency:              "CLP",
    minimumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: Date | string, tz = "America/Santiago") => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-419", {
    weekday:  "long",
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    timeZone: tz,
  });
};

const fmtTime = (d: Date | string, tz = "America/Santiago") => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit", timeZone: tz });
};

export default function AppointmentConfirmationEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  barbershopAddress,
  barberName     = "Tu barbero",
  serviceName    = "Corte",
  startsAt       = new Date(),
  totalPrice     = 0,
  bookingUrl,
  timezone       = "America/Santiago",
}: AppointmentConfirmationEmailProps) {
  const preview = `Reserva confirmada en ${barbershopName} — ${fmtDate(startsAt, timezone)} a las ${fmtTime(startsAt, timezone)}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            {/* Header */}
            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-3xl m-0 mb-1">💈</Text>
              <Heading className="text-white text-2xl font-bold m-0 mb-1">
                {barbershopName}
              </Heading>
            </Section>

            {/* Confirmación badge */}
            <Section className="bg-[#052e16] border border-[#16a34a] rounded-xl px-6 py-4 mb-4 text-center">
              <Text className="text-[#4ade80] text-base font-semibold m-0">
                ✅ Reserva confirmada
              </Text>
            </Section>

            {/* Saludo */}
            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, estos son los detalles de tu reserva:
              </Text>
            </Section>

            {/* Detalles del turno */}
            <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-6 mb-4">
              <Heading className="text-white text-base font-semibold m-0 mb-4">
                Resumen:
              </Heading>

              <Row className="mb-3">
                <Column className="w-6 pr-3">
                  <Text className="text-base m-0">📅</Text>
                </Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Fecha</Text>
                  <Text className="text-white text-sm font-medium m-0 capitalize">
                    {fmtDate(startsAt, timezone)}
                  </Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-6 pr-3">
                  <Text className="text-base m-0">🕐</Text>
                </Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Hora</Text>
                  <Text className="text-white text-sm font-medium m-0">
                    {fmtTime(startsAt, timezone)}
                  </Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-6 pr-3">
                  <Text className="text-base m-0">💈</Text>
                </Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Barbero</Text>
                  <Text className="text-white text-sm font-medium m-0">
                    {barberName}
                  </Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-6 pr-3">
                  <Text className="text-base m-0">✂️</Text>
                </Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Servicio</Text>
                  <Text className="text-white text-sm font-medium m-0">
                    {serviceName}
                  </Text>
                </Column>
              </Row>

              {barbershopAddress && (
                <Row className="mb-3">
                  <Column className="w-6 pr-3">
                    <Text className="text-base m-0">📍</Text>
                  </Column>
                  <Column>
                    <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Dirección</Text>
                    <Text className="text-white text-sm font-medium m-0">
                      {barbershopAddress}
                    </Text>
                  </Column>
                </Row>
              )}

              <Hr className="border-[#1f1f1f] my-4" />

              <Row>
                <Column>
                  <Text className="text-[#a3a3a3] text-sm m-0">Total</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-white text-lg font-bold m-0">
                    {fmt(totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* CTA */}
            {bookingUrl && (
              <Section className="text-center mb-4">
                <Button
                  href={bookingUrl}
                  className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-xl no-underline"
                >
                  Reservar otro turno
                </Button>
              </Section>
            )}

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[#525252] text-xs m-0">
                Si necesitás cancelar, comunicate con {barbershopName}.
              </Text>
              <Text className="text-[#525252] text-xs m-0 mt-2">
                Powered by <strong className="text-[#737373]">Mibarberia</strong>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
