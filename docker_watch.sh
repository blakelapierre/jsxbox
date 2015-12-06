#!/bin/bash

docker run -it -v $(pwd):/jsxbox -p 3000-3004:3000-3004 node-dev /bin/bash