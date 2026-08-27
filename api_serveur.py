"""
Serveur API — Tsaramaso V5 (Multi-Utilisateurs via IP)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import deque
import time
from core.strategy_manager import StrategyManager

app = Flask(__name__)
CORS(app)

LOOKBACK = 20
AFFLUENCE_THRESHOLD = 3300
AFFLUENCE_SAFETY_THRESHOLD = 4000

# =====================================================================
# CLASSE WINDOWTRACKER INTACTE
# =====================================================================
class WindowTracker:
    def __init__(self):
        self.is_vr_history = deque(maxlen=LOOKBACK)
        self.last_window_class = None

    @staticmethod
    def classify_window(vr_count):
        if vr_count is None: return None
        if vr_count <= 7: return "Froide"
        if vr_count <= 12: return "Équilibrée"
        if vr_count <= 15: return "Chaude"
        return "Surchauffée"

    @staticmethod
    def classify_affluence(participants):
        if participants is None: return None
        if participants >= AFFLUENCE_SAFETY_THRESHOLD: return "Forte affluence (seuil de sûreté)"
        if participants >= AFFLUENCE_THRESHOLD: return "Forte affluence"
        return "Affluence normale"

    def update(self, result: float, participants=None):
        is_vr = 1 if result >= 2.00 else 0
        self.is_vr_history.append(is_vr)
        if len(self.is_vr_history) < LOOKBACK:
            n = len(self.is_vr_history)
            self.last_window_class = None
            return f"⚪ Acquisition ({n}/{LOOKBACK})", "Acquisition", n, None
        vr_count = sum(self.is_vr_history)
        etat = self.classify_window(vr_count)
        self.last_window_class = etat
        aff_class = self.classify_affluence(participants)
        aff_txt = f" | {aff_class}" if aff_class else ""
        return f"📡 Fenêtre : {etat} ({vr_count}/{LOOKBACK} VR){aff_txt}", etat, vr_count, aff_class

    def current_state(self):
        n = len(self.is_vr_history)
        if n < LOOKBACK or self.last_window_class is None:
            return f"⚪ Acquisition ({n}/{LOOKBACK})", "Acquisition", n, None
        vr_count = sum(self.is_vr_history)
        return f"📡 Fenêtre : {self.last_window_class} ({vr_count}/{LOOKBACK} VR)", self.last_window_class, vr_count, None

# =====================================================================
# GESTIONNAIRE D'ÉTAT DES PARIS (BetTracker)
# =====================================================================
class BetTracker:
    def __init__(self):
        self.phase = 0
        self.message_actuel = ""
        self.dernier_signal = None

    def update(self, cote: float, manager, type_fenetre: str, historique: list):
        vient_de_terminer = False
        if self.phase > 0:
            if cote >= 3.00:
                self.phase = 0
                vient_de_terminer = True
                self.message_actuel = "Validé ✔️"
            else:
                if self.phase == 1:
                    self.phase = 2
                    self.message_actuel = "2ème Entrée"
                elif self.phase == 2:
                    self.phase = 3
                    self.message_actuel = "3ème Entrée"
                elif self.phase == 3:
                    self.phase = 0
                    vient_de_terminer = True
                    self.message_actuel = "Échec ❌️"
        
        signal = manager.evaluer_historique(type_fenetre, historique)
        
        if signal and self.phase == 0 and not vient_de_terminer:
            self.phase = 1
            self.dernier_signal = signal
            self.message_actuel = "1ère Entrée"
        
        if vient_de_terminer:
            return self.message_actuel, self.dernier_signal
        if self.phase == 0:
            self.message_actuel = ""
            self.dernier_signal = None
            
        return self.message_actuel, self.dernier_signal

# =====================================================================
# NOUVEAU : GESTIONNAIRE DE SESSIONS MULTI-UTILISATEURS
# =====================================================================
class SessionManager:
    def __init__(self):
        self.sessions = {}

    def get_session(self, ip_address):
        # Créer une nouvelle session si l'utilisateur n'existe pas
        if ip_address not in self.sessions:
            self.sessions[ip_address] = {
                "tracker": WindowTracker(),
                "bet_tracker": BetTracker(),
                "historique_affichage": [],
                "last_active": time.time()
            }
        else:
            self.sessions[ip_address]["last_active"] = time.time()
            
        # Nettoyage automatique des sessions inactives depuis plus de 12 heures
        self.cleanup()
        return self.sessions[ip_address]
        
    def cleanup(self):
        now = time.time()
        inactives = [ip for ip, data in self.sessions.items() if (now - data["last_active"]) > 43200]
        for ip in inactives:
            del self.sessions[ip]

manager_strategies = StrategyManager()
session_manager = SessionManager()

def get_client_ip():
    """Récupère l'IP réelle du joueur (supporte le proxy Render)"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

# =====================================================================
# ROUTES API
# =====================================================================
@app.route('/api/init_historique', methods=['POST'])
def init_historique():
    donnees = request.json.get('multiplicateurs', [])
    if len(donnees) < LOOKBACK:
        return jsonify({"success": False, "error": "Pas assez de données."})

    ip = get_client_ip()
    # On écrase l'ancienne session pour faire un vrai reset
    session_manager.sessions[ip] = {
        "tracker": WindowTracker(),
        "bet_tracker": BetTracker(),
        "historique_affichage": [],
        "last_active": time.time()
    }
    session = session_manager.get_session(ip)
    
    ordonnee = donnees[:40][::-1]
    historique_construction = []
    texte_fen, etat, vr_count, aff = "⚪ Acquisition (0/20)", "Acquisition", 0, None
    msg_signal, obj_signal = "", None
    
    for m in ordonnee:
        cote_val = float(m)
        historique_construction.append(cote_val)
        texte_fen, etat, vr_count, aff = session["tracker"].update(cote_val)
        msg_signal, obj_signal = session["bet_tracker"].update(cote_val, manager_strategies, etat, historique_construction)

    session["historique_affichage"] = ordonnee

    return jsonify({
        "success": True,
        "multiplicateurs": session["historique_affichage"],
        "recommandation": texte_fen,
        "etat": etat,
        "vr_count": vr_count,
        "affluence": aff,
        "signal_text": msg_signal,
        "signal_data": obj_signal
    })

@app.route('/api/nouveau_tour', methods=['POST'])
def nouveau_tour():
    data = request.json or {}
    cote = data.get('cote')
    participants = data.get('participants')

    if cote is None:
        return jsonify({"success": False, "error": "cote manquante"})

    cote = float(cote)
    participants = int(participants) if participants else None

    session = session_manager.get_session(get_client_ip())

    session["historique_affichage"].append(cote)
    if len(session["historique_affichage"]) > 40:
        session["historique_affichage"].pop(0)

    texte_fen, etat, vr_count, aff = session["tracker"].update(cote, participants)
    msg_signal, obj_signal = session["bet_tracker"].update(cote, manager_strategies, etat, session["historique_affichage"])

    return jsonify({
        "success": True,
        "multiplicateurs": session["historique_affichage"],
        "recommandation": texte_fen,
        "etat": etat,
        "vr_count": vr_count,
        "affluence": aff,
        "signal_text": msg_signal,
        "signal_data": obj_signal
    })

@app.route('/api/etat', methods=['GET'])
def etat():
    session = session_manager.get_session(get_client_ip())
    texte_fen, etat_val, vr_count, aff = session["tracker"].current_state()
    
    return jsonify({
        "success": True,
        "multiplicateurs": session["historique_affichage"],
        "recommandation": texte_fen,
        "etat": etat_val,
        "vr_count": vr_count,
        "affluence": aff,
        "signal_text": session["bet_tracker"].message_actuel,
        "signal_data": session["bet_tracker"].dernier_signal
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
