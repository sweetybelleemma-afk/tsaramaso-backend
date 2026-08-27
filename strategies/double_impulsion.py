from .base_strategy import BaseStrategy


class DoubleImpulsion(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Double Impulsion",
            sequence=["Violet", "Violet", "Rose"]
        )
