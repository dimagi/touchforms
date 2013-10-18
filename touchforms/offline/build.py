from optparse import OptionParser
import os.path
import os
from subprocess import Popen, PIPE
import glob
import shutil
from jinja2 import Template
import re
import itertools

ROOT = os.path.dirname(os.path.abspath(__file__))
def _(*relpath):
    return os.path.normpath(os.path.join(ROOT, *relpath))

def run(cmd, echo=True):
    if echo:
        print '>>', cmd
    Popen(cmd, shell=True).communicate()

TF_SRC_DIR = _('..', 'backend')
TF_JARS_DIR = _('..', 'backend', 'jrlib')
TF_INST_DIR = _('src', 'main', 'resources', 'Lib', 'touchforms')
DIST_DIR = _('dist')
JYTHON_JAR = _('jython-standalone-2.5.2.jar')

def mkdir(path):
    if not os.path.exists(path):
        print '** mkdir', path
        os.mkdir(path)

def wipedir(path):
    shutil.rmtree(path)
    mkdir(path)

def copy_pattern(pattern, dst):
    for path in glob.glob(pattern):
        shutil.copy(path, dst)


def register_deps():
    jars = itertools.chain([JYTHON_JAR], glob.glob(os.path.join(TF_JARS_DIR, '*.jar')))
    for jar in jars:
        filename = os.path.split(jar)[1]
        m = re.match('(?P<base>.*?)([.-]?[0-9.]+)?.jar', filename)
        basename = m.group('base')
        run('mvn install:install-file -Dfile=%s -DgroupId=touchforms-deps -DartifactId=%s -Dversion=latest -Dpackaging=jar' % (jar, basename))

def build_jars():
    wipedir(TF_INST_DIR)
    print 'copying touchforms code into jar resources'
    copy_pattern(os.path.join(TF_SRC_DIR, '*.py'), TF_INST_DIR)
    run('mvn package')

def get_built_jar(mode):
    ARTIFACT_DIR = _('target')
    jars = dict(('standalone' if 'with-dependencies' in path else 'split', path)
                for path in glob.glob(os.path.join(ARTIFACT_DIR, '*.jar')))
    return jars[mode]

def load_maven_properties():
    with open(_('local.properties')) as f:
        lines = f.readlines()

    def _props():
        for ln in lines:
            if re.match(r'\s*#', ln):
                continue
            m = re.match(r'(?P<key>.*?)=(?P<val>.*)', ln)
            if not m:
                continue
            key = m.group('key').strip()
            val = m.group('val').strip()
            if not key:
                continue
            yield key, val
    return dict(_props())

def sign_jar(jar):
    print 'signing %s' % jar
    props = load_maven_properties()
    props['jar'] = jar
    run('jarsigner -keystore "%(keystore.path)s" -storepass %(keystore.password)s -keypass %(keystore.password)s %(jar)s %(keystore.alias)s' % props, False)

def external_jars(distdir, fullpath=True):
    _f = lambda path: os.path.split(path)[1]
    return [k if fullpath else _f(k) for k in
            glob.glob(os.path.join(distdir, '*.jar')) if
            not _f(k).startswith('offline-cloudcare')]

def make_jnlp(distdir, root_url):
    print 'creating jnlp file'
    with open(_('template.jnlp')) as f:
        template = Template(f.read())
    with open(os.path.join(distdir, 'offline-cloudcare.jnlp'), 'w') as f:
        f.write(template.render(
            url_root=root_url,
            external_jars=external_jars(distdir, False),
        ))

def package(mode, root_url):
    print 'packaging for [%s]' % mode
    DIST = os.path.join(DIST_DIR, mode)
    mkdir(DIST)
    shutil.copyfile(get_built_jar(mode), os.path.join(DIST, 'offline-cloudcare.jar'))

    if mode == 'split':
        copy_pattern(os.path.join(TF_JARS_DIR, '*.jar'), DIST)
        shutil.copy(JYTHON_JAR, DIST)
        for jar in external_jars(DIST):
            sign_jar(jar)

    make_jnlp(DIST, root_url)

def build(root_url, modes):
    wipedir(DIST_DIR)

    register_deps()
    build_jars()
    for mode in modes:
        package(mode, root_url)


if __name__ == "__main__":
    parser = OptionParser(usage='usage: %prog [options] deploy-url-root')

    (options, args) = parser.parse_args()

    build(args[0], ['standalone', 'split'])

