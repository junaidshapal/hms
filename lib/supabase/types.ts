export type Role = "doctor" | "patient";
export type AppointmentStatus = "pending" | "accepted" | "rejected";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role: Role;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          email: string;
          role: Role;
        }>;
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          profile_id: string;
          specialization: string;
          bio: string | null;
          years_experience: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          specialization: string;
          bio?: string | null;
          years_experience?: number | null;
          created_at?: string;
        };
        Update: Partial<{
          specialization: string;
          bio: string | null;
          years_experience: number | null;
        }>;
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          doctor_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_booked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_booked?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          date: string;
          start_time: string;
          end_time: string;
          is_booked: boolean;
        }>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          availability_id: string;
          status: AppointmentStatus;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          availability_id: string;
          status?: AppointmentStatus;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          status: AppointmentStatus;
          reason: string | null;
        }>;
        Relationships: [];
      };
    };
    Functions: {
      book_appointment: {
        Args: { p_availability_id: string; p_reason: string | null };
        Returns: string;
      };
      accept_appointment: {
        Args: { p_appointment_id: string };
        Returns: void;
      };
      reject_appointment: {
        Args: { p_appointment_id: string };
        Returns: void;
      };
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Doctor = Database["public"]["Tables"]["doctors"]["Row"];
export type Availability = Database["public"]["Tables"]["availability"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
