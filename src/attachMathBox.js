import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './util/debounce';
import unindent from './util/unindent';

import {diff, patch} from './diffpatch/index';

import {diffString, diffString2, diffStringRaw} from './diffString';

import {diffChars} from 'diff';

import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from 'lz-string';

window.addEventListener('error', error => {
  console.log(error);
  return false;
});


const timeToUpdate = 1000; // In milliseconds

// pretty terrible globals
window.mathboxes = window.mathboxes || [];
let boxes = window.mathboxes;

class SimulatedView {
  constructor() {
    this.three = {
      renderer: {
        setClearColor: (...params) => {
          console.log('setting', ...params);
          this.clearColorParams = params;
        }
      }
    };
  }

  playback(mathbox) {
    console.log({mathbox, color: this.clearColorParams});
    if (this.clearColorParams) mathbox.three.renderer.setClearColor(...this.clearColorParams);
  }
}

class Scene {
  constructor() {

    this._simulatedView = new SimulatedView();
  }

  update(parentNode, commands, controls, result, view) {
    this.parentNode = parentNode;
    this.commands = commands;
    this.controls = controls;
    this.result = result;
    this._view = view;

    this._simulatedView.playback(view);
    this._simulatedView = undefined;
  }

  get view() {
    return this._view || this._simulatedView;
  }
}

export default function attachMathBox(code, parentNode) {
  const compressedCode = window.location.search || window.location.hash;
  if (compressedCode) {
    code = decompressFromEncodedURIComponent(compressedCode.substr(1));
  }

  const newScene = new Scene();

  boxes.push(newScene);

  const {view, result, root} = handleMathBoxJsx(unindent(code))(parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  build(view, root);

  if (onMathBoxViewBuilt) onMathBoxViewBuilt(view, controls, commands);
  if (controls) attachControls(view, controls, commands);

  newScene.update(parentNode, commands, controls, result, view);
}

function handleMathBoxJsx(code) {
  const {result, root, cancel} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins, camera} = result;

  return parentNode => {
    const element = attachTo || parentNode; // kind of strange. oh well

    const container = document.createElement('mathbox-container');
    element.appendChild(container);

    if (editorPanel) attachPanel(element, root);

    const view = mathBox({
      // element,
      element: container,
      plugins: plugins || ['core', 'cursor'],
      controls: {
        // klass: cameraControls || THREE.OrbitControls
        klass: THREE.OrbitControls
      },
      camera: camera
    }), thumbnailCanvas = document.createElement('canvas')
      , thumbnailContext = thumbnailCanvas.getContext('2d');

    thumbnailCanvas.width = view._context.canvas.width / 5;
    thumbnailCanvas.height = view._context.canvas.height / 5;

    element.addEventListener('resize', event => console.log('resize', event));

    return {view, result, root};

    function attachPanel(element, currentRoot) {
      const updateStrategies = {
        'replace': replaceStrategy,
        'diffpatch': diffpatchStrategy
      }, defaultUpdateStrategy = 'replace';

      let hasError = false,
          oldCode = code,
          codeHistory = [];

      buildPanel();

      element.classList.add('has-editor-panel');

      function buildPanel() {
        const data = {currentUpdateStrategy: defaultUpdateStrategy};

        const panel = document.createElement('panel'),
              editPanel = document.createElement('edit-panel'),
              history = document.createElement('history'),
              select = createSelect(Object.keys(updateStrategies), defaultUpdateStrategy),
              link = document.createElement('button'),
              linkBox = document.createElement('textarea'),
              textarea = document.createElement('textarea'),
              diffarea = document.createElement('diff-area'),
              updateSignaler = createUpdateSignaler(),
              errorArea = document.createElement('error-area');

        const signalUpdate = debounce(update, timeToUpdate);

        panel.className = 'panel before';

        select.addEventListener('change',
          event => (data.currentUpdateStrategy = Array.prototype.map.call(event.target.selectedOptions, (({value}) => value)).join(',')) && alert('Feature not implemented yet! You can help at https://github.com/blakelapierre/jsxbox'));

        linkBox.className = 'link-box';

        element.addEventListener('click', () => linkBox.classList.remove('show'));

        link.addEventListener('click', event => {
          linkBox.innerText = `${window.location.href.replace(window.location.hash, '').replace(window.location.search || /$/, '?' + compressToEncodedURIComponent(textarea.value))}`;
          linkBox.classList.add('show');
          linkBox.select();

          event.stopPropagation();
        });

        link.innerText = 'Get Link';

        textarea.addEventListener('keyup', (...args) => willUpdateAt(signalUpdate(args)));
        textarea.value = code;

        [ select,
          link,
          textarea,
          errorArea,
          diffarea
        ].map(el => editPanel.appendChild(el));

        element.appendChild(panel);
        panel.appendChild(editPanel);
        panel.appendChild(history);

       document.body.appendChild(linkBox);

        function createUpdateSignaler() {
          const signaler = document.createElement('update-signaler'),
                left = document.createElement('div'),
                right = document.createElement('div');

          [left, right].map(el => signaler.appendChild(el));

          return signaler;
        }

        function willUpdateAt(time) {
          console.log('will update at', time);
        }

        function update(event) {
          const newCode = textarea.value;

          // not right
          if (newCode !== oldCode) {
            const currentHistoryRecord = addHistoryRecord(code);
            const {diff, error} = updateScene(newCode); // possibly not the most efficient comparison? (might be!)
            if (error) {
              currentHistoryRecord.error = error;
              currentHistoryRecord.diff = diff;
              currentHistoryRecord.historyElement.className = 'had-error';
            }
          }

          function addHistoryRecord(code) {
            const currentHistoryRecord = {code, time: new Date()};
            const historyIndex = codeHistory.length;

            codeHistory.push(currentHistoryRecord);

            const historyElement = document.createElement('history-element'),
                  renderSurface = document.createElement('render-surface'),
                  image = document.createElement('img'),
                  info = document.createElement('info');

            thumbnailContext.drawImage(view._context.canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

            image.src = thumbnailCanvas.toDataURL();

            // renderSurface.innerHTML = newCode;

            if (historyIndex > 0) info.innerHTML = `+${Math.round((currentHistoryRecord.time - codeHistory[historyIndex - 1].time) / 1000)}s later`;

            historyElement.dataset.historyIndex = historyIndex;
            renderSurface.dataset.historyIndex = historyIndex;
            image.dataset.historyIndex = historyIndex;

            historyElement.addEventListener('click', historyClickHandler);

            renderSurface.appendChild(image);

            historyElement.appendChild(info);
            historyElement.appendChild(renderSurface);

            history.appendChild(historyElement);

            history.scrollTop = history.scrollHeight - history.clientHeight;

            currentHistoryRecord.historyElement = historyElement;

            return currentHistoryRecord;

            function historyClickHandler(event) {
              console.log(event);
              const code = codeHistory[event.target.dataset.historyIndex].code;

              const currentHistoryRecord = addHistoryRecord(code);

              if (newCode !== code) {
                textarea.value = code;
                const {diff, error} = updateScene(code); // possibly not the most efficient comparison? (might be!)

                if (error) {
                  currentHistoryRecord.error = error;
                  currentHistoryRecord.diff = diff;
                  currentHistoryRecord.historyElement.className = 'had-error';
                }
              }
            }
          }

          function updateScene(newCode) {
            console.log('updating scene');
            oldCode = newCode;

            const diff = updateDiffArea(code, newCode);

            let error;

            try {
              const {result, root} = runMathBoxJsx(compile(newCode).code);

              updateStrategies[data.currentUpdateStrategy](view, root, newCode, result);

              code = newCode; // woa

              hasError = false;
              errorArea.innerHTML = '';
              editPanel.className = '';
            }
            catch (e) {
              console.log('Failed to update', e);
              hasError = true;
              errorArea.innerHTML = e.toString();
              editPanel.className = 'panel has-error';

              error = e;
            }

            return {diff, error};
          }

          function updateDiffArea(code, newCode) {
            const diff = diffChars(code, newCode);

            diffarea.innerHTML = diff.reduce((s, e) => {
              if (e.added) return `${s}<ins>${escape(e.value)}</ins>`;
              else if (e.removed) return `${s}<del>${escape(e.value)}</del>`;
              return s;
            }, '');
          }

          function escape(s) {
            return s.replace(/>/g, '&gt;').replace(/</g, '&lt;');
          }
        }
      }

      function replaceStrategy(view, root, newCode, {controls, commands}) {
        view.remove('*');
        build(view, root);

        if (attachControls) attachControls(view, controls, commands);
      }

      function diffpatchStrategy(view, root, newCode) {
        throw new Error('diffpatch not implemented yet!');

        // patch(view, diff(currentRoot, root));
      }
    }
  };

  function runMathBoxJsx(code) {
    let root;
    const JMB = {
      // We'll just assemble our VDOM-like here.
      createElement: (name, props, ...rest) => (root = ({name, props, children: rest}))
    };

    const setInterval = fakeSetInterval;

    const intervals = [];

    const result = eval(code) || {};

    return {result, root, cancel: () => intervals.forEach(clearInterval)};

    function fakeSetInterval(...args) {
      intervals.push(window.setInterval.apply(window, args));
    }
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
    if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
    else (props1 = (props1 || {}))[propName] = prop;
  }
}

function createSelect(values = [], defaultValue = values[0], names = values) {
  const select = document.createElement('select');

  names.forEach(name => {
    const option = document.createElement('option');

    option.value = name;
    option.innerHTML = name;

    if (name === defaultValue) option.selected = true;

    select.appendChild(option);
  });

  return select;
}
