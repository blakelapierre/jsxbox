import {establishInputsAndOutputs} from '../fns';

// export default (mathbox, data) => {
//   const emitter = establishInputsAndOutputs(mathbox, data, {
//     '+': {
//       'code': code => console.log('mathbox got code', code),
//       'options': options => console.log('mathbox got options', options)
//     },
//     '-': {
//       'scene-info': emitter => {
//         emitter.emit('scene-info', {test: 'hello!'});
//       }
//     }
//   });
// }

// export default io({
//   '+': {
//     'code': code => console.log('mathbox got code', code),
//     'options': options => console.log('mathbox got options', options)
//   },
//   '-': {
//     'scene-info': emitter => {
//       emitter.emit('scene-info', {test: 'hello!'});
//     }
//   }
// }, (mathbox, data, emitter) => {
//   console.log('mathbox, fn, data, emitter');
// });

// export default io({
//   '+': {
//     'code': (code, {sceneInfo}) => console.log('mathbox got code', code),
//     'options': options => console.log('mathbox got options', options)
//   },
//   '-': ['scene-info']
// }, (mathbox, data, emitters) => {
//   console.log('mathbox, fn, data, emitter');
// });


export default io({
  '+': { code, options },
  '-': ['scene-info']
}, (mathbox, data, emitters) => {
  console.log('mathbox, fn, data, emitter');
});

// function code(code, emitters, element) {
// function code(code, {sceneInfo}, element) {
function code(code, {sceneInfo}, mathbox) {
  console.log('mathbox got code', code);
}

function options(options, emitters, mathbox) {
  console.log('mathbox got options', options);
}


function io (config, fn) {
  // return (element, data) => fn(element, data, establishInputsAndOutputs(element, data, config));
  return (element, data) => fn(establishInputsAndOutputs(element, data, config), element, data);
}