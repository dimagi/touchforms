from __future__ import with_statement


def modify_xform_session(fn):
    from xformplayer import GlobalStateManager

    def inner(session_id, *args, **kwargs):
        global_state = GlobalStateManager.get_globalstate()
        with global_state.get_session(session_id) as xform_session:
            result = fn(xform_session, *args, **kwargs)
            global_state.cache_session(xform_session)
            return result
    return inner
