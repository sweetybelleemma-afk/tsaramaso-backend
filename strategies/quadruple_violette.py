from .base_strategy import BaseStrategy


class QuadrupleViolette(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Quadruple Violette",
            sequence=["Violet", "Violet", "Violet", "Violet"]
        )
