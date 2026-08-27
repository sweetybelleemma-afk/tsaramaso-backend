from .base_strategy import BaseStrategy


class QuintupleViolette(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Quintuple Violette",
            sequence=["Violet", "Violet", "Violet", "Violet", "Violet"]
        )
