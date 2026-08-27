from .base_strategy import BaseStrategy


class TripleRose(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Triple Rose",
            sequence=["Rose", "Rose", "Rose"]
        )
