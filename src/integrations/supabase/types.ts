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
      maintenance_tickets: {
        Row: {
          completion_date: string | null
          contractor_name: string | null
          contractor_phone: string | null
          created_at: string
          id: string
          issue_description: string
          location: string
          priority: Database["public"]["Enums"]["urgency_level"]
          resolution_notes: string | null
          room_or_area: string | null
          scheduled_date: string | null
          signal_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string
          id?: string
          issue_description: string
          location: string
          priority?: Database["public"]["Enums"]["urgency_level"]
          resolution_notes?: string | null
          room_or_area?: string | null
          scheduled_date?: string | null
          signal_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string
          id?: string
          issue_description?: string
          location?: string
          priority?: Database["public"]["Enums"]["urgency_level"]
          resolution_notes?: string | null
          room_or_area?: string | null
          scheduled_date?: string | null
          signal_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          ai_reasoning: string | null
          amount: number | null
          attachments: string[] | null
          bottleneck: string | null
          category: string | null
          confidence: number | null
          confidence_level:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          cost_comparison: string | null
          created_at: string
          description: string | null
          expected_date: string | null
          flag_reason: string | null
          funding: string | null
          id: string
          location: string
          signal_number: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          status: Database["public"]["Enums"]["signal_status"]
          submitter_avatar: string | null
          submitter_name: string
          supplier_confidence: number | null
          supplier_suggestion: string | null
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          ai_reasoning?: string | null
          amount?: number | null
          attachments?: string[] | null
          bottleneck?: string | null
          category?: string | null
          confidence?: number | null
          confidence_level?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          cost_comparison?: string | null
          created_at?: string
          description?: string | null
          expected_date?: string | null
          flag_reason?: string | null
          funding?: string | null
          id?: string
          location?: string
          signal_number?: number
          signal_type?: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["signal_status"]
          submitter_avatar?: string | null
          submitter_name: string
          supplier_confidence?: number | null
          supplier_suggestion?: string | null
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          ai_reasoning?: string | null
          amount?: number | null
          attachments?: string[] | null
          bottleneck?: string | null
          category?: string | null
          confidence?: number | null
          confidence_level?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          cost_comparison?: string | null
          created_at?: string
          description?: string | null
          expected_date?: string | null
          flag_reason?: string | null
          funding?: string | null
          id?: string
          location?: string
          signal_number?: number
          signal_type?: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["signal_status"]
          submitter_avatar?: string | null
          submitter_name?: string
          supplier_confidence?: number | null
          supplier_suggestion?: string | null
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
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
      confidence_level: "high" | "medium" | "low"
      signal_status:
        | "pending"
        | "approved"
        | "auto-approved"
        | "needs-clarity"
        | "rejected"
        | "in-motion"
        | "delivered"
        | "awaiting-supplier"
        | "closed"
      signal_type:
        | "purchase"
        | "maintenance"
        | "incident"
        | "shift-handover"
        | "compliance"
        | "event"
        | "resource"
        | "general"
      urgency_level: "normal" | "urgent" | "critical"
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
    Enums: {
      confidence_level: ["high", "medium", "low"],
      signal_status: [
        "pending",
        "approved",
        "auto-approved",
        "needs-clarity",
        "rejected",
        "in-motion",
        "delivered",
        "awaiting-supplier",
        "closed",
      ],
      signal_type: [
        "purchase",
        "maintenance",
        "incident",
        "shift-handover",
        "compliance",
        "event",
        "resource",
        "general",
      ],
      urgency_level: ["normal", "urgent", "critical"],
    },
  },
} as const
