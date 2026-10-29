const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const starterData = {
  employees: [
    { id: "emp-1", name: "Rahul Sharma", role: "Software Engineer", department: "Engineering", email: "rahul@example.com", status: "Active", joined: "2025-02-10" },
    { id: "emp-2", name: "Priya Singh", role: "HR Executive", department: "Human Resources", email: "priya@example.com", status: "Active", joined: "2025-04-18" },
    { id: "emp-3", name: "Aman Verma", role: "UI/UX Designer", department: "Design", email: "aman@example.com", status: "On Leave", joined: "2025-06-02" }
  ],
  attendance: [],
  leaves: [
    { id: "leave-1", employeeId: "emp-3", employeeName: "Aman Verma", type: "Personal Leave", startDate: "2026-11-05", endDate: "2026-11-06", reason: "Personal work", status: "Pending", createdAt: new Date().toISOString() }
  ],
  announcements: [
    { id: "ann-1", title: "Welcome to StaffSync", message: "Use the dashboard to manage your team's daily HR tasks.", date: new Date().toISOString().slice(0, 10) },
    { id: "ann-2", title: "Keep attendance updated", message: "Remember to record attendance regularly.", date: new Date().toISOString().slice(0, 10) }
  ]
};

function ensureDb() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(starterData, null, 2));
  }
}
function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}
function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
function id(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}
function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

app.get("/", (_req, res) => res.json({ name: "StaffSync API", status: "running" }));
app.get("/api/health", (_req, res) => res.json({ success: true, message: "StaffSync backend is working" }));

app.get("/api/dashboard", (_req, res) => {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const todaysAttendance = db.attendance.filter(a => a.date === today);
  res.json({
    totalEmployees: db.employees.length,
    activeEmployees: db.employees.filter(e => e.status === "Active").length,
    departments: new Set(db.employees.map(e => e.department)).size,
    pendingLeaves: db.leaves.filter(l => l.status === "Pending").length,
    presentToday: todaysAttendance.filter(a => a.status === "Present").length
  });
});

app.get("/api/employees", (req, res) => {
  const db = readDb();
  const q = clean(req.query.search).toLowerCase();
  const employees = db.employees.filter(e =>
    `${e.name} ${e.role} ${e.department} ${e.email}`.toLowerCase().includes(q)
  );
  res.json(employees);
});
app.post("/api/employees", (req, res) => {
  const name = clean(req.body.name);
  const role = clean(req.body.role);
  const department = clean(req.body.department);
  const email = clean(req.body.email);
  if (!name || !role || !department) return res.status(400).json({ message: "Name, role, and department are required." });
  const db = readDb();
  if (email && db.employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: "An employee with this email already exists." });
  }
  const employee = { id: id("emp"), name, role, department, email, status: "Active", joined: new Date().toISOString().slice(0, 10) };
  db.employees.push(employee);
  writeDb(db);
  res.status(201).json(employee);
});
app.put("/api/employees/:id", (req, res) => {
  const db = readDb();
  const employee = db.employees.find(e => e.id === req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found." });
  const name = clean(req.body.name);
  const role = clean(req.body.role);
  const department = clean(req.body.department);
  if (!name || !role || !department) return res.status(400).json({ message: "Name, role, and department are required." });
  Object.assign(employee, { name, role, department, email: clean(req.body.email), status: req.body.status === "On Leave" ? "On Leave" : "Active" });
  writeDb(db);
  res.json(employee);
});
app.delete("/api/employees/:id", (req, res) => {
  const db = readDb();
  const exists = db.employees.some(e => e.id === req.params.id);
  if (!exists) return res.status(404).json({ message: "Employee not found." });
  db.employees = db.employees.filter(e => e.id !== req.params.id);
  db.attendance = db.attendance.filter(a => a.employeeId !== req.params.id);
  db.leaves = db.leaves.filter(l => l.employeeId !== req.params.id);
  writeDb(db);
  res.json({ message: "Employee deleted." });
});

app.get("/api/attendance", (req, res) => {
  const db = readDb();
  const date = clean(req.query.date);
  res.json(date ? db.attendance.filter(a => a.date === date) : db.attendance);
});
app.post("/api/attendance", (req, res) => {
  const employeeId = clean(req.body.employeeId);
  const date = clean(req.body.date) || new Date().toISOString().slice(0, 10);
  const status = ["Present", "Absent", "Late"].includes(req.body.status) ? req.body.status : "";
  const db = readDb();
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ message: "Select a valid employee." });
  if (!status) return res.status(400).json({ message: "Choose Present, Absent, or Late." });
  const existing = db.attendance.find(a => a.employeeId === employeeId && a.date === date);
  if (existing) {
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    writeDb(db);
    return res.json(existing);
  }
  const record = { id: id("att"), employeeId, employeeName: employee.name, date, status, createdAt: new Date().toISOString() };
  db.attendance.unshift(record);
  writeDb(db);
  res.status(201).json(record);
});

app.get("/api/leaves", (_req, res) => res.json(readDb().leaves));
app.post("/api/leaves", (req, res) => {
  const employeeId = clean(req.body.employeeId);
  const type = clean(req.body.type);
  const startDate = clean(req.body.startDate);
  const endDate = clean(req.body.endDate);
  const reason = clean(req.body.reason);
  const db = readDb();
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee || !type || !startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Complete all leave request fields." });
  }
  if (endDate < startDate) return res.status(400).json({ message: "End date must be on or after start date." });
  const leave = { id: id("leave"), employeeId, employeeName: employee.name, type, startDate, endDate, reason, status: "Pending", createdAt: new Date().toISOString() };
  db.leaves.unshift(leave);
  writeDb(db);
  res.status(201).json(leave);
});
app.patch("/api/leaves/:id", (req, res) => {
  const status = req.body.status;
  if (!["Approved", "Rejected", "Pending"].includes(status)) return res.status(400).json({ message: "Invalid leave status." });
  const db = readDb();
  const leave = db.leaves.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found." });
  leave.status = status;
  writeDb(db);
  res.json(leave);
});

app.get("/api/announcements", (_req, res) => res.json(readDb().announcements));
app.post("/api/announcements", (req, res) => {
  const title = clean(req.body.title);
  const message = clean(req.body.message);
  if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
  const db = readDb();
  const announcement = { id: id("ann"), title, message, date: new Date().toISOString().slice(0, 10) };
  db.announcements.unshift(announcement);
  writeDb(db);
  res.status(201).json(announcement);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

ensureDb();
app.listen(PORT, () => console.log(`StaffSync API running at http://localhost:${PORT}`));
