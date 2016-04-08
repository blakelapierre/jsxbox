import scriptHandler from '../scriptHandler';

import attachMathBox from '../../attachMathBox';

scriptHandler('mathbox/jsx', (text, script) => attachMathBox(text, script.parentNode));