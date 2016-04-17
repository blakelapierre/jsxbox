const handlers = {
  '+': [/^\+(.*)$/, (match, data, element) => data.registerInput(match[1], element, message => streams['+'][match[1](message)])],
  '-': [/^\-(.*)$/, (match, data, element) => data.registerOutput(match[1], element, emitter => streams['-'][match[1]](emitter))]
};

export function establishInputsAndOutputs(element, data, streams = {}) {
  for (let name in handlers) {
    const [expression, fn] = handlers[name];

    const re = new RegExp(expression);

    for (let i = 0; i < element.attributes.length; i++) {
      const {name} = element.attributes[i],
            match = name.match(re);

      if (match) fn(match, data.scope(element), element);
    }
  }

  forEach(streams['+'], (inStream, name) => {
    console.log(name, {inStream});
  });

  forEach(streams['-'], (outStream, name) => {
    console.log(name, {outStream});
  });
}

export function io (config, fn) {
  // return (element, data) => fn(element, data, establishInputsAndOutputs(element, data, config));
  return (element, data) => fn(establishInputsAndOutputs(element, data, config), element, data);
}

function forEach(obj, fn) {
  for (let key in obj) fn(obj[key], key);
}