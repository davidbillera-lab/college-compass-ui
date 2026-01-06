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
      college_matches: {
        Row: {
          bucket: string
          college_id: string
          created_at: string
          fit_score: number
          id: string
          notes: string | null
          shortlist: Database["public"]["Enums"]["shortlist_status"] | null
          shortlist_status: string | null
          student_id: string
          updated_at: string
          why_fit: string | null
        }
        Insert: {
          bucket: string
          college_id: string
          created_at?: string
          fit_score: number
          id?: string
          notes?: string | null
          shortlist?: Database["public"]["Enums"]["shortlist_status"] | null
          shortlist_status?: string | null
          student_id: string
          updated_at?: string
          why_fit?: string | null
        }
        Update: {
          bucket?: string
          college_id?: string
          created_at?: string
          fit_score?: number
          id?: string
          notes?: string | null
          shortlist?: Database["public"]["Enums"]["shortlist_status"] | null
          shortlist_status?: string | null
          student_id?: string
          updated_at?: string
          why_fit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_matches_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_matches_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          created_at: string
          id: string
          majors: string | null
          name: string
          region: string | null
          size: string | null
          state: string | null
          sticker_usd: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          majors?: string | null
          name: string
          region?: string | null
          size?: string | null
          state?: string | null
          sticker_usd?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          majors?: string | null
          name?: string
          region?: string | null
          size?: string | null
          state?: string | null
          sticker_usd?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_narrative: string | null
          act_score: number | null
          budget_max_usd: number | null
          campus_size: string | null
          challenge: string | null
          class_rank: string | null
          context_notes: string | null
          coursework_rigor: string | null
          created_at: string
          full_name: string | null
          gpa_scale: number | null
          gpa_unweighted: number | null
          gpa_weighted: number | null
          grad_year: number | null
          graduation_year: number | null
          id: string
          impact: string | null
          intended_majors: string[] | null
          interests: string | null
          motivations: string | null
          preferred_environments: string | null
          preferred_name: string | null
          profile_extras: Json | null
          proud_moment: string | null
          region: string | null
          sat_score: number | null
          school: string | null
          test_policy: string | null
          updated_at: string
          values: string | null
        }
        Insert: {
          academic_narrative?: string | null
          act_score?: number | null
          budget_max_usd?: number | null
          campus_size?: string | null
          challenge?: string | null
          class_rank?: string | null
          context_notes?: string | null
          coursework_rigor?: string | null
          created_at?: string
          full_name?: string | null
          gpa_scale?: number | null
          gpa_unweighted?: number | null
          gpa_weighted?: number | null
          grad_year?: number | null
          graduation_year?: number | null
          id: string
          impact?: string | null
          intended_majors?: string[] | null
          interests?: string | null
          motivations?: string | null
          preferred_environments?: string | null
          preferred_name?: string | null
          profile_extras?: Json | null
          proud_moment?: string | null
          region?: string | null
          sat_score?: number | null
          school?: string | null
          test_policy?: string | null
          updated_at?: string
          values?: string | null
        }
        Update: {
          academic_narrative?: string | null
          act_score?: number | null
          budget_max_usd?: number | null
          campus_size?: string | null
          challenge?: string | null
          class_rank?: string | null
          context_notes?: string | null
          coursework_rigor?: string | null
          created_at?: string
          full_name?: string | null
          gpa_scale?: number | null
          gpa_unweighted?: number | null
          gpa_weighted?: number | null
          grad_year?: number | null
          graduation_year?: number | null
          id?: string
          impact?: string | null
          intended_majors?: string[] | null
          interests?: string | null
          motivations?: string | null
          preferred_environments?: string | null
          preferred_name?: string | null
          profile_extras?: Json | null
          proud_moment?: string | null
          region?: string | null
          sat_score?: number | null
          school?: string | null
          test_policy?: string | null
          updated_at?: string
          values?: string | null
        }
        Relationships: []
      }
      scholarship_pipeline_items: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          pipeline_status: Database["public"]["Enums"]["pipeline_status"] | null
          scholarship_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          pipeline_status?:
            | Database["public"]["Enums"]["pipeline_status"]
            | null
          scholarship_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          pipeline_status?:
            | Database["public"]["Enums"]["pipeline_status"]
            | null
          scholarship_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_pipeline_items_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_pipeline_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          amount_usd: number | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          name: string
          tags: string | null
          url: string | null
        }
        Insert: {
          amount_usd?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          tags?: string | null
          url?: string | null
        }
        Update: {
          amount_usd?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          tags?: string | null
          url?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          priority: number
          source: string | null
          student_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          priority?: number
          source?: string | null
          student_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          priority?: number
          source?: string | null
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pipeline_status: "NOT_STARTED" | "DRAFTING" | "SUBMITTED"
      shortlist_status: "INTERESTED" | "APPLYING" | "APPLIED" | "NOT_NOW"
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
      pipeline_status: ["NOT_STARTED", "DRAFTING", "SUBMITTED"],
      shortlist_status: ["INTERESTED", "APPLYING", "APPLIED", "NOT_NOW"],
    },
  },
} as const
