import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, apiFetch, logout } from '../utils/auth';
import '../styles/patient-dashboard.css';

const BASE = '/api/patient';

const STATUS_LABELS = {
  PENDING:     { label: 'Aguardando',  cls: 'pat-badge-pending' },
  SCHEDULED:   { label: 'Agendada',   cls: 'pat-badge-scheduled' },
  IN_PROGRESS: { label: 'Em andamento', cls: 'pat-badge-inprogress' },
  COMPLETED:   { label: 'Concluída',  cls: 'pat-badge-completed' },
  CANCELLED:   { label: 'Cancelada',  cls: 'pat-badge-cancelled' },
};

const TYPE_LABELS = { FIRST_VISIT: 'Primeira Consulta', RETURN: 'Retorno' };

const BLOOD_TYPES = [
  { value: 'A_POS', label: 'A+' }, { value: 'A_NEG', label: 'A-' },
  { value: 'B_POS', label: 'B+' }, { value: 'B_NEG', label: 'B-' },
  { value: 'AB_POS', label: 'AB+' }, { value: 'AB_NEG', label: 'AB-' },
  { value: 'O_POS', label: 'O+' }, { value: 'O_NEG', label: 'O-' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(p => p[0].toUpperCase()).join('');
}

function ApptDateBox({ iso }) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
  return (
    <div className="pat-appt-date-box">
      <span className="pat-appt-date-day">{day}</span>
      <span className="pat-appt-date-month">{month}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, cls: '' };
  return <span className={`pat-badge ${s.cls}`}>{s.label}</span>;
}

// ── Aba: Agendar Consulta (wizard 3 passos) ───────────────────────────────────

function TabBooking({ onBooked }) {
  const [step, setStep] = useState(1);

  // Step 1 — clinica
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Step 2 — especialidade e medico
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Step 3 — data, hora, tipo
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [apptType, setApptType] = useState('FIRST_VISIT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch(`${BASE}/booking/clinics`)
      .then(r => r.json())
      .then(setClinics);
  }, []);

  const selectClinic = async (clinic) => {
    setSelectedClinic(clinic);
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setDoctors([]);
    const res = await apiFetch(`${BASE}/booking/clinics/${clinic.id}/specialties`);
    setSpecialties(await res.json());
    setStep(2);
  };

  const selectSpecialty = async (spec) => {
    setSelectedSpecialty(spec);
    setSelectedDoctor(null);
    const res = await apiFetch(`${BASE}/booking/clinics/${selectedClinic.id}/doctors?specialtyId=${spec.id}`);
    setDoctors(await res.json());
  };

  const handleSubmit = async () => {
    if (!scheduledDate || !scheduledTime) { setError('Escolha a data e o horário.'); return; }
    const scheduledAt = `${scheduledDate}T${scheduledTime}`;
    setSubmitting(true); setError('');
    try {
      const res = await apiFetch(`${BASE}/appointments`, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: selectedClinic.id,
          doctorId: selectedDoctor.id,
          scheduledAt,
          type: apptType,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        onBooked();
      } else {
        const msg = await res.text();
        setError(msg || 'Erro ao agendar.');
      }
    } catch { setError('Erro de conexão.'); }
    finally { setSubmitting(false); }
  };

  const reset = () => {
    setStep(1); setSelectedClinic(null); setSelectedSpecialty(null);
    setSelectedDoctor(null); setScheduledDate(''); setScheduledTime('');
    setApptType('FIRST_VISIT'); setError(''); setSuccess(false);
  };

  if (success) return (
    <div className="pat-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', color: '#20C997', display: 'block', marginBottom: 16 }} />
      <h5 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: 8 }}>Solicitação enviada!</h5>
      <p style={{ color: '#6c757d', marginBottom: 24 }}>
        Sua consulta com <strong>{selectedDoctor?.name}</strong> aguarda confirmação da recepção.
        Você receberá uma notificação quando for confirmada.
      </p>
      <button className="pat-btn pat-btn-primary" onClick={reset}>
        <i className="bi bi-plus-circle" /> Agendar outra consulta
      </button>
    </div>
  );

  return (
    <>
      {/* Stepper */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderRadius: 12,
        overflow: 'hidden', border: '1px solid #e9ecef' }}>
        {[
          { n: 1, label: 'Clínica' },
          { n: 2, label: 'Médico' },
          { n: 3, label: 'Data e Hora' },
        ].map(s => (
          <div key={s.n} style={{
            flex: 1, padding: '12px 8px', textAlign: 'center',
            background: step === s.n ? 'var(--pat-primary)' : step > s.n ? '#d1f5ea' : '#f8f9fa',
            color: step === s.n ? '#fff' : step > s.n ? '#0f6848' : '#6c757d',
            fontSize: '0.82rem', fontWeight: step === s.n ? 600 : 500,
            borderRight: s.n < 3 ? '1px solid #e9ecef' : 'none',
          }}>
            <span style={{ marginRight: 5 }}>
              {step > s.n ? <i className="bi bi-check" /> : `${s.n}.`}
            </span>
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: Clinica */}
      {step === 1 && (
        <div className="pat-card">
          <div className="pat-card-title"><i className="bi bi-hospital" /> Escolha a Clínica</div>
          {clinics.length === 0 ? (
            <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clinics.map(c => (
                <button key={c.id} className="pat-btn pat-btn-ghost"
                  style={{ justifyContent: 'flex-start', padding: '14px 16px', borderRadius: 10, textAlign: 'left' }}
                  onClick={() => selectClinic(c)}>
                  <i className="bi bi-building" style={{ fontSize: '1.1rem', marginRight: 8 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.address && <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>{c.address}</div>}
                  </div>
                  <i className="bi bi-chevron-right" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Especialidade + Medico */}
      {step === 2 && (
        <div className="pat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => setStep(1)} className="pat-btn pat-btn-ghost pat-btn-sm">
              <i className="bi bi-arrow-left" />
            </button>
            <div className="pat-card-title" style={{ margin: 0 }}>
              <i className="bi bi-person-badge" /> {selectedClinic?.name}
            </div>
          </div>

          <div className="pat-form-group" style={{ marginBottom: 16 }}>
            <label>Especialidade</label>
            <select value={selectedSpecialty?.id || ''}
              onChange={e => {
                const spec = specialties.find(s => s.id === e.target.value);
                if (spec) selectSpecialty(spec);
              }}>
              <option value="">Todas as especialidades</option>
              {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {doctors.length === 0 && selectedSpecialty && (
            <div className="pat-empty">
              <i className="bi bi-person-x" />
              <p>Nenhum médico disponível para essa especialidade.</p>
            </div>
          )}

          {doctors.length > 0 && (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6c757d', marginBottom: 8 }}>
                Médicos disponíveis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {doctors.map(d => (
                  <button key={d.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      borderRadius: 10, border: `2px solid ${selectedDoctor?.id === d.id ? 'var(--pat-primary)' : '#e9ecef'}`,
                      background: selectedDoctor?.id === d.id ? 'rgba(32,201,151,0.06)' : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onClick={() => setSelectedDoctor(d)}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #20C997, #0D6EFD)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                    }}>
                      {d.name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{d.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6c757d' }}>{d.specialtyName}</div>
                    </div>
                    {selectedDoctor?.id === d.id && (
                      <i className="bi bi-check-circle-fill" style={{ color: 'var(--pat-primary)', fontSize: '1.1rem' }} />
                    )}
                  </button>
                ))}
              </div>
              {selectedDoctor && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button className="pat-btn pat-btn-primary" onClick={() => setStep(3)}>
                    Continuar <i className="bi bi-arrow-right" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Se nenhuma especialidade selecionada, mostra todos os medicos */}
          {!selectedSpecialty && doctors.length === 0 && specialties.length > 0 && (
            <div style={{ color: '#6c757d', fontSize: '0.88rem', textAlign: 'center', padding: '16px 0' }}>
              Selecione uma especialidade para ver os médicos disponíveis.
            </div>
          )}
        </div>
      )}

      {/* Step 3: Data e hora */}
      {step === 3 && (
        <div className="pat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setStep(2)} className="pat-btn pat-btn-ghost pat-btn-sm">
              <i className="bi bi-arrow-left" />
            </button>
            <div>
              <div style={{ fontWeight: 600 }}>{selectedDoctor?.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{selectedDoctor?.specialtyName} · {selectedClinic?.name}</div>
            </div>
          </div>

          <div className="pat-profile-grid" style={{ marginBottom: 20 }}>
            <div className="pat-form-group">
              <label>Data da consulta *</label>
              <input type="date" value={scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { setScheduledDate(e.target.value); setError(''); }} />
            </div>
            <div className="pat-form-group">
              <label>Horário *</label>
              <input type="time" value={scheduledTime}
                onChange={e => { setScheduledTime(e.target.value); setError(''); }} />
            </div>
            <div className="pat-form-group full-width">
              <label>Tipo de consulta</label>
              <select value={apptType} onChange={e => setApptType(e.target.value)}>
                <option value="FIRST_VISIT">Primeira Consulta</option>
                <option value="RETURN">Retorno</option>
              </select>
            </div>
          </div>

          {scheduledDate && scheduledTime && (
            <div style={{
              background: '#f4fbf8', border: '1px solid #c3edd8', borderRadius: 10,
              padding: '14px 16px', marginBottom: 16, fontSize: '0.88rem',
            }}>
              <i className="bi bi-info-circle" style={{ color: '#20C997', marginRight: 6 }} />
              Sua solicitação será enviada para a recepção de <strong>{selectedClinic?.name}</strong>.
              Você receberá uma notificação quando for confirmada.
            </div>
          )}

          {error && (
            <div style={{ background: '#f8d7da', color: '#842029', borderRadius: 8,
              padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem' }}>
              <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />{error}
            </div>
          )}

          <button className="pat-btn pat-btn-primary"
            onClick={handleSubmit} disabled={submitting || !scheduledDate || !scheduledTime}>
            {submitting
              ? <><i className="bi bi-arrow-repeat" /> Enviando...</>
              : <><i className="bi bi-calendar-plus" /> Solicitar Agendamento</>}
          </button>
        </div>
      )}
    </>
  );
}

// ── Aba: Visao Geral ──────────────────────────────────────────────────────────

function TabOverview({ appointments }) {
  const now = new Date();
  const upcoming = appointments
    .filter(a => a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const thisMonth = appointments.filter(a => {
    const d = new Date(a.scheduledAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const nextAppt = upcoming[0];

  return (
    <>
      <div className="pat-kpi-grid">
        <div className="pat-kpi-card">
          <div className="pat-kpi-icon"><i className="bi bi-calendar-event" /></div>
          <div>
            <div className="pat-kpi-value">{upcoming.length}</div>
            <div className="pat-kpi-label">Consultas Agendadas</div>
          </div>
        </div>
        <div className="pat-kpi-card accent">
          <div className="pat-kpi-icon"><i className="bi bi-calendar-check" /></div>
          <div>
            <div className="pat-kpi-value">{thisMonth}</div>
            <div className="pat-kpi-label">Consultas este Mês</div>
          </div>
        </div>
        <div className="pat-kpi-card warning">
          <div className="pat-kpi-icon"><i className="bi bi-clipboard2-pulse" /></div>
          <div>
            <div className="pat-kpi-value">{appointments.length}</div>
            <div className="pat-kpi-label">Total de Consultas</div>
          </div>
        </div>
      </div>

      {nextAppt ? (
        <div className="pat-next-appt">
          <div className="pat-next-appt-label">Próxima Consulta</div>
          <div className="pat-next-appt-doctor">{nextAppt.doctor.name}</div>
          <div className="pat-next-appt-specialty">{nextAppt.doctor.specialtyName}</div>
          <div className="pat-next-appt-meta">
            <span><i className="bi bi-calendar3" />{formatDate(nextAppt.scheduledAt)}</span>
            <span><i className="bi bi-clock" />{new Date(nextAppt.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span><i className="bi bi-hospital" />{nextAppt.clinicName}</span>
            <span><i className="bi bi-arrow-repeat" />{TYPE_LABELS[nextAppt.type] || nextAppt.type}</span>
          </div>
        </div>
      ) : (
        <div className="pat-card">
          <div className="pat-empty">
            <i className="bi bi-calendar-x" />
            <p>Nenhuma consulta agendada no momento.</p>
          </div>
        </div>
      )}

      {upcoming.length > 1 && (
        <div className="pat-card">
          <div className="pat-card-title">
            <i className="bi bi-list-check" /> Próximas Consultas
          </div>
          <div className="pat-appt-list">
            {upcoming.slice(1, 4).map(a => (
              <div key={a.id} className="pat-appt-item">
                <ApptDateBox iso={a.scheduledAt} />
                <div className="pat-appt-info">
                  <div className="pat-appt-doctor">{a.doctor.name}</div>
                  <div className="pat-appt-meta">
                    {a.doctor.specialtyName} · {a.clinicName} · {new Date(a.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Aba: Minhas Consultas ─────────────────────────────────────────────────────

function TabAppointments({ appointments, onReload }) {
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const filters = ['ALL', 'PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
  const filterLabels = { ALL: 'Todas', PENDING: 'Aguardando', SCHEDULED: 'Agendadas', COMPLETED: 'Concluídas', CANCELLED: 'Canceladas' };

  const filtered = filter === 'ALL'
    ? appointments
    : appointments.filter(a => a.status === filter);

  const handleCancel = async (appt) => {
    if (!window.confirm('Deseja cancelar esta solicitação de consulta?')) return;
    setCancelling(appt.id);
    try {
      await apiFetch(`${BASE}/appointments/${appt.id}`, { method: 'DELETE' });
      onReload();
      setSelected(null);
    } finally { setCancelling(null); }
  };

  return (
    <>
      <div className="pat-tab-nav" style={{ marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f} className={`pat-tab-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}>
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="pat-empty">
          <i className="bi bi-calendar-x" />
          <p>Nenhuma consulta encontrada.</p>
        </div>
      ) : (
        <div className="pat-appt-list">
          {filtered.map(a => (
            <div key={a.id} className="pat-appt-item">
              <ApptDateBox iso={a.scheduledAt} />
              <div className="pat-appt-info">
                <div className="pat-appt-doctor">{a.doctor.name}</div>
                <div className="pat-appt-meta">
                  {a.doctor.specialtyName} · {a.clinicName} · {formatDateTime(a.scheduledAt)}
                </div>
              </div>
              <div className="pat-appt-actions">
                <StatusBadge status={a.status} />
                <button className="pat-btn pat-btn-ghost pat-btn-sm"
                  onClick={() => setSelected(a)}>
                  <i className="bi bi-eye" /> Ver
                </button>
                {(a.status === 'PENDING' || a.status === 'SCHEDULED') && (
                  <button className="pat-btn pat-btn-ghost pat-btn-sm"
                    style={{ color: '#dc3545', borderColor: '#dc3545' }}
                    disabled={cancelling === a.id}
                    onClick={() => handleCancel(a)}>
                    <i className="bi bi-x-circle" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480,
            maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h5 style={{ margin: 0, fontFamily: 'Poppins, sans-serif' }}>Detalhes da Consulta</h5>
              <button onClick={() => setSelected(null)}
                style={{ border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#6c757d' }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="pat-record-field">
              <div className="pat-record-field-label">Médico</div>
              <div className="pat-record-field-value">{selected.doctor.name} — {selected.doctor.specialtyName}</div>
            </div>
            <div className="pat-record-field">
              <div className="pat-record-field-label">Data e Hora</div>
              <div className="pat-record-field-value">{formatDateTime(selected.scheduledAt)}</div>
            </div>
            <div className="pat-record-field">
              <div className="pat-record-field-label">Clínica</div>
              <div className="pat-record-field-value">{selected.clinicName}</div>
            </div>
            <div className="pat-record-field">
              <div className="pat-record-field-label">Tipo</div>
              <div className="pat-record-field-value">{TYPE_LABELS[selected.type] || selected.type}</div>
            </div>
            <div className="pat-record-field">
              <div className="pat-record-field-label">Status</div>
              <StatusBadge status={selected.status} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Aba: Meu Prontuario ───────────────────────────────────────────────────────

function TabRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    apiFetch(`${BASE}/records`)
      .then(r => r.json())
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>;

  if (records.length === 0) return (
    <div className="pat-empty">
      <i className="bi bi-clipboard2-x" />
      <p>Nenhum prontuário disponível ainda.</p>
    </div>
  );

  return (
    <div>
      {records.map(rec => (
        <div key={rec.id} className="pat-record-item">
          <button className="pat-record-header"
            onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.93rem' }}>{rec.doctorName}</div>
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                {rec.specialtyName} · {formatDate(rec.scheduledAt)} · {rec.clinicName}
              </div>
            </div>
            <i className={`bi bi-chevron-${expanded === rec.id ? 'up' : 'down'}`}
              style={{ color: '#6c757d' }} />
          </button>

          {expanded === rec.id && (
            <div className="pat-record-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {rec.chiefComplaint && (
                  <div className="pat-record-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="pat-record-field-label">Queixa Principal</div>
                    <div className="pat-record-field-value">{rec.chiefComplaint}</div>
                  </div>
                )}
                {rec.diagnosis && (
                  <div className="pat-record-field">
                    <div className="pat-record-field-label">Diagnóstico</div>
                    <div className="pat-record-field-value">{rec.diagnosis}</div>
                  </div>
                )}
                {rec.cid10 && (
                  <div className="pat-record-field">
                    <div className="pat-record-field-label">CID-10</div>
                    <div className="pat-record-field-value">{rec.cid10}</div>
                  </div>
                )}
                {rec.treatment && (
                  <div className="pat-record-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="pat-record-field-label">Conduta</div>
                    <div className="pat-record-field-value">{rec.treatment}</div>
                  </div>
                )}
                {rec.notes && (
                  <div className="pat-record-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="pat-record-field-label">Observações</div>
                    <div className="pat-record-field-value">{rec.notes}</div>
                  </div>
                )}
              </div>

              {rec.prescriptionItems && rec.prescriptionItems.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="pat-record-field-label" style={{ marginBottom: 8 }}>
                    <i className="bi bi-capsule" style={{ marginRight: 5 }} />Prescrição
                  </div>
                  <div className="pat-prescription-grid">
                    {rec.prescriptionItems.map(item => (
                      <div key={item.id} className="pat-prescription-item">
                        <div className="pat-prescription-med">{item.medicationName}</div>
                        {item.dosage && <div className="pat-prescription-detail">Dose: {item.dosage}</div>}
                        {item.duration && <div className="pat-prescription-detail">Duração: {item.duration}</div>}
                        {item.notes && <div className="pat-prescription-detail">{item.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Aba: Meu Perfil ───────────────────────────────────────────────────────────

function TabProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch(`${BASE}/profile`)
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm({
          phone: data.phone || '',
          address: data.address || '',
          bloodType: data.bloodType || '',
          allergies: data.allergies || '',
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
        });
      });
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, bloodType: form.bloodType || null };
      const res = await apiFetch(`${BASE}/profile`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSuccess(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>;

  return (
    <form onSubmit={handleSave}>
      <div className="pat-card" style={{ marginBottom: 20 }}>
        <div className="pat-card-title"><i className="bi bi-person-badge" /> Dados da Conta</div>
        <div className="pat-profile-grid">
          <div className="pat-form-group">
            <label>Nome completo</label>
            <input value={profile.name} disabled />
          </div>
          <div className="pat-form-group">
            <label>Email</label>
            <input value={profile.email} disabled />
          </div>
          <div className="pat-form-group">
            <label>CPF</label>
            <input value={profile.cpf} disabled />
          </div>
          <div className="pat-form-group">
            <label>Data de nascimento</label>
            <input value={profile.birthDate} disabled />
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6c757d', marginTop: 12, marginBottom: 0 }}>
          <i className="bi bi-lock" style={{ marginRight: 4 }} />
          Para alterar nome, email ou CPF, entre em contato com a recepção.
        </p>
      </div>

      <div className="pat-card">
        <div className="pat-card-title"><i className="bi bi-heart-pulse" /> Dados Clínicos</div>
        <div className="pat-profile-grid">
          <div className="pat-form-group">
            <label>Telefone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" />
          </div>
          <div className="pat-form-group">
            <label>Tipo Sanguíneo</label>
            <select name="bloodType" value={form.bloodType} onChange={handleChange}>
              <option value="">Não informado</option>
              {BLOOD_TYPES.map(bt => (
                <option key={bt.value} value={bt.value}>{bt.label}</option>
              ))}
            </select>
          </div>
          <div className="pat-form-group full-width">
            <label>Endereço</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="pat-form-group full-width">
            <label>Alergias</label>
            <textarea name="allergies" value={form.allergies} onChange={handleChange}
              rows={3} placeholder="Liste suas alergias conhecidas..." style={{ resize: 'vertical' }} />
          </div>
          <div className="pat-form-group">
            <label>Contato de Emergência — Nome</label>
            <input name="emergencyContactName" value={form.emergencyContactName}
              onChange={handleChange} placeholder="Nome completo" />
          </div>
          <div className="pat-form-group">
            <label>Contato de Emergência — Telefone</label>
            <input name="emergencyContactPhone" value={form.emergencyContactPhone}
              onChange={handleChange} placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" className="pat-btn pat-btn-primary" disabled={saving}>
            {saving ? <><i className="bi bi-arrow-repeat" /> Salvando...</> : <><i className="bi bi-check2" /> Salvar Alterações</>}
          </button>
          {success && (
            <span style={{ color: '#20C997', fontSize: '0.87rem', fontWeight: 500 }}>
              <i className="bi bi-check-circle" /> Perfil atualizado!
            </span>
          )}
        </div>
      </div>
    </form>
  );
}

// ── Aba: Meus Convênios ───────────────────────────────────────────────────────

const EMPTY_INS_FORM = {
  operadora: '', numeroCarteirinha: '', plano: '',
  codigoAns: '', dataInicio: '', dataValidade: '',
  titular: true, nomeTitular: '', principal: false,
};

function TabInsurance() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_INS_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch(`${BASE}/insurance`)
      .then(r => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_INS_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (ins) => {
    setEditId(ins.id);
    setForm({
      operadora: ins.operadora || '',
      numeroCarteirinha: ins.numeroCarteirinha || '',
      plano: ins.plano || '',
      codigoAns: ins.codigoAns || '',
      dataInicio: ins.dataInicio || '',
      dataValidade: ins.dataValidade || '',
      titular: ins.titular,
      nomeTitular: ins.nomeTitular || '',
      principal: ins.principal,
    });
    setError('');
    setShowForm(true);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.operadora.trim() || !form.numeroCarteirinha.trim()) {
      setError('Operadora e número da carteirinha são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editId ? `${BASE}/insurance/${editId}` : `${BASE}/insurance`;
      const method = editId ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (res.ok) {
        setShowForm(false);
        load();
      } else {
        const msg = await res.text();
        setError(msg || 'Erro ao salvar convênio.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este convênio?')) return;
    await apiFetch(`${BASE}/insurance/${id}`, { method: 'DELETE' });
    load();
  };

  const handleSetPrincipal = async (id) => {
    await apiFetch(`${BASE}/insurance/${id}/set-principal`, { method: 'POST' });
    load();
  };

  if (loading) return <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h5 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Meus Convênios</h5>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d' }}>Gerencie seus planos de saúde</p>
        </div>
        <button className="pat-btn pat-btn-primary" onClick={openNew}>
          <i className="bi bi-plus-circle" /> Adicionar Convênio
        </button>
      </div>

      {showForm && (
        <div className="pat-card" style={{ marginBottom: 20, borderLeft: '4px solid #20C997' }}>
          <div className="pat-card-title">
            <i className="bi bi-shield-plus" /> {editId ? 'Editar Convênio' : 'Novo Convênio'}
          </div>
          <form onSubmit={handleSave}>
            <div className="pat-profile-grid">
              <div className="pat-form-group">
                <label>Operadora *</label>
                <input name="operadora" value={form.operadora} onChange={handleChange}
                  placeholder="Ex: Unimed, Amil, Bradesco Saúde" required />
              </div>
              <div className="pat-form-group">
                <label>Número da Carteirinha *</label>
                <input name="numeroCarteirinha" value={form.numeroCarteirinha} onChange={handleChange}
                  placeholder="Número do cartão/carteirinha" required />
              </div>
              <div className="pat-form-group">
                <label>Plano</label>
                <input name="plano" value={form.plano} onChange={handleChange}
                  placeholder="Ex: Nacional, Especial, QD-20" />
              </div>
              <div className="pat-form-group">
                <label>Código ANS</label>
                <input name="codigoAns" value={form.codigoAns} onChange={handleChange}
                  placeholder="6 dígitos" maxLength={10} />
              </div>
              <div className="pat-form-group">
                <label>Início da Vigência</label>
                <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} />
              </div>
              <div className="pat-form-group">
                <label>Validade</label>
                <input type="date" name="dataValidade" value={form.dataValidade} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, margin: '12px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" name="titular" checked={form.titular} onChange={handleChange} />
                Sou o titular deste plano
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" name="principal" checked={form.principal} onChange={handleChange} />
                Definir como convênio principal
              </label>
            </div>
            {!form.titular && (
              <div className="pat-form-group" style={{ maxWidth: 320 }}>
                <label>Nome do Titular</label>
                <input name="nomeTitular" value={form.nomeTitular} onChange={handleChange}
                  placeholder="Nome completo do titular" />
              </div>
            )}
            {error && <div className="pat-alert-error" style={{ marginBottom: 10 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" className="pat-btn pat-btn-primary" disabled={saving}>
                {saving ? <><i className="bi bi-arrow-repeat" /> Salvando...</> : <><i className="bi bi-check2" /> Salvar</>}
              </button>
              <button type="button" className="pat-btn pat-btn-outline" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {list.length === 0 ? (
        <div className="pat-empty">
          <i className="bi bi-shield-x" />
          <p>Nenhum convênio cadastrado.</p>
          <p style={{ fontSize: '0.85rem', color: '#adb5bd' }}>
            Adicione seus planos de saúde para agilizar a confirmação de consultas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map(ins => (
            <div key={ins.id} className="pat-card" style={{
              borderLeft: ins.principal ? '4px solid #20C997' : '4px solid #e9ecef',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}>
                      {ins.operadora}
                    </span>
                    {ins.principal && (
                      <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.72rem',
                        fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                        Principal
                      </span>
                    )}
                    {ins.vencido && (
                      <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem',
                        fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                        Vencido
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: 4 }}>
                    {ins.plano && <span style={{ marginRight: 12 }}><i className="bi bi-card-text" style={{ marginRight: 4 }} />{ins.plano}</span>}
                    <span><i className="bi bi-credit-card" style={{ marginRight: 4 }} />Carteirinha: <strong>{ins.numeroCarteirinha}</strong></span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#adb5bd', marginTop: 4 }}>
                    {!ins.titular && ins.nomeTitular && <span style={{ marginRight: 12 }}>Titular: {ins.nomeTitular}</span>}
                    {ins.dataValidade && <span>Válido até: {formatDate(ins.dataValidade)}</span>}
                    {ins.codigoAns && <span style={{ marginLeft: 12 }}>ANS: {ins.codigoAns}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!ins.principal && (
                    <button className="pat-btn pat-btn-outline" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                      onClick={() => handleSetPrincipal(ins.id)}>
                      <i className="bi bi-star" /> Principal
                    </button>
                  )}
                  <button className="pat-btn pat-btn-outline" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                    onClick={() => openEdit(ins)}>
                    <i className="bi bi-pencil" />
                  </button>
                  <button style={{ background: 'none', border: '1px solid #fee2e2', color: '#dc3545',
                    borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => handleDelete(ins.id)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Painel de Notificacoes ────────────────────────────────────────────────────

function NotificationsPanel({ onClose, onMarkAllRead }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${BASE}/notifications`)
      .then(r => r.json())
      .then(setNotifs)
      .finally(() => setLoading(false));
  }, []);

  const markOne = async (id) => {
    await apiFetch(`${BASE}/notifications/${id}/read`, { method: 'POST' });
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAll = async () => {
    await apiFetch(`${BASE}/notifications/mark-all-read`, { method: 'POST' });
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    onMarkAllRead();
  };

  return (
    <div style={{
      position: 'fixed', top: 70, right: 32, width: 360,
      background: '#fff', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
      zIndex: 200, maxHeight: 480, display: 'flex', flexDirection: 'column',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #e9ecef',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>Notificações</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={markAll}
            style={{ border: 'none', background: 'none', fontSize: '0.78rem', color: '#20C997',
              cursor: 'pointer', fontWeight: 500 }}>
            Marcar todas como lidas
          </button>
          <button onClick={onClose}
            style={{ border: 'none', background: 'none', color: '#6c757d', cursor: 'pointer', fontSize: '1rem' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>
        ) : notifs.length === 0 ? (
          <div className="pat-empty" style={{ padding: 32 }}>
            <i className="bi bi-bell-slash" />
            <p>Nenhuma notificação.</p>
          </div>
        ) : (
          <div style={{ padding: '10px 12px' }} className="pat-notif-list">
            {notifs.map(n => (
              <div key={n.id} className={`pat-notif-item${n.read ? '' : ' unread'}`}
                onClick={() => !n.read && markOne(n.id)}>
                <div className="pat-notif-icon"><i className="bi bi-bell" /></div>
                <div className="pat-notif-content">
                  <div className="pat-notif-title">{n.title}</div>
                  <div className="pat-notif-body">{n.body}</div>
                  <div className="pat-notif-time">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%',
                    background: '#20C997', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard Principal ───────────────────────────────────────────────────────

export default function DashBoardPaciente() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  const loadAppointments = useCallback(() => {
    apiFetch(`${BASE}/appointments`)
      .then(r => r.json())
      .then(setAppointments)
      .finally(() => setLoadingAppts(false));
  }, []);

  const loadUnread = useCallback(() => {
    apiFetch(`${BASE}/notifications/unread-count`)
      .then(r => r.json())
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAppointments();
    loadUnread();
  }, [loadAppointments, loadUnread]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview',      label: 'Visão Geral',       icon: 'bi-house' },
    { id: 'booking',       label: 'Agendar Consulta',  icon: 'bi-calendar-plus' },
    { id: 'appointments',  label: 'Minhas Consultas',  icon: 'bi-calendar-check' },
    { id: 'records',       label: 'Meu Prontuário',    icon: 'bi-clipboard2-pulse' },
    { id: 'insurance',     label: 'Meus Convênios',    icon: 'bi-shield-check' },
    { id: 'profile',       label: 'Meu Perfil',        icon: 'bi-person-circle' },
  ];

  const tabTitles = {
    overview:     { title: 'Visão Geral',       sub: 'Resumo da sua saúde' },
    booking:      { title: 'Agendar Consulta',  sub: 'Solicite uma nova consulta' },
    appointments: { title: 'Minhas Consultas',  sub: 'Histórico e agendamentos' },
    records:      { title: 'Meu Prontuário',    sub: 'Diagnósticos e prescrições' },
    insurance:    { title: 'Meus Convênios',    sub: 'Gerencie seus planos de saúde' },
    profile:      { title: 'Meu Perfil',        sub: 'Dados pessoais e clínicos' },
  };

  const current = tabTitles[activeTab];

  return (
    <div className="patient-dashboard">
      <button className="pat-mobile-toggle" onClick={() => setSidebarOpen(o => !o)}>
        <i className="bi bi-list" />
      </button>

      {sidebarOpen && (
        <div className="pat-sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`pat-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="pat-sidebar-brand">
          <div className="pat-sidebar-brand-icon"><i className="bi bi-heart-pulse-fill" /></div>
          <div>
            <div className="pat-sidebar-brand-text">SCU</div>
            <div className="pat-sidebar-brand-sub">Área do Paciente</div>
          </div>
        </div>

        <nav className="pat-sidebar-nav">
          {navItems.map(item => (
            <button key={item.id}
              className={`pat-menu-btn${activeTab === item.id ? ' active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
              <i className={`bi ${item.icon}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <hr className="pat-sidebar-divider" />
        <div className="pat-sidebar-footer">
          <button className="pat-menu-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" />
            Sair
          </button>
        </div>
      </aside>

      <main className="pat-main">
        <header className="pat-header">
          <div className="pat-header-title">
            <h2>{current.title}</h2>
            <p>{current.sub}</p>
          </div>
          <div className="pat-header-profile">
            <div style={{ position: 'relative' }}>
              <button className="pat-notif-btn" onClick={() => setNotifOpen(o => !o)}>
                <i className="bi bi-bell" />
                {unreadCount > 0 && <span className="pat-notif-dot" />}
              </button>
            </div>
            <div className="pat-header-info">
              <div className="pat-header-name">{user?.name}</div>
              <div className="pat-header-role">Paciente</div>
            </div>
            <div className="pat-header-avatar">{initials(user?.name)}</div>
          </div>
        </header>

        {notifOpen && (
          <NotificationsPanel
            onClose={() => setNotifOpen(false)}
            onMarkAllRead={() => setUnreadCount(0)}
          />
        )}

        {activeTab === 'overview' && (
          loadingAppts
            ? <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>
            : <TabOverview appointments={appointments} />
        )}
        {activeTab === 'booking' && (
          <TabBooking onBooked={() => { loadAppointments(); setActiveTab('appointments'); }} />
        )}
        {activeTab === 'appointments' && (
          loadingAppts
            ? <div className="pat-loading"><i className="bi bi-arrow-repeat" /> Carregando...</div>
            : <TabAppointments appointments={appointments} onReload={loadAppointments} />
        )}
        {activeTab === 'records' && <TabRecords />}
        {activeTab === 'insurance' && <TabInsurance />}
        {activeTab === 'profile' && <TabProfile />}
      </main>
    </div>
  );
}
