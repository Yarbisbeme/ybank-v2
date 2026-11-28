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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          card_base: string
          card_finish: string
          card_shape_intensity: number
          color: string | null
          color_secondary: string | null
          created_at: string | null
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          current_balance: number | null
          custom_pattern: Database["public"]["Enums"]["custom_pattern"] | null
          custom_text_theme:
            | Database["public"]["Enums"]["custom_text_theme"]
            | null
          cutoff_day: number | null
          expiry_date: string | null
          id: string
          initial_balance: number
          institution_id: string | null
          is_active: boolean | null
          last_4_digits: string | null
          name: string
          network: string | null
          payoff_day: number | null
          savings_goal: number | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_base?: string
          card_finish?: string
          card_shape_intensity?: number
          color?: string | null
          color_secondary?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          current_balance?: number | null
          custom_pattern?: Database["public"]["Enums"]["custom_pattern"] | null
          custom_text_theme?:
            | Database["public"]["Enums"]["custom_text_theme"]
            | null
          cutoff_day?: number | null
          expiry_date?: string | null
          id?: string
          initial_balance?: number
          institution_id?: string | null
          is_active?: boolean | null
          last_4_digits?: string | null
          name: string
          network?: string | null
          payoff_day?: number | null
          savings_goal?: number | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_base?: string
          card_finish?: string
          card_shape_intensity?: number
          color?: string | null
          color_secondary?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_code"] | null
          current_balance?: number | null
          custom_pattern?: Database["public"]["Enums"]["custom_pattern"] | null
          custom_text_theme?:
            | Database["public"]["Enums"]["custom_text_theme"]
            | null
          cutoff_day?: number | null
          expiry_date?: string | null
          id?: string
          initial_balance?: number
          institution_id?: string | null
          is_active?: boolean | null
          last_4_digits?: string | null
          name?: string
          network?: string | null
          payoff_day?: number | null
          savings_goal?: number | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          brand_color_primary: string | null
          brand_color_secondary: string | null
          card_pattern: Database["public"]["Enums"]["custom_pattern"] | null
          created_at: string | null
          exchange_rate_adjustment: number | null
          exchange_rate_buy_adjustment: number | null
          id: string
          logo_url: string | null
          name: string
          text_theme: Database["public"]["Enums"]["custom_text_theme"] | null
        }
        Insert: {
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          card_pattern?: Database["public"]["Enums"]["custom_pattern"] | null
          created_at?: string | null
          exchange_rate_adjustment?: number | null
          exchange_rate_buy_adjustment?: number | null
          id?: string
          logo_url?: string | null
          name: string
          text_theme?: Database["public"]["Enums"]["custom_text_theme"] | null
        }
        Update: {
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          card_pattern?: Database["public"]["Enums"]["custom_pattern"] | null
          created_at?: string | null
          exchange_rate_adjustment?: number | null
          exchange_rate_buy_adjustment?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          text_theme?: Database["public"]["Enums"]["custom_text_theme"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          currency_preference:
            | Database["public"]["Enums"]["currency_code"]
            | null
          full_name: string | null
          id: string
          monthly_savings_goal: number | null
          onboarding_completed: boolean | null
          phone: number | null
          primary_account_id: string | null
          theme_preference:
            | Database["public"]["Enums"]["custom_text_theme"]
            | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          currency_preference?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          full_name?: string | null
          id: string
          monthly_savings_goal?: number | null
          onboarding_completed?: boolean | null
          phone?: number | null
          primary_account_id?: string | null
          theme_preference?:
            | Database["public"]["Enums"]["custom_text_theme"]
            | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          currency_preference?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          full_name?: string | null
          id?: string
          monthly_savings_goal?: number | null
          onboarding_completed?: boolean | null
          phone?: number | null
          primary_account_id?: string | null
          theme_preference?:
            | Database["public"]["Enums"]["custom_text_theme"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_account_id_fkey"
            columns: ["primary_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_rule_exemptions: {
        Row: {
          code: string
          legal_ref: string
          transfer_kind: string
        }
        Insert: {
          code: string
          legal_ref: string
          transfer_kind: string
        }
        Update: {
          code?: string
          legal_ref?: string
          transfer_kind?: string
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          code: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          legal_ref: string
          rate: number
        }
        Insert: {
          code: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          legal_ref: string
          rate: number
        }
        Update: {
          code?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          legal_ref?: string
          rate?: number
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          discount_amount: number | null
          id: string
          name: string
          quantity: number | null
          tax_amount: number | null
          tax_rule_id: string | null
          tax_type: Database["public"]["Enums"]["tax_type"] | null
          total_price: number | null
          transaction_id: string
          unit_price: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          name: string
          quantity?: number | null
          tax_amount?: number | null
          tax_rule_id?: string | null
          tax_type?: Database["public"]["Enums"]["tax_type"] | null
          total_price?: number | null
          transaction_id: string
          unit_price: number
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          name?: string
          quantity?: number | null
          tax_amount?: number | null
          tax_rule_id?: string | null
          tax_type?: Database["public"]["Enums"]["tax_type"] | null
          total_price?: number | null
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_tax_rule_id_fkey"
            columns: ["tax_rule_id"]
            isOneToOne: false
            referencedRelation: "tax_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_tags: {
        Row: {
          tag_id: string
          transaction_id: string
        }
        Insert: {
          tag_id: string
          transaction_id: string
        }
        Update: {
          tag_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          exchange_rate: number | null
          exclude_from_reports: boolean | null
          id: string
          is_balance_adjustment: boolean
          match_key: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          source_email_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          target_amount: number | null
          transfer_kind: string | null
          transfer_to_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description: string
          exchange_rate?: number | null
          exclude_from_reports?: boolean | null
          id?: string
          is_balance_adjustment?: boolean
          match_key?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          source_email_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          target_amount?: number | null
          transfer_kind?: string | null
          transfer_to_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          exchange_rate?: number | null
          exclude_from_reports?: boolean | null
          id?: string
          is_balance_adjustment?: boolean
          match_key?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          source_email_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          target_amount?: number | null
          transfer_kind?: string | null
          transfer_to_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_to_account_id_fkey"
            columns: ["transfer_to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_month_metrics: {
        Args: { p_account_id: string; p_month?: string }
        Returns: {
          first_uncategorized_id: string
          last_date: string
          last_description: string
          month_count: number
          month_inflow: number
          month_income: number
          month_outflow: number
          month_spend: number
          month_start: string
          prev_month_spend: number
          uncategorized_count: number
        }[]
      }
      classify_transfer: {
        Args: {
          p_description: string
          p_destination: string
          p_type: Database["public"]["Enums"]["transaction_type"]
        }
        Returns: string
      }
      is_usable_category: {
        Args: { p_category_id: string }
        Returns: boolean
      }
      owns_transaction: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      set_account_balance: {
        Args: { p_account_id: string; p_target: number }
        Returns: string
      }
      spending_by_day: {
        Args: { p_from: string; p_to: string }
        Returns: {
          category_id: string
          category_name: string
          currency: string
          day: string
          source: string
          total: number
        }[]
      }
      today_rd: { Args: Record<PropertyKey, never>; Returns: string }
      transfer_tax_rule: {
        Args: { p_date: string; p_kind: string }
        Returns: {
          rate: number
          rule_id: string
        }[]
      }
    }
    Enums: {
      account_type:
        | "checking"
        | "savings"
        | "credit_card"
        | "investment"
        | "cash"
      currency_code: "DOP" | "USD"
      custom_pattern:
        | "solid"
        | "waves"
        | "geometric"
        | "mesh"
        | "lines"
        | "dots"
        | "curve"
      custom_text_theme: "light" | "dark"
      payment_method:
        | "cash"
        | "card"
        | "transfer"
        | "mobile_pay"
        | "check"
        | "direct_debit"
        | "other"
      tax_type: "ITBIS" | "PROPINA" | "NONE"
      transaction_status:
        | "pending"
        | "pending_match"
        | "posted"
        | "completed"
        | "reconciled"
      transaction_type: "income" | "expense" | "transfer" | "payment"
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
    Enums: {
      account_type: [
        "checking",
        "savings",
        "credit_card",
        "investment",
        "cash",
      ],
      currency_code: ["DOP", "USD"],
      custom_pattern: [
        "solid",
        "waves",
        "geometric",
        "mesh",
        "lines",
        "dots",
        "curve",
      ],
      custom_text_theme: ["light", "dark"],
      payment_method: [
        "cash",
        "card",
        "transfer",
        "mobile_pay",
        "check",
        "direct_debit",
        "other",
      ],
      tax_type: ["ITBIS", "PROPINA", "NONE"],
      transaction_status: [
        "pending",
        "pending_match",
        "posted",
        "completed",
        "reconciled",
      ],
      transaction_type: ["income", "expense", "transfer", "payment"],
    },
  },
} as const
