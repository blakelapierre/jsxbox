#!/bin/bash

#Would be nice to dynamically allocate "known ports" somehow
#instead of having to manage port collisions under the easiest
#management schemes
docker run -it -v $(pwd):/jsxbox -p 3000-3004:3000-3004 node-dev /bin/bash