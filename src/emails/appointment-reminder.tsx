import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Row, Column, Section, Text, Tailwind,
} from "@react-email/components";

interface AppointmentReminderEmailProps {
  clientName:     string;
  barbershopName: string;
  barbershopAddress?: string;
  barberName:     string;
  serviceName:    string;
  startsAt:       Date | string;
  totalPrice:     number;
  bookingUrl?:    string;
  confirmUrl?:    string;
  cancelUrl?:     string;
  hoursAhead:     number; // 24 o 1
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-419", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);

const TZ = "America/Santiago";

const fmtDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-419", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
};

const fmtTime = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
};

export default function AppointmentReminderEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  barbershopAddress,
  barberName     = "Tu barbero",
  serviceName    = "Corte",
  startsAt       = new Date(),
  totalPrice     = 0,
  bookingUrl,
  confirmUrl,
  cancelUrl,
  hoursAhead     = 24,
}: AppointmentReminderEmailProps) {
  const isOneHour = hoursAhead === 1;
  const preview   = isOneHour
    ? `⏰ Tu turno en ${barbershopName} es en 1 hora — ${fmtTime(startsAt)}`
    : `📅 Recordatorio: tu turno en ${barbershopName} es mañana`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-3xl m-0 mb-1">💈</Text>
              <Heading className="text-white text-2xl font-bold m-0 mb-1">{barbershopName}</Heading>
            </Section>

            <Section className="bg-[#1c1400] border border-[#ca8a04] rounded-xl px-6 py-4 mb-4 text-center">
              <Text className="text-[#fbbf24] text-base font-semibold m-0">
                {isOneHour ? "⏰ Tu turno es en 1 hora" : "📅 Recordatorio — tu turno es mañana"}
              </Text>
            </Section>

            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, te recordamos que tienes un turno próximamente:
              </Text>
            </Section>

            <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-6 mb-4">
              <Row className="mb-3">
                <Column className="w-6 pr-3"><Text className="text-base m-0">📅</Text></Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Fecha</Text>
                  <Text className="text-white text-sm font-medium m-0 capitalize">{fmtDate(startsAt)}</Text>
                </Column>
              </Row>
              <Row className="mb-3">
                <Column className="w-6 pr-3"><Text className="text-base m-0">🕐</Text></Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Hora</Text>
                  <Text className="text-white text-sm font-medium m-0">{fmtTime(startsAt)}</Text>
                </Column>
              </Row>
              <Row className="mb-3">
                <Column className="w-6 pr-3"><Text className="text-base m-0">💈</Text></Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Barbero</Text>
                  <Text className="text-white text-sm font-medium m-0">{barberName}</Text>
                </Column>
              </Row>
              <Row className="mb-3">
                <Column className="w-6 pr-3"><Text className="text-base m-0">✂️</Text></Column>
                <Column>
                  <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Servicio</Text>
                  <Text className="text-white text-sm font-medium m-0">{serviceName}</Text>
                </Column>
              </Row>
              {barbershopAddress && (
                <Row className="mb-3">
                  <Column className="w-6 pr-3"><Text className="text-base m-0">📍</Text></Column>
                  <Column>
                    <Text className="text-[#a3a3a3] text-xs m-0 uppercase tracking-wider">Dirección</Text>
                    <Text className="text-white text-sm font-medium m-0">{barbershopAddress}</Text>
                  </Column>
                </Row>
              )}
              <Hr className="border-[#1f1f1f] my-4" />
              <Row>
                <Column><Text className="text-[#a3a3a3] text-sm m-0">Total</Text></Column>
                <Column className="text-right">
                  <Text className="text-white text-lg font-bold m-0">{fmt(totalPrice)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Botones confirmar / cancelar */}
            {(confirmUrl || cancelUrl) && (
              <Section className="mb-4">
                <Row>
                  {confirmUrl && (
                    <Column className="pr-2">
                      <Button
                        href={confirmUrl}
                        className="w-full bg-[#CA8A04] text-black text-sm font-semibold px-4 py-3 rounded-xl no-underline text-center block"
                      >
                        ✅ Sí, confirmar
                      </Button>
                    </Column>
                  )}
                  {cancelUrl && (
                    <Column className="pl-2">
                      <Button
                        href={cancelUrl}
                        className="w-full bg-[#1c1c1c] text-[#ef4444] text-sm font-semibold px-4 py-3 rounded-xl no-underline text-center block border border-[#3f1212]"
                      >
                        ❌ No puedo ir
                      </Button>
                    </Column>
                  )}
                </Row>
              </Section>
            )}

            {bookingUrl && !confirmUrl && (
              <Section className="text-center mb-4">
                <Button href={bookingUrl}
                  className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-xl no-underline">
                  Reservar otro turno
                </Button>
              </Section>
            )}

            <Section className="text-center">
              <Text className="text-[#525252] text-xs m-0">
                Si no puedes asistir, por favor cancela con anticipación para liberar el turno.
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
