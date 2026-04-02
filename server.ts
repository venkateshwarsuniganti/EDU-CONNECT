import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("educonnect.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    rollNumber TEXT,
    employeeId TEXT,
    pin TEXT,
    biometricId TEXT,
    theme TEXT DEFAULT 'light',
    avatarColor TEXT,
    avatarIcon TEXT,
    phoneNumber TEXT,
    location TEXT,
    joinedDate TEXT,
    status TEXT,
    profileImage TEXT
  );

  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    userId TEXT,
    task TEXT,
    completed INTEGER DEFAULT 0,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    date TEXT,
    time TEXT,
    timestamp INTEGER,
    status TEXT,
    subject TEXT,
    classId TEXT
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,
    subject TEXT,
    courseCode TEXT,
    time TEXT,
    room TEXT,
    instructor TEXT,
    facultyId TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    message TEXT,
    time TEXT,
    type TEXT,
    read INTEGER,
    targetRole TEXT
  );

  CREATE TABLE IF NOT EXISTS advisors (
    id TEXT PRIMARY KEY,
    facultyId TEXT,
    studentId TEXT
  );
`);

// Migrations: Add columns if they don't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'").run();
} catch (e) {
  // Column might already exist
}

try {
  db.prepare("ALTER TABLE users ADD COLUMN avatarColor TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN avatarIcon TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN phoneNumber TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN location TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN joinedDate TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN status TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN profileImage TEXT").run();
} catch (e) {}

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (id, email, password, role, name, rollNumber, employeeId, pin, biometricId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertUser.run("1", "student@edu.com", "password", "student", "John Student", "STU001", null, "123456", "123456");
  insertUser.run("2", "faculty@edu.com", "password", "faculty", "Dr. Smith", null, "FAC001", "123456", "123456");
  insertUser.run("3", "admin@edu.com", "password", "admin", "Admin User", null, null, "123456", "123456");

  const insertSchedule = db.prepare("INSERT INTO schedule (id, subject, time, room, instructor, facultyId) VALUES (?, ?, ?, ?, ?, ?)");
  insertSchedule.run("s1", "Advanced Mathematics", "09:00 AM - 10:30 AM", "Room 302", "Dr. Smith", "2");
  insertSchedule.run("s2", "Cloud Computing", "11:00 AM - 12:30 PM", "Lab 104", "Prof. Wilson", "2");
  insertSchedule.run("s3", "Software Engineering", "02:00 PM - 03:30 PM", "Room 201", "Dr. Brown", "2");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, password, role, name, rollNumber, employeeId } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare("INSERT INTO users (id, email, password, role, name, rollNumber, employeeId, pin, biometricId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, email, password, role, name, rollNumber || null, employeeId || null, "123456", "123456");
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  // Attendance Routes
  app.get("/api/attendance", (req, res) => {
    const { studentId } = req.query;
    const records = db.prepare("SELECT * FROM attendance WHERE studentId = ? ORDER BY timestamp DESC").all(studentId);
    res.json(records);
  });

  app.post("/api/attendance", (req, res) => {
    const { studentId, date, time, timestamp, status, subject, classId } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO attendance (id, studentId, date, time, timestamp, status, subject, classId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, studentId, date, time, timestamp, status, subject, classId);
    res.json({ success: true, id });
  });

  // Schedule Routes
  app.get("/api/schedule", (req, res) => {
    const schedules = db.prepare("SELECT * FROM schedule").all();
    res.json(schedules);
  });

  app.post("/api/schedule", (req, res) => {
    const { subject, courseCode, time, room, instructor, facultyId } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO schedule (id, subject, courseCode, time, room, instructor, facultyId) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, subject, courseCode || null, time, room, instructor, facultyId);
    res.json({ success: true, id });
  });

  // Notification Routes
  app.get("/api/notifications", (req, res) => {
    const { role } = req.query;
    const notifs = db.prepare("SELECT * FROM notifications WHERE targetRole IS NULL OR targetRole = ?").all(role);
    res.json(notifs.map((n: any) => ({ ...n, read: !!n.read })));
  });

  app.post("/api/notifications", (req, res) => {
    const { title, message, type, targetRole } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const time = "Just now";
    db.prepare("INSERT INTO notifications (id, title, message, time, type, read, targetRole) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, title, message, time, type, 0, targetRole || null);
    res.json({ success: true, id });
  });

  // User Management (Admin)
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, email, role, name, rollNumber, employeeId, theme FROM users").all();
    res.json(users);
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/users/theme", (req, res) => {
    const { userId, theme } = req.body;
    db.prepare("UPDATE users SET theme = ? WHERE id = ?").run(theme, userId);
    res.json({ success: true });
  });

  app.post("/api/users/profile", (req, res) => {
    const { id, name, email, avatarColor, avatarIcon, phoneNumber, location, joinedDate, status, profileImage } = req.body;
    db.prepare(`
      UPDATE users SET 
        name = ?, 
        email = ?, 
        avatarColor = ?, 
        avatarIcon = ?, 
        phoneNumber = ?, 
        location = ?, 
        joinedDate = ?, 
        status = ?, 
        profileImage = ? 
      WHERE id = ?
    `).run(name, email, avatarColor, avatarIcon, phoneNumber, location, joinedDate, status, profileImage, id);
    res.json({ success: true });
  });

  app.delete("/api/schedule/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM schedule WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/notifications/clear", (req, res) => {
    const { role } = req.query;
    db.prepare("DELETE FROM notifications WHERE targetRole IS NULL OR targetRole = ?").run(role);
    res.json({ success: true });
  });

  // Todo Routes
  app.get("/api/todos", (req, res) => {
    const { userId } = req.query;
    const todos = db.prepare("SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC").all(userId);
    res.json(todos.map((t: any) => ({ ...t, completed: !!t.completed })));
  });

  app.post("/api/todos", (req, res) => {
    const { userId, task } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO todos (id, userId, task, completed, createdAt) VALUES (?, ?, ?, ?, ?)")
      .run(id, userId, task, 0, Date.now());
    res.json({ success: true, id });
  });

  app.put("/api/todos/:id", (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    db.prepare("UPDATE todos SET completed = ? WHERE id = ?").run(completed ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/todos/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM todos WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Advisor Routes
  app.get("/api/advisors", (req, res) => {
    const { studentId } = req.query;
    const advisor = db.prepare(`
      SELECT u.* FROM users u
      JOIN advisors a ON a.facultyId = u.id
      WHERE a.studentId = ?
    `).get(studentId);
    res.json(advisor || null);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
