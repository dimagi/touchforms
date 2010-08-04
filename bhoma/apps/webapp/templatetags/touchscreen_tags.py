from datetime import datetime, timedelta
from django import template
from django.template.loader import render_to_string


register = template.Library()

@register.simple_tag
def ts_button(text, url, css_class="really-big-button"):
    '''
    Create a touchscreen friendly button, with some options
    '''
    print text
    print url
    return render_to_string("touchscreen/button.html", 
                            { "class": css_class, "text": text, "url": url })
    
