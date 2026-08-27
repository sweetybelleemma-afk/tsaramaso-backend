from .base_strategy import BaseStrategy


class QuintupleRose(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Quintuple Rose",
            sequence=["Rose", "Rose", "Rose", "Rose", "Rose"]
        )
