#!/bin/bash

#try running: npm install -g watchify browser-sync
echo "Building Babel..."

tee >(read && browser-sync start --server --https --files "*.html|*.js") \
  < <(watchify src/handler.js -o '> handler.js && echo "Start Watching"' -v)
