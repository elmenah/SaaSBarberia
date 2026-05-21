import {
  Body,
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

interface NewAppointmentOwnerEmailProps {
  barbershopName: string;
  clientName:     string;
  clientPhone:    string;
  clientEmail?:   string | null;
  barberName:     string;
  serviceName:    string;
  startsAt:       Date | string;
  totalPrice:     number;
  source:         string; // "web" | "manual"
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style:                 "currency",
    currency:              "ARS",
    minimumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
};

const fmtTime = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
};

const sourceLabel = (s: string) => (s === "web" ? "Reserva online" : "Cargada manualmente");

export default function NewAppointmentOwnerEmail({
  barbershopName = "La Barbería",
  clientName     = "Cliente",
  clientPhone    = "",
  clientEmail,
  barberName     = "Barbero",
  serviceName    = "Servicio",
  startsAt       = new Date(),
  totalPrice     = 0,
  source         = "web",
}: NewAppointmentOwnerEmailProps) {
  const preview = `Nueva reserva de ${clientName} — ${fmtDate(startsAt)} a las ${fmtTime(startsAt)}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            {/* Header */}
            <Section className="bg-[#111111] rounded-2xl px-8 py-6 mb-4 border border-[#1f1f1f]">
              <Text className="text-[#a3a3a3] text-xs uppercase tracking-widest m-0 mb-1">
                {barbershopName}
              </Text>
              <Heading className="text-white text-xl font-bold m-0">
                Nueva reserva recibida 🎉
              </Heading>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-1">
                {sourceLabel(source)}
              </Text>
            </Section>

            {/* Turno */}
            <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-6 mb-4">
              <Heading className="text-white text-sm font-semibold m-0 mb-4 uppercase tracking-wider">
                Detalles del turno
              </Heading>

              <Row className="mb-3">
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Fecha</Text>
                  <Text className="text-white text-sm font-medium m-0 capitalize">{fmtDate(startsAt)}</Text>
                </Column>
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Hora</Text>
                  <Text className="text-white text-sm font-medium m-0">{fmtTime(startsAt)}</Text>
                </Column>
              </Row>

              <Row className="mb-3">
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Barbero</Text>
                  <Text className="text-white text-sm font-medium m-0">{barberName}</Text>
                </Column>
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Servicio</Text>
                  <Text className="text-white text-sm font-medium m-0">{serviceName}</Text>
                </Column>
              </Row>

              <Hr className="border-[#1f1f1f] my-4" />

              <Row>
                <Column>
                  <Text className="text-[#737373] text-sm m-0">Total</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-white text-base font-bold m-0">{fmt(totalPrice)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Cliente */}
            <Section className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-6 py-6 mb-4">
              <Heading className="text-white text-sm font-semibold m-0 mb-4 uppercase tracking-wider">
                Datos del cliente
              </Heading>

              <Row className="mb-3">
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Nombre</Text>
                  <Text className="text-white text-sm font-medium m-0">{clientName}</Text>
                </Column>
                <Column className="w-[50%]">
                  <Text className="text-[#737373] text-xs m-0">Teléfono</Text>
                  <Text className="text-white text-sm font-medium m-0">{clientPhone}</Text>
                </Column>
              </Row>

              {clientEmail && (
                <Row>
                  <Column>
                    <Text className="text-[#737373] text-xs m-0">Email</Text>
                    <Text className="text-white text-sm font-medium m-0">{clientEmail}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[#525252] text-xs m-0">
                Gestiona este turno desde tu dashboard de Mibarberia.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
