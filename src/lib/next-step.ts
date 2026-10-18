export type NextStepKey = "catalog" | "price" | "goal" | "sale" | "closing";

export type NextStep = {
  key: NextStepKey;
  title: string;
  text: string;
  to: "/produtos" | "/meta" | "/vendas" | "/fechamento";
  cta: string;
  search?: { id: string };
};

export type NextStepInput = {
  hasProducts: boolean;
  unpriced: { id: string; name: string } | null;
  hasGoal: boolean;
  hasMonthSales: boolean;
};

/**
 * Ordem dos passos sugeridos na home: só entram os que ainda faltam, e o
 * fechamento sempre fecha a lista — por isso a lista nunca fica vazia.
 */
export function nextStepFlow(input: NextStepInput): NextStep[] {
  const flow: NextStep[] = [];

  if (!input.hasProducts) {
    flow.push({
      key: "catalog",
      title: "Cadastre seu primeiro produto",
      text: "Comece pela ficha de precificação: custo, preço e lucro.",
      to: "/produtos",
      cta: "Cadastrar produto",
    });
  }

  if (input.hasProducts && input.unpriced) {
    flow.push({
      key: "price",
      title: `Defina o preço de “${input.unpriced.name}”`,
      text: "Sem preço não dá para saber o lucro nem a meta.",
      to: "/produtos",
      cta: "Abrir ficha",
      search: { id: input.unpriced.id },
    });
  }

  if (!input.hasGoal) {
    flow.push({
      key: "goal",
      title: "Defina a meta de lucro do mês",
      text: "Descubra quantas vendas por dia você precisa.",
      to: "/meta",
      cta: "Definir meta",
    });
  }

  if (!input.hasMonthSales) {
    flow.push({
      key: "sale",
      title: "Registre sua primeira venda do mês",
      text: "Cada venda alimenta a meta e o fechamento.",
      to: "/vendas",
      cta: "Registrar venda",
    });
  }

  flow.push({
    key: "closing",
    title: "Acompanhe o fechamento",
    text: "Veja o que está funcionando e o produto campeão.",
    to: "/fechamento",
    cta: "Ver fechamento",
  });

  return flow;
}

/** Passo mostrado para um salto: começa no primeiro e trava no último. */
export function pickStep(
  flow: NextStep[],
  skip: number,
): { step: NextStep; index: number; canSkip: boolean } {
  const index = Math.max(0, Math.min(skip, flow.length - 1));
  const step = flow[index] ?? flow[flow.length - 1];
  if (!step) throw new Error("nextStepFlow não pode retornar lista vazia");
  return { step, index, canSkip: index < flow.length - 1 };
}
