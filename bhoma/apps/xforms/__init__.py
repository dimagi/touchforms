from django.db.models import signals

def syncdb(app, created_models, verbosity=2, **kwargs):
    """Function used by syncdb signal"""
    from bhoma.apps.xforms.bootstrap import bootstrap
    bootstrap()

signals.post_syncdb.connect(syncdb)
