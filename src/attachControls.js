let boxes = [];

export default function attachControls(view, controls, commands) {
  console.log('attaching', controls, commands, 'to', view);
  if (controls === undefined || commands === undefined) return;

  addListeners(generateActionHandler(controls, define(commands)));

  function define(commands) {
    console.log('commands', commands);
    return dispatch(commands, value => typeof value, {'function': command => command}, createMultiplePropsHandler);

    function createMultiplePropsHandler(command) {
      return function multipleProps(view) {
        for (let name in command) runCommand(name, command);

        function runCommand(name, command) {
          const props = command[name],
                element = proxied(view.select(name));

          for (let propName in props) updateProp(propName, props[propName], element);

          function updateProp(propName, action, {get, set}) {
            let isComplex = typeof action !== 'function',
                getNewValue = isComplex ? getComplexPropValue : action;

            set(propName, getNewValue(get(propName)));

            function getComplexPropValue(propValue) {
              switch (typeof action) {
                case 'function': return action(propValue);
                case 'number': return action;
                default:
                  const {length} = action,
                        fnIndex = length - 1,
                        fn = action[fnIndex],
                        dependencies = action.slice(0, fnIndex).map(get),
                        parameters = [propValue, ...dependencies];

                  return fn.apply(undefined, parameters);
              }
            }
          }
        }
      };
    }
  }

  function dispatch(obj, selector, handlers, defaultHandler) {
    return mapValues(obj, (name, value) => (handlers[selector(value, name)] || defaultHandler)(value));
  }

  function generateActionHandler(controls, commands) {
    const actions = buildActions(controls, commands);

    return keyCode => (actions[keyCode] || noActionHandler)(view, keyCode);

    function buildActions(controls, commands) {
      return controls.reduce((actions, [keys, commandName]) => {
        (typeof keys !== 'object' ? [keys] : keys).forEach(setAction);

        return actions;

        function setAction(key) {
          actions[typeof key === 'number' ? key : key.charCodeAt(0)] = commands[commandName];
        }
      }, {});
    }

    function noActionHandler(view, keyCode) { console.log(`No action for ${keyCode} on ${view}`); }
  }

  function addListeners(actionHandler) {
    const box = view._context.canvas.parentElement;
    focusOn(box, 'mousedown');

    if (boxes.length === 0) window.addEventListener('keydown', windowKeydownListener);

    boxes.push({box, actionHandler, view});
  }

  function proxied(obj) {
    return {
      get: (...args) => obj.get.apply(obj, args),
      set: (...args) => obj.set.apply(obj, args)
    };
  }

  function mapValues(obj, t) {
    const ret = {};
    for (let name in obj) ret[name] = t(name, obj[name]);
    return ret;
  }

  function windowKeydownListener(event) {
    const {length} = boxes,
          {target} = event;

    for (let i = 0; i < length; i++) {
      const {box, actionHandler} = boxes[i]; // don't need to pull actionHandler out here for most cases

      if (target === box) {
        actionHandler(event.keyCode);
        return;
      }
    }

    console.log('no handler', event, boxes);
  }
}

function focusOn(el, eventName) { return el.addEventListener(eventName, () => el.focus()); }