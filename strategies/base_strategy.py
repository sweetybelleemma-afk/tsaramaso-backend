class BaseStrategy:
    def __init__(self, nom: str, sequence: list):
        self.nom = nom
        self.sequence = sequence
        self.cible = "x3.00"
        self.staking = "1u-1u-1,5u"

    def verifier_signal(self, historique_couleurs: list) -> bool:
        """Vérifie si la fin de l'historique correspond exactement à la séquence."""
        taille_seq = len(self.sequence)
        if len(historique_couleurs) < taille_seq:
            return False
        return historique_couleurs[-taille_seq:] == self.sequence
