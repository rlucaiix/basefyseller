import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hasAuthorizedAccess } from "./access-keys";

// Only cache an Auth-server-validated identity, never a local session claim.
export function navigationUser(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    queryKey: ["navigation-user"],
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (["session_not_found", "session_expired", "refresh_token_not_found", "refresh_token_already_used"].includes(error.code ?? "") || error.name === "AuthSessionMissingError") return null;
        throw error;
      }
      if (data.user && !(await hasAuthorizedAccess())) return null;
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