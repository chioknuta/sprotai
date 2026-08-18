#!/bin/sh
# shot.sh <html-path> <png-path> [width] [height]
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --force-color-profile=srgb --virtual-time-budget=1800 \
  --screenshot="$2" --window-size="${3:-1240},${4:-1500}" "file://$1" 2>/dev/null
echo "$2"
