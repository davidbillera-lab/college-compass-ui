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
      application_materials: {
        Row: {
          ai_analysis: Json | null
          ai_analyzed_at: string | null
          category: string
          content_text: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          material_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          category: string
          content_text?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          material_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          category?: string
          content_text?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          material_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      college_list_items: {
        Row: {
          added_at: string
          college_id: string
          id: string
          list_id: string
          notes: string | null
        }
        Insert: {
          added_at?: string
          college_id: string
          id?: string
          list_id: string
          notes?: string | null
        }
        Update: {
          added_at?: string
          college_id?: string
          id?: string
          list_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_list_items_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "college_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      college_lists: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          share_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      college_matches: {
        Row: {
          academic_match_score: number | null
          activities_match_score: number | null
          bucket: string
          college_id: string
          created_at: string
          financial_match_score: number | null
          fit_score: number
          id: string
          location_match_score: number | null
          notes: string | null
          shortlist: Database["public"]["Enums"]["shortlist_status"] | null
          shortlist_status: string | null
          student_id: string
          updated_at: string
          why_fit: string | null
        }
        Insert: {
          academic_match_score?: number | null
          activities_match_score?: number | null
          bucket: string
          college_id: string
          created_at?: string
          financial_match_score?: number | null
          fit_score: number
          id?: string
          location_match_score?: number | null
          notes?: string | null
          shortlist?: Database["public"]["Enums"]["shortlist_status"] | null
          shortlist_status?: string | null
          student_id: string
          updated_at?: string
          why_fit?: string | null
        }
        Update: {
          academic_match_score?: number | null
          activities_match_score?: number | null
          bucket?: string
          college_id?: string
          created_at?: string
          financial_match_score?: number | null
          fit_score?: number
          id?: string
          location_match_score?: number | null
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
          acceptance_rate: number | null
          act_range_high: number | null
          act_range_low: number | null
          athletics_division: string | null
          avg_financial_aid: number | null
          avg_gpa: number | null
          city: string | null
          created_at: string
          graduation_rate: number | null
          id: string
          last_crawled_at: string | null
          logo_url: string | null
          majors: string | null
          name: string
          notable_programs: string[] | null
          region: string | null
          religious_affiliation: string | null
          retention_rate: number | null
          sat_range_high: number | null
          sat_range_low: number | null
          setting: string | null
          size: string | null
          source_type: string | null
          source_url: string | null
          sports: string[] | null
          state: string | null
          sticker_usd: number | null
          student_faculty_ratio: number | null
          student_population: number | null
          tuition_in_state: number | null
          tuition_out_state: number | null
          type: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          act_range_high?: number | null
          act_range_low?: number | null
          athletics_division?: string | null
          avg_financial_aid?: number | null
          avg_gpa?: number | null
          city?: string | null
          created_at?: string
          graduation_rate?: number | null
          id?: string
          last_crawled_at?: string | null
          logo_url?: string | null
          majors?: string | null
          name: string
          notable_programs?: string[] | null
          region?: string | null
          religious_affiliation?: string | null
          retention_rate?: number | null
          sat_range_high?: number | null
          sat_range_low?: number | null
          setting?: string | null
          size?: string | null
          source_type?: string | null
          source_url?: string | null
          sports?: string[] | null
          state?: string | null
          sticker_usd?: number | null
          student_faculty_ratio?: number | null
          student_population?: number | null
          tuition_in_state?: number | null
          tuition_out_state?: number | null
          type?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          act_range_high?: number | null
          act_range_low?: number | null
          athletics_division?: string | null
          avg_financial_aid?: number | null
          avg_gpa?: number | null
          city?: string | null
          created_at?: string
          graduation_rate?: number | null
          id?: string
          last_crawled_at?: string | null
          logo_url?: string | null
          majors?: string | null
          name?: string
          notable_programs?: string[] | null
          region?: string | null
          religious_affiliation?: string | null
          retention_rate?: number | null
          sat_range_high?: number | null
          sat_range_low?: number | null
          setting?: string | null
          size?: string | null
          source_type?: string | null
          source_url?: string | null
          sports?: string[] | null
          state?: string | null
          sticker_usd?: number | null
          student_faculty_ratio?: number | null
          student_population?: number | null
          tuition_in_state?: number | null
          tuition_out_state?: number | null
          type?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_narrative: string | null
          act_score: number | null
          ap_courses: string[] | null
          awards: string[] | null
          budget_max_usd: number | null
          campus_size: string | null
          challenge: string | null
          citizenship: string | null
          city: string | null
          class_rank: string | null
          class_size: number | null
          context_notes: string | null
          coursework_rigor: string | null
          created_at: string
          estimated_efc: number | null
          financial_need: boolean | null
          first_gen_college: boolean | null
          full_name: string | null
          gpa_scale: number | null
          gpa_unweighted: number | null
          gpa_weighted: number | null
          grad_year: number | null
          graduation_year: number | null
          honors_courses: string[] | null
          id: string
          impact: string | null
          intended_majors: string[] | null
          interests: string | null
          leadership_roles: string[] | null
          max_distance_miles: number | null
          motivations: string | null
          preferred_college_type: string | null
          preferred_environments: string | null
          preferred_name: string | null
          preferred_setting: string | null
          profile_extras: Json | null
          proud_moment: string | null
          psat_score: number | null
          region: string | null
          sat_score: number | null
          school: string | null
          special_talents: string[] | null
          sports_played: string[] | null
          state: string | null
          test_policy: string | null
          updated_at: string
          values: string | null
          volunteer_hours: number | null
          work_experience_hours: number | null
          zip_code: string | null
        }
        Insert: {
          academic_narrative?: string | null
          act_score?: number | null
          ap_courses?: string[] | null
          awards?: string[] | null
          budget_max_usd?: number | null
          campus_size?: string | null
          challenge?: string | null
          citizenship?: string | null
          city?: string | null
          class_rank?: string | null
          class_size?: number | null
          context_notes?: string | null
          coursework_rigor?: string | null
          created_at?: string
          estimated_efc?: number | null
          financial_need?: boolean | null
          first_gen_college?: boolean | null
          full_name?: string | null
          gpa_scale?: number | null
          gpa_unweighted?: number | null
          gpa_weighted?: number | null
          grad_year?: number | null
          graduation_year?: number | null
          honors_courses?: string[] | null
          id: string
          impact?: string | null
          intended_majors?: string[] | null
          interests?: string | null
          leadership_roles?: string[] | null
          max_distance_miles?: number | null
          motivations?: string | null
          preferred_college_type?: string | null
          preferred_environments?: string | null
          preferred_name?: string | null
          preferred_setting?: string | null
          profile_extras?: Json | null
          proud_moment?: string | null
          psat_score?: number | null
          region?: string | null
          sat_score?: number | null
          school?: string | null
          special_talents?: string[] | null
          sports_played?: string[] | null
          state?: string | null
          test_policy?: string | null
          updated_at?: string
          values?: string | null
          volunteer_hours?: number | null
          work_experience_hours?: number | null
          zip_code?: string | null
        }
        Update: {
          academic_narrative?: string | null
          act_score?: number | null
          ap_courses?: string[] | null
          awards?: string[] | null
          budget_max_usd?: number | null
          campus_size?: string | null
          challenge?: string | null
          citizenship?: string | null
          city?: string | null
          class_rank?: string | null
          class_size?: number | null
          context_notes?: string | null
          coursework_rigor?: string | null
          created_at?: string
          estimated_efc?: number | null
          financial_need?: boolean | null
          first_gen_college?: boolean | null
          full_name?: string | null
          gpa_scale?: number | null
          gpa_unweighted?: number | null
          gpa_weighted?: number | null
          grad_year?: number | null
          graduation_year?: number | null
          honors_courses?: string[] | null
          id?: string
          impact?: string | null
          intended_majors?: string[] | null
          interests?: string | null
          leadership_roles?: string[] | null
          max_distance_miles?: number | null
          motivations?: string | null
          preferred_college_type?: string | null
          preferred_environments?: string | null
          preferred_name?: string | null
          preferred_setting?: string | null
          profile_extras?: Json | null
          proud_moment?: string | null
          psat_score?: number | null
          region?: string | null
          sat_score?: number | null
          school?: string | null
          special_talents?: string[] | null
          sports_played?: string[] | null
          state?: string | null
          test_policy?: string | null
          updated_at?: string
          values?: string | null
          volunteer_hours?: number | null
          work_experience_hours?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      scholarship_matches: {
        Row: {
          created_at: string | null
          eligibility_status: string
          id: string
          missing_fields: Json | null
          reasons: string
          scholarship_id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          eligibility_status: string
          id?: string
          missing_fields?: Json | null
          reasons: string
          scholarship_id: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          eligibility_status?: string
          id?: string
          missing_fields?: Json | null
          reasons?: string
          scholarship_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_matches_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
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
      scholarship_questions: {
        Row: {
          answer_type: string
          applies_to: Json | null
          created_at: string | null
          id: string
          key: string
          options: Json | null
          question_text: string
        }
        Insert: {
          answer_type: string
          applies_to?: Json | null
          created_at?: string | null
          id?: string
          key: string
          options?: Json | null
          question_text: string
        }
        Update: {
          answer_type?: string
          applies_to?: Json | null
          created_at?: string | null
          id?: string
          key?: string
          options?: Json | null
          question_text?: string
        }
        Relationships: []
      }
      scholarship_user_answers: {
        Row: {
          answer_json: Json
          id: string
          question_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_json: Json
          id?: string
          question_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_json?: Json
          id?: string
          question_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount_max_usd: number | null
          amount_min_usd: number | null
          amount_usd: number | null
          career_tags: string | null
          created_at: string
          deadline: string | null
          deadline_date: string | null
          description: string | null
          education_level: string | null
          id: string
          last_crawled_at: string | null
          location_scope: string | null
          major_tags: string | null
          name: string
          normalized_criteria: Json | null
          provider: string | null
          raw_eligibility_text: string | null
          rolling_deadline: boolean | null
          source_type: string | null
          source_url: string | null
          status: string | null
          tags: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          amount_max_usd?: number | null
          amount_min_usd?: number | null
          amount_usd?: number | null
          career_tags?: string | null
          created_at?: string
          deadline?: string | null
          deadline_date?: string | null
          description?: string | null
          education_level?: string | null
          id?: string
          last_crawled_at?: string | null
          location_scope?: string | null
          major_tags?: string | null
          name: string
          normalized_criteria?: Json | null
          provider?: string | null
          raw_eligibility_text?: string | null
          rolling_deadline?: boolean | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          amount_max_usd?: number | null
          amount_min_usd?: number | null
          amount_usd?: number | null
          career_tags?: string | null
          created_at?: string
          deadline?: string | null
          deadline_date?: string | null
          description?: string | null
          education_level?: string | null
          id?: string
          last_crawled_at?: string | null
          location_scope?: string | null
          major_tags?: string | null
          name?: string
          normalized_criteria?: Json | null
          provider?: string | null
          raw_eligibility_text?: string | null
          rolling_deadline?: boolean | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string | null
          updated_at?: string | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
      pipeline_status: ["NOT_STARTED", "DRAFTING", "SUBMITTED"],
      shortlist_status: ["INTERESTED", "APPLYING", "APPLIED", "NOT_NOW"],
    },
  },
} as const
