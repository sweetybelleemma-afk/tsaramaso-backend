from .base_strategy import BaseStrategy


class QuadrupleRose(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Quadruple Rose",
            sequence=["Rose", "Rose", "Rose", "Rose"]
        )
