import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface LoyaltyRewardEmailProps {
  clientName:     string;
  barbershopName: string;
  totalVisits:    number;
  bookingUrl?:    string;
}

export default function LoyaltyRewardEmail({
  clientName     = "Cliente",
  barbershopName = "La Barbería",
  totalVisits    = 5,
  bookingUrl,
}: LoyaltyRewardEmailProps) {
  const isFreecut   = totalVisits % 5 === 0 && totalVisits % 10 !== 0;
  const isDiscount  = totalVisits % 10 === 0;

  const emoji   = isDiscount ? "🎁" : "🎉";
  const reward  = isDiscount
    ? "¡Corte número 10 — descuento especial!"
    : "¡Corte número 5 — el próximo es gratis!";
  const detail  = isDiscount
    ? "Por ser un cliente fiel, tu próxima visita tiene un descuento especial. Presentá este email al llegar."
    : "Completaste 5 cortes. Tu próxima visita es completamente gratis. Presentá este email al llegar.";

  return (
    <Html>
      <Head />
      <Preview>{emoji} {reward} — {barbershopName}</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[560px]">

            <Section className="bg-[#111111] rounded-2xl px-8 py-8 mb-4 text-center border border-[#1f1f1f]">
              <Text className="text-4xl m-0 mb-2">{emoji}</Text>
              <Heading className="text-white text-2xl font-bold m-0">{barbershopName}</Heading>
            </Section>

            <Section className="bg-[#1c1400] border border-[#ca8a04] rounded-xl px-6 py-5 mb-4 text-center">
              <Text className="text-[#fbbf24] text-lg font-bold m-0">{reward}</Text>
            </Section>

            <Section className="mb-4">
              <Text className="text-white text-base m-0">
                Hola <strong>{clientName}</strong>, ¡gracias por tu fidelidad!
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">
                Llevas <strong className="text-white">{totalVisits} visitas</strong> en {barbershopName}.
              </Text>
              <Text className="text-[#a3a3a3] text-sm m-0 mt-2">{detail}</Text>
            </Section>

            {bookingUrl && (
              <Section className="text-center mb-4">
                <Button href={bookingUrl}
                  className="bg-[#ca8a04] text-black text-sm font-bold px-8 py-4 rounded-xl no-underline">
                  Reservar mi turno gratis
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
