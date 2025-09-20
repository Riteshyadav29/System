-- Insert sample students
INSERT INTO students (student_id, first_name, last_name, email, phone, department, year_of_study) VALUES
('CS2021001', 'Ritesh', 'Yadav', 'john.doe@college.edu', '+1234567890', 'Computer Science', 3),
('CS2021002', 'Rajkumar', 'Yadav', 'jane.smith@college.edu', '+1234567891', 'Computer Science', 3),
('CS2022003', 'Ramkisan', 'Yadav', 'mike.johnson@college.edu', '+1234567892', 'Computer Science', 2),
('EE2021004', 'Aditi', 'Singh', 'sarah.wilson@college.edu', '+1234567893', 'Electrical Engineering', 3),
('EE2022005', 'David', 'Brown', 'david.brown@college.edu', '+1234567894', 'Electrical Engineering', 2),
('ME2021006', 'Lisa', 'Davis', 'lisa.davis@college.edu', '+1234567895', 'Mechanical Engineering', 3),
('CS2023007', 'Alex', 'Miller', 'alex.miller@college.edu', '+1234567896', 'Computer Science', 1),
('CS2023008', 'Emma', 'Garcia', 'emma.garcia@college.edu', '+1234567897', 'Computer Science', 1);

-- Insert sample courses
INSERT INTO courses (course_code, course_name, department, credits, semester, academic_year, instructor_name) VALUES
('CS301', 'Database Systems', 'Computer Science', 3, 'Fall', '2024-25', 'Dr. Robert Anderson'),
('CS302', 'Software Engineering', 'Computer Science', 4, 'Fall', '2024-25', 'Dr. Maria Rodriguez'),
('CS201', 'Data Structures', 'Computer Science', 3, 'Fall', '2024-25', 'Dr. James Wilson'),
('EE301', 'Digital Signal Processing', 'Electrical Engineering', 3, 'Fall', '2024-25', 'Dr. Susan Lee'),
('ME301', 'Thermodynamics', 'Mechanical Engineering', 3, 'Fall', '2024-25', 'Dr. Michael Chen');

-- Insert sample enrollments
INSERT INTO student_enrollments (student_id, course_id)
SELECT s.id, c.id 
FROM students s, courses c 
WHERE (s.student_id = 'CS2021001' AND c.course_code IN ('CS301', 'CS302'))
   OR (s.student_id = 'CS2021002' AND c.course_code IN ('CS301', 'CS302', 'CS201'))
   OR (s.student_id = 'CS2022003' AND c.course_code = 'CS201')
   OR (s.student_id = 'EE2021004' AND c.course_code = 'EE301')
   OR (s.student_id = 'EE2022005' AND c.course_code = 'EE301')
   OR (s.student_id = 'ME2021006' AND c.course_code = 'ME301')
   OR (s.student_id = 'CS2023007' AND c.course_code = 'CS201')
   OR (s.student_id = 'CS2023008' AND c.course_code = 'CS201');

-- Insert sample classes for the current week
INSERT INTO classes (course_id, class_date, start_time, end_time, topic, location)
SELECT 
  c.id,
  CURRENT_DATE + (i - 1),
  '09:00:00',
  '10:30:00',
  CASE 
    WHEN c.course_code = 'CS301' THEN 'Database Design Principles'
    WHEN c.course_code = 'CS302' THEN 'Software Development Lifecycle'
    WHEN c.course_code = 'CS201' THEN 'Binary Trees and Traversal'
    WHEN c.course_code = 'EE301' THEN 'Fourier Transform Applications'
    WHEN c.course_code = 'ME301' THEN 'First Law of Thermodynamics'
  END,
  CASE 
    WHEN c.course_code = 'CS301' THEN 'Room A101'
    WHEN c.course_code = 'CS302' THEN 'Room A102'
    WHEN c.course_code = 'CS201' THEN 'Room A103'
    WHEN c.course_code = 'EE301' THEN 'Room B201'
    WHEN c.course_code = 'ME301' THEN 'Room C301'
  END
FROM courses c
CROSS JOIN generate_series(1, 3) AS i
WHERE c.is_active = true;

-- Insert sample attendance records
INSERT INTO attendance_records (student_id, class_id, status)
SELECT 
  se.student_id,
  cl.id,
  CASE 
    WHEN random() < 0.8 THEN 'present'
    WHEN random() < 0.9 THEN 'late'
    ELSE 'absent'
  END
FROM student_enrollments se
JOIN classes cl ON cl.course_id = se.course_id
WHERE cl.class_date <= CURRENT_DATE
AND se.is_active = true;
