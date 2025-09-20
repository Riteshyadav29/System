-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Allow authenticated users to view students" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert students" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update students" ON students FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete students" ON students FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for courses table
CREATE POLICY "Allow authenticated users to view courses" ON courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert courses" ON courses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update courses" ON courses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete courses" ON courses FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for student_enrollments table
CREATE POLICY "Allow authenticated users to view enrollments" ON student_enrollments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert enrollments" ON student_enrollments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update enrollments" ON student_enrollments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete enrollments" ON student_enrollments FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for classes table
CREATE POLICY "Allow authenticated users to view classes" ON classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert classes" ON classes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update classes" ON classes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete classes" ON classes FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for attendance_records table
CREATE POLICY "Allow authenticated users to view attendance" ON attendance_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert attendance" ON attendance_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update attendance" ON attendance_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete attendance" ON attendance_records FOR DELETE USING (auth.role() = 'authenticated');
