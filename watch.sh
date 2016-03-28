#!/bin/bash

#try running: npm install -g watchify browser-sync babel-cli
echo "Building Handler..."

(babel --presets es2015 --watch src --out-dir lib & \
  tee >(read && browser-sync start --server --https --files "*.html|*.js") \
    < <(watchify lib/handler.js -o '> handler.js && echo "Start Watching"' -v))
