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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_moves: {
        Row: {
          agent: string
          created_at: string
          data: string
          game_id: number
          id: string
          move_type: string
          nonce: number
          nonce_evvm: number
          priority_fee_evvm: number
          priority_flag_evvm: boolean
          signature: string
          signature_evvm: string
          status: string
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          agent: string
          created_at?: string
          data: string
          game_id: number
          id?: string
          move_type: string
          nonce: number
          nonce_evvm: number
          priority_fee_evvm: number
          priority_flag_evvm: boolean
          signature: string
          signature_evvm: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          agent?: string
          created_at?: string
          data?: string
          game_id?: number
          id?: string
          move_type?: string
          nonce?: number
          nonce_evvm?: number
          priority_fee_evvm?: number
          priority_flag_evvm?: boolean
          signature?: string
          signature_evvm?: string
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          agents: Json
          ai_players: Json | null
          bettor_address: string | null
          bettor_choice: number | null
          board_state: Json | null
          chain_deposit: string | null
          chain_end_time: string | null
          chain_payload: Json | null
          chain_random_ready: boolean | null
          chain_request_id: string | null
          chain_start_time: string | null
          chain_status: number | null
          chain_winner: number | null
          created_at: string | null
          finished_at: string | null
          game_id: number
          id: string
          started_at: string | null
          status: string
          total_moves: number | null
          total_turns: number | null
          updated_at: string | null
          winner_agent: string | null
          winner_index: number | null
        }
        Insert: {
          agents: Json
          ai_players?: Json | null
          bettor_address?: string | null
          bettor_choice?: number | null
          board_state?: Json | null
          chain_deposit?: string | null
          chain_end_time?: string | null
          chain_payload?: Json | null
          chain_random_ready?: boolean | null
          chain_request_id?: string | null
          chain_start_time?: string | null
          chain_status?: number | null
          chain_winner?: number | null
          created_at?: string | null
          finished_at?: string | null
          game_id: number
          id?: string
          started_at?: string | null
          status?: string
          total_moves?: number | null
          total_turns?: number | null
          updated_at?: string | null
          winner_agent?: string | null
          winner_index?: number | null
        }
        Update: {
          agents?: Json
          ai_players?: Json | null
          bettor_address?: string | null
          bettor_choice?: number | null
          board_state?: Json | null
          chain_deposit?: string | null
          chain_end_time?: string | null
          chain_payload?: Json | null
          chain_random_ready?: boolean | null
          chain_request_id?: string | null
          chain_start_time?: string | null
          chain_status?: number | null
          chain_winner?: number | null
          created_at?: string | null
          finished_at?: string | null
          game_id?: number
          id?: string
          started_at?: string | null
          status?: string
          total_moves?: number | null
          total_turns?: number | null
          updated_at?: string | null
          winner_agent?: string | null
          winner_index?: number | null
        }
        Relationships: []
      }
      signed_transactions: {
        Row: {
          created_at: string | null
          executed_at: string | null
          fisher_address: string | null
          game_id: number | null
          id: number
          message: string
          signature: string
          signer_address: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          executed_at?: string | null
          fisher_address?: string | null
          game_id?: number | null
          id?: number
          message: string
          signature: string
          signer_address?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          executed_at?: string | null
          fisher_address?: string | null
          game_id?: number | null
          id?: number
          message?: string
          signature?: string
          signer_address?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
