-- DROP TABLES IF EXISTS (for fresh setup)
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS lesson_plans;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS backup_logs;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS teachers;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT UNIQUE NOT NULL,
    fullname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    school TEXT NOT NULL,
    subject TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT UNIQUE NOT NULL,
    teacher_id TEXT NOT NULL,
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    term INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    registration_number TEXT,
    parent_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Marks table
CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    term INTEGER NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER,
    grade TEXT,
    remarks TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Lesson plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    topic TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Backup logs table
CREATE TABLE IF NOT EXISTS backup_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_type TEXT NOT NULL,
    file_size INTEGER,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- Insert demo teacher (password: password123)
INSERT OR IGNORE INTO teachers (teacher_id, fullname, email, school, subject, password_hash) VALUES 
('TCH_DEMO_001', 'Mr. Jean UWIMANA', 'teacher@school.rw', 'G.S. Saint Andre', 'Physics', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

-- Insert demo classes
INSERT OR IGNORE INTO classes (class_id, teacher_id, name, academic_year, term) VALUES 
('CLS_S4A_001', 'TCH_DEMO_001', 'Physics S4A', '2026', 3),
('CLS_S3B_002', 'TCH_DEMO_001', 'Physics S3B', '2026', 3),
('CLS_S3A_003', 'TCH_DEMO_001', 'Physics S3A', '2026', 3),
('CLS_S2A_004', 'TCH_DEMO_001', 'Physics S2A', '2026', 3),
('CLS_S2B_005', 'TCH_DEMO_001', 'Physics S2B', '2026', 3);

-- Insert demo students
INSERT OR IGNORE INTO students (student_id, class_id, name, registration_number, parent_phone) VALUES 
('STU_001', 'CLS_S4A_001', 'UWAMAHORO Eric', '2024001', '0788XXXXXX'),
('STU_002', 'CLS_S4A_001', 'IRADUKUNDA Diane', '2024002', '0788XXXXXX'),
('STU_003', 'CLS_S4A_001', 'NSENGIYUMVA Jean', '2024003', '0788XXXXXX'),
('STU_004', 'CLS_S4A_001', 'MUKAMANA Grace', '2024004', '0788XXXXXX'),
('STU_005', 'CLS_S4A_001', 'NDAYISABA Pierre', '2024005', '0788XXXXXX');

-- Insert demo marks
INSERT OR IGNORE INTO marks (student_id, class_id, term, subject, score, grade, remarks) VALUES 
('STU_001', 'CLS_S4A_001', 1, 'Physics', 82, 'B', 'Good'),
('STU_001', 'CLS_S4A_001', 2, 'Physics', 88, 'B', 'Good'),
('STU_001', 'CLS_S4A_001', 3, 'Physics', 94, 'A', 'Excellent'),
('STU_002', 'CLS_S4A_001', 1, 'Physics', 85, 'B', 'Good'),
('STU_002', 'CLS_S4A_001', 2, 'Physics', 89, 'B', 'Good'),
('STU_002', 'CLS_S4A_001', 3, 'Physics', 91, 'A', 'Excellent'),
('STU_003', 'CLS_S4A_001', 1, 'Physics', 80, 'B', 'Good'),
('STU_003', 'CLS_S4A_001', 2, 'Physics', 85, 'B', 'Good'),
('STU_003', 'CLS_S4A_001', 3, 'Physics', 88, 'B', 'Very Good'),
('STU_004', 'CLS_S4A_001', 1, 'Physics', 45, 'D', 'Satisfactory'),
('STU_004', 'CLS_S4A_001', 2, 'Physics', 58, 'D', 'Satisfactory'),
('STU_004', 'CLS_S4A_001', 3, 'Physics', 71, 'C', 'Good'),
('STU_005', 'CLS_S4A_001', 1, 'Physics', 38, 'F', 'Needs Improvement'),
('STU_005', 'CLS_S4A_001', 2, 'Physics', 42, 'F', 'Needs Improvement'),
('STU_005', 'CLS_S4A_001', 3, 'Physics', 41, 'F', 'Needs Improvement');

-- Insert demo lesson plans
INSERT OR IGNORE INTO lesson_plans (teacher_id, class_id, day_of_week, start_time, duration) VALUES 
('TCH_DEMO_001', 'CLS_S4A_001', 'Monday', '08:00', 60),
('TCH_DEMO_001', 'CLS_S3B_002', 'Monday', '10:00', 60),
('TCH_DEMO_001', 'CLS_S4A_001', 'Tuesday', '08:00', 60),
('TCH_DEMO_001', 'CLS_S2A_004', 'Wednesday', '14:00', 60),
('TCH_DEMO_001', 'CLS_S3A_003', 'Thursday', '09:00', 60),
('TCH_DEMO_001', 'CLS_S4A_001', 'Friday', '08:00', 60),
('TCH_DEMO_001', 'CLS_S2B_005', 'Friday', '10:00', 60);
