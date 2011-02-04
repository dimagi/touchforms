from django.db.models import signals

def syncdb(app, created_models, verbosity=2, **kwargs):
    """Function used by syncdb signal"""
    app_name = app.__name__.rsplit('.', 1)[0]
    app_label = app_name.split('.')[-1]
    if app_label == "xforms":
        from touchforms.formplayer.bootstrap import bootstrap
        bootstrap()
    
signals.post_syncdb.connect(syncdb)
