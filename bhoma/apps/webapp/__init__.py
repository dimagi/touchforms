from django.db.models import signals

def create_groups(app, created_models, verbosity=2, **kwargs):
    """Function used by syncdb signal to create our default groups"""
    app_name = app.__name__.rsplit('.', 1)[0]
    app_label = app_name.split('.')[-1]
    # the name of this app has to come after "webapp" in settings.py
    # this is because the permissions are also created with a post syncdb 
    # signal, so we aren't guaranteed they will exist when this is called.
    if app_label == "patient":
        from bhoma.apps.webapp.permissions import init_groups
        init_groups()
    
signals.post_syncdb.connect(create_groups)