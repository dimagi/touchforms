import os

from fabric.api import env, run, cd
from fabric.decorators import hosts

DEFAULTS = {
    'home': '/home/wsgi/srv/',
    'repo_name': 'touchforms',
    'django_dir': 'touchforms',
}

DEPLOYMENTS = {
    'dev': {
        'project': 'touchforms_dev',
        'branch': 'master',
    },
}


def run_in_virtualenv(command):
    d = {
        'activate': os.path.join(
            env.project_directory, 'project_env', 'bin', 'activate'),
        'command': command,
        }
    run('source %(activate)s && %(command)s' % d)


def setup_env(deployment_name):
    env.update(DEFAULTS)
    env.update(DEPLOYMENTS[deployment_name])
    env.project_directory = os.path.join(env.home, env.project)
    # django project is embedded within repo
    env.code_src = os.path.join(env.project_directory, env.repo_name,
        env.django_dir)
    env.wsgi_config_file = os.path.join(
        env.project_directory, 'apache', 'environment.wsgi')
    env.pip_requirements_file = os.path.join(env.code_src, 'requirements.pip')


@hosts(["wsgi@nmis-linode.mvpafrica.org"])
def deploy(deployment_name):
    setup_env(deployment_name)
    with cd(env.code_src):
        run("git pull origin %(branch)s" % env)
    run_in_virtualenv("pip install -r %s" % env.pip_requirements_file)
    with cd(env.code_src):
        run_in_virtualenv("python manage.py syncdb")
        run_in_virtualenv("python manage.py migrate")
        run_in_virtualenv("python manage.py collectstatic --noinput")
    run('touch %s' % env.wsgi_config_file)
