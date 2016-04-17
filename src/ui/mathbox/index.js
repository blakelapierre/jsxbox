import {io} from '../fns';

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
  const view = createMathBoxView(mathbox);

});


function createMathBoxView(element) {
  return mathBox({
    element,
    plugins: plugins || ['core', 'cursor'],
    controls: {
      // klass: cameraControls || THREE.OrbitControls // how/why do we pass cameraControls here?
      klass: THREE.OrbitControls
    },
  });
}

// function code(code, emitters, element) {
// function code(code, {sceneInfo}, element) {
// function code(code, {sceneInfo}, mathbox) {
function code({context, scene}, {sceneInfo}, mathbox, state) {
  console.log('mathbox got code', code);

  if (state.context !== context || state.scene !== scene) {
    // get thumbnail!
    const lastImage = getThumbnail();
    const oldCode = {context: state.context, scene: state.scene};

    const compiledCode = compile(context + scene).code;

    if (state.context !== context) {
      // must replace all
    }
    else if (state.scene !== scene) {
      // can patchdiff
    }

    state.code = compiledCode;

    sceneInfo({lastImage, oldCode});
  }

  function compile(text) {
    return transform(text, {
      presets: [es2015],
      plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
    });
  }
}

function options(options, emitters, mathbox) {
  console.log('mathbox got options', options);
}
