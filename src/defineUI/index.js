export function defineUI(components) {
  return {buildUI, buildUIFromTemplate};

  function buildUIFromTemplate(template, element = document.createElement('div')) {
    const data = {};

    element.innerHTML = template;

    setupUI(element, data);

    return {element, data};
  }

  function buildUI(el, data = new Data()) { data.hookup(setupUI(el, data)); }

  function setupUI(el, data = new Data()) {
    console.log('setup', {el});
    const component = components[el.tagName];

    // do something with the result! (make one!)
    if (component) component(el, data); // might want to pass other stuff here

    for (let i = 0; i < el.children.length; i++) setupUI(el.children[i], data);
  }

}

class Data {
  constructor() {
    console.log('new Data!');

    this.inputs = new Inputs();
    this.outputs = new Outputs();
  }

  registerInput(name, element) {
    return this.inputs.register(name, element);
  }

  registerOutput(name, element) {
    return this.outputs.register(name, element);
  }

  pipe(output, input) {

  }

  scope() {
    return this;
  }

  hookup() {
    console.log({this});
    for (let i = 0; i < this.inputs.length; i++) {
      const input = this.inputs.at(i),
            {name, element} = input,
            [a, b] = name.split(':');

      if (b) {
        const map = this.outputs.data[b || a];

        if (map) {
          const element = map.map[a];

          if (element) connect(element, name);
          else throw new Error('Missing element', name);
        }
        else throw new Error('Missing', b || a, name);
      }
      else {
        const map = this.outputs.at(a);

        if (map) {
          // only grab if one
          // if (map.list.length === 1) {
          //   const {tagName} = map.list[0];

          //   connect(tagName, name);
          // }
          // else throw new Error('too many or not enough');

          // grab all
          let connected = false;
          for (let j = 0; j < map.list.length; j++) {
            const output = map.list[j],
                  [a, b] = output.name.split(':');

            if (((!b && output.name === a) || (input.component.name === a && output.name === `${a}:${b}`)) && output.component !== input.component) connected = connect(output, input);
            // if (output.name === b || a && output.component !== input.component) connected = connect(output, input);
          }
          if (!connected) throw new Error(`No output for ${name}, ${element.tagName}`);
        }
        else throw new Error(`no ${a}!`);
      }
    }

    function connect(output, input) {
      console.log('connect', output, input);
      output.attach(input);
      return true;
    }
  }

  debounceOn(...args) {
    console.log('debounceOn !!! should this move?', args);
  }

  on(...args) {
    console.log('on !!! should this move?', args);
  }
}

class Inputs {
  constructor() {
    this._ = [];
  }

  register(name, element) {
    console.log('register+', name, element);
    const input = new Input(name, new InputComponent(element));
    this._.push(input);
    input.bind();
    return input; // Is this wise?
  }

  at(i) { return this._[i]; }

  get length() { return this._.length; }
  get data() { return this._; }
}

class Outputs {
  constructor() {
    this.data = {};
  }

  register(name, element) {
    console.log('register-', name, element);

    let [a, b] = name.split(':');

    const map = this.data[b || a] = (this.data[b || a] || {map: {}, list: []});

    const output = new Output(name, element);

    map.map[element.tagName] = output;
    map.list.push(output);

    return output.bind(element);
  }

  at(i) { return this.data[i]; }
}

class Input {
  constructor(name, component) {
    this.name = name;
    this.component = component;
  }

  bind(config = {}, fn = () => {}) {
    this.config = config;
    this.fn = fn;
    return fn;
  }

  // why do we need this?
  receive(data) {
    this.fn(data);
  }
}

class Output {
  constructor(name, element) {
    this.name = name;
    this.element = element;
  }

  bind(component, config = {}) {
    this.component = component;
    this.config = config;

    // return {
    //   emit: data => {
    //     for (let i = 0; i < this.inputs.length; i++) this.inputs[i].receive(data);
    //   }
    // };

    return data => {
      console.log(`-${this.name}: ${data}`);
      for (let i = 0; i < this.inputs.length; i++) this.inputs[i].receive(data);
    };
  }

  attach(input) {
    if (!this.component) throw new Error('Unbound!', this);

    this.inputs = this.inputs || [];

    if (this.inputs.length >= this.config.maxInputs || Math.Infinity) throw new Error('Too many inputs!', this, input);

    this.inputs.push(input);
  }
}

class InputComponent {
  constructor(element) {
    this.element = element;
  }

  get name() { return this.element.tagName.toLowerCase(); }
}