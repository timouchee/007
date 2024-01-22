




class Joueur:
    truc = 0
    nom = None
    recharge = 0

    def __init__(self,a):
        print("init fait")
        self.truc = a

    def __str__(self):
        print(self.truc)

    def comportement (self):
        pass



class Choix:
    truc = 0
    nom = None
    type = None
    cible = None
    cout = None
    lst_exeption = []

    def __init__(self,a):
        print("init fait")
        self.truc = a

    def __str__(self):
        print(self.truc)

    def comportement (self):
        pass

truc = Choix(5)
truc.__str__()







