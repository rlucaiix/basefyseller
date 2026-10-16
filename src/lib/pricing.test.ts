import { describe, it, expect } from "vitest";
import { commission, profit, breakEvenPrice, priceForProfit, priceForMargin, salesForGoal, summarize, parseMoney, marginPct } from "./pricing";

describe("regras financeiras", () => {
  it("R$ 14,90, custo R$ 5,00, 4,99%: comissão 0,74 e lucro 9,16", () => {
    expect(commission(14.9, 0.0499)).toBe(0.74);
    expect(profit(14.9, 0.0499, 5)).toBe(9.16);
    expect(Math.round(marginPct(14.9, 0.0499, 5)!)).toBe(61);
  });
  it("mesmo produto com destaque 7,49% recalcula", () => {
    expect(commission(14.9, 0.0749)).toBe(1.12);
    expect(profit(14.9, 0.0749, 5)).toBe(8.78);
  });
  it("produto próprio R$ 19,90: lucro 18,91", () => {
    expect(profit(19.9, 0.0499, 0)).toBe(18.91);
  });
  it("preço mínimo arredonda para cima sem prejuízo", () => {
    expect(breakEvenPrice(5, 0.0499)).toBe(5.27);
    expect(breakEvenPrice(1, 0.0499)).toBe(1.06);
    expect(profit(breakEvenPrice(5, 0.0499)!, 0.0499, 5)).toBeGreaterThanOrEqual(0);
  });
  it("preço para lucro desejado garante o lucro", () => {
    const p = priceForProfit(5, 10, 0.0499)!;
    expect(profit(p, 0.0499, 5)).toBeGreaterThanOrEqual(10);
  });
  it("margem impossível retorna null", () => {
    expect(priceForMargin(5, 0.96, 0.0499)).toBeNull();
  });
  it("vendas para meta arredonda para cima e exige lucro positivo", () => {
    expect(salesForGoal(1000, 9.16)).toBe(110);
    expect(salesForGoal(1000, 0)).toBeNull();
  });
  it("venda cancelada não entra na receita; reembolso perde comissão e custo", () => {
    const base = { modality: "padrao" as const, product_name: "X" };
    const s = summarize([
      { ...base, price: 14.9, commission: 0.74, cost: 5, profit: 9.16, status: "concluida" },
      { ...base, price: 14.9, commission: 0.74, cost: 5, profit: 9.16, status: "cancelada" },
      { ...base, price: 14.9, commission: 0.74, cost: 5, profit: 9.16, status: "reembolsada" },
    ]);
    expect(s.revenue).toBe(14.9);
    expect(s.count).toBe(1);
    expect(s.profit).toBe(3.42);
  });
  it("aceita vírgula decimal", () => {
    expect(parseMoney("14,90")).toBe(14.9);
    expect(parseMoney("1.234,56")).toBe(1234.56);
    expect(parseMoney("abc")).toBeNull();
  });
});
