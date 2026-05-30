import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Button,
  Tailwind,
} from "@react-email/components";

interface AppointmentCancelledEmailProps {
  clientName:     string;
  barbershopName: string;
  barberName:     string;
  serviceName:    string;
  startsAt:       Date | string;
  cancelReason?:  string;
  bookingUrl?:    string;
}

const TZ = "America/Santiago";

const fmtDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-419", {
    weekday:  "long",
    day:      "numeric",
    month:    "long",
    timeZone: TZ,
  });
};

const fmtTime = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
};

export default function AppointmentCancelledEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  barberName     = "Tu barbero",
  serviceName    = "Corte",
  startsAt       = new Date(),
  cancelReason,
  bookingUrl,
}: AppointmentCancelledEmailProps) {
  const preview = `Tu turno en ${barbershopName} fue cancelado`;

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

            {/* Alerta cancelación */}
            <Section className="bg-[#1c0a0a] border border-[#dc2626] rounded-xl px-6 py-4 mb-4 text-center">
              <Text className="text-[#f87171] text-base font-semibold m-0">
                ❌ Reserva Cancelada
              </Text>
            </Section>

            {/* Saludo */}
            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, tu reserva fue cancelada:
              </Text>
            </Section>

            {/* Detalles */}
            <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-6 mb-4">
              <Row className="mb-3">
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Fecha</Text>
                  <Text className="text-[#a3a3a3] text-sm font-medium m-0 line-through capitalize">
                    {fmtDate(startsAt)}
                  </Text>
                </Column>
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Hora</Text>
                  <Text className="text-[#a3a3a3] text-sm font-medium m-0 line-through">
                    {fmtTime(startsAt)}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Barbero</Text>
                  <Text className="text-[#a3a3a3] text-sm font-medium m-0">{barberName}</Text>
                </Column>
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Servicio</Text>
                  <Text className="text-[#a3a3a3] text-sm font-medium m-0">{serviceName}</Text>
                </Column>
              </Row>

              {cancelReason && (
                <>
                  <Section className="border-t border-[#1f1f1f] mt-4 pt-4">
                    <Text className="text-[#737373] text-xs m-0">Motivo</Text>
                    <Text className="text-white text-sm m-0">{cancelReason}</Text>
                  </Section>
                </>
              )}
            </Section>

            {/* CTA */}
            {bookingUrl && (
              <Section className="text-center mb-4">
                <Text className="text-[#a3a3a3] text-sm m-0 mb-3">
                  ¿Querés reservar otro turno?
                </Text>
                <Button
                  href={bookingUrl}
                  className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-xl no-underline"
                >
                  Reservar nuevo turno
                </Button>
              </Section>
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
