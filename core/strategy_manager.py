from core.utils import get_couleur_aviator

# Importation des 12 stratégies individuelles
from strategies.amortissement_brutal import AmortissementBrutal
from strategies.double_rose import DoubleRose
from strategies.double_impulsion import DoubleImpulsion
from strategies.elan_violet_rose import ElanVioletRose
from strategies.quadruple_violette import QuadrupleViolette
from strategies.quadruple_rose import QuadrupleRose
from strategies.quintuple_violette import QuintupleViolette
from strategies.quintuple_rose import QuintupleRose
from strategies.triple_rose import TripleRose
from strategies.violet_bleu_double_rose_bleu import VioletBleuDoubleRoseBleu
from strategies.triple_violette import TripleViolette
from strategies.violet_triple_rose import VioletTripleRose

class StrategyManager:
    def __init__(self):
        # 1. Instanciation de toutes les stratégies
        amort_brutal = AmortissementBrutal()
        double_rose = DoubleRose()
        double_impulsion = DoubleImpulsion()
        elan_violet_rose = ElanVioletRose()
        quadruple_violette = QuadrupleViolette()
        quadruple_rose = QuadrupleRose()
        quintuple_violette = QuintupleViolette()
        quintuple_rose = QuintupleRose()
        triple_rose = TripleRose()
        violet_bleu_double_rose_bleu = VioletBleuDoubleRoseBleu()
        triple_violette = TripleViolette()
        violet_triple_rose = VioletTripleRose()

        # 2. Cartographie stricte selon le Guide Stratégique (Partie II)
        self.fenetres = {
            "Froide": [
                amort_brutal
            ],
            "Équilibrée": [
                quintuple_rose,
                quintuple_violette,
                quadruple_rose,
                violet_triple_rose,
                quadruple_violette,
                triple_rose,
                triple_violette,
                violet_bleu_double_rose_bleu
            ],
            "Chaude": [
                elan_violet_rose,
                double_impulsion,
                quintuple_rose,
                quadruple_rose,
                quadruple_violette,
                triple_rose,
                triple_violette,
                double_rose
            ],
            "Surchauffée": [
                double_rose,
                quintuple_rose,
                quadruple_rose,
                triple_rose
            ]
        }

    def evaluer_historique(self, type_fenetre: str, multiplicateurs: list):
        """
        Analyse l'historique récent et retourne le premier signal valide 
        selon les stratégies autorisées dans la fenêtre courante.
        """
        if type_fenetre not in self.fenetres or not type_fenetre or type_fenetre == "Acquisition":
            return None

        # Convertir les côtes numériques en suite de couleurs
        couleurs = [get_couleur_aviator(m) for m in multiplicateurs]
        
        # Récupérer uniquement les stratégies autorisées pour l'état actuel du jeu
        strategies_actives = self.fenetres[type_fenetre]
        
        # Mode Priorité de Conflit : on parcourt les stratégies et on s'arrête à la première valide
        for strat in strategies_actives:
            if strat.verifier_signal(couleurs):
                return {
                    "nom": strat.nom,
                    "cible": strat.cible,
                    "staking": strat.staking
                }
                
        # Aucun signal détecté
        return None
