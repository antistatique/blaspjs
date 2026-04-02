import datetime
from datetime import date

class CalculateurEnLigne:
    def __init__(self, dateCertificat, dateNaissance, salaireAVS, tx_act, choixDuPlan, tx_crd,
    avoirReg, mesuresTrans, dateRetraite, rachatFutur, rachatDate, VAFutur, VADate, retraiteApres65):
        # Initialiser les parametres
        self.dateCertificat = dateCertificat
        self.dateNaissance = dateNaissance
        self.salaireAVS = salaireAVS
        self.tx_act = tx_act
        self.salaireAVS = salaireAVS
        self.choixDuPlan = choixDuPlan
        self.tx_crd = tx_crd
        self.avoirReg = avoirReg
        self.mesuresTrans = mesuresTrans
        self.dateRetraite = dateRetraite
        self.rachatFutur = rachatFutur
        self.rachatDate = rachatDate
        self.VAFutur = VAFutur
        self.VADate = VADate
        self.retraiteApres65 = retraiteApres65


        # Initialiser les constantes
        self.montantCoordination = 25725
        self.tx_CapitalRetraite = 0.5
        self.tx_ConjointSurvivant = 0.6
        self.tx_EnfantInvalide = 0.2
        self.tx_EnfantOrphelin = 0.2
        self.tx_CapitalRetraiteMax = 0.5


        # Initialiser les tableaux de constantes
        self.tx_bonifs = [[0,0,0,0,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.175,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.249,0.249,0.249,0.249,0.249,0.249,0.249,0.249,0.249,0.249,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295,0.295],
            [0,0,0,0,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.185,0.195,0.195,0.195,0.195,0.195,0.195,0.195,0.195,0.195,0.195,0.259,0.259,0.259,0.259,0.259,0.259,0.259,0.259,0.259,0.259,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305,0.305],
            [0,0,0,0,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.184,0.214,0.214,0.214,0.214,0.214,0.214,0.214,0.214,0.214,0.214,0.278,0.278,0.278,0.278,0.278,0.278,0.278,0.278,0.278,0.278,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324,0.324]]
        self.tx_conv = [[0.0451,0.04518,0.04527,0.04535,0.04543,0.04552,0.0456,0.04568,0.04577,0.04585,0.04593,0.04602],
            [0.0461,0.0462,0.0463,0.0464,0.0465,0.0466,0.0467,0.0468,0.0469,0.047,0.0471,0.0472],
            [0.0473,0.0474,0.0475,0.0476,0.0477,0.0478,0.0479,0.048,0.0481,0.0482,0.0483,0.0484],
            [0.0485,0.0486,0.0487,0.0488,0.0489,0.049,0.0491,0.0492,0.0493,0.0494,0.0495,0.0496],
            [0.0497,0.04982,0.04993,0.05005,0.05017,0.05028,0.0504,0.05052,0.05063,0.05075,0.05087,0.05098],
            [0.0511,0.05122,0.05133,0.05145,0.05157,0.05168,0.0518,0.05192,0.05203,0.05215,0.05227,0.05238],
            [0.0525,0.05263,0.05275,0.05288,0.053,0.05313,0.05325,0.05338,0.0535,0.05363,0.05375,0.05388],
            [0.054,0.05413,0.05427,0.0544,0.05453,0.05467,0.0548,0.05493,0.05507,0.0552,0.05533,0.05547],
            [0.0556,0.05574,0.05588,0.05603,0.05617,0.05631,0.05645,0.05659,0.05673,0.05688,0.05702,0.05716],
            [0.0573,0.05745,0.0576,0.05775,0.0579,0.05805,0.0582,0.05835,0.0585,0.05865,0.0588,0.05895],
            [0.0591,0.05927,0.05943,0.0596,0.05977,0.05993,0.0601,0.06027,0.06043,0.0606,0.06077,0.06093],
            [0.0611,0.06128,0.06147,0.06165,0.06183,0.06202,0.0622,0.06238,0.06257,0.06275,0.06293,0.06312],
            [0.0633,0,0,0,0,0,0,0,0,0,0,0]]
        self.tx_inva = [0.575,0.575,0.6]

        # Initialiser les variables
        self.salaireAss = self.salaireAVS - self.montantCoordination * self.tx_act
        self.AgeLPP = self.dateCertificat.year - self.dateNaissance.year
        self.AgeAuMois = self.AgeLPP + (self.dateCertificat.month - self.dateNaissance.month) / 12
        self.AgeRetraiteSaisie = self.dateRetraite.year - self.dateNaissance.year + (self.dateRetraite.month - self.dateNaissance.month)/12
    
    def simulationRetraite(self, dateRetraiteProj, dateRetraiteChoisie):
        AgeRetraiteAnnee = int(dateRetraiteProj.year - self.dateNaissance.year + (dateRetraiteProj.month - self.dateNaissance.month)/12)
        AgeRetraiteMois = (12 + dateRetraiteProj.month - self.dateNaissance.month) % 12
        # Ajoute des mesures transitoires avant le debut de la projection
        AvoirReg = self.avoirReg + self.mesuresTrans
        # Projection de l'avoir de vieillesse pour une date de retraite donnee
        if self.dateCertificat.year == dateRetraiteProj.year:
            AvoirReg = AvoirReg * (1+((dateRetraiteProj.month-self.dateCertificat.month)/12) * self.tx_crd) + self.salaireAss * ((dateRetraiteProj.month - self.dateCertificat.month) / 12) * self.tx_bonifs[self.choixDuPlan][self.AgeLPP-18]
        else:
            AgeRetraite = self.AgeLPP+dateRetraiteProj.year-self.dateCertificat.year
            AvoirReg = AvoirReg * (1 + ((12 - self.dateCertificat.month)/12) * self.tx_crd) + self.salaireAss * ((12-self.dateCertificat.month)/12) * self.tx_bonifs[self.choixDuPlan][self.AgeLPP-18]
            sommeBonifs = 0
            for a in range (self.AgeLPP+1, AgeRetraite):
                sommeBonifs += self.tx_bonifs[self.choixDuPlan][a-18] * (1 + self.tx_crd)**(AgeRetraite-1-a)
            AvoirReg = AvoirReg * (1 + self.tx_crd)**(AgeRetraite-1-self.AgeLPP) + min(max(AgeRetraite-1-self.AgeLPP,0),1) * self.salaireAss * sommeBonifs
            AvoirReg = AvoirReg * (1 + dateRetraiteProj.month * self.tx_crd / 12) + self.salaireAss * dateRetraiteProj.month * self.tx_bonifs[self.choixDuPlan][AgeRetraite-18] / 12
        #Ajout d'un rachat ou VA futur
        if self.rachatFutur > 0:
            AvoirReg += self.rachatFutur * (1+self.tx_crd)**(dateRetraiteProj.year-self.rachatDate.year+(dateRetraiteProj.month-self.rachatDate.month)/12)
        if self.VAFutur > 0:
            AvoirReg -= self.VAFutur * (1+self.tx_crd)**(dateRetraiteProj.year-self.VADate.year+(dateRetraiteProj.month-self.VADate.month)/12)
        #Calcul des prestations (rente et capital)
        RenteRetraiteAnnuelle = AvoirReg * self.tx_conv[AgeRetraiteAnnee - 58][AgeRetraiteMois]
        RenteRetraiteMensuelle = RenteRetraiteAnnuelle / 12
        CapitalMaxRetraite = AvoirReg * self.tx_CapitalRetraiteMax
        RenteRetraiteAnnuelleAvecCapital = RenteRetraiteAnnuelle * (1 - self.tx_CapitalRetraiteMax)
        RenteRetraiteMensuelleAvecCapital = RenteRetraiteAnnuelleAvecCapital / 12
        #Renvoie les valeurs selon si c'est une projection avec la date choisie ou avec les dates d'ages entiers (58 - 70)
        if dateRetraiteChoisie :
            return [RenteRetraiteAnnuelle,RenteRetraiteMensuelle,CapitalMaxRetraite,RenteRetraiteAnnuelleAvecCapital,RenteRetraiteMensuelleAvecCapital]
        else:
            return [RenteRetraiteAnnuelle,CapitalMaxRetraite,RenteRetraiteAnnuelleAvecCapital]
        
    def run_calcul(self):
        #projection selon date saisie
        ProjectionsSelonDate = self.simulationRetraite(self.dateRetraite,True)
        #determination des age entiers de retraite a projeter
        #age min
        AgeEntierMin = max(int(self.AgeAuMois)+1,58)
        if self.AgeAuMois % 1 == 0:
            AgeEntierMin -= 1
        #age max
        AgeEntierMax = 65
        if self.retraiteApres65:
            AgeEntierMax = 70
    
        #projections ages entiers
        ProjectionsSelonAgeEntier = []
        for AgeEntier in range(AgeEntierMin,AgeEntierMax+1):
            DateRetraiteAgeEntier = date(self.dateNaissance.year + AgeEntier,self.dateNaissance.month,self.dateNaissance.day)
            ProjectionsSelonAgeEntier.insert(len(ProjectionsSelonAgeEntier),self.simulationRetraite(DateRetraiteAgeEntier,False))
        #calcul des autres prestations
        RenteInvalideAnnuelle = self.salaireAss * self.tx_inva[self.choixDuPlan]
        RenteInvalideMensuelle = RenteInvalideAnnuelle / 12
        RenteConjAnnuelle = RenteInvalideAnnuelle * self.tx_ConjointSurvivant
        RenteConjMensuelle = RenteConjAnnuelle / 12
        RenteEnfantInvaAnnuelle = RenteInvalideAnnuelle * self.tx_EnfantInvalide
        RenteEnfantInvaMensuelle = RenteEnfantInvaAnnuelle / 12
        RenteOrphelinAnnuelle = RenteInvalideAnnuelle * self.tx_EnfantOrphelin
        RenteOrphelinMensuelle = RenteOrphelinAnnuelle / 12

        return {
            "date de retraite ":self.dateRetraite,
            "age a la retraite ":self.AgeRetraiteSaisie,
            "projection selon date ":ProjectionsSelonDate,
            "projection selon age entier ":ProjectionsSelonAgeEntier,
            "rente invalide par an ":RenteInvalideAnnuelle,
            "rente invalide par mois ":RenteInvalideMensuelle,
            "rente enfant d'inva par an ":RenteEnfantInvaAnnuelle,
            "rente enfant d'inva par mois ":RenteEnfantInvaMensuelle,
            "rente conjoint par an ":RenteConjAnnuelle,
            "rente conjoint par mois ":RenteConjMensuelle,
            "rente orphelin par an ":RenteOrphelinAnnuelle,
            "rente orphelin par mois ":RenteOrphelinMensuelle
        }
        
        
def get_user_input():
    #Ci dissous = partie test (saisie manuelle des input)
    dateCertificat = datetime.datetime.strptime("31.12.2023","%d.%m.%Y").date()
    dateNaissance = datetime.datetime.strptime("16.12.1962","%d.%m.%Y").date()
    salaireAVS = 80000
    tx_act = 1.0
    choixDuPlan = 0
    tx_crd = 0.0125
    avoirReg = 300000.0
    mesuresTrans = 0.0
    dateRetraite = datetime.datetime.strptime("31.08.2024","%d.%m.%Y").date()
    rachatFutur = 0
    rachatDate = datetime.datetime.strptime("14.03.2027","%d.%m.%Y").date()
    VAFutur = 0
    VADate = datetime.datetime.strptime("15.09.2026","%d.%m.%Y").date()
    retraiteApres65 = False

    return dateCertificat, dateNaissance, salaireAVS, tx_act, choixDuPlan, tx_crd, avoirReg, mesuresTrans, dateRetraite, rachatFutur, rachatDate, VAFutur, VADate, retraiteApres65

def main():
    #collecter les donnees saisies
    user_input = get_user_input()
    #controler les donnees saisies = PARTIE QUI CONTROLE ET AFFICHE LES MESSAGES D'ERREUR lorsque les saisies sont incoherentes

    #calculs
    
    calculateur = CalculateurEnLigne(*user_input)
    user_output = calculateur.run_calcul()
        
    #envoi des resultats
    for numerotation, value in user_output.items():
        print(f"{numerotation}: {value}")

if __name__ == "__main__":
    main()
