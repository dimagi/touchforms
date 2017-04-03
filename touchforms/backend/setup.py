import sys
import os
import os.path

CUR_DIR = os.path.dirname(__file__)

initialized = False
def init_classpath():
    global initialized

    if CUR_DIR.startswith('__pyclasspath__'):
        # running in web-start mode; jars are already on classpath
        initialized = True
        return

    jardir = os.path.join(CUR_DIR, 'jrlib')
    jars = [k for k in os.listdir(jardir) if k.endswith('.jar')]

    if not initialized:
        for jar in jars:
            if jar not in sys.path:
                sys.path.append(os.path.join(jardir, jar))
        initialized = True


def init_jr_engine():
    classes = [
        "org.javarosa.model.xform.XPathReference",
        "org.javarosa.xpath.XPathConditional",
        "org.javarosa.xpath.expr.XPathArithExpr",
        "org.javarosa.xpath.expr.XPathBoolExpr",
        "org.javarosa.xpath.expr.XPathCmpExpr",
        "org.javarosa.xpath.expr.XPathEqExpr",
        "org.javarosa.xpath.expr.XPathFilterExpr",
        "org.javarosa.xpath.expr.XPathNumericLiteral",
        "org.javarosa.xpath.expr.XPathNumNegExpr",
        "org.javarosa.xpath.expr.XPathPathExpr",
        "org.javarosa.xpath.expr.XPathStringLiteral",
        "org.javarosa.xpath.expr.XPathUnionExpr",
        "org.javarosa.xpath.expr.XPathVariableReference"
    ]

    from org.javarosa.core.services import PrototypeManager
    PrototypeManager.registerPrototypes(classes)
