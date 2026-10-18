import { describe, expect, it } from "vitest";

import { nextStepFlow, pickStep } from "./next-step";

const empty = { hasProducts: false, unpriced: null, hasGoal: false, hasMonthSales: false };

describe("nextStepFlow", () => {
  it("sempre termina no fechamento", () => {
    expect(nextStepFlow(empty).at(-1)?.key).toBe("closing");
    expect(
      nextStepFlow({ hasProducts: true, unpriced: null, hasGoal: true, hasMonthSales: true }).at(-1)?.key,
    ).toBe("closing");
  });

  it("começa no cadastro e não oferece preço quando não há produtos", () => {
    const flow = nextStepFlow({ ...empty, unpriced: { id: "p1", name: "Caneca" } });
    expect(flow[0]?.key).toBe("catalog");
    expect(flow.map((s) => s.key)).not.toContain("price");
  });

  it("oferece a ficha do produto sem preço com o id daquela ficha", () => {
    const flow = nextStepFlow({ ...empty, hasProducts: true, unpriced: { id: "p1", name: "Caneca" } });
    expect(flow[0]?.key).toBe("price");
    expect(flow[0]?.search).toEqual({ id: "p1" });
  });

  it("deixa de sugerir meta e venda quando já existem", () => {
    const flow = nextStepFlow({
      ...empty,
      hasProducts: true,
      hasGoal: true,
      hasMonthSales: true,
    });
    expect(flow.map((s) => s.key)).toEqual(["closing"]);
  });
});

describe("pickStep", () => {
  const flow = nextStepFlow({ ...empty, hasProducts: true, hasGoal: true }); // venda, fechamento

  it("começa no primeiro passo e permite pular", () => {
    expect(pickStep(flow, 0)).toMatchObject({ index: 0, step: { key: "sale" }, canSkip: true });
  });

  it("avança exatamente um passo por clique", () => {
    expect(pickStep(flow, 1)).toMatchObject({ index: 1, step: { key: "closing" }, canSkip: false });
  });

  it("trava no último passo se pular além do fim", () => {
    expect(pickStep(flow, 99)).toMatchObject({ index: 1, step: { key: "closing" }, canSkip: false });
  });
});
