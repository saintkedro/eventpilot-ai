export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EventStatus =
  | "draft"
  | "published"
  | "completed"
  | "archived"
  | "cancelled";

export type RsvpStatus = "yes" | "no" | "maybe";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          auth_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string | null;
          auth_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          auth_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_identities: {
        Row: {
          id: string;
          profile_id: string;
          wa_id: string;
          phone_e164: string | null;
          verified_at: string | null;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          wa_id: string;
          phone_e164?: string | null;
          verified_at?: string | null;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          wa_id?: string;
          phone_e164?: string | null;
          verified_at?: string | null;
          last_seen_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_identities_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_profile_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_profile_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_profile_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_owner_profile_id_fkey";
            columns: ["owner_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          title: string | null;
          description: string | null;
          status: EventStatus;
          starts_at: string | null;
          ends_at: string | null;
          timezone: string;
          venue_name: string | null;
          venue_address: string | null;
          capacity: number | null;
          public_slug: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by: string;
          title?: string | null;
          description?: string | null;
          status?: EventStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          timezone?: string;
          venue_name?: string | null;
          venue_address?: string | null;
          capacity?: number | null;
          public_slug?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by?: string;
          title?: string | null;
          description?: string | null;
          status?: EventStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          timezone?: string;
          venue_name?: string | null;
          venue_address?: string | null;
          capacity?: number | null;
          public_slug?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          guest_name: string;
          guest_phone: string | null;
          guest_email: string | null;
          status: RsvpStatus;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          guest_name: string;
          guest_phone?: string | null;
          guest_email?: string | null;
          status: RsvpStatus;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          guest_name?: string;
          guest_phone?: string | null;
          guest_email?: string | null;
          status?: RsvpStatus;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_sessions: {
        Row: {
          id: string;
          profile_id: string;
          wa_id: string;
          active_event_id: string | null;
          state: Json;
          last_inbound_at: string | null;
          last_outbound_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          wa_id: string;
          active_event_id?: string | null;
          state?: Json;
          last_inbound_at?: string | null;
          last_outbound_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          wa_id?: string;
          active_event_id?: string | null;
          state?: Json;
          last_inbound_at?: string | null;
          last_outbound_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_sessions_active_event_id_fkey";
            columns: ["active_event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_status: EventStatus;
      rsvp_status: RsvpStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
