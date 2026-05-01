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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          matricula: string | null
          mensaje: string
          nombre: string | null
          numero_poliza: string | null
          respondido: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          mensaje: string
          nombre?: string | null
          numero_poliza?: string | null
          respondido?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          matricula?: string | null
          mensaje?: string
          nombre?: string | null
          numero_poliza?: string | null
          respondido?: boolean
        }
        Relationships: []
      }
      dealers: {
        Row: {
          activo: boolean
          cif: string
          created_at: string
          direccion: string | null
          email: string
          id: string
          nombre_empresa: string
          telefono: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          activo?: boolean
          cif: string
          created_at?: string
          direccion?: string | null
          email: string
          id?: string
          nombre_empresa: string
          telefono?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          activo?: boolean
          cif?: string
          created_at?: string
          direccion?: string | null
          email?: string
          id?: string
          nombre_empresa?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
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
      warranties: {
        Row: {
          bastidor: string | null
          combustible: string | null
          comprador_cp: string | null
          comprador_direccion: string | null
          comprador_dni: string
          comprador_email: string | null
          comprador_nombre: string
          comprador_poblacion: string | null
          comprador_provincia: string | null
          comprador_telefono: string | null
          created_at: string
          dealer_id: string
          estado: Database["public"]["Enums"]["warranty_status"]
          fecha_fin: string
          fecha_inicio: string
          fecha_matriculacion: string | null
          fecha_venta: string
          id: string
          km_venta: number | null
          limite_averia: number
          matricula: string
          modalidad: Database["public"]["Enums"]["warranty_modality"]
          numero_poliza: string
          precio_venta: number | null
          tipo_cambio: string | null
          traccion_4x4: boolean
          updated_at: string
          vehiculo_marca: string
          vehiculo_modelo: string
        }
        Insert: {
          bastidor?: string | null
          combustible?: string | null
          comprador_cp?: string | null
          comprador_direccion?: string | null
          comprador_dni: string
          comprador_email?: string | null
          comprador_nombre: string
          comprador_poblacion?: string | null
          comprador_provincia?: string | null
          comprador_telefono?: string | null
          created_at?: string
          dealer_id: string
          estado?: Database["public"]["Enums"]["warranty_status"]
          fecha_fin: string
          fecha_inicio: string
          fecha_matriculacion?: string | null
          fecha_venta: string
          id?: string
          km_venta?: number | null
          limite_averia: number
          matricula: string
          modalidad: Database["public"]["Enums"]["warranty_modality"]
          numero_poliza: string
          precio_venta?: number | null
          tipo_cambio?: string | null
          traccion_4x4?: boolean
          updated_at?: string
          vehiculo_marca: string
          vehiculo_modelo: string
        }
        Update: {
          bastidor?: string | null
          combustible?: string | null
          comprador_cp?: string | null
          comprador_direccion?: string | null
          comprador_dni?: string
          comprador_email?: string | null
          comprador_nombre?: string
          comprador_poblacion?: string | null
          comprador_provincia?: string | null
          comprador_telefono?: string | null
          created_at?: string
          dealer_id?: string
          estado?: Database["public"]["Enums"]["warranty_status"]
          fecha_fin?: string
          fecha_inicio?: string
          fecha_matriculacion?: string | null
          fecha_venta?: string
          id?: string
          km_venta?: number | null
          limite_averia?: number
          matricula?: string
          modalidad?: Database["public"]["Enums"]["warranty_modality"]
          numero_poliza?: string
          precio_venta?: number | null
          tipo_cambio?: string | null
          traccion_4x4?: boolean
          updated_at?: string
          vehiculo_marca?: string
          vehiculo_modelo?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_poliza_number: { Args: never; Returns: string }
      get_dealer_id_for_user: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dealer"
      warranty_modality: "PLUS" | "BASIC"
      warranty_status: "activa" | "expirada" | "cancelada"
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
      app_role: ["admin", "dealer"],
      warranty_modality: ["PLUS", "BASIC"],
      warranty_status: ["activa", "expirada", "cancelada"],
    },
  },
} as const
