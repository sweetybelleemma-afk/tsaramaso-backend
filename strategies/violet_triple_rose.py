from .base_strategy import BaseStrategy


class VioletTripleRose(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Violet Triple Rose",
            sequence=["Violet", "Rose", "Rose", "Rose"]
        )
