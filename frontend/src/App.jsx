import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarCheck, CalendarDays,
  Check, ChevronDown, CircleHelp, ClipboardList, Clock3, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, Trash2, Users, X,
  BriefcaseBusiness, Megaphone, CheckCircle2, XCircle, Pencil, Building2
} from "lucide-react";

const API = "http://localhost:5000/api";
const departments = ["Engineering", "Human Resources", "Design", "Finance", "Marketing", "Sales", "Operations"];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed. Check that the backend is running.");
  return body;
}

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);

function App() {
  const [page, setPage] = useState("Dashboard");
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ totalEmployees: 0, activeEmployees: 0, departments: 0, pendingLeaves: 0, presentToday: 0 });
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [leaveModal, setLeaveModal] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [attendanceDraft, setAttendanceDraft] = useState({});
  const [employeeForm, setEmployeeForm] = useState({ name: "", role: "", department: "Engineering", email: "" });
  const [leaveForm, setLeaveForm] = useState({ employeeId: "", type: "Annual Leave", startDate: today(), endDate: today(), reason: "" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "" });

  async function loadAll() {
    try {
      setError("");
      const [e, a, l, n, s] = await Promise.all([
        request("/employees"), request(`/attendance?date=${attendanceDate}`),
        request("/leaves"), request("/announcements"), request("/dashboard")
      ]);
      setEmployees(e); setAttendance(a); setLeaves(l); setAnnouncements(n); setStats(s);
      const draft = {};
      e.forEach(emp => {
        const saved = a.find(item => item.employeeId === emp.id);
        draft[emp.id] = saved?.status || "Present";
      });
      setAttendanceDraft(draft);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [attendanceDate]);

  const filteredEmployees = useMemo(() => employees.filter(e =>
    `${e.name} ${e.role} ${e.department} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  ), [employees, search]);

  function toast(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function saveEmployee(event) {
    event.preventDefault();
    try {
      if (employeeModal?.id) {
        await request(`/employees/${employeeModal.id}`, { method: "PUT", body: JSON.stringify(employeeForm) });
        toast("Employee updated successfully.");
      } else {
        await request("/employees", { method: "POST", body: JSON.stringify(employeeForm) });
        toast("Employee added successfully.");
      }
      setEmployeeModal(null);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  function openNewEmployee() {
    setEmployeeForm({ name: "", role: "", department: "Engineering", email: "" });
    setEmployeeModal({ mode: "new" });
  }

  function openEditEmployee(employee) {
    setEmployeeForm({ name: employee.name, role: employee.role, department: employee.department, email: employee.email || "" });
    setEmployeeModal({ mode: "edit", id: employee.id });
  }

  async function removeEmployee(employee) {
    if (!window.confirm(`Remove ${employee.name} from StaffSync?`)) return;
    try {
      await request(`/employees/${employee.id}`, { method: "DELETE" });
      toast("Employee removed.");
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function saveAttendance(employeeId) {
    try {
      await request("/attendance", { method: "POST", body: JSON.stringify({ employeeId, date: attendanceDate, status: attendanceDraft[employeeId] || "Present" }) });
      toast("Attendance saved.");
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function submitLeave(event) {
    event.preventDefault();
    try {
      await request("/leaves", { method: "POST", body: JSON.stringify(leaveForm) });
      setLeaveModal(false);
      setLeaveForm({ employeeId: "", type: "Annual Leave", startDate: today(), endDate: today(), reason: "" });
      toast("Leave request submitted.");
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function updateLeave(leave, status) {
    try {
      await request(`/leaves/${leave.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast(`Leave request ${status.toLowerCase()}.`);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    try {
      await request("/announcements", { method: "POST", body: JSON.stringify(announcementForm) });
      setAnnouncementModal(false);
      setAnnouncementForm({ title: "", message: "" });
      toast("Announcement published.");
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, section: "WORKSPACE" },
    { name: "Employees", icon: Users },
    { name: "Departments", icon: Building2 },
    { name: "Attendance", icon: CalendarCheck, section: "PEOPLE" },
    { name: "Leave Requests", icon: CalendarDays },
    { name: "Announcements", icon: Megaphone, section: "UPDATES" }
  ];

  function navigate(name) { setPage(name); setMobileMenu(false); setSearch(""); }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={23} strokeWidth={2.6} /></div>
          <div><strong>StaffSync</strong><span>PEOPLE PLATFORM</span></div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={19}/></button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-logo">N</div><div><strong>Northstar Studio</strong><span>Free workspace</span></div><ChevronDown size={15}/>
        </div>
        <nav className="nav-list">
          {navItems.map((item, index) => <div key={item.name}>
            {item.section && <p className="nav-section">{item.section}</p>}
            <button className={`nav-item ${page === item.name ? "selected" : ""}`} onClick={() => navigate(item.name)}>
              <item.icon size={18} strokeWidth={1.9}/><span>{item.name}</span>
              {item.name === "Leave Requests" && stats.pendingLeaves > 0 && <em>{stats.pendingLeaves}</em>}
            </button>
          </div>)}
        </nav>
        <div className="sidebar-spacer"/>
        <div className="sidebar-help"><div className="help-icon"><CircleHelp size={18}/></div><div><strong>Need a hand?</strong><span>Visit the help center</span></div><ChevronDown size={14}/></div>
        <div className="profile">
          <div className="profile-avatar">HR</div><div className="profile-text"><strong>HR Administrator</strong><span>Admin workspace</span></div><button title="Settings"><Settings size={17}/></button>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu/></button>
          <div className="top-search"><Search size={17}/><input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌘ K</kbd></div>
          <div className="top-actions"><span className="date-label"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span><button className="icon-button notification-button" title="Notifications"><Bell size={18}/><i/></button><div className="top-divider"/><div className="top-user"><div className="top-avatar">HR</div><ChevronDown size={15}/></div></div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="breadcrumbs">Workspace <span>/</span> {page}</div><h1>{page === "Dashboard" ? "Good morning, Admin" : page}</h1><p>{page === "Dashboard" ? "Here's what's happening with your team today." : pageDescriptions[page]}</p></div>
            <div className="heading-actions">{page === "Employees" && <button className="btn btn-primary" onClick={openNewEmployee}><Plus size={17}/> Add employee</button>}{page === "Leave Requests" && <button className="btn btn-primary" onClick={() => setLeaveModal(true)}><Plus size={17}/> New request</button>}{page === "Announcements" && <button className="btn btn-primary" onClick={() => setAnnouncementModal(true)}><Plus size={17}/> New announcement</button>}</div>
          </div>

          {error && <div className="alert error-alert"><XCircle size={18}/><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}
          {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}</div>}
          {loading && <div className="loading-line"><span/> Loading your workspace…</div>}

          {page === "Dashboard" && <Dashboard stats={stats} employees={employees} leaves={leaves} announcements={announcements} onNavigate={navigate}/>}
          {page === "Employees" && <Employees employees={filteredEmployees} search={search} setSearch={setSearch} onAdd={openNewEmployee} onEdit={openEditEmployee} onDelete={removeEmployee}/>}
          {page === "Departments" && <Departments employees={employees}/>}
          {page === "Attendance" && <Attendance employees={employees} records={attendance} date={attendanceDate} setDate={setAttendanceDate} draft={attendanceDraft} setDraft={setAttendanceDraft} onSave={saveAttendance}/>}
          {page === "Leave Requests" && <Leaves leaves={leaves} employees={employees} onNew={() => setLeaveModal(true)} onUpdate={updateLeave}/>}
          {page === "Announcements" && <Announcements items={announcements} onNew={() => setAnnouncementModal(true)}/>}

          <footer className="footer"><span>© 2026 StaffSync, Inc.</span><span><span className="footer-dot"/> All systems operational <span className="footer-separator">·</span> Made for better work</span></footer>
        </div>
      </main>

      {employeeModal && <Modal title={employeeModal.mode === "edit" ? "Edit employee" : "Add employee"} subtitle="Employee information is stored in your local StaffSync data file." onClose={() => setEmployeeModal(null)}>
        <form className="form-grid" onSubmit={saveEmployee}>
          <label>Full name<input autoFocus required value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm,name:e.target.value})} placeholder="e.g. Jordan Lee"/></label>
          <label>Work email<input type="email" value={employeeForm.email} onChange={e => setEmployeeForm({...employeeForm,email:e.target.value})} placeholder="name@company.com"/></label>
          <label>Job title<input required value={employeeForm.role} onChange={e => setEmployeeForm({...employeeForm,role:e.target.value})} placeholder="e.g. Product Designer"/></label>
          <label>Department<select value={employeeForm.department} onChange={e => setEmployeeForm({...employeeForm,department:e.target.value})}>{departments.map(d=><option key={d}>{d}</option>)}</select></label>
          <div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setEmployeeModal(null)}>Cancel</button><button className="btn btn-primary" type="submit"><Check size={16}/>{employeeModal.mode === "edit" ? "Save changes" : "Add employee"}</button></div>
        </form>
      </Modal>}

      {leaveModal && <Modal title="New leave request" subtitle="Submit a leave request for an employee." onClose={() => setLeaveModal(false)}>
        <form className="form-grid" onSubmit={submitLeave}>
          <label className="full-field">Employee<select required value={leaveForm.employeeId} onChange={e => setLeaveForm({...leaveForm,employeeId:e.target.value})}><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
          <label>Leave type<select value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm,type:e.target.value})}><option>Annual Leave</option><option>Sick Leave</option><option>Personal Leave</option><option>Unpaid Leave</option></select></label>
          <label>Start date<input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm,startDate:e.target.value})}/></label>
          <label>End date<input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm,endDate:e.target.value})}/></label>
          <label className="full-field">Reason<textarea required rows="3" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm,reason:e.target.value})} placeholder="Briefly describe the reason"/></label>
          <div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setLeaveModal(false)}>Cancel</button><button className="btn btn-primary" type="submit">Submit request</button></div>
        </form>
      </Modal>}

      {announcementModal && <Modal title="New announcement" subtitle="Share an update with your workspace." onClose={() => setAnnouncementModal(false)}>
        <form className="form-grid" onSubmit={submitAnnouncement}>
          <label className="full-field">Title<input required value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm,title:e.target.value})} placeholder="Announcement title"/></label>
          <label className="full-field">Message<textarea required rows="4" value={announcementForm.message} onChange={e=>setAnnouncementForm({...announcementForm,message:e.target.value})} placeholder="Write your announcement…"/></label>
          <div className="modal-actions"><button type="button" className="btn btn-light" onClick={()=>setAnnouncementModal(false)}>Cancel</button><button className="btn btn-primary" type="submit"><Megaphone size={16}/> Publish</button></div>
        </form>
      </Modal>}
    </div>
  );
}

const pageDescriptions = {
  Employees: "Manage your people, roles, and team information.",
  Departments: "See how your people are distributed across teams.",
  Attendance: "Track daily attendance and update team records.",
  "Leave Requests": "Review, approve, and manage time-off requests.",
  Announcements: "Keep everyone aligned with the latest updates."
};

function Dashboard({ stats, employees, leaves, announcements, onNavigate }) {
  const recentEmployees = [...employees].slice(-4).reverse();
  return <div className="dashboard-view">
    <section className="hero-card"><div className="hero-copy"><span className="hero-eyebrow"><span/> YOUR PEOPLE, IN SYNC</span><h2>Great teams start<br/>with <em>great people.</em></h2><p>Your team's workday, made a little simpler. Here's your workspace at a glance.</p><button className="btn hero-button" onClick={() => onNavigate("Employees")}>Explore your team <ArrowUpRight size={16}/></button></div><div className="hero-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-sun"/><div className="hero-person person-one">JS</div><div className="hero-person person-two">AK</div><div className="hero-person person-three">ML</div><div className="hero-person person-four">+</div><div className="hero-floating-card"><span className="mini-check"><Check size={14}/></span><div><strong>Team in sync</strong><small>You're doing great!</small></div></div></div></section>
    <div className="section-title-row"><div><h2>At a glance</h2><p>Your workspace overview</p></div><span className="live-chip"><span/> Live overview</span></div>
    <section className="stats-grid">
      <StatCard icon={Users} label="Total employees" value={stats.totalEmployees} foot="Across your workspace" tone="lavender" trend="+12.5%" trendUp/>
      <StatCard icon={ShieldCheck} label="Active employees" value={stats.activeEmployees} foot="Currently active" tone="mint" trend="On track" trendUp/>
      <StatCard icon={Building2} label="Departments" value={stats.departments} foot="Teams represented" tone="blue" trend="Organized"/>
      <StatCard icon={CalendarDays} label="Pending leave" value={stats.pendingLeaves} foot="Awaiting a decision" tone="peach" trend={stats.pendingLeaves ? "Needs review" : "All caught up"}/>
    </section>
    <div className="content-grid">
      <section className="panel recent-panel"><div className="panel-heading"><div><h3>People at StaffSync</h3><p>Your latest team members</p></div><button className="text-button" onClick={() => onNavigate("Employees")}>View all <ArrowUpRight size={15}/></button></div>
        <div className="recent-list">{recentEmployees.map((e,i)=><div className="recent-person" key={e.id}><div className={`person-avatar avatar-${i%5}`}>{initials(e.name)}</div><div className="person-info"><strong>{e.name}</strong><span>{e.role}</span></div><div className="person-dept">{e.department}</div><StatusPill status={e.status}/></div>)}{!recentEmployees.length&&<Empty message="No employees yet. Add your first team member."/>}</div>
      </section>
      <section className="panel announcement-panel"><div className="panel-heading"><div><h3>What's happening</h3><p>Latest announcements</p></div><div className="panel-icon"><Megaphone size={18}/></div></div>
        <div className="announcement-list">{announcements.slice(0,3).map((a,i)=><div className="announcement-item" key={a.id}><div className={`announcement-mark mark-${i%3}`}><Megaphone size={16}/></div><div><strong>{a.title}</strong><p>{a.message}</p><small>{a.date}</small></div></div>)}{!announcements.length&&<Empty message="No announcements yet."/>}</div><button className="wide-light-button" onClick={() => onNavigate("Announcements")}>View announcements <ArrowUpRight size={15}/></button>
      </section>
    </div>
    <section className="panel quick-panel"><div className="panel-heading"><div><h3>Quick actions</h3><p>Common tasks, right at your fingertips</p></div></div><div className="quick-actions"><button onClick={() => onNavigate("Employees")}><span className="quick-icon qi-purple"><Users size={19}/></span><span><strong>Manage employees</strong><small>View your team directory</small></span><ArrowUpRight size={17}/></button><button onClick={() => onNavigate("Attendance")}><span className="quick-icon qi-green"><CalendarCheck size={19}/></span><span><strong>Mark attendance</strong><small>Update today's records</small></span><ArrowUpRight size={17}/></button><button onClick={() => onNavigate("Leave Requests")}><span className="quick-icon qi-orange"><ClipboardList size={19}/></span><span><strong>Review leave</strong><small>{leaves.filter(l=>l.status==="Pending").length} requests need attention</small></span><ArrowUpRight size={17}/></button></div></section>
  </div>;
}

function StatCard({ icon: Icon, label, value, foot, tone, trend, trendUp }) {
  return <article className="stat-card"><div className="stat-card-top"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><span className={`stat-trend ${trendUp ? "trend-up" : ""}`}>{trendUp && <ArrowUpRight size={13} />}{trend}</span></div><div className="stat-number">{value}</div><div className="stat-label">{label}</div><div className="stat-foot">{foot}</div></article>;
}

function Employees({ employees, search, setSearch, onAdd, onEdit, onDelete }) {
  return <section className="panel table-panel"><div className="table-toolbar"><div className="table-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, role, department…"/></div><span className="result-count">{employees.length} team members</span></div><div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>ROLE</th><th>DEPARTMENT</th><th>STATUS</th><th>JOINED</th><th className="action-col">ACTIONS</th></tr></thead><tbody>{employees.map((e,i)=><tr key={e.id}><td><div className="table-person"><div className={`person-avatar avatar-${i%5}`}>{initials(e.name)}</div><div><strong>{e.name}</strong><small>{e.email || "No email added"}</small></div></div></td><td>{e.role}</td><td><span className="department-chip">{e.department}</span></td><td><StatusPill status={e.status}/></td><td>{e.joined || "—"}</td><td><div className="row-actions"><button title="Edit employee" onClick={()=>onEdit(e)}><Pencil size={15}/></button><button title="Delete employee" onClick={()=>onDelete(e)}><Trash2 size={15}/></button></div></td></tr>)}{!employees.length&&<tr><td colSpan="6"><Empty message="No employees found. Try another search or add a team member."/></td></tr>}</tbody></table></div><div className="table-bottom"><span>Showing <strong>{employees.length}</strong> team members</span><button className="btn btn-primary" onClick={onAdd}><Plus size={16}/> Add employee</button></div></section>;
}

function Departments({ employees }) {
  const colors = ["lavender","mint","blue","peach","pink","sand","gray"];
  const grouped = departments.map((name,i)=>({name,people:employees.filter(e=>e.department===name)})).filter(d=>d.people.length);
  return <div className="department-grid">{grouped.map((d,i)=><section className="panel department-card" key={d.name}><div className={`department-symbol ${colors[i%colors.length]}`}><Building2 size={22}/></div><h3>{d.name}</h3><p>{d.people.length} {d.people.length===1?"team member":"team members"}</p><div className="avatar-stack">{d.people.slice(0,4).map((e,j)=><div className={`person-avatar avatar-${j%5}`} key={e.id} title={e.name}>{initials(e.name)}</div>)}</div><div className="department-members">{d.people.slice(0,4).map(e=><span key={e.id}>{e.name}</span>)}</div></section>)}{!grouped.length&&<section className="panel"><Empty message="Add employees to see departments here."/></section>}</div>;
}

function Attendance({ employees, records, date, setDate, draft, setDraft, onSave }) {
  return <div className="panel table-panel"><div className="attendance-header"><div><h3>Daily attendance</h3><p>Choose a status for each employee and save the record.</p></div><label className="date-input"><CalendarDays size={16}/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><div className="attendance-summary"><span><i className="summary-dot present"/> Present <strong>{records.filter(r=>r.status==="Present").length}</strong></span><span><i className="summary-dot absent"/> Absent <strong>{records.filter(r=>r.status==="Absent").length}</strong></span><span><i className="summary-dot late"/> Late <strong>{records.filter(r=>r.status==="Late").length}</strong></span></div><div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{employees.map((e,i)=><tr key={e.id}><td><div className="table-person"><div className={`person-avatar avatar-${i%5}`}>{initials(e.name)}</div><div><strong>{e.name}</strong><small>{e.role}</small></div></div></td><td>{e.department}</td><td><select className={`attendance-select ${String(draft[e.id]||"Present").toLowerCase()}`} value={draft[e.id]||"Present"} onChange={ev=>setDraft({...draft,[e.id]:ev.target.value})}><option>Present</option><option>Absent</option><option>Late</option></select></td><td><button className="btn btn-light btn-small" onClick={()=>onSave(e.id)}><Check size={15}/> Save</button></td></tr>)}</tbody></table>{!employees.length&&<Empty message="Add employees before recording attendance." />}</div></div>;
}

function Leaves({ leaves, employees, onNew, onUpdate }) {
  return <section className="panel table-panel"><div className="panel-heading leave-heading"><div><h3>Time off requests</h3><p>Review employee leave requests and make a decision.</p></div><button className="btn btn-primary" onClick={onNew}><Plus size={16}/> New request</button></div><div className="leave-list">{leaves.map(l=><article className="leave-card" key={l.id}><div className="leave-avatar">{initials(l.employeeName)}</div><div className="leave-main"><div className="leave-title"><strong>{l.employeeName}</strong><StatusPill status={l.status}/></div><span className="leave-type">{l.type}</span><p>{l.reason}</p><div className="leave-dates"><CalendarDays size={14}/>{l.startDate} <span>to</span> {l.endDate}</div></div>{l.status==="Pending"&&<div className="leave-actions"><button className="approve-button" onClick={()=>onUpdate(l,"Approved")} title="Approve"><Check size={16}/> Approve</button><button className="reject-button" onClick={()=>onUpdate(l,"Rejected")} title="Reject"><X size={16}/> Reject</button></div>}</article>)}{!leaves.length&&<Empty message="No leave requests yet."/>}</div></section>;
}

function Announcements({ items, onNew }) {
  return <section className="announcement-page"><div className="announcement-page-intro"><div className="announcement-large-icon"><Megaphone size={25}/></div><div><h3>Workspace announcements</h3><p>Important updates for everyone on your team.</p></div></div>{items.map((a,i)=><article className="panel announcement-full" key={a.id}><div className={`announcement-mark mark-${i%3}`}><Megaphone size={18}/></div><div className="announcement-full-content"><div className="announcement-meta"><span>WORKSPACE UPDATE</span><time>{a.date}</time></div><h3>{a.title}</h3><p>{a.message}</p></div></article>)}{!items.length&&<section className="panel"><Empty message="No announcements yet. Publish the first update."/></section>}<button className="btn btn-primary" onClick={onNew}><Plus size={16}/> New announcement</button></section>;
}

function StatusPill({ status }) {
  const cls = status === "Active" || status === "Present" || status === "Approved" ? "status-good" : status === "Pending" || status === "Late" || status === "On Leave" ? "status-warn" : status === "Rejected" || status === "Absent" ? "status-bad" : "status-neutral";
  return <span className={`status-pill ${cls}`}><i/>{status}</span>;
}
function Empty({ message }) { return <div className="empty-state"><div className="empty-icon"><Users size={20}/></div><strong>{message}</strong></div>; }
function Modal({ title, subtitle, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal"><header className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></header>{children}</section></div>;
}

export default App;
