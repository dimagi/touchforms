from setup import init_classpath
init_classpath()

from org.javarosa.core.model.utils import IPreloadHandler
from org.javarosa.core.model.condition import IFunctionHandler
# from org.javarosa.core.model.data import IAnswerData
from org.javarosa.core.model.data import StringData
# from org.javarosa.core.model.instance import TreeElement

import jarray
import java.lang
import java.util
from util import to_vect

class StaticPreloadHandler(IPreloadHandler):
    """
    Statically preload things, based on an initial dictionary.
    
    Currently only supports strings
    """
    
    _dict = {}
    
    def __init__(self, name, dict, default=""):
        self._name = name
        self._dict = dict
        self._default = default
        
    def preloadHandled(self):
        return self._name
    
    def handlePreload(self, preloadParams):
        # TODO: support types other than strings?
        if preloadParams in self._dict:
            return StringData(self._dict[preloadParams])
        return StringData(self._default)
    
    def handlePostProcess(self, node, params):
        return False
    
def is_alphanum(c):
    return c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

def fallback(drug_name):
    return ''.join(c if is_alphanum(c) else ' ' for c in drug_name).upper()

drugs = {
    'acetyl_salicylic_acid':          'Acetyl Salicylic Acid ',
    'acyclovir':                      'Acyclovir',
    'adrenalin':                      'Adrenalin',
    'albendazole':                    'Albendazole',
    'amiloride_hydrochloride_hydroc': 'Amlrd Hdrchlrd (Co-amiloride)',
    'aminophylline':                  'Aminophylline',
    'amoxycillin':                    'Amoxycillin',
    'artemether_lumefantrine_co_art': 'Artmthr + Lmfntrn (Co.Artem)',
    'atenelol':                       'Atenelol',
    'atropine_sulphate':              'Atropine Sulphate',
    'benzathine':                     'Benzathine',
    'benzyl_penicillin':              'Benzyl Penicillin',
    'carbamazepine':                  'Carbamazepine',
    'ceftriaxone':                    'Ceftriaxone',
    'cephalexin':                     'Cephalexin',
    'chloramphenicol':                'Chloramphenicol',
    'chlorpheniramine':               'Chlorpheniramine',
    'chlorpromazine':                 'Chlorpromazine',
    'cimetidine':                     'Cimetidine',
    'ciprofloxacin':                  'Ciprofloxacin',
    'clotrimazole':                   'Clotrimazole',
    'cloxacillin':                    'Cloxacillin',
    'co_trimoxazole':                 'Co_trimoxazole',
    'depo_provera':                   'Depo Provera',
    'dextrose':                       'Dextrose',
    'diazepam':                       'Diazepam',
    'diclofenac':                     'Diclofenac',
    'doxycycline':                    'Doxycycline',
    'enalapril':                      'Enalapril',
    'ergometrine':                    'Ergometrine',
    'ergometrine_oxytocin':           'Ergometrine / Oxytocin',
    'erythromycin':                   'Erythromycin',
    'ethambutol':                     'Ethambutol',
    'ethambutol_isoniazid':           'Ethambutol / Isoniazid',
    'ethambutol_isoniazid_pyrazinam': 'Eth/Isn/Przn/Rfmp (4FDC) ',
    'ferrous_sulphate_bp':            'Ferrous Sulphate BP',
    'fluconazole':                    'Fluconazole',
    'folic_acid':                     'Folic Acid',
    'frusemide':                      'Frusemide',
    'gentamycin':                     'Gentamycin',
    'glibeclamide':                   'Glibeclamide',
    'hydralazine':                    'Hydralazine',
    'hydrocortisone':                 'Hydrocortisone',
    'ibuprofen':                      'Ibuprofen',
    'insulin_lente':                  'Insulin Lente',
    'insulin_soluble':                'Insulin Soluble',
    'levonorgestrel_microlut':        'Levonorgestrel (Microlut)',
    'lignocaine':                     'Lignocaine 1%',
    'magnesium_sulphate':             'Magnesium Sulphate',
    'magnesium_trisilicate':          'Magnesium Trisilicate',
    'mebendazole':                    'Mebendazole',
    'methyldopa':                     'Methyldopa',
    'metoclopramide':                 'Metoclopramide',
    'metronidazole':                  'Metronidazole',
    'miconazole':                     'Miconazole',
    'multivitamin':                   'Multivitamin',
    'nalidixic_acid':                 'Nalidixic Acid',
    'nifedipine':                     'Nifedipine',
    'nifedipine_sublingual':          'Nifedipine Sublingual',
    'nitrofurantoin':                 'Nitrofurantoin',
    'norethisterone_noristerat':      'Norethisterone (Noristerat)',
    'nystatin':                       'Nystatin',
    'ors':                            'ORS',
    'oxytocin':                       'Oxytocin',
    'paracetamol':                    'Paracetamol',
    'phenobarbitone':                 'Phenobarbitone',
    'phenoxymethyl_penicillin':       'Phenoxymethyl Penicillin',
    'procaine_penicillin':            'Procaine Penicillin',
    'promethazine':                   'Promethazine',
    'propranolol':                    'Propranolol',
    'pyrazinamide':                   'Pyrazinamide',
    'pyridoxine':                     'Pyridoxine',
    'quinine':                        'Quinine',
    'rifampicin_isoniazid_rifinah':   'Rifampicin/Isoniazid (Rifinah)',
    'ringers_lactate':                'Ringers Lactate',
    'salbutamol':                     'Salbutamol',
    'sodium_chloride':                'Sodium Chloride',
    'streptomycin':                   'Streptomycin',
    'sulphadoxine_pyrimethamine_fan': 'Slphxn/Prmthmn (Fansidar)',
    'tetracycline':                   'Tetracycline',
}

class XFuncPrettify(IFunctionHandler):
    def getName(self):
        return "prettify-drug"

    def getPrototypes(self):
        return to_vect([jarray.array([java.lang.String], java.lang.Class)])

    def rawArgs(self):
        return False

    def realTime(self):
        return False

    def eval(self, args):
        drug_name = args[0]

        try:
            return drugs[drug_name]
        except KeyError:
            return fallback(drug_name)
