from .base_strategy import BaseStrategy

class AmortissementBrutal(BaseStrategy):
    def __init__(self):
        # Séquence : Violet -> Rose -> Bleu
        super().__init__(
            nom="Amortissement Brutal",
            sequence=["Violet", "Rose", "Bleu"]
        )
