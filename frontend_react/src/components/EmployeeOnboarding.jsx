import { useState, useEffect } from "react";
import { createEmployee, getEmployees } from "../api";
import { cardStyle, inputStyle, buttonStyle, themeColors, typography, pillStyle } from "../styles";
import { UserPlus, Users, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function EmployeeOnboarding() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");
  const [teamId, setTeamId] = useState("Engineering");
  const [managerMode, setManagerMode] = useState("auto"); // "auto" | "manual"
  const [managerEmail, setManagerEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [badge, setBadge] = useState("");
  const [avatar, setAvatar] = useState("👤");

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" }); // type: "success" | "error"

  const fetchEmployeesList = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error("Failed to load employees list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      team_id: teamId.trim(),
      manager_email: managerMode === "manual" ? managerEmail.trim().toLowerCase() : null,
      department: department.trim() || teamId.trim(),
      badge: badge.trim() || role,
      avatar: avatar.trim() || "👤"
    };

    try {
      const res = await createEmployee(payload);
      if (res.status === "success" || res.id) {
        setMsg({ text: `Successfully onboarded employee ${payload.name}!`, type: "success" });
        // Reset form
        setName("");
        setEmail("");
        setManagerEmail("");
        setDepartment("");
        setBadge("");
        setAvatar("👤");
        fetchEmployeesList();
      } else {
        setMsg({ text: "Failed to onboard employee. Email might already exist.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Error communicating with server.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
      {/* Onboarding Form Card (Left) */}
      <div style={{ flex: "1.2 1 450px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <UserPlus size={22} style={{ color: themeColors.accentPrimary }} />
            <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
              Onboard New Employee
            </h3>
          </div>
          <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Provision access parameters, department tags, and manager routing instructions.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {msg.text && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                background: msg.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${msg.type === "success" ? themeColors.success : "rgba(239, 68, 68, 0.3)"}`,
                color: msg.type === "success" ? themeColors.success : themeColors.confidenceLow,
              }}>
                {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{msg.text}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@mindvault.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>SYSTEM ROLE</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ ...inputStyle, background: "#1E1E1E", height: "45px" }}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager (Team Lead)</option>
                  <option value="HR">HR Specialist</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>ORGANIZATIONAL TEAM</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  style={{ ...inputStyle, background: "#1E1E1E", height: "45px" }}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="HR Operations">HR Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>DEPARTMENT NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Software Development"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>TITLE BADGE</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>AVATAR EMOJI</label>
                <input
                  type="text"
                  placeholder="e.g. 💻"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>MANAGER ASSIGNMENT</label>
                <select
                  value={managerMode}
                  onChange={(e) => setManagerMode(e.target.value)}
                  style={{ ...inputStyle, background: "#1E1E1E", height: "45px" }}
                >
                  <option value="auto">Auto-assign team manager</option>
                  <option value="manual">Manual email assignment</option>
                </select>
              </div>
            </div>

            {managerMode === "manual" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: themeColors.textSecondary }}>MANAGER EMAIL</label>
                <input
                  type="email"
                  required={managerMode === "manual"}
                  placeholder="e.g. manager@mindvault.ai"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...buttonStyle,
                background: themeColors.accentPrimary,
                color: "#121212",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.5rem"
              }}
            >
              {submitting ? "Adding Employee..." : "Provision Employee Access"}
            </button>
          </form>
        </div>
      </div>

      {/* Directory List Card (Right) */}
      <div style={{ flex: "1.5 1 500px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ ...cardStyle, marginTop: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={22} style={{ color: themeColors.accentPrimary }} />
              <h3 style={{ ...typography.heading, fontSize: "1.25rem", margin: 0 }}>
                Active Directory
              </h3>
            </div>
            <button
              onClick={fetchEmployeesList}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: themeColors.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.8rem"
              }}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              Reload
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, color: themeColors.textSecondary }}>
                  <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Role</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Team</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>Manager</th>
                </tr>
              </thead>
              <tbody>
                {loading && employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: themeColors.textSecondary }}>
                      Loading directory...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: themeColors.textSecondary, fontStyle: "italic" }}>
                      No employees registered.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${themeColors.borderDivider}`, transition: "background 0.2s" }}>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.2rem" }}>{emp.avatar || "👤"}</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, color: themeColors.textPrimary }}>{emp.name}</span>
                            <span style={{ fontSize: "0.72rem", color: themeColors.textSecondary }}>{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{
                          ...pillStyle,
                          fontSize: "0.72rem",
                          color: emp.role === "HR" ? "#EC4899" : emp.role === "Manager" ? themeColors.accentPrimary : "#3B82F6",
                          background: emp.role === "HR" ? "rgba(236,72,153,0.08)" : emp.role === "Manager" ? "rgba(201,162,39,0.08)" : "rgba(59,130,246,0.08)",
                          borderColor: "transparent"
                        }}>
                          {emp.role}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: themeColors.textPrimary }}>
                        {emp.team_id}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: themeColors.textSecondary, fontSize: "0.8rem" }}>
                        {emp.manager_email || <span style={{ opacity: 0.5 }}>None (Leader)</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
