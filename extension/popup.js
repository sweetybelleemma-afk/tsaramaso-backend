document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/etat');
        const data = await response.json();
        if(data.success && data.multiplicateurs.length > 0) {
            mettreAJourHistorique(data.multiplicateurs);
            mettreAJourEtatFenetre(data.etat, data.vr_count, data.affluence);
            mettreAJourSignal(data.signal_data);
        }
    } catch(err) { console.log("Serveur Python hors ligne."); }
});

document.getElementById('btnAspirer').addEventListener('click', () => {
    const statusContainer = document.getElementById('statusContainer');
    const statusMsg = document.getElementById('statusMsg');
    
    statusContainer.classList.remove('hidden');
    statusMsg.className = 'status-loading';
    statusMsg.innerText = "⏳ Aspiration des données en cours...";

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "aspirer_historique" });
            
            setTimeout(() => {
                statusMsg.className = 'status-success';
                statusMsg.innerText = `✅ Initialisation Réussie.`;
            }, 800);
        }
    });
});

function mettreAJourHistorique(multiplicateurs) {
    const grid = document.getElementById('historyGrid');
    grid.innerHTML = ''; 
    const recents = multiplicateurs.slice(-40);
    recents.forEach(mult => {
        const pill = document.createElement('div');
        pill.innerText = mult.toFixed(2) + 'x';
        pill.classList.add('pill');
        if (mult < 2.00) pill.classList.add('bg-bleu');
        else if (mult < 5.00) pill.classList.add('bg-violet');
        else if (mult < 50.00) pill.classList.add('bg-rose');
        else pill.classList.add('bg-vert');
        grid.appendChild(pill);
    });
}

const TSR_CIRCONFERENCE = 326.7;

function mettreAJourEtatFenetre(etat, vrCount, affluence) {
    const badge = document.getElementById('windowState');
    const vrEl = document.getElementById('vrReadout');
    const fill = document.getElementById('dialFill');
    const dial = document.getElementById('dial');
    const affEl = document.getElementById('affReadout'); // Nouveau
    
    if (!badge || !etat) return;

    badge.innerText = etat;
    badge.className = 'etat-badge';

    let colorVar = '--c-acquisition';
    if (etat === "Froide") { badge.classList.add('etat-froide'); colorVar = '--c-froide'; }
    else if (etat === "Équilibrée") { badge.classList.add('etat-equilibree'); colorVar = '--c-equilibree'; }
    else if (etat === "Chaude") { badge.classList.add('etat-chaude'); colorVar = '--c-chaude'; }
    else if (etat === "Surchauffée") { badge.classList.add('etat-surchauffee'); colorVar = '--c-surchauffee'; }
    else { badge.classList.add('etat-acquisition'); }

    const n = vrCount != null ? vrCount : 0;
    if (vrEl) vrEl.textContent = etat === "Acquisition" ? `${n} / 20 tours` : `${n} / 20 VR`;
    
    // Mise à jour de l'affluence
    if (affEl) {
        if (affluence) {
            affEl.textContent = `Affluence : ${affluence}`;
            affEl.style.color = affluence.includes('Forte') ? 'var(--c-surchauffee)' : 'var(--text-muted)';
        } else {
            affEl.textContent = 'Affluence : En attente';
            affEl.style.color = 'var(--text-muted)';
        }
    }

    if (fill) {
        fill.style.stroke = `var(${colorVar})`;
        const ratio = Math.min(n, 20) / 20;
        fill.style.strokeDashoffset = String(TSR_CIRCONFERENCE * (1 - ratio));
    }
    if (dial) dial.classList.toggle('scanning', etat === "Acquisition");
}

function mettreAJourSignal(signalData) {
    const container = document.getElementById('signalContainer');
    const nameEl = document.getElementById('signalName');
    const cibleEl = document.getElementById('signalCible');
    
    if (signalData) {
        container.classList.remove('hidden');
        nameEl.innerText = `🔥 ${signalData.nom}`;
        cibleEl.innerText = `Cible: ${signalData.cible} | Staking: ${signalData.staking}`;
    } else {
        container.classList.add('hidden');
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "refresh_popup") {
        mettreAJourHistorique(request.multiplicateurs);
        mettreAJourEtatFenetre(request.etat, request.vrCount, request.affluence);
        mettreAJourSignal(request.signalData);
    }
});
