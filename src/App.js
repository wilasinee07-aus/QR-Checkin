import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

// --- Config (ห้ามเปลี่ยน) ---
const firebaseConfig = {
  apiKey: "AIzaSyBWSz3ZEZ-gzTVCKvflB43Kx2UMoouF8JE",
  authDomain: "checkinsystem-58299.firebaseapp.com",
  projectId: "checkinsystem-58299",
  storageBucket: "checkinsystem-58299.firebasestorage.app",
  messagingSenderId: "514481199105",
  appId: "1:514481199105:web:c803a5debdafe6c9528800",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 🎨 Theme: Monday Style ---
const colors = {
  primary: "#0073EA",
  primaryDark: "#0060B9",
  secondary: "#323338",
  background: "#F5F6F8",
  surface: "#FFFFFF",
  text: "#323338",
  textLight: "#676879",
  border: "#D0D4E4",
  success: "#00C875",
  warning: "#FDAB3D",
  error: "#E2445C",
};

const logoPath = "/logo.jpg";

// --- ✨ Global Styles (Fixed Grid Layout) ---
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background-color: ${colors.background};
      font-family: 'Prompt', sans-serif;
      color: ${colors.text};
      overflow: hidden; /* ป้องกัน scrollbar ซ้อน */
    }

    /* --- LAYOUT SYSTEM (GRID) --- */
    .app-root {
      display: grid;
      grid-template-columns: 260px 1fr; /* Sidebar | Content */
      grid-template-rows: 100vh;
      width: 100vw; height: 100vh;
    }

    /* Sidebar (Desktop) */
    .sidebar {
      background: ${colors.surface};
      border-right: 1px solid ${colors.border};
      padding: 24px;
      display: flex; flex-direction: column;
      z-index: 50;
    }

    /* Main Content Area */
    .content-area {
      background: ${colors.background};
      padding: 32px;
      overflow-y: auto; /* Scroll เฉพาะส่วนเนื้อหา */
      position: relative;
    }

    /* --- AUTH SCREEN (CENTERING FIX) --- */
    .auth-wrapper {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: ${colors.background};
      z-index: 1000; padding: 20px;
    }
    .auth-card {
      background: ${colors.surface};
      width: 100%; max-width: 400px;
      padding: 40px 32px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      text-align: center;
    }

    /* --- MOBILE RESPONSIVE --- */
    .mobile-bar { display: none; }

    @media (max-width: 768px) {
      .app-root {
        grid-template-columns: 1fr; /* เหลือคอลัมน์เดียว */
        grid-template-rows: 1fr 70px; /* Content | Bottom Bar */
      }
      .sidebar { display: none; } /* ซ่อน Sidebar */
      .content-area { padding: 16px; padding-bottom: 20px; }
      
      .mobile-bar {
        display: flex;
        background: ${colors.surface};
        border-top: 1px solid ${colors.border};
        justify-content: space-around;
        align-items: center;
        z-index: 100;
        box-shadow: 0 -5px 20px rgba(0,0,0,0.05);
      }
      
      /* Floating FAB Fix */
      .fab-container {
        position: relative; top: -25px;
        width: 60px; height: 60px;
      }
      .fab-btn {
        width: 100%; height: 100%;
        background: ${colors.primary};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 1.8rem;
        box-shadow: 0 8px 20px rgba(0, 115, 234, 0.4);
        border: 5px solid ${colors.background};
      }
    }

    /* --- COMPONENTS --- */
    .card {
      background: ${colors.surface}; border-radius: 12px; padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid ${colors.border};
      margin-bottom: 20px;
    }

    .hero-widget {
      background: ${colors.primary}; color: white;
      border-radius: 16px; padding: 32px; margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(0, 115, 234, 0.3);
    }
    .hero-widget h1 { margin: 0; font-size: 2.5rem; font-weight: 700; }

    /* Filter Tabs */
    .filter-bar { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px; }
    .filter-chip {
      padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; cursor: pointer;
      background: white; border: 1px solid ${colors.border}; color: ${colors.textLight}; transition: 0.2s;
      white-space: nowrap;
    }
    .filter-chip.active {
      background: ${colors.primary}; color: white; border-color: ${colors.primary}; font-weight: 600;
    }

    .student-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; border-bottom: 1px solid ${colors.background};
    }
    .student-row:last-child { border-bottom: none; }

    /* Scanner Fullscreen */
    .scanner-modal {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 9999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .scanner-box {
      width: 100%; max-width: 500px; aspect-ratio: 1/1; 
      background: black; border-radius: 24px; overflow: hidden; position: relative; border: 4px solid white;
    }
    #reader { width: 100%; height: 100%; }
    #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }

    .input-box {
      width: 100%; padding: 12px 16px; border-radius: 8px;
      border: 1px solid ${colors.border}; outline: none; margin-bottom: 12px;
      font-family: 'Prompt'; font-size: 1rem;
    }
    .btn-primary { background: ${colors.primary}; color: white; width: 100%; padding: 14px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-link { background: none; border: none; color: ${colors.primary}; cursor: pointer; font-size: 0.9rem; font-weight: 600; text-decoration: underline; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 2000;
      backdrop-filter: blur(3px);
    }
    .modal-content {
      background: white; padding: 32px; border-radius: 16px;
      width: 90%; max-width: 350px; text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    }
  `}</style>
);

const Loading = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.primary,
    }}
  >
    Loading...
  </div>
);

const Modal = ({ isOpen, type, title, msg, onOk, onCancel, input }) => {
  const [val, setVal] = useState("");
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>
          {type === "success" ? "🎉" : type === "error" ? "⚠️" : "📝"}
        </div>
        <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
        <p style={{ color: colors.textLight, marginBottom: 24 }}>{msg}</p>
        {input && (
          <input
            className="input-box"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="..."
          />
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" onClick={() => onOk(val)}>
            ตกลง
          </button>
          {(type === "confirm" || onCancel) && (
            <button
              className="btn-primary"
              style={{
                background: "white",
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
              onClick={onCancel}
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false });

  const alert = (
    type,
    title,
    msg,
    onOk = () => {},
    onCancel = null,
    input = false
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      msg,
      onOk: (v) => {
        setModal((p) => ({ ...p, isOpen: false }));
        onOk(v);
      },
      onCancel: onCancel
        ? () => {
            setModal((p) => ({ ...p, isOpen: false }));
            onCancel();
          }
        : null,
      input,
    });
  };

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (u) {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists() && !d.data().isDeleted) {
            setUser({ ...u, ...d.data() });
            setPage("home");
          } else {
            await signOut(auth);
            setUser(null);
            setPage("login");
          }
        } else {
          setUser(null);
          setPage("login");
        }
        setLoading(false);
      }),
    []
  );

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setPage("login");
  };

  if (loading)
    return (
      <>
        <GlobalStyle />
        <Loading />
      </>
    );

  // --- Auth Logic handled separately ---
  if (!user) return <AuthScreen page={page} setPage={setPage} alert={alert} />;

  return (
    <div className="app-root">
      <GlobalStyle />
      <Modal {...modal} />

      {/* Sidebar (Desktop) */}
      <div className="sidebar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <img
            src={logoPath}
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
          <div
            style={{
              fontWeight: 700,
              color: colors.primary,
              fontSize: "1.2rem",
            }}
          >
            Check-in
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavItem
            icon="🏠"
            label="หน้าหลัก (เช็คชื่อ)"
            active={page === "home"}
            onClick={() => setPage("home")}
          />
          {user.role === "teacher" && (
            <NavItem
              icon="👥"
              label="จัดการรายชื่อ"
              active={page === "users"}
              onClick={() => setPage("users")}
            />
          )}
          <NavItem
            icon="📷"
            label={user.role === "teacher" ? "QR Code" : "สแกน"}
            active={page === "scan"}
            onClick={() => setPage("scan")}
          />
        </div>
        <div
          style={{
            marginTop: "auto",
            cursor: "pointer",
            color: colors.error,
            fontWeight: 600,
          }}
          onClick={logout}
        >
          🚪 ออกจากระบบ
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content-area">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: colors.secondary }}>
              สวัสดี, {user.name}
            </h2>
            <span style={{ color: colors.textLight }}>
              {user.role === "teacher" ? "อาจารย์" : `นักเรียน (${user.level})`}
            </span>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.5rem",
            }}
          >
            {user.name.charAt(0)}
          </div>
        </div>

        {/* Content Pages */}
        {user.role === "teacher" ? (
          <TeacherDashboard page={page} setPage={setPage} alert={alert} />
        ) : (
          <StudentDashboard
            user={user}
            page={page}
            setPage={setPage}
            setUser={setUser}
          />
        )}
      </div>

      {/* Mobile Bottom Bar (Fixed) */}
      <div className="mobile-bar">
        <MobileNav
          icon="🏠"
          label="หน้าหลัก"
          active={page === "home"}
          onClick={() => setPage("home")}
        />

        <div className="fab-container" onClick={() => setPage("scan")}>
          <div className="fab-btn">{user.role === "teacher" ? "🚀" : "📷"}</div>
        </div>

        {user.role === "teacher" ? (
          <MobileNav
            icon="👥"
            label="รายชื่อ"
            active={page === "users"}
            onClick={() => setPage("users")}
          />
        ) : (
          <MobileNav icon="🚪" label="ออก" onClick={logout} />
        )}
      </div>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: "12px 16px",
      borderRadius: 8,
      cursor: "pointer",
      background: active ? "#E1F0FF" : "transparent",
      color: active ? colors.primary : colors.text,
      fontWeight: active ? 600 : 400,
      display: "flex",
      gap: 12,
      alignItems: "center",
    }}
  >
    <span style={{ fontSize: "1.2rem" }}>{icon}</span> {label}
  </div>
);
const MobileNav = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      flex: 1,
      opacity: active ? 1 : 0.5,
      color: active ? colors.primary : colors.textLight,
    }}
  >
    <div style={{ fontSize: "1.5rem", marginBottom: 2 }}>{icon}</div>
    <div style={{ fontSize: "0.7rem", fontWeight: 600 }}>{label}</div>
  </div>
);

// --- Teacher Logic ---
function TeacherDashboard({ page, setPage, alert }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [level, setLevel] = useState("all");

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "users"), where("role", "==", "student")),
        (s) =>
          setStudents(
            s.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((u) => !u.isDeleted)
          )
      ),
    []
  );
  useEffect(
    () =>
      onSnapshot(collection(db, "attendance_logs"), (s) =>
        setLogs(
          s.docs
            .map((d) => d.data())
            .filter(
              (l) => l.timestamp?.toDate().toISOString().split("T")[0] === date
            )
        )
      ),
    [date]
  );

  const studentsInLevel = students.filter(
    (s) => level === "all" || s.level === level
  );

  const report = studentsInLevel.map((s) => {
    const log = logs.find((l) => l.studentUid === s.id);
    return {
      ...s,
      status: log ? log.status : "absent",
      logTime: log ? log.timestamp.toDate() : null,
    };
  });

  const present = report.filter((r) => r.status === "present").length;
  const late = report.filter((r) => r.status === "late").length;
  const absent = report.filter((r) => r.status === "absent").length;

  const filteredList = report.filter(
    (s) => filter === "all" || s.status === filter
  );

  if (page === "scan") return <TeacherQR />;
  if (page === "users")
    return <TeacherUserList students={students} alert={alert} />;

  return (
    <>
      <div className="hero-widget">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <p>เข้าเรียนวันนี้ ({level === "all" ? "ทั้งหมด" : level})</p>
            <h1>
              {present + late} / {studentsInLevel.length}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                borderRadius: 8,
                padding: "8px 12px",
                outline: "none",
                fontFamily: "Prompt",
              }}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all" style={{ color: "black" }}>
                ทุกชั้นปี
              </option>
              {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
                <option key={l} value={l} style={{ color: "black" }}>
                  {l}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                borderRadius: 8,
                padding: "8px 12px",
                outline: "none",
                fontFamily: "Prompt",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatBox label="มาปกติ" val={present} color={colors.success} />
        <StatBox label="มาสาย" val={late} color={colors.warning} />
        <StatBox label="ขาด" val={absent} color={colors.error} />
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>รายการเช็คชื่อ</h3>
        </div>
        <div className="filter-bar">
          {["all", "present", "late", "absent"].map((f) => (
            <div
              key={f}
              className={`filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? "ทั้งหมด"
                : f === "present"
                ? "มาปกติ"
                : f === "late"
                ? "มาสาย"
                : "ขาด/ยังไม่มา"}
            </div>
          ))}
        </div>

        {filteredList.map((s) => (
          <div key={s.id} className="student-row">
            <div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: "0.85rem", color: colors.textLight }}>
                {s.level} #{s.studentId}
                {s.logTime &&
                  ` • ${s.logTime.toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </div>
            </div>
            <StatusBadge status={s.status} />
          </div>
        ))}
        {filteredList.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: colors.textLight,
              padding: 20,
            }}
          >
            ไม่พบข้อมูล
          </div>
        )}
      </div>
    </>
  );
}

function TeacherUserList({ students, alert }) {
  const [level, setLevel] = useState("all");
  const filtered = students.filter((s) => level === "all" || s.level === level);

  const del = (id, name) =>
    alert("confirm", "ลบข้อมูล?", `ยืนยันลบ ${name} ออกจากระบบ?`, async () => {
      try {
        await updateDoc(doc(db, "users", id), { isDeleted: true });
      } catch (e) {}
    });

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>จัดการรายชื่อ ({filtered.length})</h3>
        <select
          className="input-box"
          style={{ width: "auto", marginBottom: 0, padding: "6px 12px" }}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">ทุกชั้นปี</option>
          {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {filtered.map((s) => (
        <div key={s.id} className="student-row">
          <div>
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: "0.85rem", color: colors.textLight }}>
              {s.level} #{s.studentId}
            </div>
          </div>
          <button
            onClick={() => del(s.id, s.name)}
            style={{
              border: "none",
              background: "#FFEBEE",
              color: colors.error,
              borderRadius: 4,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ลบ
          </button>
        </div>
      ))}
    </div>
  );
}

function TeacherQR() {
  const [code, setCode] = useState("loading");
  useEffect(() => {
    const gen = () =>
      setCode(Math.random().toString(36).substring(7).toUpperCase());
    gen();
    const i = setInterval(gen, 60000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="card" style={{ textAlign: "center", padding: 40 }}>
      <h3 style={{ marginBottom: 24, color: colors.primary }}>QR Check-in</h3>
      <div
        style={{
          padding: 24,
          background: "white",
          borderRadius: 16,
          border: `2px dashed ${colors.primary}`,
          display: "inline-block",
        }}
      >
        <QRCode value={code} size={220} />
      </div>
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          margin: "24px 0",
          letterSpacing: 4,
        }}
      >
        {code}
      </div>
      <p style={{ color: colors.textLight }}>QR Code เปลี่ยนทุก 60 วินาที</p>
    </div>
  );
}

// --- Student Logic ---
function StudentDashboard({ user, page, setPage, setUser }) {
  if (page === "scan")
    return <ScannerOverlay user={user} close={() => setPage("home")} />;

  const saveProfile = async (name, level, studentId) => {
    await updateDoc(doc(db, "users", user.uid), { name, level, studentId });
    setUser({ ...user, name, level, studentId });
    alert("บันทึกข้อมูลเรียบร้อย");
  };

  return (
    <>
      <div
        className="hero-widget"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, #00C875)`,
        }}
      >
        <p>สถานะของคุณ</p>
        <h1>{user.level}</h1>
        <p>เลขที่ {user.studentId}</p>
      </div>

      {page === "home" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div
            className="card"
            onClick={() => setPage("scan")}
            style={{
              textAlign: "center",
              cursor: "pointer",
              border: `2px solid ${colors.primary}`,
              background: "#F0F7FF",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 8 }}>📷</div>
            <div style={{ fontWeight: 600, color: colors.primary }}>
              สแกนเข้าเรียน
            </div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 8 }}>📝</div>
            <div style={{ fontWeight: 600 }}>ประวัติย้อนหลัง</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>ประวัติการมาเรียน</h3>
        <StudentHistory uid={user.uid} />
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>แก้ไขข้อมูลส่วนตัว</h3>
        <input
          className="input-box"
          defaultValue={user.name}
          id="editName"
          placeholder="ชื่อ-สกุล"
        />
        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="input-box"
            defaultValue={user.level}
            id="editLevel"
          >
            {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <input
            className="input-box"
            defaultValue={user.studentId}
            id="editId"
            placeholder="เลขที่"
            type="number"
          />
        </div>
        <button
          className="btn-primary"
          onClick={() =>
            saveProfile(
              document.getElementById("editName").value,
              document.getElementById("editLevel").value,
              document.getElementById("editId").value
            )
          }
        >
          บันทึก
        </button>
      </div>
    </>
  );
}

function StudentHistory({ uid }) {
  const [logs, setLogs] = useState([]);
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, "attendance_logs"),
          where("studentUid", "==", uid),
          orderBy("timestamp", "desc")
        ),
        (s) => setLogs(s.docs.map((d) => d.data()))
      ),
    [uid]
  );
  if (logs.length === 0)
    return (
      <p style={{ textAlign: "center", color: colors.textLight }}>
        ยังไม่มีประวัติการเช็คชื่อ
      </p>
    );
  return logs.map((l, i) => (
    <div key={i} className="student-row">
      <div>
        <div style={{ fontWeight: 600 }}>{l.subjectCode}</div>
        <div style={{ fontSize: "0.85rem", color: colors.textLight }}>
          {l.timestamp?.toDate().toLocaleDateString("th-TH")}
        </div>
      </div>
      <StatusBadge status={l.status} />
    </div>
  ));
}

function ScannerOverlay({ user, close }) {
  const [status, setStatus] = useState("scanning");
  const isRun = useRef(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("reader");
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (txt) => {
            if (isRun.current) {
              await html5QrCode.stop();
              isRun.current = false;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const q = query(
              collection(db, "attendance_logs"),
              where("studentUid", "==", user.uid),
              where("timestamp", ">=", today)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              alert("วันนี้คุณเช็คชื่อไปแล้ว!");
              close();
              return;
            }
            const isLate = new Date() > new Date().setHours(7, 50, 0, 0);
            await addDoc(collection(db, "attendance_logs"), {
              studentUid: user.uid,
              studentName: user.name,
              level: user.level,
              studentId: user.studentId,
              subjectCode: txt,
              status: isLate ? "late" : "present",
              timestamp: serverTimestamp(),
            });
            setStatus("success");
          },
          () => {}
        );
        isRun.current = true;
      } catch (e) {}
    }, 500);
    return () => clearTimeout(t);
  }, []);

  if (status === "success")
    return (
      <div className="scanner-modal" style={{ background: "white" }}>
        <div style={{ fontSize: 80 }}>🎉</div>
        <h1 style={{ color: colors.primary }}>สำเร็จ!</h1>
        <button
          className="btn-primary"
          style={{ width: 200, marginTop: 20 }}
          onClick={close}
        >
          ตกลง
        </button>
      </div>
    );
  return (
    <div className="scanner-modal">
      <div className="scanner-box">
        <div id="reader"></div>
      </div>
      <button
        style={{
          position: "absolute",
          bottom: 50,
          background: "white",
          border: "none",
          padding: "12px 30px",
          borderRadius: 30,
          fontWeight: "bold",
          cursor: "pointer",
        }}
        onClick={close}
      >
        ปิดกล้อง
      </button>
    </div>
  );
}

// --- Helpers ---
const StatBox = ({ label, val, color }) => (
  <div
    className="card"
    style={{
      textAlign: "center",
      marginBottom: 0,
      padding: 16,
      borderTop: `4px solid ${color}`,
    }}
  >
    <div
      style={{ fontSize: "2rem", fontWeight: 700, color: color, lineHeight: 1 }}
    >
      {val}
    </div>
    <div style={{ fontSize: "0.8rem", color: colors.textLight }}>{label}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  let c = colors.success;
  let bg = "#E8F5E9";
  let t = "ทันเวลา";
  if (status === "late") {
    c = colors.warning;
    bg = "#FFF3E0";
    t = "มาสาย";
  }
  if (status === "absent") {
    c = colors.error;
    bg = "#FFEBEE";
    t = "ขาด";
  }
  return (
    <span
      style={{
        background: bg,
        color: c,
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {t}
    </span>
  );
};

// --- Auth Screen (Fixed Center) ---
const AuthScreen = ({ page, setPage, alert }) => {
  return (
    <div className="auth-wrapper">
      <GlobalStyle />
      <div className="auth-card">
        <img
          src={logoPath}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            marginBottom: 24,
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
          }}
        />
        <h2 style={{ color: colors.primary, margin: "0 0 24px" }}>
          ระบบเช็คชื่อ
        </h2>
        {page === "login" ? (
          <Login go={() => setPage("register")} alert={alert} />
        ) : (
          <Register go={() => setPage("login")} alert={alert} />
        )}
      </div>
    </div>
  );
};

const Login = ({ go, alert }) => {
  const [f, setF] = useState({ email: "", pass: "" });

  const forgotPassword = () => {
    alert(
      "input",
      "ลืมรหัสผ่าน?",
      "กรุณากรอกอีเมล:",
      async (email) => {
        if (!email) return;
        try {
          await sendPasswordResetEmail(auth, email);
          alert("success", "สำเร็จ", "ส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว");
        } catch (e) {
          alert("error", "ผิดพลาด", e.message);
        }
      },
      null,
      true
    );
  };

  return (
    <div style={{ textAlign: "left" }}>
      <input
        className="input-box"
        placeholder="อีเมล"
        onChange={(e) => setF({ ...f, email: e.target.value })}
      />
      <input
        className="input-box"
        type="password"
        placeholder="รหัสผ่าน"
        onChange={(e) => setF({ ...f, pass: e.target.value })}
      />
      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <span
          onClick={forgotPassword}
          style={{
            fontSize: "0.9rem",
            color: colors.primary,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ลืมรหัสผ่าน?
        </span>
      </div>
      <button
        className="btn-primary"
        onClick={async () => {
          try {
            await signInWithEmailAndPassword(auth, f.email, f.pass);
          } catch (e) {
            alert("error", "Error", "ข้อมูลไม่ถูกต้อง");
          }
        }}
      >
        เข้าสู่ระบบ
      </button>
      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: "0.9rem",
          color: colors.textLight,
        }}
      >
        ยังไม่มีบัญชี?{" "}
        <span
          onClick={go}
          style={{ color: colors.primary, cursor: "pointer", fontWeight: 600 }}
        >
          สมัครสมาชิก
        </span>
      </p>
    </div>
  );
};

const Register = ({ go, alert }) => {
  const [f, setF] = useState({
    email: "",
    pass: "",
    name: "",
    role: "student",
    level: "ปวช.1",
    id: "",
  });
  const reg = async () => {
    if (!f.email || !f.pass || !f.name)
      return alert("warning", "แจ้งเตือน", "กรอกให้ครบ");
    try {
      const c = await createUserWithEmailAndPassword(auth, f.email, f.pass);
      await setDoc(doc(db, "users", c.user.uid), {
        name: f.name,
        role: f.role,
        email: f.email,
        level: f.level,
        studentId: f.id,
        isDeleted: false,
      });
      alert("success", "สำเร็จ", "สมัครเรียบร้อย", () =>
        window.location.reload()
      );
    } catch (e) {
      alert("error", "Error", e.message);
    }
  };
  return (
    <div style={{ textAlign: "left" }}>
      <input
        className="input-box"
        placeholder="ชื่อ-สกุล"
        onChange={(e) => setF({ ...f, name: e.target.value })}
      />
      <input
        className="input-box"
        placeholder="อีเมล"
        onChange={(e) => setF({ ...f, email: e.target.value })}
      />
      <input
        className="input-box"
        type="password"
        placeholder="รหัสผ่าน"
        onChange={(e) => setF({ ...f, pass: e.target.value })}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <select
          className="input-box"
          onChange={(e) => setF({ ...f, role: e.target.value })}
        >
          <option value="student">นักเรียน</option>
          <option value="teacher">ครู</option>
        </select>
        {f.role === "student" && (
          <input
            className="input-box"
            placeholder="เลขที่"
            type="number"
            onChange={(e) => setF({ ...f, id: e.target.value })}
          />
        )}
      </div>
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={reg}>
        สมัครสมาชิก
      </button>
      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: "0.9rem",
          color: colors.textLight,
        }}
      >
        กลับไป{" "}
        <span
          onClick={go}
          style={{ color: colors.primary, cursor: "pointer", fontWeight: 600 }}
        >
          เข้าสู่ระบบ
        </span>
      </p>
    </div>
  );
};
