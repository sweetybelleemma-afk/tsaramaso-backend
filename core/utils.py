def get_couleur_aviator(cote: float) -> str:
    """Classifie le multiplicateur selon les 4 compartiments d'absorption thermique."""
    if cote < 2.00:
        return "Bleu"
    elif cote < 5.00:
        return "Violet"
    elif cote < 50.00:
        return "Rose"
    else:
        return "Vert"
