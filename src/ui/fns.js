const handlers = {
  '+': [/^\+(.*)$/, (match, data, element) => data.registerInput(match[1], element, message => streams['+'][match[1](message)])],
  '-': [/^\-(.*)$/, (match, data, element) => data.registerOutput(match[1], element, emitter => streams['-'][match[1]](emitter))]
};

export function establishInputsAndOutputs(element, data, streams = {}) {
  const emitters = {};
  for (let name in handlers) {
    const [expression, fn] = handlers[name];

    const re = new RegExp(expression);

    for (let i = 0; i < element.attributes.length; i++) {
      const {name} = element.attributes[i],
            match = name.match(re);

      if (match) {
        const [a, b] = match[1].split(':');

        emitters[b || a] = fn(match, data.scope(element), element);
      }
    }
  }

  forEach(streams['+'], (inStream, name) => {
    console.log('+', name, {inStream});
  });

  forEach(streams['-'], (outStream, name) => {
    console.log('-', name, {outStream});
  });

  console.log('emitters', {emitters});

  return emitters;
}

// export function io (config, fn) {
//   // return (element, data) => fn(element, data, establishInputsAndOutputs(element, data, config));
//   return (element, data) => fn(establishInputsAndOutputs(element, data, config), element, data);
// }

export function io (config) {
  return fn => {
    return template => {
      console.log('template', template);
      return (element, data) => {
        console.log('element', element, 'data', data);
        element.innerHTML = template;
        const emitters = establishInputsAndOutputs(element, data);
        fn(element, data, emitters);
        return (...args) => {
          console.log('args', args);
        };
        // return fn => fn(element, data, emitters);
      };
    };
  };
}

// export function io (config) {
//   establishInputsAndOutputs()
//   // return (element, data) => fn(element, data, establishInputsAndOutputs(element, data, config));
//   return (element, data) => fn(establishInputsAndOutputs(element, data, config), element, data);

//   return fn => fn(element, data, emitters);

//   return template => componentInstantiationFn;
// }

function forEach(obj, fn) {
  for (let key in obj) fn(obj[key], key);
}