-- Fix schedule import conflicts
-- First, let's check what tables we have

-- Make sure student_schedule has proper indexes
DROP INDEX IF EXISTS student_schedule_student_id_idx;
DROP INDEX IF EXISTS student_schedule_subject_id_idx;
DROP INDEX IF EXISTS student_schedule_weekday_id_idx;
DROP INDEX IF EXISTS student_schedule_slot_id_idx;

CREATE INDEX IF NOT EXISTS student_schedule_student_id_idx ON student_schedule(student_id);
CREATE INDEX IF NOT EXISTS student_schedule_subject_id_idx ON student_schedule(subject_id);
CREATE INDEX IF NOT EXISTS student_schedule_weekday_id_idx ON student_schedule(weekday_id);
CREATE INDEX IF NOT EXISTS student_schedule_slot_id_idx ON student_schedule(slot_id);

-- Also add indexes for students lookup
DROP INDEX IF EXISTS students_national_id_idx;
DROP INDEX IF EXISTS students_academic_id_idx;

CREATE UNIQUE INDEX IF NOT EXISTS students_national_id_idx ON students(national_id);
CREATE UNIQUE INDEX IF NOT EXISTS students_academic_id_idx ON students(academic_id);

-- Add indexes for subjects
DROP INDEX IF EXISTS subjects_subject_name_idx;
DROP INDEX IF EXISTS subjects_department_id_idx;

CREATE INDEX IF NOT EXISTS subjects_subject_name_idx ON subjects(subject_name);
CREATE INDEX IF NOT EXISTS subjects_department_id_idx ON subjects(department_id);

-- Enable realtime for these tables if not already enabled
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS student_schedule;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS students;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS subjects;

COMMENT ON TABLE student_schedule IS 'Student schedules with indexes for performance';
COMMENT ON TABLE students IS 'Student information with unique indexes';
COMMENT ON TABLE subjects IS 'Subjects with search indexes';
