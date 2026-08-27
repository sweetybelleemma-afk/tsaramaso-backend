from .base_strategy import BaseStrategy

class DoubleRose(BaseStrategy):
    def __init__(self):
        # Séquence : Rose -> Rose
        super().__init__(
            nom="Double Rose",
            sequence=["Rose", "Rose"]
        )
