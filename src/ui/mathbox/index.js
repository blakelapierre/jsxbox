import {establishInputsAndOutputs} from '../fns';

export default (mathbox, data) => {
  const emitter = establishInputsAndOutputs(mathbox, data, {
    '+': {
      'code': code => console.log('mathbox got code', code),
      'options': options => console.log('mathbox got options', options)
    },
    '-': emitter => {

    }
  });
}
