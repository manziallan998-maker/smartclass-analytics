// ==================== LOCAL STORAGE MANAGEMENT ====================
// Handles all data storage for offline mode

class StorageManager {
    constructor() {
        this.initStorage();
    }

    initStorage() {
        // Initialize default data if not exists
        if (!localStorage.getItem('classes')) {
            this.loadDemoData();
        }
    }

    loadDemoData() {
        // Demo classes
        const classes = [
            { id: 'cls1', name: 'Physics S4A', teacherId: 'current', academicYear: '2026', term: 3, studentCount: 42, average: 68 },
            { id: 'cls2', name: 'Physics S3B', teacherId: 'current', academicYear: '2026', term: 3, studentCount: 38, average: 58 },
            { id: 'cls3', name: 'Physics S3A', teacherId: 'current', academicYear: '2026', term: 3, studentCount: 40, average: 72 },
            { id: 'cls4', name: 'Physics S2A', teacherId: 'current', academicYear: '2026', term: 3, studentCount: 35, average: 66 },
            { id: 'cls5', name: 'Physics S2B', teacherId: 'current', academicYear: '2026', term: 3, studentCount: 37, average: 84 }
        ];
        localStorage.setItem('classes', JSON.stringify(classes));

        // Demo students for Physics S4A
        const students = [
            { id: 'stu1', classId: 'cls1', name: 'UWAMAHORO Eric', regNumber: '2024001', parentPhone: '0788XXXXXX', term1: 82, term2: 88, term3: 94 },
            { id: 'stu2', classId: 'cls1', name: 'IRADUKUNDA Diane', regNumber: '2024002', parentPhone: '0788XXXXXX', term1: 85, term2: 89, term3: 91 },
            { id: 'stu3', classId: 'cls1', name: 'NSENGIYUMVA Jean', regNumber: '2024003', parentPhone: '0788XXXXXX', term1: 80, term2: 85, term3: 88 },
            { id: 'stu4', classId: 'cls1', name: 'MUKAMANA Grace', regNumber: '2024004', parentPhone: '0788XXXXXX', term1: 45, term2: 58, term3: 71 },
            { id: 'stu5', classId: 'cls1', name: 'NDAYISABA Pierre', regNumber: '2024005', parentPhone: '0788XXXXXX', term1: 38, term2: 42, term3: 41 }
        ];
        localStorage.setItem('students', JSON.stringify(students));

        // Demo lesson plans
        const lessonPlans = [
            { id: 'lp1', classId: 'cls1', day: 'Monday', startTime: '08:00', duration: 60 },
            { id: 'lp2', classId: 'cls2', day: 'Monday', startTime: '10:00', duration: 60 },
            { id: 'lp3', classId: 'cls1', day: 'Tuesday', startTime: '08:00', duration: 60 },
            { id: 'lp4', classId: 'cls4', day: 'Wednesday', startTime: '14:00', duration: 60 },
            { id: 'lp5', classId: 'cls3', day: 'Thursday', startTime: '09:00', duration: 60 },
            { id: 'lp6', classId: 'cls1', day: 'Friday', startTime: '08:00', duration: 60 }
        ];
        localStorage.setItem('lessonPlans', JSON.stringify(lessonPlans));
    }

    // Class methods
    getClasses() {
        return JSON.parse(localStorage.getItem('classes') || '[]');
    }

    saveClass(classData) {
        const classes = this.getClasses();
        classData.id = classData.id || `cls_${Date.now()}`;
        const index = classes.findIndex(c => c.id === classData.id);
        if (index >= 0) {
            classes[index] = classData;
        } else {
            classes.push(classData);
        }
        localStorage.setItem('classes', JSON.stringify(classes));
        return classData;
    }

    deleteClass(classId) {
        let classes = this.getClasses();
        classes = classes.filter(c => c.id !== classId);
        localStorage.setItem('classes', JSON.stringify(classes));
        
        // Also delete related students
        let students = this.getStudents();
        students = students.filter(s => s.classId !== classId);
        localStorage.setItem('students', JSON.stringify(students));
    }

    // Student methods
    getStudents(classId = null) {
        let students = JSON.parse(localStorage.getItem('students') || '[]');
        if (classId) {
            students = students.filter(s => s.classId === classId);
        }
        return students;
    }

    saveStudent(studentData) {
        const students = this.getStudents();
        studentData.id = studentData.id || `stu_${Date.now()}`;
        const index = students.findIndex(s => s.id === studentData.id);
        if (index >= 0) {
            students[index] = studentData;
        } else {
            students.push(studentData);
        }
        localStorage.setItem('students', JSON.stringify(students));
        return studentData;
    }

    deleteStudent(studentId) {
        let students = this.getStudents();
        students = students.filter(s => s.id !== studentId);
        localStorage.setItem('students', JSON.stringify(students));
    }

    updateMarks(studentId, term1, term2, term3) {
        const students = this.getStudents();
        const student = students.find(s => s.id === studentId);
        if (student) {
            if (term1 !== undefined) student.term1 = term1;
            if (term2 !== undefined) student.term2 = term2;
            if (term3 !== undefined) student.term3 = term3;
            localStorage.setItem('students', JSON.stringify(students));
            return true;
        }
        return false;
    }

    // Lesson Plan methods
    getLessonPlans() {
        return JSON.parse(localStorage.getItem('lessonPlans') || '[]');
    }

    saveLessonPlan(planData) {
        const plans = this.getLessonPlans();
        planData.id = planData.id || `lp_${Date.now()}`;
        const index = plans.findIndex(p => p.id === planData.id);
        if (index >= 0) {
            plans[index] = planData;
        } else {
            plans.push(planData);
        }
        localStorage.setItem('lessonPlans', JSON.stringify(plans));
        return planData;
    }

    deleteLessonPlan(planId) {
        let plans = this.getLessonPlans();
        plans = plans.filter(p => p.id !== planId);
        localStorage.setItem('lessonPlans', JSON.stringify(plans));
    }

    // Backup methods
    exportAllData() {
        return {
            classes: this.getClasses(),
            students: this.getStudents(),
            lessonPlans: this.getLessonPlans(),
            settings: themeManager.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    importAllData(data) {
        if (data.classes) localStorage.setItem('classes', JSON.stringify(data.classes));
        if (data.students) localStorage.setItem('students', JSON.stringify(data.students));
        if (data.lessonPlans) localStorage.setItem('lessonPlans', JSON.stringify(data.lessonPlans));
        if (data.settings) {
            themeManager.settings = data.settings;
            themeManager.applyTheme();
        }
    }

    clearAllData() {
        localStorage.removeItem('classes');
        localStorage.removeItem('students');
        localStorage.removeItem('lessonPlans');
        this.loadDemoData();
    }
}

// Initialize storage
const storage = new StorageManager();
window.storage = storage;
