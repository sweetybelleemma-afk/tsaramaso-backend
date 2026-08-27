let tsrDernierCote = null;
let tsrDernierTemps = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "send_to_python") {
        const now = Date.now();
        if (request.payload.cote === tsrDernierCote && (now - tsrDernierTemps < 4000)) {
            return true; 
        }
        tsrDernierCote = request.payload.cote;
        tsrDernierTemps = now;

        fetch('http://127.0.0.1:5000/api/nouveau_tour', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.payload)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                if (sender.tab && sender.tab.id) {
                    chrome.tabs.sendMessage(sender.tab.id, { 
                        action: "update_hud", 
                        text: data.recommandation,
                        etat: data.etat,
                        vrCount: data.vr_count,
                        affluence: data.affluence,
                        signalText: data.signal_text,
                        signalData: data.signal_data
                    });
                }
                chrome.runtime.sendMessage({ 
                    action: "refresh_popup", 
                    multiplicateurs: data.multiplicateurs,
                    etat: data.etat,
                    vrCount: data.vr_count,
                    affluence: data.affluence,
                    signalData: data.signal_data
                });
            }
        })
        .catch(err => console.error("Erreur relais Python:", err));
        return true; 
    }

    if (request.action === "historique_aspire") {
        fetch('http://127.0.0.1:5000/api/init_historique', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ multiplicateurs: request.donnees })
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                if (sender.tab && sender.tab.id) {
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: "update_hud",
                        text: data.recommandation,
                        etat: data.etat,
                        vrCount: data.vr_count,
                        affluence: data.affluence,
                        signalText: data.signal_text,
                        signalData: data.signal_data
                    });
                }
                chrome.runtime.sendMessage({ 
                    action: "refresh_popup", 
                    multiplicateurs: data.multiplicateurs,
                    etat: data.etat,
                    vrCount: data.vr_count,
                    affluence: data.affluence,
                    signalData: data.signal_data
                });
            }
        })
        .catch(err => console.error("Erreur initialisation:", err));
        return true;
    }
});
