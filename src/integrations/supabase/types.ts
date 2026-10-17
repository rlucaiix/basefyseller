export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_attempt_limits: {
        Row: {
          attempts: number
          bucket: string
          window_start: string
        }
        Insert: {
          attempts?: number
          bucket: string
          window_start?: string
        }
        Update: {
          attempts?: number
          bucket?: string
          window_start?: string
        }
        Relationships: []
      }
      access_authorizations: {
        Row: {
          active: boolean
          created_at: string
          source: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          source: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      access_key_audit: {
        Row: {
          action: string
          actor_id: string | null
          id: string
          key_id: string | null
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          id?: string
          key_id?: string | null
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          id?: string
          key_id?: string | null
          occurred_at?: string
        }
        Relationships: []
      }
      access_key_tickets: {
        Row: {
          created_at: string
          expires_at: string
          key_id: string
          ticket_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          key_id: string
          ticket_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          key_id?: string
          ticket_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_key_tickets_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "access_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      access_keys: {
        Row: {
          bound_user_id: string | null
          generated_at: string
          generated_by: string
          id: string
          key_hash: string
          registration_email: string | null
          revoked_at: string | null
          status: string
          used_at: string | null
        }
        Insert: {
          bound_user_id?: string | null
          generated_at?: string
          generated_by: string
          id?: string
          key_hash: string
          registration_email?: string | null
          revoked_at?: string | null
          status?: string
          used_at?: string | null
        }
        Update: {
          bound_user_id?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          key_hash?: string
          registration_email?: string | null
          revoked_at?: string | null
          status?: string
          used_at?: string | null
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          champion: string | null
          change_next: string | null
          created_at: string
          id: string
          main_product_id: string | null
          month: string
          plan: string | null
          profit_goal: number
          updated_at: string
          user_id: string
          version: number
          weeks: Json
          worked: string | null
        }
        Insert: {
          champion?: string | null
          change_next?: string | null
          created_at?: string
          id?: string
          main_product_id?: string | null
          month: string
          plan?: string | null
          profit_goal?: number
          updated_at?: string
          user_id?: string
          version?: number
          weeks?: Json
          worked?: string | null
        }
        Update: {
          champion?: string | null
          change_next?: string | null
          created_at?: string
          id?: string
          main_product_id?: string | null
          month?: string
          plan?: string | null
          profit_goal?: number
          updated_at?: string
          user_id?: string
          version?: number
          weeks?: Json
          worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_main_product_id_fkey"
            columns: ["main_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          competitor_price: number | null
          created_at: string
          id: string
          kind: string
          name: string
          notes: string | null
          price: number | null
          sale_cost: number
          supplier: string | null
          unit_cost: number
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          competitor_price?: number | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          price?: number | null
          sale_cost?: number
          supplier?: string | null
          unit_cost?: number
          updated_at?: string
          user_id?: string
          version?: number
        }
        Update: {
          competitor_price?: number | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          price?: number | null
          sale_cost?: number
          supplier?: string | null
          unit_cost?: number
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string
          commission: number
          cost: number
          created_at: string
          id: string
          modality: string
          order_ref: string | null
          price: number
          product_id: string | null
          product_name: string
          profit: number
          rate: number
          sale_date: string
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          client_id: string
          commission: number
          cost?: number
          created_at?: string
          id?: string
          modality?: string
          order_ref?: string | null
          price: number
          product_id?: string | null
          product_name: string
          profit: number
          rate: number
          sale_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Update: {
          client_id?: string
          commission?: number
          cost?: number
          created_at?: string
          id?: string
          modality?: string
          order_ref?: string | null
          price?: number
          product_id?: string | null
          product_name?: string
          profit?: number
          rate?: number
          sale_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          buyer_fee: number
          created_at: string
          display_name: string | null
          goal: string | null
          level: string | null
          nickname: string | null
          onboarded: boolean
          rate_featured: number
          rate_standard: number
          read_chapters: Json
          seller_link: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          buyer_fee?: number
          created_at?: string
          display_name?: string | null
          goal?: string | null
          level?: string | null
          nickname?: string | null
          onboarded?: boolean
          rate_featured?: number
          rate_standard?: number
          read_chapters?: Json
          seller_link?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          buyer_fee?: number
          created_at?: string
          display_name?: string | null
          goal?: string | null
          level?: string | null
          nickname?: string | null
          onboarded?: boolean
          rate_featured?: number
          rate_standard?: number
          read_chapters?: Json
          seller_link?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      access_rate_allowed: {
        Args: { p_bucket: string; p_limit: number; p_seconds: number }
        Returns: boolean
      }
      delete_my_account: { Args: never; Returns: undefined }
      generate_access_keys: { Args: { p_count?: number }; Returns: Json }
      has_app_access: { Args: never; Returns: boolean }
      is_key_admin: { Args: never; Returns: boolean }
      revoke_access_key: { Args: { p_id: string }; Returns: boolean }
      validate_access_key: {
        Args: { p_email?: string; p_intent?: string; p_key: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
