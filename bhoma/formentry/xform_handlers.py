from org.javarosa.core.model.utils import IPreloadHandler
from org.javarosa.core.model.condition import IFunctionHandler
from org.javarosa.core.model.data import StringData

import jarray
import java.lang
import java.util
from util import to_vect

## CUSTOM XPATH HANDLER to convert drug value into drug name
   
def is_alphanum(c):
    return c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

def fallback(drug_name):
    return ''.join(c if is_alphanum(c) else ' ' for c in drug_name).upper()

drugs = {
    'acyclovir':                        'Acyclovir',
    'acetyl_salicylic_acid':            'Acetyl Salicylic Acid  (Aspirin)',
    'adrenalin':                        'Adrenalin',
    'albendazole':                      'Albendazole',
    'amiloride_hc':                     'Amiloride HC (Co-amiloride)',
    'aminophylline':                    'Aminophylline',
    'amoxycillin':                      'Amoxycillin (Amoxyl)',
    'artemether_lumefantrine_co_art':   'Artmthr + Lmfntrn (Co.Artem)',
    'atenelol':                         'Atenelol',
    'atropine_sulphate':                'Atropine Sulphate',
    'benzathine':                       'Bnzthn Bnzyl Pnclln (Ritapen/PEN G)',
    'benzyl_penicillin':                'Benzyl Penicillin (X-Pen/PEN G)',
    'carbamazepine':                    'Carbamazepine',
    'ceftriaxone':                      'Ceftriaxone',
    'cephalexin':                       'Cephalexin',
    'chloramphenicol':                  'Chloramphenicol',
    'chlorpheniramine':                 'Chlorpheniramine (Piriton)',
    'chlorpromazine':                   'Chlorpromazine (Largactil)',
    'ciprofloxacin':                    'Ciprofloxacin (Ciprobid)',
    'cimetidine':                       'Cimetidine',
    'clotrimazole':                     'Clotrimazole',
    'cloxacillin':                      'Cloxacillin',
    'co_trimoxazole':                   'Co_trimoxazole (Septrin)',
    'dextrose':                         'Dextrose',
    'diazepam':                         'Diazepam (Valium)',
    'diclofenac':                       'Diclofenac',
    'doxycycline':                      'Doxycycline',
    'depo_provera':                     'Depo Provera',
    'enalapril':                        'Enalapril',
    'ergometrine':                      'Ergometrine',
    'ergometrine_oxytocin':             'Ergometrine / Oxytocin',
    'erythromycin':                     'Erythromycin',
    'ethambutol':                       'Ethambutol',
    'ethambutol_isoniazid':             'Ethambutol / Isoniazid',
    'ethambutol_isoniazid_pyrazinam':   'Ethmbtl/Isnzd/Prznmd/Rfmpcn (4FDC)',
    'ferrous_sulphate_bp':              'Ferrous Sulphate BP (FeSo4)',
    'folic_acid':                       'Folic Acid',
    'fluconazole':                      'Fluconazole',
    'frusemide':                        'Frusemide (Lasix)',
    'gentamycin':                       'Gentamycin',
    'glibeclamide':                     'Glibeclamide (Daonil)',
    'hydralazine':                      'Hydralazine',
    'hydrocortisone':                   'Hydrocortisone',
    'ibuprofen':                        'Ibuprofen (Brufen)',
    'insulin_lente':                    'Insulin Lente',
    'insulin_soluble':                  'Insulin Soluble',
    'levonorgestrel_microlut':          'Levonorgestrel (Microlut)',
    'lignocaine':                       'Lignocaine 1%',
    'magnesium_sulphate':               'Magnesium Sulphate (MgSo4)',
    'magnesium_trisilicate':            'Magnesium Trisilicate (MMT)',
    'mebendazole':                      'Mebendazole (Vermox)',
    'metoclopramide':                   'Metoclopramide (Plasil)',
    'metronidazole':                    'Metronidazole (Flagyl)',
    'methyldopa':                       'Methyldopa (Aldomet)',
    'miconazole':                       'Miconazole',
    'multivitamin':                     'Multivitamin (MV)',
    'nalidixic_acid':                   'Nalidixic Acid',
    'nifedipine':                       'Nifedipine',
    'nifedipine_sublingual':            'Nifedipine Sublingual',
    'nitrofurantoin':                   'Nitrofurantoin',
    'norethisterone_noristerat':        'Norethisterone (Noristerat)',
    'nystatin':                         'Nystatin',
    'ors':                              'ORS',
    'oxytocin':                         'Oxytocin',
    'paracetamol':                      'Paracetamol (Panadol)',
    'phenobarbitone':                   'Phenobarbitone',
    'phenoxymethyl_penicillin':         'Phenoxymethyl Penicillin (PEN V)',
    'procaine_penicillin':              'Procaine Penicillin (PP/PEN G)',
    'promethazine':                     'Promethazine (Phenergan)',
    'propranolol':                      'Propranolol (Inderal)',
    'pyrazinamide':                     'Pyrazinamide',
    'pyridoxine':                       'Pyridoxine (B6)',
    'quinine':                          'Quinine',
    'rifampicin_isoniazid_rifinah':     'Rifampicin/Isoniazid (Rifinah)',
    'ringers_lactate':                  'Ringers Lactate',
    'salbutamol':                       'Salbutamol (Ventolin)',
    'sodium_chloride':                  'Sodium Chloride (Saline)',
    'sulphadoxine_pyrimethamine_fan':   'Slphdxn/Prmthmn (Fansidar)',
    'streptomycin':                     'Streptomycin',
    'tetracycline':                     'Tetracycline',
    'abacavir':                         'Abacavir (ABC)',
    'didanosine':                       'Didanosine (ddI)',
    'efavirenz':                        'Efavirenz (EFV)',
    'lamivudine':                       'Lamivudine (3TC)',
    'lopinavir_ritonavir':              'Lopinavir/Ritonavir (LPV/r)',
    'stavudine':                        'Stavudine (d4T)',
    'zidovudine':                       'Zidovudine (AZT)',
    'tenofovir_lamivudine':             'Tenofovir/Lamivudine (TDF + 3TC)',
    'tenofovir_emitricitabine':         'Tenofovir/Emitricitabine (TDF + FTC)',
    'stavudine_lamivudine_nevirapin':   'Stavdn/Lmvdn/Nvrpn (d4T + 3TC + NVP)',
    'stavudine_lamivudine':             'Stavudine/Lamivudine (d4T + 3TC )',
    'zidovudine_lamivudine':            'Zidovudine/Lamivudine (AZT + 3TC)',
    'acetyl_salicylic_acid-tablet-600-3-3': 'Acetyl Salicylic Acid (Aspirin), 600 mg, tablet, TDS x 3 days',
    'amoxycillin-syrup-125-3-5':        'Amoxycillin (Amoxyl), 125 mg/5 ml,syrup,  TDS x 3 days',
    'amoxycillin-tablet-250-3-5':       'Amoxycillin (Amoxyl), 250 mg, tablet, TDS x 3 days',
    'amoxycillin-tablet-500-3-5':       'Amoxycillin (Amoxyl), 500 mg, tablet, TDS x 3 days',
    'artemether_lumefantrine_co_art-tablet-1-2-3': 'Artmthr Lmfntrn (Co.Artem), 1 tab (20/120mg), tablet, BD x 3 days',
    'artemether_lumefantrine_co_art-tablet-4-2-3': 'Artmthr Lmfntrn (Co.Artem), 4 tabs (80/480mg), tablet, BD x 3 days',
    'chlorpheniramine-tablet-1-2-3':    'Chlorpheniramine (Piriton), 1 mg, tablet, BD x 3 days',
    'chlorpheniramine-tablet-2-2-3':    'Chlorpheniramine (Piriton), 2 mg, tablet, BD x 3 days',
    'chlorpheniramine-tablet-4-2-3':    'Chlorpheniramine (Piriton), 4 mg, tablet, BD x 3 days',
    'co_trimoxazole-tablet-120-2-5':    'Co-trimoxazole (Septrin), 120 mg, tablet, BD x 5 days',
    'co_trimoxazole-tablet-240-2-5':    'Co-trimoxazole (Septrin), 240 mg, tablet, BD x 5 days',
    'co_trimoxazole-tablet-960-2-5':    'Co-trimoxazole (Septrin), 960 mg, tablet, BD x 5 days',
    'erythromycin-tablet-500-4-5':      'Erythromycin, 500 mg, tablet, QDS x 5 days',
    'ibuprofen-tablet-400-3-3':         'Ibuprofen (Brufen), 400 mg, tablet, TDS x 3 days',
    'metronidazole-tablet-400-3-5':     'Metronidazole (Flagyl), 400 mg, tablet, TDS x 5 days',
    'multivitamin-tablet-1-1-5':        'Multivitamin (MV), 1 tablet, tablet, once daily x 5 days',
    'paracetamol-tablet-100-3-3':       'Paracetamol (Panadol), 100 mg, tablet, TDS x 3 days',
    'paracetamol-tablet-200-3-3':       'Paracetamol (Panadol), 200 mg, tablet, TDS x 3 days',
    'paracetamol-tablet-250-3-3':       'Paracetamol (Panadol), 250 mg, tablet, TDS x 3 days',
    'paracetamol-tablet-500-3-3':       'Paracetamol (Panadol), 500 mg, tablet, TDS x 3 days',
    'paracetamol-tablet-500-2-3':       'Paracetamol (Panadol), 500 mg, tablet, BD x 3 days',
    'paracetamol-tablet-1000-3-3':      'Paracetamol (Panadol), 1000 mg (1 g), tablet, TDS x 3 days',
    'ors-sachet-200--':                 'ORS, sachet, 200mL after each loose stool',
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
 
