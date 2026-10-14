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

const emptyDoctorForm = { name:"", email:"", cpf:"", birthDate:"", password:"", specialtyId:"", councilType:"", councilNumber:"", councilState:"", rqe:"", formation:"", languages:"", areasOfPractice:"" };

const TYPE_LABELS_MGR = { FIRST_VISIT: '1ª Consulta', RETURN: 'Retorno' };

const GUIA_STATUS_CONFIG_MGR = {
  GERADA:         { label: 'Aguard. Assinatura', badge: 'bg-warning text-dark',   icon: 'bi-pen' },
  ASSINADA:       { label: 'Assinada',           badge: 'bg-info text-white',     icon: 'bi-pen-fill' },
  ENVIADA:        { label: 'Enviada ao Convênio',badge: 'bg-primary',             icon: 'bi-send' },
  APROVADA:       { label: 'Aprovada',           badge: 'bg-success',             icon: 'bi-check-circle-fill' },
  GLOSADA_PARCIAL:{ label: 'Glosada Parcial',    badge: 'bg-warning text-dark',   icon: 'bi-exclamation-triangle-fill' },
  GLOSADA_TOTAL:  { label: 'Glosada Total',      badge: 'bg-danger',              icon: 'bi-x-circle-fill' },
};

function GuiasPanelMgr() {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');
  const [processing, setProc]     = useState(null);
  const [selected, setSelected]   = useState(null);
  const [modal, setModal]         = useState(null);

  const [obsForm, setObsForm]         = useState('');
  const [enviarForm, setEnviarForm]   = useState({ codigoAutorizacao: '', valorApresentado: '', observacoes: '' });
  const [resolverForm, setResolverForm] = useState({ resultado: 'APROVADA', valorAprovado: '', valorGlosado: '', motivoGlosa: '' });
  const [actionError, setActionError] = useState('');

  const load = () => {
    setLoading(true);
    const url = filterStatus ? `/api/reception/guias?status=${filterStatus}` : '/api/reception/guias';
    apiFetch(url).then(r => r.json()).then(setList).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openModal = (guia, tipo) => {
    setSelected(guia); setModal(tipo); setActionError('');
    setObsForm('');
    setEnviarForm({ codigoAutorizacao: '', valorApresentado: '', observacoes: '' });
    setResolverForm({ resultado: 'APROVADA', valorAprovado: '', valorGlosado: '', motivoGlosa: '' });
  };
  const closeModal = () => { setSelected(null); setModal(null); };

  const doAssinar = async () => {
    setProc(selected.id);
    const res = await apiFetch(`/api/reception/guias/${selected.id}/assinar`, { method:'POST', body: JSON.stringify({ observacoes: obsForm }) });
    if (res.ok) { closeModal(); load(); } else setActionError(await res.text());
    setProc(null);
  };
  const doEnviar = async () => {
    setProc(selected.id);
    const res = await apiFetch(`/api/reception/guias/${selected.id}/enviar`, { method:'POST', body: JSON.stringify(enviarForm) });
    if (res.ok) { closeModal(); load(); } else setActionError(await res.text());
    setProc(null);
  };
  const doResolver = async () => {
    setProc(selected.id);
    const res = await apiFetch(`/api/reception/guias/${selected.id}/resolver`, { method:'POST', body: JSON.stringify(resolverForm) });
    if (res.ok) { closeModal(); load(); } else setActionError(await res.text());
    setProc(null);
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
  const fmtDate = (iso) => iso ? new Date(iso+'T00:00').toLocaleDateString('pt-BR') : '—';
  const statusCfg = (s) => GUIA_STATUS_CONFIG_MGR[s] || { label: s, badge: 'bg-secondary', icon: 'bi-question' };

  return (
    <section className="adm-fade-in">
      {selected && modal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                {modal === 'detail'   && <h5 className="modal-title"><i className="bi bi-file-earmark-text me-2"/>Guia {selected.numeroGuia}</h5>}
                {modal === 'assinar'  && <h5 className="modal-title"><i className="bi bi-pen me-2 text-warning"/>Registrar Assinatura do Paciente</h5>}
                {modal === 'enviar'   && <h5 className="modal-title"><i className="bi bi-send me-2 text-primary"/>Enviar Guia ao Convênio</h5>}
                {modal === 'resolver' && <h5 className="modal-title"><i className="bi bi-clipboard-check me-2 text-success"/>Registrar Resultado do Convênio</h5>}
                <button className="btn-close" onClick={closeModal}/>
              </div>
              <div className="modal-body">
                {/* Dados do documento */}
                <div className="border rounded p-3 mb-3" style={{ background: '#f8f9fa', fontSize: '0.88rem' }}>
                  <div className="row g-2">
                    <div className="col-12"><h6 className="fw-bold mb-2" style={{ color: '#0d6efd' }}><i className="bi bi-hospital me-1"/>Dados do Atendimento</h6></div>
                    <div className="col-md-4"><span className="text-muted">Clínica:</span><br/><strong>{selected.clinicName}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Médico:</span><br/><strong>{selected.doctorName}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Especialidade:</span><br/><strong>{selected.specialtyName}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Data:</span><br/><strong>{fmt(selected.scheduledAt)}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Tipo:</span><br/><strong>{TYPE_LABELS_MGR[selected.appointmentType] || selected.appointmentType}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Nº Guia:</span><br/><strong>{selected.numeroGuia}</strong></div>
                  </div>
                  <hr/>
                  <div className="row g-2">
                    <div className="col-12"><h6 className="fw-bold mb-2" style={{ color: '#198754' }}><i className="bi bi-person me-1"/>Dados do Beneficiário</h6></div>
                    <div className="col-md-4"><span className="text-muted">Nome:</span><br/><strong>{selected.patientName}</strong></div>
                    <div className="col-md-4"><span className="text-muted">CPF:</span><br/><strong>{selected.patientCpf}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Nascimento:</span><br/><strong>{fmtDate(selected.patientBirthDate)}</strong></div>
                  </div>
                  <hr/>
                  <div className="row g-2">
                    <div className="col-12"><h6 className="fw-bold mb-2" style={{ color: '#6f42c1' }}><i className="bi bi-shield-check me-1"/>Dados do Convênio</h6></div>
                    <div className="col-md-4"><span className="text-muted">Operadora:</span><br/><strong>{selected.operadora}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Plano:</span><br/><strong>{selected.plano || '—'}</strong></div>
                    <div className="col-md-4"><span className="text-muted">Nº Carteirinha:</span><br/><strong>{selected.numeroCarteirinha}</strong></div>
                    {selected.codigoAns && <div className="col-md-4"><span className="text-muted">Código ANS:</span><br/><strong>{selected.codigoAns}</strong></div>}
                    {selected.codigoAutorizacao && <div className="col-md-4"><span className="text-muted">Cód. Autorização:</span><br/><strong>{selected.codigoAutorizacao}</strong></div>}
                  </div>
                  {(selected.valorApresentado || selected.valorAprovado || selected.valorGlosado) && (<>
                    <hr/>
                    <div className="row g-2">
                      <div className="col-12"><h6 className="fw-bold mb-2">Valores</h6></div>
                      {selected.valorApresentado && <div className="col-md-4"><span className="text-muted">Apresentado:</span><br/><strong>R$ {selected.valorApresentado}</strong></div>}
                      {selected.valorAprovado    && <div className="col-md-4"><span className="text-muted">Aprovado:</span><br/><strong className="text-success">R$ {selected.valorAprovado}</strong></div>}
                      {selected.valorGlosado     && <div className="col-md-4"><span className="text-muted">Glosado:</span><br/><strong className="text-danger">R$ {selected.valorGlosado}</strong></div>}
                    </div>
                  </>)}
                  {selected.motivoGlosa && <div className="alert alert-danger mt-2 mb-0 py-2 small"><i className="bi bi-exclamation-triangle me-1"/><strong>Motivo da glosa:</strong> {selected.motivoGlosa}</div>}
                  <div className="mt-3 d-flex gap-3 flex-wrap" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                    <span><i className="bi bi-clock me-1"/>Gerada: {fmt(selected.createdAt)}</span>
                    {selected.assinadaEm  && <span><i className="bi bi-pen me-1"/>Assinada: {fmt(selected.assinadaEm)}</span>}
                    {selected.enviadaEm   && <span><i className="bi bi-send me-1"/>Enviada: {fmt(selected.enviadaEm)}</span>}
                    {selected.resolvidaEm && <span><i className="bi bi-check me-1"/>Resolvida: {fmt(selected.resolvidaEm)}</span>}
                  </div>
                </div>
                {modal === 'assinar' && (
                  <div>
                    <p className="text-muted small mb-2"><i className="bi bi-info-circle me-1"/>Confirme que <strong>{selected.patientName}</strong> apresentou documento com foto e assinou a guia.</p>
                    <label className="form-label">Observações (opcional)</label>
                    <textarea className="form-control" rows={2} value={obsForm} onChange={e=>setObsForm(e.target.value)} placeholder="Ex: RG apresentado, assinatura confere..."/>
                  </div>
                )}
                {modal === 'enviar' && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Código de Autorização (se houver)</label>
                      <input className="form-control" value={enviarForm.codigoAutorizacao} onChange={e=>setEnviarForm(f=>({...f,codigoAutorizacao:e.target.value}))} placeholder="Fornecido pelo convênio"/>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Valor Apresentado (R$)</label>
                      <input className="form-control" type="number" step="0.01" min="0" value={enviarForm.valorApresentado} onChange={e=>setEnviarForm(f=>({...f,valorApresentado:e.target.value}))} placeholder="0,00"/>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Observações</label>
                      <textarea className="form-control" rows={2} value={enviarForm.observacoes} onChange={e=>setEnviarForm(f=>({...f,observacoes:e.target.value}))} placeholder="Lote, protocolo..."/>
                    </div>
                  </div>
                )}
                {modal === 'resolver' && (
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Resultado da análise pelo convênio</label>
                      <div className="d-flex gap-3 flex-wrap">
                        {['APROVADA','GLOSADA_PARCIAL','GLOSADA_TOTAL'].map(op=>(
                          <div className="form-check" key={op}>
                            <input className="form-check-input" type="radio" name="resultadoMgr" id={`resMgr_${op}`} value={op} checked={resolverForm.resultado===op} onChange={()=>setResolverForm(f=>({...f,resultado:op}))}/>
                            <label className="form-check-label" htmlFor={`resMgr_${op}`}>
                              <span className={`badge ${statusCfg(op).badge}`}><i className={`bi ${statusCfg(op).icon} me-1`}/>{statusCfg(op).label}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-6"><label className="form-label">Valor Aprovado (R$)</label><input className="form-control" type="number" step="0.01" min="0" value={resolverForm.valorAprovado} onChange={e=>setResolverForm(f=>({...f,valorAprovado:e.target.value}))} placeholder="0,00"/></div>
                    <div className="col-md-6"><label className="form-label">Valor Glosado (R$)</label><input className="form-control" type="number" step="0.01" min="0" value={resolverForm.valorGlosado} onChange={e=>setResolverForm(f=>({...f,valorGlosado:e.target.value}))} placeholder="0,00"/></div>
                    {(resolverForm.resultado==='GLOSADA_PARCIAL'||resolverForm.resultado==='GLOSADA_TOTAL') && (
                      <div className="col-12"><label className="form-label">Motivo da Glosa</label><textarea className="form-control" rows={2} value={resolverForm.motivoGlosa} onChange={e=>setResolverForm(f=>({...f,motivoGlosa:e.target.value}))} placeholder="Ex: dados ilegíveis, beneficiário inativo..."/></div>
                    )}
                  </div>
                )}
                {actionError && <div className="alert alert-danger mt-3 py-2 small">{actionError}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Fechar</button>
                {modal==='assinar'  && <button className="btn btn-warning" onClick={doAssinar}  disabled={processing===selected?.id}><i className="bi bi-pen me-1"/>{processing===selected?.id?'Registrando...':'Confirmar Assinatura'}</button>}
                {modal==='enviar'   && <button className="btn btn-primary" onClick={doEnviar}   disabled={processing===selected?.id}><i className="bi bi-send me-1"/>{processing===selected?.id?'Enviando...':'Marcar como Enviada'}</button>}
                {modal==='resolver' && <button className="btn btn-success" onClick={doResolver} disabled={processing===selected?.id}><i className="bi bi-check2 me-1"/>{processing===selected?.id?'Salvando...':'Registrar Resultado'}</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <span className="fw-semibold text-muted small me-1">Filtrar:</span>
        {[['','Todas'],...Object.entries(GUIA_STATUS_CONFIG_MGR).map(([k,v])=>[k,v.label])].map(([val,lbl])=>(
          <button key={val} className={`btn btn-sm ${filterStatus===val?'btn-primary':'btn-outline-secondary'}`} onClick={()=>setFilter(val)}>{lbl}</button>
        ))}
      </div>

      {loading ? (
        <div className="adm-card text-center py-4 text-muted">Carregando...</div>
      ) : list.length === 0 ? (
        <div className="adm-card text-center py-5 text-muted">
          <i className="bi bi-file-earmark-x" style={{fontSize:'2rem'}}/>
          <div className="mt-2">Nenhuma guia encontrada.</div>
          <div className="small mt-1">As guias são geradas automaticamente ao confirmar uma consulta com convênio.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {list.map(g => {
            const cfg = statusCfg(g.status);
            const borderColor = g.status==='APROVADA'?'#198754':g.status.startsWith('GLOSADA')?'#dc3545':g.status==='ENVIADA'?'#0d6efd':g.status==='ASSINADA'?'#0dcaf0':'#ffc107';
            return (
              <div className="adm-card" key={g.id} style={{ borderLeft:`4px solid ${borderColor}` }}>
                <div className="d-flex align-items-start gap-3 flex-wrap">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge ${cfg.badge}`}><i className={`bi ${cfg.icon} me-1`}/>{cfg.label}</span>
                      <span className="text-muted small">{g.numeroGuia}</span>
                    </div>
                    <div className="fw-bold">{g.patientName} <span className="text-muted fw-normal small">— CPF: {g.patientCpf}</span></div>
                    <div className="text-muted small mt-1"><i className="bi bi-shield-check me-1 text-success"/>{g.operadora}{g.plano?` — ${g.plano}`:''} · {g.numeroCarteirinha}</div>
                    <div className="text-muted small"><i className="bi bi-person-badge me-1"/>{g.doctorName} ({g.specialtyName})<span className="ms-3"><i className="bi bi-clock me-1"/>{fmt(g.scheduledAt)}</span></div>
                    {g.motivoGlosa && <div className="small text-danger mt-1"><i className="bi bi-exclamation-triangle me-1"/>{g.motivoGlosa}</div>}
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0 flex-wrap">
                    <button className="btn btn-outline-secondary btn-sm" onClick={()=>openModal(g,'detail')}><i className="bi bi-eye me-1"/>Ver Guia</button>
                    {g.status==='GERADA'   && <button className="btn btn-warning btn-sm" onClick={()=>openModal(g,'assinar')}><i className="bi bi-pen me-1"/>Registrar Assinatura</button>}
                    {g.status==='ASSINADA' && <button className="btn btn-primary btn-sm" onClick={()=>openModal(g,'enviar')}><i className="bi bi-send me-1"/>Enviar ao Convênio</button>}
                    {g.status==='ENVIADA'  && <button className="btn btn-success btn-sm" onClick={()=>openModal(g,'resolver')}><i className="bi bi-clipboard-check me-1"/>Registrar Resultado</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PendingAppointmentsPanel() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  // confirm modal
  const [confirming, setConfirming] = useState(null);
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [confirmError, setConfirmError] = useState('');
  // reject modal
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch('/api/reception/appointments/pending')
      .then(r => r.json())
      .then(setPending)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openConfirm = (appt) => {
    setConfirming(appt);
    const principal = appt.patient.insurances?.find(i => i.principal && !i.vencido);
    setSelectedInsurance(principal ? principal.id : '');
    setConfirmError('');
  };

  const confirm = async () => {
    if (!confirming) return;
    setProcessing(confirming.id);
    setConfirmError('');
    try {
      const body = selectedInsurance ? { insuranceId: selectedInsurance } : {};
      const res = await apiFetch(`/api/reception/appointments/${confirming.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setConfirming(null);
        load();
      } else {
        const msg = await res.text();
        setConfirmError(msg || 'Erro ao confirmar.');
      }
    } finally { setProcessing(null); }
  };

  const reject = async (id) => {
    setProcessing(id);
    try {
      await apiFetch(`/api/reception/appointments/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejecting(null);
      setRejectReason('');
      load();
    } finally { setProcessing(null); }
  };

  const fmt = (iso) => new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  if (loading) return <div className="adm-card text-center py-4 text-muted">Carregando...</div>;

  return (
    <section className="adm-fade-in">
      {/* Modal de Confirmação com seleção de convênio */}
      {confirming && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-check-circle-fill text-success me-2" />
                  Confirmar Agendamento
                </h5>
                <button className="btn-close" onClick={() => setConfirming(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-1"><strong>Paciente:</strong> {confirming.patient.name}</p>
                <p className="mb-1 text-muted small">CPF: {confirming.patient.cpf}</p>
                <p className="mb-3 text-muted small">
                  <i className="bi bi-clock me-1" />{fmt(confirming.scheduledAt)} —{' '}
                  {confirming.doctor.name} ({confirming.doctor.specialtyName})
                </p>

                <label className="form-label fw-semibold">
                  <i className="bi bi-shield-check me-1 text-success" />
                  Convênio para esta consulta
                </label>
                {confirming.patient.insurances?.length > 0 ? (
                  <select className="form-select" value={selectedInsurance}
                    onChange={e => setSelectedInsurance(e.target.value)}>
                    <option value="">Particular (sem convênio)</option>
                    {confirming.patient.insurances.map(ins => (
                      <option key={ins.id} value={ins.id} disabled={ins.vencido}>
                        {ins.operadora}{ins.plano ? ` — ${ins.plano}` : ''} · {ins.numeroCarteirinha}
                        {ins.vencido ? ' (VENCIDO)' : ''}
                        {ins.principal ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="alert alert-warning py-2 small mb-0">
                    <i className="bi bi-exclamation-triangle me-1" />
                    Paciente não possui convênios cadastrados. Será confirmado como particular.
                  </div>
                )}
                {confirmError && (
                  <div className="alert alert-danger mt-2 py-2 small">{confirmError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirming(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={confirm} disabled={processing === confirming.id}>
                  {processing === confirming.id ? 'Confirmando...' : 'Confirmar Consulta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recusa */}
      {rejecting && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Recusar Agendamento</h5>
                <button className="btn-close" onClick={() => { setRejecting(null); setRejectReason(''); }} />
              </div>
              <div className="modal-body">
                <label className="form-label">Motivo (opcional)</label>
                <textarea className="form-control" rows={3} value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ex: horário indisponível..." />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setRejecting(null); setRejectReason(''); }}>Cancelar</button>
                <button className="btn btn-danger" onClick={() => reject(rejecting)} disabled={processing === rejecting}>
                  {processing === rejecting ? 'Recusando...' : 'Recusar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pending.length === 0 ? (
        <div className="adm-card text-center py-5 text-muted">
          <i className="bi bi-calendar-check" style={{ fontSize: '2rem' }} />
          <div className="mt-2">Nenhum agendamento aguardando aprovação.</div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {pending.map(appt => (
            <div className="adm-card" key={appt.id} style={{ borderLeft: '4px solid #6f42c1' }}>
              <div className="d-flex align-items-start gap-3 flex-wrap">
                <div className="flex-grow-1">
                  <div className="d-flex gap-2 mb-1 flex-wrap">
                    <span className="badge" style={{ background: '#f3e8ff', color: '#6f42c1' }}>Aguardando</span>
                    <span className="badge bg-light text-dark">{TYPE_LABELS_MGR[appt.type] || appt.type}</span>
                    {appt.patient.insurances?.length > 0 ? (
                      <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                        <i className="bi bi-shield-check me-1" />
                        {appt.patient.insurances.length} convênio{appt.patient.insurances.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="badge bg-light text-secondary">Particular</span>
                    )}
                  </div>
                  <div className="fw-bold">{appt.patient.name}</div>
                  <div className="text-muted small">CPF: {appt.patient.cpf} · {appt.patient.email}</div>
                  <div className="text-muted small mt-1">
                    <i className="bi bi-person-badge me-1" />{appt.doctor.name} — {appt.doctor.specialtyName}
                  </div>
                  <div className="text-muted small">
                    <i className="bi bi-hospital me-1" />{appt.clinicName}
                    <span className="ms-3"><i className="bi bi-clock me-1" />{fmt(appt.scheduledAt)}</span>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <button className="btn btn-success btn-sm" onClick={() => openConfirm(appt)} disabled={processing === appt.id}>
                    <i className="bi bi-check-circle me-1" />Confirmar
                  </button>
                  <button className="btn btn-outline-danger btn-sm"
                    onClick={() => { setRejecting(appt.id); setRejectReason(''); }} disabled={processing === appt.id}>
                    <i className="bi bi-x-circle me-1" />Recusar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashBoardManager() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const [doctors,     setDoctors]     = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState("");

  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [dFormErr,   setDFormErr]   = useState("");
  const [dFormOk,    setDFormOk]    = useState("");
  const [dMissing,   setDMissing]   = useState([]);
  const [dSubmit,    setDSubmit]    = useState(false);

  const [editDoc,    setEditDoc]    = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [editErr,    setEditErr]    = useState("");
  const [editOk,     setEditOk]     = useState("");
  const [editSubmit, setEditSubmit] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try { const r = await apiFetch("/api/admin/staff/doctors"); if (r.ok) setDoctors(await r.json()); } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rs] = await Promise.all([apiFetch("/api/specialties")]);
        if (rs.ok) setSpecialties(await rs.json());
        await fetchDoctors();
      } catch { setApiError("Não foi possível carregar dados."); }
      finally { setLoading(false); }
    })();
  }, [fetchDoctors]);

  const handleCreateDoctor = async (e) => {
    e.preventDefault(); setDFormErr(""); setDFormOk(""); setDMissing([]);
    const req = ["name","email","cpf","birthDate","password","specialtyId","councilType","councilNumber","councilState"];
    const miss = req.filter(k => !doctorForm[k]);
    if (miss.length) { setDMissing(miss); setDFormErr("Preencha todos os campos obrigatórios."); return; }
    if (!isValidCPF(doctorForm.cpf)) { setDMissing(["cpf"]); setDFormErr("CPF inválido."); return; }
    setDSubmit(true);
    try {
      const payload = { ...doctorForm, cpf: doctorForm.cpf.replace(/\D/g, "") };
      const res = await apiFetch("/api/admin/staff/doctor", { method:"POST", body: JSON.stringify(payload) });
      const txt = await res.text(); let body; try { body = JSON.parse(txt); } catch { body = txt; }
      if (!res.ok) { setDFormErr(typeof body === "string" && body ? body : body?.message || "Erro ao cadastrar médico."); return; }
      setDFormOk(`Médico ${body.userName || "novo"} cadastrado!`); setDoctorForm(emptyDoctorForm); await fetchDoctors();
    } catch { setDFormErr("Erro de conexão."); } finally { setDSubmit(false); }
  };

  const openEdit  = (d) => { setEditDoc(d); setEditForm({ name:d.userName, cpf:d.userCpf, birthDate:d.userBirthDate, password:"", specialtyId:d.specialtyId, councilType:d.councilType, councilNumber:d.councilNumber, councilState:d.councilState, rqe:d.rqe||"", formation:d.formation||"", languages:d.languages||"", areasOfPractice:d.areasOfPractice||"" }); setEditErr(""); setEditOk(""); };
  const closeEdit = () => { setEditDoc(null); setEditForm({}); };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault(); setEditErr(""); setEditOk(""); setEditSubmit(true);
    try {
      const res = await apiFetch(`/api/admin/staff/doctor/${editDoc.id}`, { method:"PUT", body: JSON.stringify({...editForm, cpf: editForm.cpf?.replace(/\D/g,"")}) });
      const txt = await res.text(); let body; try { body = JSON.parse(txt); } catch { body = txt; }
      if (!res.ok) { setEditErr(typeof body === "string" ? body : "Erro ao atualizar."); return; }
      setEditOk("Médico atualizado!"); await fetchDoctors(); setTimeout(closeEdit, 1500);
    } catch { setEditErr("Erro de conexão."); } finally { setEditSubmit(false); }
  };

  const handleToggleDoctor = async (id) => { try { const r = await apiFetch(`/api/admin/staff/doctor/${id}/toggle`,{method:"POST"}); if(r.ok) await fetchDoctors(); } catch {} };

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleMenu   = (s) => { setActiveSection(s); if(window.innerWidth<992) setSidebarOpen(false); };
  const setDF = (k) => (e) => setDoctorForm(f=>({...f,[k]:e.target.value}));
  const setEF = (k) => (e) => setEditForm(f=>({...f,[k]:e.target.value}));

  const menuItems = [
    { id:"overview",    icon:"bi-grid-1x2-fill",          label:"Visão Geral" },
    { id:"pending",     icon:"bi-calendar-event",         label:"Agendamentos" },
    { id:"guias",       icon:"bi-file-earmark-text-fill", label:"Guias Convênio" },
    { id:"staff",       icon:"bi-people-fill",             label:"Equipe Médica" },
    { id:"specialties", icon:"bi-award-fill",              label:"Especialidades" },
    { id:"settings",    icon:"bi-gear-fill",               label:"Configurações" },
  ];

  const renderSidebar = () => (
    <>
      {sidebarOpen && <div className="adm-sidebar-overlay show" onClick={()=>setSidebarOpen(false)} />}
      <aside className={`adm-sidebar ${sidebarOpen?"adm-sidebar-open":"adm-sidebar-closed"}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-brand-icon" style={{background:"linear-gradient(135deg,#0d9488,#0f766e)"}}><i className="bi bi-building-fill" /></div>
          <div><div className="adm-sidebar-brand-text">SCU</div><div className="adm-sidebar-brand-sub">Painel Gestor</div></div>
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

  const renderOverview = () => (
    <section className="adm-fade-in">
      {loading  && <div className="alert alert-info">Carregando dados...</div>}
      {apiError && <div className="alert alert-danger">{apiError}</div>}
      <div className="row g-4 mb-4">
        {[
          { label:"Médicos da Clínica",  value:doctors.length,                               icon:"bi-heart-pulse-fill",  cls:"blue",   card:"" },
          { label:"Médicos Ativos",       value:doctors.filter(d=>d.profileEnabled).length,   icon:"bi-person-check-fill", cls:"green",  card:"accent" },
          { label:"Médicos Inativos",     value:doctors.filter(d=>!d.profileEnabled).length,  icon:"bi-person-dash-fill",  cls:"yellow", card:"warning" },
          { label:"Especialidades",       value:specialties.length,                           icon:"bi-award-fill",        cls:"cyan",   card:"info" },
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
        <div className="adm-activity-item"><div className="adm-activity-dot blue"/><div><div className="adm-activity-text"><strong>Login</strong> — Acesso ao painel Gestor</div><div className="adm-activity-time">Agora</div></div></div>
      </div>
    </section>
  );

  const renderStaff = () => (
    <section className="adm-fade-in">
      <div className="adm-card mb-4">
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
            <div className="adm-form-section-title"><i className="bi bi-award"/> Especialidade</div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">Especialidade *</label>
                <select className={`form-select ${dMissing.includes("specialtyId")?"border-danger":""}`} value={doctorForm.specialtyId} onChange={setDF("specialtyId")}>
                  <option value="">Selecione...</option>{specialties.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
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
        <div className="adm-card-title"><i className="bi bi-list-ul"/> Médicos da Clínica <span className="ms-2 badge bg-secondary">{doctors.length}</span></div>
        {doctors.length === 0 ? <div className="text-center py-4 text-muted">Nenhum médico cadastrado.</div> : (
          <div className="table-responsive"><table className="adm-table">
            <thead><tr><th>Nome</th><th>Conselho</th><th>Especialidade</th><th>Status</th><th style={{width:100}}>Ações</th></tr></thead>
            <tbody>{doctors.map(d=>(
              <tr key={d.id}>
                <td className="fw-semibold">{d.userName}</td>
                <td>{d.councilType}/{d.councilState} {d.councilNumber}</td>
                <td>{d.specialtyName}</td>
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
    </section>
  );

  const renderSpecialties = () => (
    <section className="adm-fade-in">
      <div className="adm-card">
        <div className="adm-card-title"><i className="bi bi-award-fill"/> Especialidades Disponíveis <span className="ms-2 badge bg-secondary">{specialties.length}</span></div>
        {specialties.length === 0 ? <div className="text-center py-4 text-muted">Nenhuma especialidade cadastrada.</div> : (
          <div className="table-responsive"><table className="adm-table">
            <thead><tr><th>Nome</th><th>Descrição</th></tr></thead>
            <tbody>{specialties.map(s=><tr key={s.id}><td className="fw-semibold">{s.name}</td><td>{s.description||"—"}</td></tr>)}</tbody>
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

  const sectionTitles = { overview:"Visão Geral", pending:"Agendamentos Pendentes", guias:"Guias de Convênio", staff:"Equipe Médica", specialties:"Especialidades", settings:"Configurações" };
  const initials = (user?.name||"GS").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

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
                <div className="adm-header-greeting">Bem-vindo(a), {user?.name||"Gestor"}</div>
              </div>
            </div>
            <div className="adm-header-profile">
              <div className="adm-header-info">
                <div className="adm-header-name">{user?.name||"Gestor"}</div>
                <div className="adm-header-role">Gestor de Clínica</div>
              </div>
              <div className="adm-header-avatar" style={{cursor:"pointer", background:"#0d9488"}} onClick={handleLogout} title="Sair">{initials}</div>
            </div>
          </header>
          {activeSection==="overview"    && renderOverview()}
          {activeSection==="pending"     && <PendingAppointmentsPanel />}
          {activeSection==="guias"       && <GuiasPanelMgr />}
          {activeSection==="staff"       && renderStaff()}
          {activeSection==="specialties" && renderSpecialties()}
          {activeSection==="settings"    && <section className="adm-fade-in"><div className="adm-card text-center py-5 text-muted"><i className="bi bi-gear" style={{fontSize:"2rem"}}/><div className="mt-2">Configurações — em desenvolvimento</div></div></section>}
        </main>
      </div>
    </div>
  );
}
