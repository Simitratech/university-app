import { pool } from "./db";

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS grading_categories CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS gym_sessions CASCADE;
DROP TABLE IF EXISTS happiness_entries CASCADE;
DROP TABLE IF EXISTS daily_tracking CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS income_entries CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP TABLE IF EXISTS emergency_fund CASCADE;
DROP TABLE IF EXISTS emergency_fund_contributions CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS semester_archives CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

CREATE TABLE students (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'student',
  student_id varchar,
  profile_image_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE classes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  course_name text NOT NULL,
  credits integer NOT NULL,
  status text NOT NULL DEFAULT 'remaining',
  semester text,
  estimated_completion_date date,
  grade text,
  gpa real,
  instructor text,
  passing_threshold text DEFAULT 'C',
  current_grade_percent real,
  critical_tracking boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE exams (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  class_id varchar,
  category_id varchar,
  exam_name text NOT NULL,
  exam_date timestamp NOT NULL,
  weight real,
  grade text,
  grade_percent real,
  max_score real,
  score real,
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE grading_categories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  class_id varchar NOT NULL,
  name text NOT NULL,
  weight real NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE study_sessions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  class_id varchar,
  date timestamp NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL,
  focus_duration integer DEFAULT 25,
  break_duration integer DEFAULT 5,
  session_type text DEFAULT 'solo',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE gym_sessions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  date timestamp NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL,
  type text NOT NULL,
  weight real,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE happiness_entries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  date date NOT NULL DEFAULT now(),
  entry text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE daily_tracking (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  date date NOT NULL DEFAULT now(),
  study_completed boolean DEFAULT false,
  movement_completed boolean DEFAULT false,
  happiness_completed boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE expenses (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  month text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount real NOT NULL,
  date date DEFAULT now(),
  is_fixed boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE income_entries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  amount real NOT NULL,
  source text NOT NULL,
  date date NOT NULL DEFAULT now(),
  note text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE credit_cards (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  card_name text NOT NULL,
  balance real DEFAULT 0,
  due_date date,
  is_paid boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE emergency_fund (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  current_amount real DEFAULT 0,
  target_months integer DEFAULT 3,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE emergency_fund_contributions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  amount real NOT NULL,
  date date NOT NULL DEFAULT now(),
  note text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE semesters (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT false,
  is_new boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE semester_archives (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL,
  semester_id varchar NOT NULL,
  semester_name text NOT NULL,
  class_count integer DEFAULT 0,
  completed_credits integer DEFAULT 0,
  semester_gpa real,
  total_study_minutes integer DEFAULT 0,
  notes text,
  archived_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE user_settings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id varchar NOT NULL UNIQUE,
  total_credits_required integer DEFAULT 60,
  daily_study_goal_minutes integer DEFAULT 60,
  weekly_gym_goal integer DEFAULT 3,
  weekly_movement_minutes integer DEFAULT 90,
  theme text DEFAULT 'dark',
  university_theme text DEFAULT 'uf',
  target_gpa real DEFAULT 3.5,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
`;

export async function initDatabase() {
  try {
    console.log("Initializing database tables...");
    await pool.query(createTablesSQL);
    console.log("Database tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}
