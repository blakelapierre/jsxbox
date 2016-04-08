import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './debounce';
import unindent from './unindent';

import {diff, patch} from './diffpatch/index';

const timeToUpdate = 1000; // In milliseconds

// pretty terrible globals
window.mathboxes = window.mathboxes || [];
let boxes = window.mathboxes;

export default function attachMathBox(code, parentNode) {
  const {view, result, root} = handleMathBoxJsx(unindent(code))(parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  build(view, root);

  if (onMathBoxViewBuilt) onMathBoxViewBuilt(view, controls, commands);
  if (attachControls) attachControls(view, controls, commands);

  boxes.push({parentNode, commands, controls, result, view});
}

function handleMathBoxJsx(code) {
  const {result, root} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins} = result;

  return parentNode => {
    const element = attachTo || parentNode; // kind of strange. oh well

    const container = document.createElement('mathbox-container');
    element.appendChild(container);

    const view = mathBox({
      // element,
      element: container,
      plugins: plugins || ['core', 'cursor'],
      controls: {
        klass: cameraControls || THREE.OrbitControls
      },
    });

    console.log({element});

    element.addEventListener('resize', event => console.log('resize', event));

    if (editorPanel) attachPanel(element, root);

    console.log(root);

    return {view, result, root};

    function attachPanel(element, currentRoot) {
      const updateStrategies = {
        'replace': replaceStrategy,
        'diffpatch': diffpatchStrategy
      }, currentUpdateStrategy = 'replace';

      // const panel = element.getElementsByTagName('panel')[0],
      //       textarea = panel.getElementsByTagName('textarea')[0],
      //       updateNotifier = panel.getElementsByTagName('update-notifier')[0];

      let hasError = false,
          oldCode = '';

      const panel = document.createElement('panel'),
            textarea = document.createElement('textarea'),
            updateNotifier = document.createElement('update-notifier');

      panel.appendChild(textarea);
      panel.appendChild(updateNotifier);

      panel.className = 'panel before';

      textarea.value = code;

      const signalUpdate = debounce(update, timeToUpdate);

      textarea.addEventListener('keyup', (...args) => willUpdateAt(signalUpdate(args)));

      element.appendChild(panel);

      function willUpdateAt(time) {
        console.log('will update at', time);
      }

      function update(event) {
        const newCode = textarea.value;

        if (newCode !== oldCode) updateScene(newCode); // possibly not the most efficient comparison? (might be!)

        function updateScene(newCode) {
          console.log('updating scene');
          oldCode = newCode;
          try {
            const {result, root} = runMathBoxJsx(compile(newCode).code);

            updateStrategies[currentUpdateStrategy](view, root, newCode);

            code = newCode; // woa

            hasError = false;
            updateNotifier.innerText = '';
            panel.className = 'panel';
          }
          catch (e) {
            console.log('Failed to update', e);
            hasError = true;
            updateNotifier.innerText = e.toString();
            panel.className = 'panel has-error';
          }
        }
      }

      function replaceStrategy(view, root, newCode) {
        view.remove('*');
        build(view, root);
      }

      function diffpatchStrategy(view, root, newCode) {
        patch(view, diff(currentRoot, root));
      }
    }
  };

  function runMathBoxJsx(code) {
    let root;
    const JMB = {
      // We'll just assemble our VDOM-like here.
      createElement: (name, props, ...rest) => {
        root = {name, props};

        root.children = rest;

        return root;
      }
    };

    const result = eval(code) || {};

    return {result, root};
  }
}

function compile(text) {
  return transform(text, {
    presets: [es2015],
    plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
  });
}

function build(view, {name, children, props}) {
  if (name !== 'root') view = handleChild(name, props, view);

  (children || []).forEach(child => build(view, child));

  return view;
}

function handleChild(name, props, view) {
  let props1 = {}, props2;

  for (let propName in props) handleProp(propName, props[propName]);

  // view = view[name](props1, props2);
  return view[name](props1, props2);

  function handleProp(propName, prop) {
    console.log({name, propName, prop, props1, props2, view});
    if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
    else (props1 = (props1 || {}))[propName] = prop;
  }
}