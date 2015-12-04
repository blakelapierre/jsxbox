#!/bin/bash

#try running: npm install -g watchify browser-sync babel-cli
echo "Building Handler..."

babel src --out-dir lib && \
(babel src --out-dir lib --watch & \
  tee >(read && browser-sync start --server --https --files "*.html|*.js") \
    < <(watchify lib/handler.js -o '> handler.js && echo "Start Watching"' -v))
