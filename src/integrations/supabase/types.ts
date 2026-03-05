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
      access_profile_themes: {
        Row: {
          access_profile_id: string
          id: string
          theme_key: string
        }
        Insert: {
          access_profile_id: string
          id?: string
          theme_key: string
        }
        Update: {
          access_profile_id?: string
          id?: string
          theme_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_profile_themes_access_profile_id_fkey"
            columns: ["access_profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      action_plans: {
        Row: {
          action_description: string
          action_name: string
          client_name: string | null
          completion_date: string | null
          contract_manager_id: string
          created_at: string
          created_by: string | null
          directory_id: string
          end_date: string | null
          id: string
          new_end_date: string | null
          pesquisa_id: number
          question_comment: string | null
          regional_manager_id: string
          start_date: string | null
          status_id: string
          survey_year: number | null
          theme: string | null
          theme_comment: string | null
          updated_at: string
        }
        Insert: {
          action_description: string
          action_name: string
          client_name?: string | null
          completion_date?: string | null
          contract_manager_id: string
          created_at?: string
          created_by?: string | null
          directory_id: string
          end_date?: string | null
          id?: string
          new_end_date?: string | null
          pesquisa_id: number
          question_comment?: string | null
          regional_manager_id: string
          start_date?: string | null
          status_id: string
          survey_year?: number | null
          theme?: string | null
          theme_comment?: string | null
          updated_at?: string
        }
        Update: {
          action_description?: string
          action_name?: string
          client_name?: string | null
          completion_date?: string | null
          contract_manager_id?: string
          created_at?: string
          created_by?: string | null
          directory_id?: string
          end_date?: string | null
          id?: string
          new_end_date?: string | null
          pesquisa_id?: number
          question_comment?: string | null
          regional_manager_id?: string
          start_date?: string | null
          status_id?: string
          survey_year?: number | null
          theme?: string | null
          theme_comment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_contract_manager_id_fkey"
            columns: ["contract_manager_id"]
            isOneToOne: false
            referencedRelation: "contract_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "pesquisa_satisfacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_regional_manager_id_fkey"
            columns: ["regional_manager_id"]
            isOneToOne: false
            referencedRelation: "regional_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "action_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      action_statuses: {
        Row: {
          created_at: string
          id: string
          name: string
          requires_completion_date: boolean
          requires_end_date: boolean
          requires_new_end_date: boolean
          requires_start_date: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requires_completion_date?: boolean
          requires_end_date?: boolean
          requires_new_end_date?: boolean
          requires_start_date?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requires_completion_date?: boolean
          requires_end_date?: boolean
          requires_new_end_date?: boolean
          requires_start_date?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      contract_managers: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      directories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pesquisa_satisfacao: {
        Row: {
          activity: string | null
          answer_delay: string | null
          answered: number | null
          applicability: number | null
          client_name: string | null
          contact: string | null
          context: string | null
          country: string | null
          created_at: string
          firstname: string | null
          id: number
          importance: number | null
          lastname: string | null
          progress: number | null
          question: string | null
          question_comment: string | null
          score: number | null
          survey_year: number | null
          theme: string | null
          theme_comment: string | null
          type: string | null
        }
        Insert: {
          activity?: string | null
          answer_delay?: string | null
          answered?: number | null
          applicability?: number | null
          client_name?: string | null
          contact?: string | null
          context?: string | null
          country?: string | null
          created_at?: string
          firstname?: string | null
          id?: never
          importance?: number | null
          lastname?: string | null
          progress?: number | null
          question?: string | null
          question_comment?: string | null
          score?: number | null
          survey_year?: number | null
          theme?: string | null
          theme_comment?: string | null
          type?: string | null
        }
        Update: {
          activity?: string | null
          answer_delay?: string | null
          answered?: number | null
          applicability?: number | null
          client_name?: string | null
          contact?: string | null
          context?: string | null
          country?: string | null
          created_at?: string
          firstname?: string | null
          id?: never
          importance?: number | null
          lastname?: string | null
          progress?: number | null
          question?: string | null
          question_comment?: string | null
          score?: number | null
          survey_year?: number | null
          theme?: string | null
          theme_comment?: string | null
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_profile_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_profile_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_profile_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_access_profile"
            columns: ["access_profile_id"]
            isOneToOne: false
            referencedRelation: "access_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_managers: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      score_colors: {
        Row: {
          color: string
          created_at: string
          id: string
          score: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          score: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          score?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
