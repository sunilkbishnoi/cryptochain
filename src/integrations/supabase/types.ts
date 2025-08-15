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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      blockchain_transactions: {
        Row: {
          block_number: number
          encrypted_aes_key: string
          file_hash: string
          gas_used: number
          id: string
          metadata: Json | null
          recipient_id: string
          sender_id: string
          status: string
          timestamp: string
          tx_id: string
        }
        Insert: {
          block_number: number
          encrypted_aes_key: string
          file_hash: string
          gas_used?: number
          id?: string
          metadata?: Json | null
          recipient_id: string
          sender_id: string
          status?: string
          timestamp?: string
          tx_id: string
        }
        Update: {
          block_number?: number
          encrypted_aes_key?: string
          file_hash?: string
          gas_used?: number
          id?: string
          metadata?: Json | null
          recipient_id?: string
          sender_id?: string
          status?: string
          timestamp?: string
          tx_id?: string
        }
        Relationships: []
      }
      decryption_sessions: {
        Row: {
          blockchain_tx_id: string
          completed_at: string | null
          created_at: string
          encryption_session_id: string | null
          error_message: string | null
          file_hash_verification: string | null
          id: string
          private_key_fingerprint: string
          status: string
          user_id: string | null
        }
        Insert: {
          blockchain_tx_id: string
          completed_at?: string | null
          created_at?: string
          encryption_session_id?: string | null
          error_message?: string | null
          file_hash_verification?: string | null
          id?: string
          private_key_fingerprint: string
          status?: string
          user_id?: string | null
        }
        Update: {
          blockchain_tx_id?: string
          completed_at?: string | null
          created_at?: string
          encryption_session_id?: string | null
          error_message?: string | null
          file_hash_verification?: string | null
          id?: string
          private_key_fingerprint?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decryption_sessions_encryption_session_id_fkey"
            columns: ["encryption_session_id"]
            isOneToOne: false
            referencedRelation: "encryption_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_sessions: {
        Row: {
          blockchain_tx_id: string
          completed_at: string | null
          created_at: string
          encrypted_aes_key: string
          file_hash: string
          file_name: string
          file_size: number
          id: string
          public_key_fingerprint: string
          status: string
          user_id: string | null
        }
        Insert: {
          blockchain_tx_id: string
          completed_at?: string | null
          created_at?: string
          encrypted_aes_key: string
          file_hash: string
          file_name: string
          file_size: number
          id?: string
          public_key_fingerprint: string
          status?: string
          user_id?: string | null
        }
        Update: {
          blockchain_tx_id?: string
          completed_at?: string | null
          created_at?: string
          encrypted_aes_key?: string
          file_hash?: string
          file_name?: string
          file_size?: number
          id?: string
          public_key_fingerprint?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      key_pairs: {
        Row: {
          algorithm: string
          created_at: string
          expires_at: string | null
          fingerprint: string
          id: string
          name: string
          private_key_encrypted: string
          public_key: string
          status: string
          user_id: string | null
        }
        Insert: {
          algorithm?: string
          created_at?: string
          expires_at?: string | null
          fingerprint: string
          id?: string
          name: string
          private_key_encrypted: string
          public_key: string
          status?: string
          user_id?: string | null
        }
        Update: {
          algorithm?: string
          created_at?: string
          expires_at?: string | null
          fingerprint?: string
          id?: string
          name?: string
          private_key_encrypted?: string
          public_key?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
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
