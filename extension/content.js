// --- INITIALISATION DES PERMISSIONS (Notifications) ---
if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

if (window === window.top) {
    if (!document.getElementById("tsr-hud-top")) {
        const style = document.createElement('style');
        style.textContent = `
            #tsr-hud-top, #tsr-hud-bottom {
                position: fixed; z-index: 999999; pointer-events: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex; align-items: center; gap: 6px;
                background: rgba(11, 15, 23, 0.62); backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px);
                border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 999px;
                padding: 5px 11px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); white-space: nowrap; width: max-content;
            }
            #tsr-hud-top { top: 10px; right: 10px; font-size: 10px; }
            #tsr-hud-bottom { bottom: 78px; right: 10px; font-size: 11px; font-weight: 700; }
            #tsr-top-dot, #tsr-bottom-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; transition: background 0.4s ease; }
            #tsr-top-dot { background: #94a3b8; }
            #tsr-top-brand { opacity: 0.55; font-weight: 700; letter-spacing: 0.03em; color: #e7ecf3; }
            #tsr-top-sep { opacity: 0.3; color: #e7ecf3; }
            #tsr-top-status { color: #cbd5e1; font-weight: 600; }
            #tsr-bottom-label { color: #8b96a5; font-weight: 500; }
            #tsr-bottom-etat { transition: color 0.4s ease; }

            @keyframes recBlink { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }
            #tsr-top-dot.live-recording { background: #ef4444 !important; animation: recBlink 2s ease-in-out infinite; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }

            /* HUD CENTRAL POUR LE SIGNAL PYTHON */
            #tsr-signal-container {
                position: fixed; top: 25px; left: 50%; transform: translateX(-50%);
                display: flex; flex-direction: column; gap: 8px; z-index: 999999;
                pointer-events: none; align-items: center;
            }
            .tsr-signal-badge {
                background: rgba(11, 15, 23, 0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border: 2px solid #f5a623; color: #f5a623; font-weight: 800; font-size: 15px;
                padding: 10px 24px; border-radius: 999px; box-shadow: 0 6px 20px rgba(245, 166, 35, 0.25);
                animation: tsrSlideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                text-transform: uppercase; letter-spacing: 1px;
            }
            .tsr-signal-valide { border-color: #4ade80; color: #4ade80; box-shadow: 0 6px 20px rgba(74, 222, 128, 0.25); }
            .tsr-signal-echec { border-color: #f87171; color: #f87171; box-shadow: 0 6px 20px rgba(248, 113, 113, 0.25); }
            @keyframes tsrSlideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);

        const hudTop = document.createElement('div');
        hudTop.id = "tsr-hud-top";
        hudTop.innerHTML = `<div id="tsr-top-dot"></div><span id="tsr-top-brand">TSARAMASO IA</span><span id="tsr-top-sep">|</span><span id="tsr-top-status">Scan en cours</span>`;
        document.body.appendChild(hudTop);

        const hudBottom = document.createElement('div');
        hudBottom.id = "tsr-hud-bottom";
        hudBottom.innerHTML = `<div id="tsr-bottom-dot"></div><span id="tsr-bottom-label">Fenêtre :</span><span id="tsr-bottom-etat">Acquisition</span>`;
        document.body.appendChild(hudBottom);

        // --- DÉVERROUILLAGE API (Vibration & Anti-Veille) ---
        let interactionFaite = false;
        document.body.addEventListener('click', () => {
            if (!interactionFaite) {
                interactionFaite = true;
                
                // Débloque silencieusement le moteur de vibration Android
                if (navigator.vibrate) navigator.vibrate(1); 
                
                // Anti-veille silencieux
                const audioAntiVeille = document.createElement('audio');
                audioAntiVeille.src = "https://raw.githubusercontent.com/anars/blank-audio/master/1-minute-of-silence.mp3";
                audioAntiVeille.loop = true;
                document.body.appendChild(audioAntiVeille);
                audioAntiVeille.play().catch(e => console.log(e));
            }
        }, { once: true });
    }
}

const TSR_COULEURS = {
    "Acquisition":  "#94a3b8", "Froide": "#60a5fa", "Équilibrée": "#4ade80", "Chaude": "#fb923c", "Surchauffée": "#f87171",
};

let tsrLastSignalText = ""; 

function updateHUD(messageTexte, etatFenetre, vrCount, affluence, signalText) {
    if (window !== window.top) return; 

    // --- MISE À JOUR DES BADGES STATIQUES ---
    const topDot = document.getElementById("tsr-top-dot");
    const topStatus = document.getElementById("tsr-top-status");
    const bottomDot = document.getElementById("tsr-bottom-dot");
    const bottomEtat = document.getElementById("tsr-bottom-etat");
    if (!bottomEtat) return;

    const couleur = TSR_COULEURS[etatFenetre] || "#94a3b8";

    if (etatFenetre === "Acquisition") {
        topStatus.textContent = vrCount != null ? `Scan en cours (${vrCount}/20)` : "Scan en cours";
        topDot.style.background = "#94a3b8";
        topDot.classList.remove("live-recording");
    } else {
        topStatus.textContent = "En direct";
        topDot.classList.add("live-recording");
    }

    bottomEtat.textContent = etatFenetre || "Acquisition";
    bottomEtat.style.color = couleur;
    if (bottomDot) bottomDot.style.background = couleur;

    // --- MISE À JOUR DU SIGNAL CENTRAL (Piloté par Python) ---
    let container = document.getElementById('tsr-signal-container');
    if (!container) {
        container = document.createElement('div');
        container.id = "tsr-signal-container";
        container.style.cssText = `position: fixed; top: 25px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 999999; pointer-events: none; align-items: center;`;
        document.body.appendChild(container);
    }

    // Si le texte change, on redessine le badge et on vibre
    if (signalText !== tsrLastSignalText) {
        tsrLastSignalText = signalText;
        container.innerHTML = ''; 

        if (signalText && signalText !== "") {
            const el = document.createElement('div');
            el.className = 'tsr-signal-badge';
            
            // Nettoyage des Emojis
            let msgPropre = signalText.replace(/[🔥✅❌🔴⚪⚠️🚀🎯]/g, '').trim();
            el.textContent = msgPropre;

            // --- LOGIQUE DES VIBRATIONS CIBLÉES ---
            if (signalText.includes("1ère Entrée")) {
                if (navigator.vibrate) navigator.vibrate([800, 300, 800, 300, 1000]); // Vibration d'élite
            } 
            else if (signalText.includes("2ème") || signalText.includes("3ème")) {
                if (navigator.vibrate) navigator.vibrate([200]); // Petite impulsion discrète
            }
            else if (signalText.includes("✅")) {
                el.classList.add('tsr-signal-valide');
                if (navigator.vibrate) navigator.vibrate([150, 100, 150, 100, 150]);
                setTimeout(() => { container.innerHTML = ''; }, 4000); 
            }
            else if (signalText.includes("❌")) {
                el.classList.add('tsr-signal-echec');
                if (navigator.vibrate) navigator.vibrate([1000]);
                setTimeout(() => { container.innerHTML = ''; }, 4000); 
            }
            
            container.appendChild(el);
        }
    }
}

// --- LOGIQUE DE SCRAPING DE LA PAGE ---
let faranyEnvole = ""; 
const workerCode = `setInterval(() => { postMessage('tick'); }, 1000);`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

worker.onmessage = function() { manaoScrapeSyFandaharana(); };

function manaoScrapeSyFandaharana() {
  let participants = null; let envoleValStr = null;
  document.querySelectorAll('div._wrapper_1se54_9').forEach(wrapper => {
    const spans = wrapper.querySelectorAll('span');
    if (spans.length >= 2 && spans[0].innerText.toLowerCase().includes("paris totaux")) {
      const parts = spans[1].innerText.split("/");
      if (parts.length === 2) { participants = parts[1].trim(); }
    }
  });

  const allElements = document.querySelectorAll('span, div, td, p');
  const colléRegex = /([0-9.,]+x)\s*ENVOLÉ/i;
  const xRegex = /\b\d+[\.,]?\d*[xX]\b/;

  for (let i = 0; i < allElements.length; i++) {
    const text = allElements[i].innerText.trim();
    const match = text.match(colléRegex);
    if (match && match[1]) { envoleValStr = match[1]; break; }
    else if (text.toUpperCase().includes("ENVOLÉ")) {
      const matchInText = text.match(xRegex);
      if (matchInText) { envoleValStr = matchInText[0]; break; }
      else if (allElements[i - 1] && allElements[i - 1].innerText.match(xRegex)) {
        envoleValStr = allElements[i - 1].innerText.match(xRegex)[0]; break;
      }
    }
  }

  if (!envoleValStr) return;
  let numStr = envoleValStr.replace(/[xX]/g, '').replace(',', '.').trim();
  let numericCote = parseFloat(numStr);
  if (isNaN(numericCote)) return;
  let finalEnvoleStr = numericCote.toFixed(2) + "x";

  if (faranyEnvole === finalEnvoleStr) return;
  faranyEnvole = finalEnvoleStr;
  
  chrome.runtime.sendMessage({ 
      action: "send_to_python", 
      payload: { cote: numericCote, participants: participants ? parseInt(participants) : 0 } 
  });
}

// --- ÉCOUTEUR GLOBAL ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "update_hud") {
        if (window === window.top) {
            updateHUD(request.text, request.etat, request.vrCount, request.affluence, request.signalText);
        }
    }
    else if (request.action === "aspirer_historique") {
        let multiplicateurs = [];
        const numberRegex = /^\d+[.,]\d{2}[xX]?$/;
        const tousLesElements = document.querySelectorAll('*');
        let ancre = null;
        for (const el of tousLesElements) {
            if (el.children.length === 0 && el.innerText && el.innerText.toUpperCase().includes("HISTORIQUE DE LA MANCHE")) {
                ancre = el; break;
            }
        }
        if (!ancre) {
            chrome.runtime.sendMessage({ action: "historique_aspire", donnees: [] }); return;
        }

        function compterCotesDans(conteneur) {
            let count = 0;
            conteneur.querySelectorAll('*').forEach(node => {
                if (node.children.length === 0 && node.innerText && numberRegex.test(node.innerText.trim())) count++;
            });
            return count;
        }

        const SEUIL_COTES_MIN = 5;
        const PROFONDEUR_MAX = 8;
        let conteneur = ancre.parentElement;
        let meilleurConteneur = null;
        for (let i = 0; i < PROFONDEUR_MAX && conteneur; i++) {
            if (compterCotesDans(conteneur) >= SEUIL_COTES_MIN) { meilleurConteneur = conteneur; break; }
            conteneur = conteneur.parentElement;
        }

        if (!meilleurConteneur) {
            chrome.runtime.sendMessage({ action: "historique_aspire", donnees: [] }); return;
        }

        meilleurConteneur.querySelectorAll('*').forEach(node => {
            if (node.children.length === 0 && node.innerText) {
                const text = node.innerText.trim();
                if (numberRegex.test(text)) multiplicateurs.push(parseFloat(text.replace(/[xX]/g, '').replace(',', '.')));
            }
        });

        chrome.runtime.sendMessage({ action: "historique_aspire", donnees: multiplicateurs });
    }
});
