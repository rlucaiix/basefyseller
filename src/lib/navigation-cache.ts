import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Only cache an Auth-server-validated identity, never a local session claim.
export function navigationUser(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    queryKey: ["navigation-user"],
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
}

export function navigationProfile(queryClient: QueryClient, userId: string) {
  return queryClient.fetchQuery({
    queryKey: ["navigation-profile", userId],
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("onboarded").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}