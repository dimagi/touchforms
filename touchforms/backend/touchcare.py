from org.javarosa.core.model.instance import InstanceInitializationFactory
from org.javarosa.core.services.storage import IStorageUtilityIndexed
from org.javarosa.core.services.storage import IStorageIterator
from org.commcare.cases.instance import CaseInstanceTreeElement
from org.commcare.cases.model import Case
from org.commcare.util import CommCareSession

from util import to_vect

CASES = [Case(), Case(), Case()]
for i, c in enumerate(CASES):
  c.setID(50 + i)
  c.setCaseId('TEST%d' % i)
  c.setTypeId('TEST')
  c.setName('Test %d' % i)
  c.setProperty('mother_alive', 'yes')
CASE_ID = 'TEST0'

class CaseDatabase(IStorageUtilityIndexed):
  def setReadOnly(self):
    pass

  def read(self, record_id):
    try:
      return dict((c.getID(), c) for c in CASES)[record_id]
    except KeyError:
      return None

  def getNumRecords(self):
    return len(CASES)

  def getIDsForValue(self, field_name, value):
    get_val = {
      'case-id': lambda c: c.getCaseId(),
      'case-type': lambda c: c.getTypeId(),
      'case-status': lambda c: 'closed' if c.isClosed() else 'open',
    }[field_name]

    return to_vect(c.getID() for c in CASES if get_val(c) == value)

  def iterate(self):
    return CaseIterator(CASES)


class CaseIterator(IStorageIterator):
  def __init__(self, cases):
    self.case_ids = [c.getID() for c in cases]
    self.i = 0

  def hasMore(self):
    return self.i < len(self.case_ids)

  def nextID(self):
    case_id = self.case_ids[self.i]
    self.i += 1
    return case_id


class CCInstances(InstanceInitializationFactory):

    def __init__(self, sessionvars):
        self.vars = sessionvars

    def generateRoot(self, instance):
        ref = instance.getReference()
    
        def from_xml(xml):
            inst = parse_xml(xml)
            root = inst.getRoot()
            root.setParent(instance.getBase())
            return root

        if 'casedb' in ref:
            return CaseInstanceTreeElement(instance.getBase(), CaseDatabase(), False);
        elif 'fixture' in ref:
            pass  # save till end... just get raw xml payload from HQ, i presume? -- look up based solely on user id
        elif 'session' in ref:
            meta_keys = ['device_id', 'app_version', 'username', 'user_id']

            sess = CommCareSession(None)
            for k, v in self.vars.iteritems():
                if k not in meta_keys:
                    sess.setDatum(k, v)

            inst = sess.getSessionInstance(*[self.vars.get(k, '') for k in meta_keys])
            root = inst.getRoot()
            root.setParent(instance.getBase())
            return root


"""
			String userId = "";
			User u = CommCareContext._().getUser();
			if(u != null) {
				userId = u.getUniqueId();
			}
			FormInstance fixture = CommCareUtil.loadFixtureForUser(ref.substring(ref.lastIndexOf('/') + 1, ref.length()), userId);
			if(fixture == null) {
				throw new RuntimeException("Could not find an appropriate fixture for src: " + ref);
			}
			
			TreeElement root = fixture.getRoot();
			root.setParent(instance.getBase());
			return root;



"""

