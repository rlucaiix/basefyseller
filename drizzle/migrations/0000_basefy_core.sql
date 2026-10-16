CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); NEW.version = COALESCE(OLD.version,0) + 1; RETURN NEW; END $$;

CREATE TABLE public.settings (
  user_id uuid PRIMARY KEY,
  display_name text,
  rate_standard numeric(6,4) NOT NULL DEFAULT 0.0499,
  rate_featured numeric(6,4) NOT NULL DEFAULT 0.0749,
  buyer_fee numeric(10,2) NOT NULL DEFAULT 1.00,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'produto' CHECK (kind IN ('produto','dinamico','servico')),
  supplier text,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  sale_cost numeric(12,2) NOT NULL DEFAULT 0,
  competitor_price numeric(12,2),
  price numeric(12,2),
  notes text,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  order_ref text,
  sale_date date NOT NULL DEFAULT current_date,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  modality text NOT NULL DEFAULT 'padrao' CHECK (modality IN ('padrao','destaque')),
  rate numeric(6,4) NOT NULL,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  commission numeric(12,2) NOT NULL,
  profit numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'concluida' CHECK (status IN ('registrada','concluida','cancelada','reembolsada')),
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_sales BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  month text NOT NULL,
  profit_goal numeric(12,2) NOT NULL DEFAULT 0,
  main_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  plan text,
  weeks jsonb NOT NULL DEFAULT '[{},{},{},{}]'::jsonb,
  champion text, worked text, change_next text,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_goals TO authenticated;
GRANT ALL ON public.monthly_goals TO service_role;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.monthly_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_goals BEFORE UPDATE ON public.monthly_goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.delete_my_account() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.sales WHERE user_id = auth.uid();
  DELETE FROM public.monthly_goals WHERE user_id = auth.uid();
  DELETE FROM public.products WHERE user_id = auth.uid();
  DELETE FROM public.settings WHERE user_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;