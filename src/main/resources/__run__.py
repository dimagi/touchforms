# what is this file for?

from touchforms import xformserver
xformserver.main(
    port=xformserver.DEFAULT_PORT,
    stale_window=xformserver.DEFAULT_STALE_WINDOW
)
