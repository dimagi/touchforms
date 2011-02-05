from django.dispatch import Signal

"""
When an xform is received, either from posting or when finished playing.
"""
xform_received = Signal(providing_args=["form"])