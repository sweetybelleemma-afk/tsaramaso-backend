from .base_strategy import BaseStrategy


class ElanVioletRose(BaseStrategy):
    def __init__(self):
        super().__init__(
            nom="Élan Violet-Rose",
            sequence=["Violet", "Rose"]
        )
