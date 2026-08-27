from .base_strategy import BaseStrategy


class TripleViolette(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Triple Violette",
            sequence=["Violet", "Violet", "Violet"]
        )
