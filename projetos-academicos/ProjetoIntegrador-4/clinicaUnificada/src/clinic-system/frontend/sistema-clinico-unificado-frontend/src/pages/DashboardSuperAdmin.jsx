import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/admin-dashboard.css";
import { apiFetch, getUser, logout } from "../utils/auth";

const COUNCIL_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const isValidCPF = (cpf) => {
  if (typeof cpf !== "string") return false;
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const arr = cpf.split("").map(Number);
  const rest = (n) => (arr.slice(0, n - 12).reduce((s, v, i) => s + v * (n - i), 0) * 10) % 11 % 10;
  return rest(10) === arr[9] && rest(11) === arr[10];
};

const emptyDoctorForm  = { name:"", email:"", cpf:"", birthDate:"", password:"", specialtyId:"", clinicId:"", councilType:"", councilNumber:"", councilState:"", rqe:"", formation:"", languages:"", areasOfPractice:"" };
const emptySpecForm    = { name:"", description:"" };
const emptyClinicForm  = { clinicName:"", cnpj:"", address:"", phone:"", isFilial:false, parentClinicId:"", networkId:"" };
const emptyManagerForm = { name:"", email:"", cpf:"", birthDate:"", password:"", clinicId:"" };
const emptyNetworkForm = { networkName:"", cnpj:"", adminName:"", adminEmail:"", adminCpf:"", adminBirthDate:"", adminPassword:"" };

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [staffTab,      setStaffTab]      = useState("doctors");

  const [doctors,    setDoctors]    = useState([]);
  const [specialties,setSpecialties]= useState([]);
  const [clinics,    setClinics]    = useState([]);
  const [managers,   setManagers]   = useState([]);
  const [networks,   setNetworks]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState("");

  const [doctorForm,  setDoctorForm]  = useState(emptyDoctorForm);
  const [dFormErr,    setDFormErr]    = useState("");
  const [dFormOk,     setDFormOk]     = useState("");
  const [dMissing,    setDMissing]    = useState([]);
  const [dSubmit,     setDSubmit]     = useState(false);

  const [specForm,    setSpecForm]    = useState(emptySpecForm);
  const [sFormErr,    setSFormErr]    = useState("");
  const [sFormOk,     setSFormOk]     = useState("");
  const [sSubmit,     setSSubmit]     = useState(false);

  const [clinicForm,  setClinicForm]  = useState(emptyClinicForm);
  const [cFormErr,    setCFormErr]    = useState("");
  const [cFormOk,     setCFormOk]     = useState("");
  const [cSubmit,     setCSubmit]     = useState(false);

  const [mgrForm,     setMgrForm]     = useState(emptyManagerForm);
  const [mFormErr,    setMFormErr]    = useState("");
  const [mFormOk,     setMFormOk]     = useState("");
  const [mSubmit,     setMSubmit]     = useState(false);

  const [netForm,     setNetForm]     = useState(emptyNetworkForm);
  const [nFormErr,    setNFormErr]    = useState("");
  const [nFormOk,     setNFormOk]     = useState("");
  const [nSubmit,     setNSubmit]     = useState(false);

  const [editDoc,     setEditDoc]     = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editErr,     setEditErr]     = useState("");
  const [editOk,      setEditOk]      = useState("");
  const [editSubmit,  setEditSubmit]  = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchDoctors  = useCallback(async () => { try { const r = await apiFetch("/api/admin/staff/doctors");  if (r.ok) setDoctors(await r.json());  } catch {} }, []);
  const fetchManagers = useCallback(async () => { try { const r = await apiFetch("/api/management/managers"); if (r.ok) setManagers(await r.json()); } catch {} }, []);
  const fetchNetworks = useCallback(async () => { try { const r = await apiFetch("/api/platform/networks");   if (r.ok) setNetworks(await r.json()); } catch {} }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rs, rc] = await Promise.all([apiFetch("/api/specialties"), apiFetch("/api/management/clinics")]);
        if (rs.ok) setSpecialties(await rs.json());
        if (rc.ok) setClinics(await rc.json());
        await fetchDoctors(); await fetchManagers(); await fetchNetworks();
      } catch { setApiError("Não foi possível carregar dados."); }
      finally { setLoading(false); }
    })();
  }, [fetchDoctors, fetchManagers, fetchNetworks]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleCreateDoctor = async (e) => {
    e.preventDefault(); setDFormErr(""); setDFormOk(""); setDMissing([]);
    const req = ["name","email","cpf","birthDate","password","specialtyId","clinicId","councilType","councilNumber","councilState"];
    const miss = req.filter(k => !doctorForm[k]);
    if (miss.length) { setDMissing(miss); setDFormErr("Preencha todos os campos obrigatórios."); return; }
    if (!isValidCPF(doctorForm.cpf)) { setDMissing(["cpf"]); setDFormErr("CPF inválido."); return; }
    setDSubmit(true);
    try {
      const res = await apiFetch("/api/admin/staff/doctor", { method:"POST", body: JSON.stringify({...doctorForm, cpf: doctorForm.cpf.replace(/\D/g,"")}) });
      const txt = await res.text(); let body; try { body = JSON.parse(txt); } catch { body = txt; }
      if (!res.ok) { setDFormErr(typeof body==="string" && body ? body : body?.message || "Erro ao cadastrar médico."); return; }
      setDFormOk(`Médico ${body.userName||"novo"} cadastrado!`); setDoctorForm(emptyDoctorForm); await fetchDoctors();
    } catch { setDFormErr("Erro de conexão."); } finally { setDSubmit(false); }
  };

  const handleCreateSpec = async (e) => {
    e.preventDefault(); setSFormErr(""); setSFormOk("");
    if (!specForm.name) { setSFormErr("Nome obrigatório."); return; }
    setSSubmit(true);
    try {
      const res = await apiFetch("/api/specialties", { method:"POST", body: JSON.stringify(specForm) });
      if (!res.ok) { setSFormErr("Erro ao cadastrar especialidade."); return; }
      const body = await res.json(); setSFormOk(`${body.name} cadastrada!`); setSpecForm(emptySpecForm);
      const rs = await apiFetch("/api/specialties"); if (rs.ok) setSpecialties(await rs.json());
    } catch { setSFormErr("Erro de conexão."); } finally { setSSubmit(false); }
  };

  const handleCreateClinic = async (e) => {
    e.preventDefault(); setCFormErr(""); setCFormOk("");
    if (!clinicForm.clinicName || !clinicForm.cnpj) { setCFormErr("Preencha Nome e CNPJ."); return; }
    if (clinicForm.isFilial && !clinicForm.parentClinicId) { setCFormErr("Selecione a clínica matriz."); return; }
    if (!clinicForm.networkId) { setCFormErr("Selecione a rede."); return; }
    setCSubmit(true);
    try {
      const payload = { clinicName: clinicForm.clinicName, cnpj: clinicForm.cnpj.replace(/\D/g,""), address: clinicForm.address, phone: clinicForm.phone, parentClinicId: clinicForm.isFilial ? clinicForm.parentClinicId : null, networkId: clinicForm.networkId };
      const res = await apiFetch("/api/management/create-clinic", { method:"POST", body: JSON.stringify(payload) });
      if (!res.ok) { setCFormErr(await res.text() || "Erro ao cadastrar clínica."); return; }
      setCFormOk(`Clínica ${clinicForm.clinicName} cadastrada!`); setClinicForm(emptyClinicForm);
      const rc = await apiFetch("/api/management/clinics"); if (rc.ok) setClinics(await rc.json());
    } catch { setCFormErr("Erro de conexão."); } finally { setCSubmit(false); }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault(); setMFormErr(""); setMFormOk("");
    const miss = ["name","email","cpf","birthDate","password","clinicId"].filter(k => !mgrForm[k]);
    if (miss.length) { setMFormErr("Preencha todos os campos obrigatórios."); return; }
    if (!isValidCPF(mgrForm.cpf)) { setMFormErr("CPF inválido."); return; }
    setMSubmit(true);
    try {
      const res = await apiFetch("/api/management/create-manager", { method:"POST", body: JSON.stringify({...mgrForm, cpf: mgrForm.cpf.replace(/\D/g,"")}) });
      if (!res.ok) { setMFormErr(await res.text() || "Erro ao cadastrar manager."); return; }
      setMFormOk("Manager cadastrado!"); setMgrForm(emptyManagerForm); await fetchManagers();
    } catch { setMFormErr("Erro de conexão."); } finally { setMSubmit(false); }
  };

  const handleCreateNetwork = async (e) => {
    e.preventDefault(); setNFormErr(""); setNFormOk("");
    const miss = ["networkName","adminName","adminEmail","adminCpf","adminBirthDate","adminPassword"].filter(k => !netForm[k]);
    if (miss.length) { setNFormErr("Preencha todos os campos obrigatórios."); return; }
    if (!isValidCPF(netForm.adminCpf)) { setNFormErr("CPF do admin inválido."); return; }
    setNSubmit(true);
    try {
      const payload = { networkName: netForm.networkName, cnpj: netForm.cnpj ? netForm.cnpj.replace(/\D/g,"") : null, adminName: netForm.adminName, adminEmail: netForm.adminEmail, adminCpf: netForm.adminCpf.replace(/\D/g,""), adminBirthDate: netForm.adminBirthDate, adminPassword: netForm.adminPassword };
      const res = await apiFetch("/api/platform/networks", { method:"POST", body: JSON.stringify(payload) });
      if (!res.ok) { setNFormErr(await res.text() || "Erro ao criar rede."); return; }
      setNFormOk(`Rede "${netForm.networkName}" credenciada!`); setNetForm(emptyNetworkForm); await fetchNetworks();
    } catch { setNFormErr("Erro de conexão."); } finally { setNSubmit(false); }
  };

  const openEdit  = (d) => { setEditDoc(d); setEditForm({ name:d.userName, cpf:d.userCpf, birthDate:d.userBirthDate, password:"", specialtyId:d.specialtyId, clinicId:d.clinicId, councilType:d.councilType, councilNumber:d.councilNumber, councilState:d.councilState, rqe:d.rqe||"", formation:d.formation||"", languages:d.languages||"", areasOfPractice:d.areasOfPractice||"" }); setEditErr(""); setEditOk(""); };
  const closeEdit = () => { setEditDoc(null); setEditForm({}); };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault(); setEditErr(""); setEditOk(""); setEditSubmit(true);
    try {
      const res = await apiFetch(`/api/admin/staff/doctor/${editDoc.id}`, { method:"PUT", body: JSON.stringify({...editForm, cpf: editForm.cpf?.replace(/\D/g,"")}) });
      const txt = await res.text(); let body; try { body=JSON.parse(txt); } catch { body=txt; }
      if (!res.ok) { setEditErr(typeof body==="string"?body:"Erro ao atualizar."); return; }
      setEditOk("Médico atualizado!"); await fetchDoctors(); setTimeout(closeEdit, 1500);
    } catch { setEditErr("Erro de conexão."); } finally { setEditSubmit(false); }
  };

  const handleToggleDoctor = async (id) => { try { const r = await apiFetch(`/api/admin/staff/doctor/${id}/toggle`,{method:"POST"}); if(r.ok) await fetchDoctors(); } catch {} };

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleMenu   = (s) => { setActiveSection(s); if(window.innerWidth<992) setSidebarOpen(false); };
  const setDF = (k) => (e) => setDoctorForm(f=>({...f,[k]:e.target.value}));
  const setSF = (k) => (e) => setSpecForm(f=>({...f,[k]:e.target.value}));
  const setCF = (k) => (e) => setClinicForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
  const setMF = (k) => (e) => setMgrForm(f=>({...f,[k]:e.target.value}));
  const setNF = (k) => (e) => setNetForm(f=>({...f,[k]:e.target.value}));
  const setEF = (k) => (e) => setEditForm(f=>({...f,[k]:e.target.value}));

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  const menuItems = [
    { id:"overview",   icon:"bi-grid-1x2-fill",     label:"Visão Geral" },
    { id:"staff",      icon:"bi-people-fill",         label:"Equipe" },
    { id:"specialties",icon:"bi-award-fill",          label:"Especialidades" },
    { id:"clinic",     icon:"bi-hospital-fill",       label:"Clínicas" },
    { id:"platform",   icon:"bi-diagram-3-fill",      label:"Plataforma" },
    { id:"reports",    icon:"bi-bar-chart-line-fill", label:"Relatórios" },
    { id:"settings",   icon:"bi-gear-fill",           label:"Configurações" },
  ];

  const renderSidebar = () => (
    <>
      {sidebarOpen && <div className="adm-sidebar-overlay show" onClick={()=>setSidebarOpen(false)} />}
      <aside className={`adm-sidebar ${sidebarOpen?"adm-sidebar-open":"adm-sidebar-closed"}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-brand-icon"><i className="bi bi-shield-shaded" /></div>
          <div><div className="adm-sidebar-brand-text">SCU</div><div className="adm-sidebar-brand-sub">Super Admin</div></div>
          <button className="btn btn-link ms-auto d-lg-none text-white p-0" onClick={()=>setSidebarOpen(false)}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="adm-sidebar-label">Menu Principal</div>
        <ul className="adm-sidebar-menu">
          {menuItems.map(m=>(
            <li key={m.id}><button className={`adm-menu-btn ${activeSection===m.id?"active":""}`} onClick={()=>handleMenu(m.id)}><i className={`bi ${m.icon}`}/><span>{m.label}</span></button></li>
          ))}
        </ul>
        <div className="adm-sidebar-footer">
          <button className="adm-menu-btn" style={{color:"rgba(255,255,255,0.5)"}} onClick={handleLogout}><i className="bi bi-box-arrow-left"/><span>Sair</span></button>
        </div>
      </aside>
    </>
  );

  // ── SEÇÕES ─────────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <section className="adm-fade-in">
      {loading  && <div className="alert alert-info">Carregando dados...</div>}
      {apiError && <div className="alert alert-danger">{apiError}</div>}
      <div className="row g-4 mb-4">
        {[
          { label:"Redes Credenciadas", value:networks.length,                              icon:"bi-diagram-3-fill",    cls:"blue",   card:"" },
          { label:"Clínicas",            value:clinics.length,                              icon:"bi-hospital-fill",     cls:"yellow", card:"warning" },
          { label:"Médicos Ativos",      value:doctors.filter(d=>d.profileEnabled).length,  icon:"bi-person-check-fill", cls:"green",  card:"accent" },
          { label:"Total de Médicos",    value:doctors.length,                              icon:"bi-heart-pulse-fill",  cls:"cyan",   card:"info" },
        ].map((k,i)=>(
          <div className="col-12 col-sm-6 col-xl-3" key={i}>
            <div className={`adm-kpi-card ${k.card}`}>
              <div className={`adm-kpi-icon ${k.cls}`}><i className={`bi ${k.icon}`}/></div>
              <div className="adm-kpi-label">{k.label}</div>
              <div className="adm-kpi-value">{k.value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-clock-history"/> Atividade Recente</div>
        <div className="adm-activity-item"><div className="adm-activity-dot blue"/><div><div className="adm-activity-text"><strong>Login</strong> — Acesso ao painel SCU</div><div className="adm-activity-time">Agora</div></div></div>
      </div>
    </section>
  );

  const renderDoctors = () => (
    <>
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-person-plus-fill"/> Cadastrar Novo Médico</div>
        {dFormErr && <div className="alert alert-danger py-2">{dFormErr}</div>}
        {dFormOk  && <div className="alert alert-success py-2">{dFormOk}</div>}
        <form onSubmit={handleCreateDoctor}>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-person"/> Dados Pessoais e Acesso</div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">Nome Completo *</label><input className={`form-control ${dMissing.includes("name")?"border-danger":""}`} value={doctorForm.name} onChange={setDF("name")} placeholder="Dr. João Silva"/></div>
              <div className="col-md-6"><label className="form-label">E-mail *</label><input type="email" className={`form-control ${dMissing.includes("email")?"border-danger":""}`} value={doctorForm.email} onChange={setDF("email")} placeholder="medico@clinica.com"/></div>
              <div className="col-md-4"><label className="form-label">CPF *</label><input className={`form-control ${dMissing.includes("cpf")?"border-danger":""}`} value={doctorForm.cpf} onChange={setDF("cpf")} placeholder="000.000.000-00"/></div>
              <div className="col-md-4"><label className="form-label">Data de Nascimento *</label><input type="date" className={`form-control ${dMissing.includes("birthDate")?"border-danger":""}`} value={doctorForm.birthDate} onChange={setDF("birthDate")}/></div>
              <div className="col-md-4"><label className="form-label">Senha *</label><input type="password" className={`form-control ${dMissing.includes("password")?"border-danger":""}`} value={doctorForm.password} onChange={setDF("password")} placeholder="••••••••"/></div>
            </div>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-card-checklist"/> Conselho Profissional</div>
            <div className="row g-3">
              <div className="col-md-3"><label className="form-label">Tipo *</label>
                <select className={`form-select ${dMissing.includes("councilType")?"border-danger":""}`} value={doctorForm.councilType} onChange={setDF("councilType")}>
                  <option value="">Selecione...</option><option value="CRM">CRM</option><option value="COREM">COREM</option>
                </select></div>
              <div className="col-md-4"><label className="form-label">Número *</label><input className={`form-control ${dMissing.includes("councilNumber")?"border-danger":""}`} value={doctorForm.councilNumber} onChange={setDF("councilNumber")} placeholder="00000"/></div>
              <div className="col-md-2"><label className="form-label">Estado *</label>
                <select className={`form-select ${dMissing.includes("councilState")?"border-danger":""}`} value={doctorForm.councilState} onChange={setDF("councilState")}>
                  <option value="">Selecione...</option>{COUNCIL_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="col-md-3"><label className="form-label">RQE</label><input className="form-control" value={doctorForm.rqe} onChange={setDF("rqe")} placeholder="Nº RQE (opcional)"/></div>
            </div>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-award"/> Especialidade e Clínica</div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">Especialidade *</label>
                <select className={`form-select ${dMissing.includes("specialtyId")?"border-danger":""}`} value={doctorForm.specialtyId} onChange={setDF("specialtyId")}>
                  <option value="">Selecione...</option>{specialties.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div className="col-md-6"><label className="form-label">Clínica *</label>
                <select className={`form-select ${dMissing.includes("clinicId")?"border-danger":""}`} value={doctorForm.clinicId} onChange={setDF("clinicId")}>
                  <option value="">Selecione...</option>{clinics.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
            </div>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-mortarboard"/> Formação (opcional)</div>
            <div className="row g-3">
              <div className="col-md-4"><label className="form-label">Formação</label><input className="form-control" value={doctorForm.formation} onChange={setDF("formation")} placeholder="Ex: USP — Medicina"/></div>
              <div className="col-md-4"><label className="form-label">Idiomas</label><input className="form-control" value={doctorForm.languages} onChange={setDF("languages")} placeholder="Ex: Português, Inglês"/></div>
              <div className="col-md-4"><label className="form-label">Áreas de Atuação</label><input className="form-control" value={doctorForm.areasOfPractice} onChange={setDF("areasOfPractice")} placeholder="Ex: Hemodinâmica"/></div>
            </div>
          </div>
          <div className="text-end mt-3"><button type="submit" className="adm-btn-primary" disabled={dSubmit}><i className="bi bi-check-lg"/> {dSubmit?"Cadastrando...":"Cadastrar Médico"}</button></div>
        </form>
      </div>
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-list-ul"/> Médicos Cadastrados <span className="ms-2 badge bg-secondary">{doctors.length}</span></div>
        {doctors.length===0 ? <div className="text-center py-4 text-muted">Nenhum médico cadastrado.</div> : (
          <div className="table-responsive"><table className="adm-table">
            <thead><tr><th>Nome</th><th>Conselho</th><th>Especialidade</th><th>Clínica</th><th>Status</th><th style={{width:100}}>Ações</th></tr></thead>
            <tbody>{doctors.map(d=>(
              <tr key={d.id}>
                <td className="fw-semibold">{d.userName}</td>
                <td>{d.councilType}/{d.councilState} {d.councilNumber}</td>
                <td>{d.specialtyName}</td><td>{d.clinicName}</td>
                <td><span className={`adm-badge ${d.profileEnabled?"active":"inactive"}`}>{d.profileEnabled?"Ativo":"Inativo"}</span></td>
                <td><div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-primary" style={{borderRadius:8}} onClick={()=>openEdit(d)}><i className="bi bi-pencil"/></button>
                  <button className={`btn btn-sm ${d.profileEnabled?"btn-outline-danger":"btn-outline-success"}`} style={{borderRadius:8}} onClick={()=>handleToggleDoctor(d.id)}><i className={`bi ${d.profileEnabled?"bi-toggle-on":"bi-toggle-off"}`}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );

  const renderManagers = () => (
    <>
      <div className="adm-card mb-4">
        <div className="adm-card-title"><i className="bi bi-person-plus-fill"/> Cadastrar Novo Manager</div>
        {mFormErr && <div className="alert alert-danger py-2">{mFormErr}</div>}
        {mFormOk  && <div className="alert alert-success py-2">{mFormOk}</div>}
        <form onSubmit={handleCreateManager}>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">Nome Completo *</label><input className="form-control" value={mgrForm.name} onChange={setMF("name")} placeholder="João Silva"/></div>
            <div className="col-md-6"><label className="form-label">E-mail *</label><input type="email" className="form-control" value={mgrForm.email} onChange={setMF("email")} placeholder="manager@clinica.com"/></div>
            <div className="col-md-4"><label className="form-label">CPF *</label><input className="form-control" value={mgrForm.cpf} onChange={setMF("cpf")} placeholder="000.000.000-00"/></div>
            <div className="col-md-4"><label className="form-label">Data de Nascimento *</label><input type="date" className="form-control" value={mgrForm.birthDate} onChange={setMF("birthDate")}/></div>
            <div className="col-md-4"><label className="form-label">Senha *</label><input type="password" className="form-control" value={mgrForm.password} onChange={setMF("password")} placeholder="••••••••"/></div>
            <div className="col-12"><label className="form-label">Clínica Vinculada *</label>
              <select className="form-select" value={mgrForm.clinicId} onChange={setMF("clinicId")}>
                <option value="">Selecione...</option>{clinics.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
          </div>
          <div className="text-end mt-3"><button type="submit" className="adm-btn-primary" disabled={mSubmit}><i className="bi bi-check-lg"/> {mSubmit?"Cadastrando...":"Cadastrar Manager"}</button></div>
        </form>
      </div>
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-list-ul"/> Managers <span className="ms-2 badge bg-secondary">{managers.length}</span></div>
        {managers.length===0 ? <div className="text-center py-4 text-muted">Nenhum manager cadastrado.</div> : (
          <div className="table-responsive"><table className="adm-table">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Clínica</th><th>Status</th></tr></thead>
            <tbody>{managers.map(m=>(
              <tr key={m.id}><td className="fw-semibold">{m.name}</td><td>{m.email}</td><td>{m.clinicName}</td>
                <td><span className={`adm-badge ${m.active?"active":"inactive"}`}>{m.active?"Ativo":"Inativo"}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );

  const renderStaff = () => (
    <section className="adm-fade-in">
      <div className="adm-tab-nav" style={{maxWidth:400}}>
        {[{id:"doctors",label:"Médicos"},{id:"managers",label:"Managers"}].map(t=>(
          <button key={t.id} className={`adm-tab-btn ${staffTab===t.id?"active":""}`} onClick={()=>setStaffTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {staffTab==="doctors"  && renderDoctors()}
      {staffTab==="managers" && renderManagers()}
    </section>
  );

  const renderSpecialties = () => (
    <section className="adm-fade-in">
      <div className="adm-card mb-4">
        <div className="adm-card-title"><i className="bi bi-plus-circle"/> Cadastrar Especialidade</div>
        {sFormErr && <div className="alert alert-danger py-2">{sFormErr}</div>}
        {sFormOk  && <div className="alert alert-success py-2">{sFormOk}</div>}
        <form onSubmit={handleCreateSpec}>
          <div className="row g-3">
            <div className="col-md-4"><label className="form-label">Nome *</label><input className="form-control" value={specForm.name} onChange={setSF("name")} placeholder="Ex: Cardiologia"/></div>
            <div className="col-md-8"><label className="form-label">Descrição</label><input className="form-control" value={specForm.description} onChange={setSF("description")} placeholder="Breve descrição..."/></div>
          </div>
          <div className="text-end mt-3"><button type="submit" className="adm-btn-primary" disabled={sSubmit}><i className="bi bi-check-lg"/> {sSubmit?"Cadastrando...":"Cadastrar"}</button></div>
        </form>
      </div>
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-award-fill"/> Especialidades <span className="ms-2 badge bg-secondary">{specialties.length}</span></div>
        {specialties.length===0 ? <div className="text-center py-4 text-muted">Nenhuma especialidade cadastrada.</div> : (
          <div className="table-responsive"><table className="adm-table"><thead><tr><th>Nome</th><th>Descrição</th></tr></thead>
            <tbody>{specialties.map(s=><tr key={s.id}><td className="fw-semibold">{s.name}</td><td>{s.description||"—"}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </section>
  );

  const renderClinic = () => (
    <section className="adm-fade-in">
      <div className="adm-card mb-4">
        <div className="adm-card-title"><i className="bi bi-plus-circle"/> Cadastrar Nova Clínica</div>
        {cFormErr && <div className="alert alert-danger py-2">{cFormErr}</div>}
        {cFormOk  && <div className="alert alert-success py-2">{cFormOk}</div>}
        <form onSubmit={handleCreateClinic}>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-hospital"/> Dados da Clínica</div>
            <div className="row g-3">
              <div className="col-12"><label className="form-label fw-bold">Rede Clínica *</label>
                <select className="form-select" value={clinicForm.networkId} onChange={setCF("networkId")}>
                  <option value="">Selecione a rede...</option>{networks.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                {networks.length===0 && <div className="form-text text-warning">Crie uma rede na seção Plataforma primeiro.</div>}
              </div>
              <div className="col-md-6"><label className="form-label">Nome da Clínica *</label><input className="form-control" value={clinicForm.clinicName} onChange={setCF("clinicName")} placeholder="Ex: Clínica Saúde"/></div>
              <div className="col-md-6"><label className="form-label">CNPJ *</label><input className="form-control" value={clinicForm.cnpj} onChange={setCF("cnpj")} placeholder="00.000.000/0000-00"/></div>
              <div className="col-md-8"><label className="form-label">Endereço</label><input className="form-control" value={clinicForm.address} onChange={setCF("address")} placeholder="Rua, Número, Cidade - UF"/></div>
              <div className="col-md-4"><label className="form-label">Telefone</label><input className="form-control" value={clinicForm.phone} onChange={setCF("phone")} placeholder="(00) 0000-0000"/></div>
            </div>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-diagram-3"/> Hierarquia</div>
            <div className="row g-3">
              <div className="col-12"><div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="isFilial" checked={clinicForm.isFilial} onChange={setCF("isFilial")}/>
                <label className="form-check-label fw-bold" htmlFor="isFilial">Esta clínica é filial de outra?</label>
              </div></div>
              {clinicForm.isFilial && <div className="col-md-6"><label className="form-label">Clínica Matriz *</label>
                <select className="form-select" value={clinicForm.parentClinicId} onChange={setCF("parentClinicId")}>
                  <option value="">Selecione...</option>{clinics.filter(c=>!c.parentClinic).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>}
            </div>
          </div>
          <div className="text-end mt-3"><button type="submit" className="adm-btn-primary" disabled={cSubmit}><i className="bi bi-check-lg"/> {cSubmit?"Cadastrando...":"Cadastrar Clínica"}</button></div>
        </form>
      </div>
      <h5 className="mb-3"><i className="bi bi-h-square"/> Clínicas Cadastradas</h5>
      {clinics.length===0 ? <div className="adm-card text-center py-5 text-muted">Nenhuma clínica cadastrada.</div> : (
        <div className="row g-4">{clinics.map(c=>(
          <div className="col-lg-6" key={c.id}><div className="adm-card">
            <div className="adm-card-title"><i className="bi bi-hospital"/> {c.name}</div>
            {[{icon:"bi-file-earmark-text",label:"CNPJ",value:c.cnpj},{icon:"bi-geo-alt",label:"Endereço",value:c.address||"—"},{icon:"bi-telephone",label:"Telefone",value:c.phone||"—"}].map((it,i)=>(
              <div className="adm-clinic-info-item" key={i}><div className="adm-clinic-info-icon"><i className={`bi ${it.icon}`}/></div><div><div className="adm-clinic-info-label">{it.label}</div><div className="adm-clinic-info-value">{it.value}</div></div></div>
            ))}
          </div></div>
        ))}</div>
      )}
    </section>
  );

  const renderPlatform = () => (
    <section className="adm-fade-in">
      <div className="adm-card mb-4">
        <div className="adm-card-title"><i className="bi bi-plus-circle"/> Credenciar Nova Rede Clínica</div>
        <p className="text-muted small mb-3">Cria a rede e registra o primeiro Admin responsável.</p>
        {nFormErr && <div className="alert alert-danger py-2">{nFormErr}</div>}
        {nFormOk  && <div className="alert alert-success py-2">{nFormOk}</div>}
        <form onSubmit={handleCreateNetwork}>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-diagram-3"/> Dados da Rede</div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">Nome da Rede *</label><input className="form-control" value={netForm.networkName} onChange={setNF("networkName")} placeholder="Ex: Rede Saúde SP"/></div>
              <div className="col-md-6"><label className="form-label">CNPJ da Rede</label><input className="form-control" value={netForm.cnpj} onChange={setNF("cnpj")} placeholder="00.000.000/0000-00 (opcional)"/></div>
            </div>
          </div>
          <div className="adm-form-section">
            <div className="adm-form-section-title"><i className="bi bi-person-badge"/> Admin da Rede (1º acesso)</div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">Nome *</label><input className="form-control" value={netForm.adminName} onChange={setNF("adminName")} placeholder="Nome Completo"/></div>
              <div className="col-md-6"><label className="form-label">E-mail *</label><input type="email" className="form-control" value={netForm.adminEmail} onChange={setNF("adminEmail")} placeholder="admin@rede.com"/></div>
              <div className="col-md-4"><label className="form-label">CPF *</label><input className="form-control" value={netForm.adminCpf} onChange={setNF("adminCpf")} placeholder="000.000.000-00"/></div>
              <div className="col-md-4"><label className="form-label">Data de Nascimento *</label><input type="date" className="form-control" value={netForm.adminBirthDate} onChange={setNF("adminBirthDate")}/></div>
              <div className="col-md-4"><label className="form-label">Senha *</label><input type="password" className="form-control" value={netForm.adminPassword} onChange={setNF("adminPassword")} placeholder="••••••••"/></div>
            </div>
          </div>
          <div className="text-end mt-3"><button type="submit" className="adm-btn-primary" disabled={nSubmit}><i className="bi bi-check-lg"/> {nSubmit?"Credenciando...":"Credenciar Rede"}</button></div>
        </form>
      </div>
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-diagram-3-fill"/> Redes Credenciadas <span className="ms-2 badge bg-secondary">{networks.length}</span></div>
        {networks.length===0 ? <div className="text-center py-4 text-muted">Nenhuma rede cadastrada ainda.</div> : (
          <div className="table-responsive"><table className="adm-table">
            <thead><tr><th>Nome da Rede</th><th>CNPJ</th><th>Admins</th><th>Criada em</th></tr></thead>
            <tbody>{networks.map(n=>(
              <tr key={n.id}><td className="fw-semibold">{n.name}</td><td>{n.cnpj||"—"}</td>
                <td><span className="badge bg-primary">{n.adminCount}</span></td>
                <td>{new Date(n.createdAt).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </section>
  );

  const renderEditModal = () => {
    if (!editDoc) return null;
    return (
      <div className="modal show d-block" tabIndex="-1" style={{backgroundColor:"rgba(0,0,0,0.55)"}}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title"><i className="bi bi-pencil-square me-2"/>Editar — {editDoc.userName}</h5>
              <button type="button" className="btn-close" onClick={closeEdit}/>
            </div>
            <div className="modal-body">
              {editErr && <div className="alert alert-danger py-2">{editErr}</div>}
              {editOk  && <div className="alert alert-success py-2">{editOk}</div>}
              <form id="editDocForm" onSubmit={handleUpdateDoctor}>
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label">Nome</label><input className="form-control" value={editForm.name||""} onChange={setEF("name")}/></div>
                  <div className="col-md-6"><label className="form-label">E-mail</label><input className="form-control" value={editDoc.userEmail} disabled/></div>
                  <div className="col-md-4"><label className="form-label">CPF</label><input className="form-control" value={editForm.cpf||""} onChange={setEF("cpf")}/></div>
                  <div className="col-md-4"><label className="form-label">Data de Nascimento</label><input type="date" className="form-control" value={editForm.birthDate||""} onChange={setEF("birthDate")}/></div>
                  <div className="col-md-4"><label className="form-label">Nova Senha</label><input type="password" className="form-control" value={editForm.password||""} onChange={setEF("password")} placeholder="vazio = manter atual"/></div>
                  <div className="col-md-3"><label className="form-label">Tipo</label>
                    <select className="form-select" value={editForm.councilType||""} onChange={setEF("councilType")}><option value="CRM">CRM</option><option value="COREM">COREM</option></select></div>
                  <div className="col-md-4"><label className="form-label">Número</label><input className="form-control" value={editForm.councilNumber||""} onChange={setEF("councilNumber")}/></div>
                  <div className="col-md-2"><label className="form-label">Estado</label>
                    <select className="form-select" value={editForm.councilState||""} onChange={setEF("councilState")}><option value="">UF</option>{COUNCIL_STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                  <div className="col-md-3"><label className="form-label">RQE</label><input className="form-control" value={editForm.rqe||""} onChange={setEF("rqe")}/></div>
                  <div className="col-md-6"><label className="form-label">Especialidade</label>
                    <select className="form-select" value={editForm.specialtyId||""} onChange={setEF("specialtyId")}><option value="">Selecione...</option>{specialties.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div className="col-md-6"><label className="form-label">Clínica</label>
                    <select className="form-select" value={editForm.clinicId||""} onChange={setEF("clinicId")}><option value="">Selecione...</option>{clinics.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEdit}>Cancelar</button>
              <button type="submit" form="editDocForm" className="adm-btn-primary" disabled={editSubmit}><i className="bi bi-check-lg"/> {editSubmit?"Salvando...":"Salvar"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sectionTitles = { overview:"Visão Geral", staff:"Gestão de Equipe", specialties:"Especialidades", clinic:"Clínicas", platform:"Plataforma SCU", reports:"Relatórios", settings:"Configurações" };
  const initials = (user?.name||"SA").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

  return (
    <div className="admin-dashboard">
      <div className="admin-layout">
        {renderSidebar()}
        {renderEditModal()}
        <main className="adm-main">
          <header className="adm-header">
            <div className="d-flex align-items-center gap-3">
              <button className="adm-mobile-toggle" onClick={()=>setSidebarOpen(true)}><i className="bi bi-list"/></button>
              <div>
                <h1 className="adm-header-title">{sectionTitles[activeSection]}</h1>
                <div className="adm-header-greeting">Bem-vindo(a), {user?.name||"Super Admin"}</div>
              </div>
            </div>
            <div className="adm-header-profile">
              <div className="adm-header-info">
                <div className="adm-header-name">{user?.name||"SCU"}</div>
                <div className="adm-header-role">Super Admin SCU</div>
              </div>
              <div className="adm-header-avatar" style={{cursor:"pointer",backgroundColor:"#7c3aed"}} onClick={handleLogout} title="Sair">{initials}</div>
            </div>
          </header>
          {activeSection==="overview"    && renderOverview()}
          {activeSection==="staff"       && renderStaff()}
          {activeSection==="specialties" && renderSpecialties()}
          {activeSection==="clinic"      && renderClinic()}
          {activeSection==="platform"    && renderPlatform()}
          {activeSection==="reports"     && <section className="adm-fade-in"><div className="adm-card text-center py-5 text-muted"><i className="bi bi-bar-chart-line" style={{fontSize:"2rem"}}/><div className="mt-2">Relatórios — em desenvolvimento</div></div></section>}
          {activeSection==="settings"    && <section className="adm-fade-in"><div className="adm-card text-center py-5 text-muted"><i className="bi bi-gear" style={{fontSize:"2rem"}}/><div className="mt-2">Configurações — em desenvolvimento</div></div></section>}
        </main>
      </div>
    </div>
  );
}
