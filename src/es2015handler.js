import {babel} from 'babel-core';
import es2015 from 'babel-preset-es2015';

import scriptHandler from './scriptHandler';

scriptHandler('application/es2015', text => eval(babel.transform(text, {presets: [es2015]}).code));