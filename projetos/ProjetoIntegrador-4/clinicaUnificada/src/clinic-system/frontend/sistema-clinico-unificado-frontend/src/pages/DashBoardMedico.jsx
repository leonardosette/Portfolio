import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/admin-dashboard.css";
import { apiFetch, getUser, logout } from "../utils/auth";

const STATUS_LABEL = {
  PENDING:     { label: "Aguardando Confirmação", cls: "bg-warning text-dark" },
  SCHEDULED:   { label: "Agendada",               cls: "bg-primary" },
  IN_PROGRESS: { label: "Em atendimento",          cls: "bg-warning text-dark" },
  COMPLETED:   { label: "Concluída",               cls: "bg-success" },
  CANCELLED:   { label: "Cancelada",               cls: "bg-secondary" },
};

const TYPE_LABEL = {
  FIRST_VISIT: "1ª Consulta",
  RETURN:      "Retorno",
};

const emptyRecord = {
  chiefComplaint: "", personalHistory: "", physicalExam: "",
  diagnosis: "", cid10: "", treatment: "", notes: "",
  prescriptionItems: [],
};

const emptyPrescItem = { medicationName: "", dosage: "", duration: "", notes: "" };

export default function DashBoardMedico() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeSection, setActiveSection]       = useState("agenda");
  const [sidebarOpen,   setSidebarOpen]          = useState(false);

  // ── dados da API ─────────────────────────────────────────────────────────
  const [todayAppts,    setTodayAppts]   = useState([]);
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [overview,      setOverview]     = useState(null);
  const [loading,       setLoading]      = useState(false);

  // ── consulta ativa ────────────────────────────────────────────────────────
  const [activeAppt,  setActiveAppt]   = useState(null);
  const [record,      setRecord]       = useState(emptyRecord);
  const [activeTab,   setActiveTab]    = useState("prontuario");
  const [saving,      setSaving]       = useState(false);
  const [saveMsg,     setSaveMsg]      = useState("");

  // ── prescrição ────────────────────────────────────────────────────────────
  const [prescItem,   setPrescItem]    = useState(emptyPrescItem);

  // ── modal walk-in ─────────────────────────────────────────────────────────
  const [showWalkIn,  setShowWalkIn]   = useState(false);
  const [searchQ,     setSearchQ]      = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,   setSearching]    = useState(false);
  const [walkInType,  setWalkInType]   = useState("FIRST_VISIT");

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchToday = useCallback(async () => {
    try {
      const res = await apiFetch("/api/doctor/consultations/today");
      if (res.ok) setTodayAppts(await res.json());
    } catch { /* silencioso */ }
  }, []);

  const fetchUpcoming = useCallback(async () => {
    try {
      const res = await apiFetch("/api/doctor/consultations/upcoming");
      if (res.ok) setUpcomingAppts(await res.json());
    } catch { /* silencioso */ }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await apiFetch("/api/doctor/consultations/overview");
      if (res.ok) setOverview(await res.json());
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchToday(), fetchUpcoming(), fetchOverview()]);
      setLoading(false);
    };
    load();
  }, [fetchToday, fetchUpcoming, fetchOverview]);

  // ── abrir consulta ────────────────────────────────────────────────────────
  const openConsultation = useCallback((appt) => {
    setActiveAppt(appt);
    setRecord({
      chiefComplaint:  appt.chiefComplaint  || "",
      personalHistory: appt.personalHistory || "",
      physicalExam:    appt.physicalExam    || "",
      diagnosis:       appt.diagnosis       || "",
      cid10:           appt.cid10           || "",
      treatment:       appt.treatment       || "",
      notes:           appt.notes           || "",
      prescriptionItems: appt.prescriptionItems || [],
    });
    setActiveTab("prontuario");
    setSaveMsg("");
    setActiveSection("consultation");
  }, []);

  const startAppointment = async (appt) => {
    if (appt.status === "IN_PROGRESS") { openConsultation(appt); return; }
    const res = await apiFetch(`/api/doctor/consultations/${appt.id}/start`, { method: "POST" });
    if (res.ok) { const updated = await res.json(); openConsultation(updated); }
  };

  // ── walk-in ───────────────────────────────────────────────────────────────
  const searchPatients = async () => {
    if (searchQ.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await apiFetch(`/api/doctor/patients/search?q=${encodeURIComponent(searchQ)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch { /* silencioso */ } finally { setSearching(false); }
  };

  const startWalkIn = async (patient) => {
    const res = await apiFetch("/api/doctor/consultations/walkin", {
      method: "POST",
      body: JSON.stringify({ patientId: patient.id, type: walkInType }),
    });
    if (res.ok) {
      const appt = await res.json();
      setShowWalkIn(false);
      setSearchQ(""); setSearchResults([]);
      await fetchToday(); await fetchOverview();
      openConsultation(appt);
    }
  };

  // ── salvar rascunho ───────────────────────────────────────────────────────
  const saveRecord = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const res = await apiFetch(`/api/doctor/consultations/${activeAppt.id}/save`, {
        method: "POST",
        body: JSON.stringify(record),
      });
      if (res.ok) { setSaveMsg("Rascunho salvo!"); setTimeout(() => setSaveMsg(""), 3000); }
      else setSaveMsg("Erro ao salvar.");
    } catch { setSaveMsg("Erro de conexão."); } finally { setSaving(false); }
  };

  // ── finalizar consulta ────────────────────────────────────────────────────
  const finalizeConsultation = async () => {
    if (!window.confirm("Finalizar a consulta? Não será possível editar depois.")) return;
    setSaving(true); setSaveMsg("");
    try {
      const res = await apiFetch(`/api/doctor/consultations/${activeAppt.id}/finalize`, {
        method: "POST",
        body: JSON.stringify(record),
      });
      if (res.ok) {
        setSaveMsg("Consulta finalizada com sucesso!");
        await fetchToday(); await fetchOverview();
        setTimeout(() => { setActiveAppt(null); setRecord(emptyRecord); setActiveSection("agenda"); }, 1500);
      } else setSaveMsg("Erro ao finalizar.");
    } catch { setSaveMsg("Erro de conexão."); } finally { setSaving(false); }
  };

  // ── prescrição ────────────────────────────────────────────────────────────
  const addPrescItem = () => {
    if (!prescItem.medicationName.trim()) return;
    setRecord(r => ({ ...r, prescriptionItems: [...r.prescriptionItems, { ...prescItem }] }));
    setPrescItem(emptyPrescItem);
  };

  const removePrescItem = (idx) => {
    setRecord(r => ({ ...r, prescriptionItems: r.prescriptionItems.filter((_, i) => i !== idx) }));
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const setRF = (k) => (e) => setRecord(r => ({ ...r, [k]: e.target.value }));

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  const menuItems = [
    { id: "overview",     icon: "bi-grid-1x2-fill",   label: "Visão Geral" },
    { id: "agenda",       icon: "bi-calendar-check",   label: "Agenda do Dia" },
    { id: "upcoming",     icon: "bi-calendar-week",    label: "Próximas Consultas" },
    { id: "consultation", icon: "bi-clipboard2-pulse", label: "Atendimento", hidden: !activeAppt },
  ];

  const renderSidebar = () => (
    <>
      {sidebarOpen && <div className="adm-sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}
      <aside className={`adm-sidebar ${sidebarOpen ? "adm-sidebar-open" : "adm-sidebar-closed"}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-brand-icon"><i className="bi bi-heart-pulse-fill" /></div>
          <div>
            <div className="adm-sidebar-brand-text">SCU</div>
            <div className="adm-sidebar-brand-sub">Painel Médico</div>
          </div>
          <button className="btn btn-link ms-auto d-lg-none text-white p-0" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="adm-sidebar-label">Menu</div>
        <ul className="adm-sidebar-menu">
          {menuItems.filter(m => !m.hidden).map((m) => (
            <li key={m.id}>
              <button className={`adm-menu-btn ${activeSection === m.id ? "active" : ""}`}
                onClick={() => { setActiveSection(m.id); if (window.innerWidth < 992) setSidebarOpen(false); }}>
                <i className={`bi ${m.icon}`} /><span>{m.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="adm-sidebar-footer">
          <button className="adm-menu-btn" style={{ color: "rgba(255,255,255,0.5)" }} onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" /><span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <section className="adm-fade-in">
      {loading && <div className="alert alert-info">Carregando...</div>}
      <div className="row g-4 mb-4">
        {[
          { label: "Consultas Hoje",     value: overview?.todayTotal   ?? "—", icon: "bi-calendar-check-fill", cls: "" },
          { label: "Concluídas",         value: overview?.todayCompleted ?? "—", icon: "bi-check-circle-fill",   cls: "accent" },
          { label: "Pendentes",          value: overview?.todayPending   ?? "—", icon: "bi-hourglass-split",     cls: "warning" },
        ].map((k, i) => (
          <div className="col-12 col-sm-4" key={i}>
            <div className={`adm-kpi-card ${k.cls}`}>
              <div className="adm-kpi-icon blue"><i className={`bi ${k.icon}`} /></div>
              <div className="adm-kpi-label">{k.label}</div>
              <div className="adm-kpi-value">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {overview?.nextPending && (
        <div className="adm-card">
          <div className="adm-card-title"><i className="bi bi-person-lines-fill" /> Próximo Paciente</div>
          <div className="d-flex align-items-center gap-3">
            <div className="adm-header-avatar" style={{ width: 48, height: 48, fontSize: "1.2rem" }}>
              {overview.nextPending.patient.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div className="fw-semibold">{overview.nextPending.patient.name}</div>
              <div className="text-muted small">
                {TYPE_LABEL[overview.nextPending.type]} ·{" "}
                {new Date(overview.nextPending.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <button className="btn btn-primary btn-sm ms-auto" onClick={() => startAppointment(overview.nextPending)}>
              <i className="bi bi-play-fill me-1" />Iniciar
            </button>
          </div>
        </div>
      )}
    </section>
  );

  // ── AGENDA ────────────────────────────────────────────────────────────────
  const renderAgenda = () => (
    <section className="adm-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-calendar2-week me-2" />
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </h5>
        <button className="adm-btn-primary btn-sm" onClick={() => setShowWalkIn(true)}>
          <i className="bi bi-person-plus me-1" />Nova Consulta Avulsa
        </button>
      </div>

      {loading ? (
        <div className="adm-card text-center py-4 text-muted">Carregando agenda...</div>
      ) : todayAppts.length === 0 ? (
        <div className="adm-card text-center py-5 text-muted">
          <i className="bi bi-calendar-x" style={{ fontSize: "2rem" }} />
          <div className="mt-2">Nenhuma consulta agendada para hoje.</div>
          <button className="adm-btn-primary btn-sm mt-3" onClick={() => setShowWalkIn(true)}>
            Iniciar consulta avulsa
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {todayAppts.map(appt => {
            const st = STATUS_LABEL[appt.status] || {};
            const canStart = appt.status === "SCHEDULED" || appt.status === "IN_PROGRESS";
            return (
              <div className="adm-card" key={appt.id} style={{ borderLeft: `4px solid ${appt.status === "COMPLETED" ? "#198754" : appt.status === "IN_PROGRESS" ? "#ffc107" : "#0d6efd"}` }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="adm-header-avatar" style={{ flexShrink: 0 }}>
                    {appt.patient.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{appt.patient.name}</div>
                    <div className="text-muted small">
                      {TYPE_LABEL[appt.type]} · CPF {appt.patient.cpf} · {appt.patient.age} anos
                    </div>
                    <div className="text-muted small">
                      <i className="bi bi-clock me-1" />
                      {new Date(appt.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{appt.clinicName}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    {canStart && (
                      <button className="btn btn-sm btn-primary" onClick={() => startAppointment(appt)}>
                        <i className={`bi ${appt.status === "IN_PROGRESS" ? "bi-play-circle" : "bi-play-fill"} me-1`} />
                        {appt.status === "IN_PROGRESS" ? "Continuar" : "Iniciar"}
                      </button>
                    )}
                    {appt.status === "COMPLETED" && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => openConsultation(appt)}>
                        <i className="bi bi-eye me-1" />Ver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  // ── PRÓXIMAS CONSULTAS ────────────────────────────────────────────────────
  const renderUpcoming = () => (
    <section className="adm-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-calendar-week me-2" />Próximas Consultas Agendadas
        </h5>
        <span className="badge bg-primary rounded-pill">{upcomingAppts.length}</span>
      </div>

      {loading ? (
        <div className="adm-card text-center py-4 text-muted">Carregando...</div>
      ) : upcomingAppts.length === 0 ? (
        <div className="adm-card text-center py-5 text-muted">
          <i className="bi bi-calendar-x" style={{ fontSize: "2rem" }} />
          <div className="mt-2">Nenhuma consulta futura agendada.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {upcomingAppts.map(appt => {
            const st = STATUS_LABEL[appt.status] || {};
            const dt = new Date(appt.scheduledAt);
            return (
              <div className="adm-card" key={appt.id} style={{ borderLeft: "4px solid #0d6efd" }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="adm-header-avatar" style={{ flexShrink: 0 }}>
                    {appt.patient.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{appt.patient.name}</div>
                    <div className="text-muted small">
                      {TYPE_LABEL[appt.type]} · CPF {appt.patient.cpf} · {appt.patient.age} anos
                    </div>
                    <div className="text-muted small">
                      <i className="bi bi-calendar-event me-1" />
                      {dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                      {" às "}
                      {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{appt.clinicName}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  // ── MODAL WALK-IN ─────────────────────────────────────────────────────────
  const renderWalkInModal = () => {
    if (!showWalkIn) return null;
    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title"><i className="bi bi-person-plus me-2" />Nova Consulta Avulsa</h5>
              <button type="button" className="btn-close" onClick={() => { setShowWalkIn(false); setSearchQ(""); setSearchResults([]); }} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Tipo de Consulta</label>
                <select className="form-select" value={walkInType} onChange={e => setWalkInType(e.target.value)}>
                  <option value="FIRST_VISIT">1ª Consulta</option>
                  <option value="RETURN">Retorno</option>
                </select>
              </div>
              <label className="form-label">Buscar Paciente por Nome ou CPF</label>
              <div className="input-group mb-3">
                <input className="form-control" value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchPatients()}
                  placeholder="Digite o nome ou CPF..." />
                <button className="btn btn-primary" onClick={searchPatients} disabled={searching}>
                  {searching ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search" />}
                </button>
              </div>

              {searchResults.length === 0 && searchQ.length >= 2 && !searching && (
                <div className="text-muted text-center py-2">Nenhum paciente encontrado.</div>
              )}

              <div className="d-flex flex-column gap-2">
                {searchResults.map(p => (
                  <div key={p.id} className="d-flex align-items-center justify-content-between p-2 border rounded">
                    <div>
                      <div className="fw-semibold">{p.name}</div>
                      <div className="text-muted small">CPF: {p.cpf} · {p.age} anos</div>
                    </div>
                    <button className="btn btn-sm btn-success" onClick={() => startWalkIn(p)}>
                      <i className="bi bi-play-fill me-1" />Iniciar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── CONSULTA ATIVA ────────────────────────────────────────────────────────
  const renderConsultation = () => {
    if (!activeAppt) return (
      <div className="adm-card text-center py-5 text-muted">
        Nenhuma consulta em andamento. Acesse a Agenda para iniciar.
      </div>
    );
    const isReadOnly = activeAppt.status === "COMPLETED";
    const p = activeAppt.patient;

    return (
      <section className="adm-fade-in">
        {/* Header do paciente */}
        <div className="adm-card mb-3">
          <div className="d-flex align-items-center gap-3">
            <div className="adm-header-avatar" style={{ width: 52, height: 52, fontSize: "1.3rem" }}>
              {p.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold fs-5">{p.name}</div>
              <div className="text-muted small">
                CPF: {p.cpf} · {p.age} anos · {p.email}
              </div>
              <div className="text-muted small">
                {TYPE_LABEL[activeAppt.type]} · {activeAppt.clinicName}
                {" · "}<span className={`badge ${STATUS_LABEL[activeAppt.status]?.cls} ms-1`}>{STATUS_LABEL[activeAppt.status]?.label}</span>
              </div>
            </div>
            {!isReadOnly && (
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setActiveAppt(null); setActiveSection("agenda"); }}>
                <i className="bi bi-arrow-left me-1" />Voltar
              </button>
            )}
            {isReadOnly && (
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setActiveAppt(null); setActiveSection("agenda"); }}>
                <i className="bi bi-arrow-left me-1" />Fechar
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tab-nav mb-3">
          <button className={`adm-tab-btn ${activeTab === "prontuario" ? "active" : ""}`} onClick={() => setActiveTab("prontuario")}>
            <i className="bi bi-clipboard2-pulse me-1" />Prontuário
          </button>
          <button className={`adm-tab-btn ${activeTab === "prescricao" ? "active" : ""}`} onClick={() => setActiveTab("prescricao")}>
            <i className="bi bi-capsule me-1" />Prescrição
            {record.prescriptionItems.length > 0 && (
              <span className="badge bg-primary ms-2">{record.prescriptionItems.length}</span>
            )}
          </button>
        </div>

        {/* Tab: Prontuário */}
        {activeTab === "prontuario" && (
          <div className="adm-card">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Queixa Principal</label>
                <textarea className="form-control" rows={3} value={record.chiefComplaint}
                  onChange={setRF("chiefComplaint")} disabled={isReadOnly}
                  placeholder="Descreva a queixa principal do paciente..." />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Antecedentes Pessoais</label>
                <textarea className="form-control" rows={3} value={record.personalHistory}
                  onChange={setRF("personalHistory")} disabled={isReadOnly}
                  placeholder="Doenças prévias, cirurgias, alergias, medicamentos em uso..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Exame Físico</label>
                <textarea className="form-control" rows={3} value={record.physicalExam}
                  onChange={setRF("physicalExam")} disabled={isReadOnly}
                  placeholder="Achados do exame físico..." />
              </div>
              <div className="col-md-8">
                <label className="form-label fw-semibold">Diagnóstico</label>
                <textarea className="form-control" rows={2} value={record.diagnosis}
                  onChange={setRF("diagnosis")} disabled={isReadOnly}
                  placeholder="Hipótese diagnóstica ou diagnóstico definitivo..." />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">CID-10</label>
                <input className="form-control" value={record.cid10}
                  onChange={setRF("cid10")} disabled={isReadOnly}
                  placeholder="Ex: J06.9" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Conduta Terapêutica</label>
                <textarea className="form-control" rows={3} value={record.treatment}
                  onChange={setRF("treatment")} disabled={isReadOnly}
                  placeholder="Conduta clínica, orientações, encaminhamentos..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Observações</label>
                <textarea className="form-control" rows={2} value={record.notes}
                  onChange={setRF("notes")} disabled={isReadOnly}
                  placeholder="Observações adicionais..." />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Prescrição */}
        {activeTab === "prescricao" && (
          <div className="adm-card">
            {record.prescriptionItems.length === 0 ? (
              <div className="text-muted text-center py-3 mb-3">Nenhum medicamento adicionado.</div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-4">
                {record.prescriptionItems.map((item, idx) => (
                  <div key={idx} className="border rounded p-3 d-flex justify-content-between align-items-start bg-light">
                    <div>
                      <div className="fw-semibold">{item.medicationName}</div>
                      <div className="small text-muted">{item.dosage}{item.duration && ` · ${item.duration}`}</div>
                      {item.notes && <div className="small text-muted fst-italic">{item.notes}</div>}
                    </div>
                    {!isReadOnly && (
                      <button className="btn btn-link text-danger p-0 small" onClick={() => removePrescItem(idx)}>
                        <i className="bi bi-trash" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isReadOnly && (
              <div className="border-top pt-3">
                <div className="adm-form-section-title mb-2"><i className="bi bi-plus-circle" /> Adicionar Medicamento</div>
                <div className="row g-2">
                  <div className="col-md-5">
                    <input className="form-control form-control-sm" value={prescItem.medicationName}
                      onChange={e => setPrescItem(p => ({ ...p, medicationName: e.target.value }))}
                      placeholder="Nome do medicamento *" />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control form-control-sm" value={prescItem.dosage}
                      onChange={e => setPrescItem(p => ({ ...p, dosage: e.target.value }))}
                      placeholder="Posologia (Ex: 1 comp a cada 8h)" />
                  </div>
                  <div className="col-md-3">
                    <input className="form-control form-control-sm" value={prescItem.duration}
                      onChange={e => setPrescItem(p => ({ ...p, duration: e.target.value }))}
                      placeholder="Duração (Ex: 7 dias)" />
                  </div>
                  <div className="col-12">
                    <input className="form-control form-control-sm" value={prescItem.notes}
                      onChange={e => setPrescItem(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Observações (opcional)" />
                  </div>
                  <div className="col-12 text-end">
                    <button className="btn btn-outline-primary btn-sm" onClick={addPrescItem}>
                      <i className="bi bi-plus me-1" />Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer de ações */}
        {!isReadOnly && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              {saveMsg && <span className={`small ${saveMsg.includes("Erro") ? "text-danger" : "text-success"}`}>{saveMsg}</span>}
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={saveRecord} disabled={saving}>
                <i className="bi bi-floppy me-1" />{saving ? "Salvando..." : "Salvar Rascunho"}
              </button>
              <button className="btn btn-success btn-sm" onClick={finalizeConsultation} disabled={saving}>
                <i className="bi bi-check-circle me-1" />Finalizar Consulta
              </button>
            </div>
          </div>
        )}
      </section>
    );
  };

  const sectionTitles = { overview: "Visão Geral", agenda: "Agenda do Dia", upcoming: "Próximas Consultas", consultation: "Atendimento" };
  const initials = (user?.name || "DR").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="admin-dashboard">
      <div className="admin-layout">
        {renderSidebar()}
        {renderWalkInModal()}
        <main className="adm-main">
          <header className="adm-header">
            <div className="d-flex align-items-center gap-3">
              <button className="adm-mobile-toggle" onClick={() => setSidebarOpen(true)}><i className="bi bi-list" /></button>
              <div>
                <h1 className="adm-header-title">{sectionTitles[activeSection] || "Painel Médico"}</h1>
                <div className="adm-header-greeting">Bem-vindo(a), {user?.name || "Médico"}</div>
              </div>
            </div>
            <div className="adm-header-profile">
              <div className="adm-header-info">
                <div className="adm-header-name">{user?.name || "Médico"}</div>
                <div className="adm-header-role">{user?.email || ""}</div>
              </div>
              <div className="adm-header-avatar" style={{ cursor: "pointer", backgroundColor: "#0d6efd" }}
                onClick={handleLogout} title="Sair">{initials}</div>
            </div>
          </header>

          {activeSection === "overview"      && renderOverview()}
          {activeSection === "agenda"        && renderAgenda()}
          {activeSection === "upcoming"      && renderUpcoming()}
          {activeSection === "consultation"  && renderConsultation()}
        </main>
      </div>
    </div>
  );
}
