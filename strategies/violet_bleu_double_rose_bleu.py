from .base_strategy import BaseStrategy


class VioletBleuDoubleRoseBleu(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Violet Bleu Double Rose Bleu",
            sequence=["Violet", "Bleu", "Rose", "Rose", "Bleu"]
        )
