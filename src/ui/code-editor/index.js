import {establishInputsAndOutputs} from '../fns';

const template = `
  <options>
    <select>
      <option value="replace">replace</option>
      <option value="diffpatch">diffpatch</option>
    </select>
  </options>
  <code>
    <scene>
      <textarea></textarea>
    </scene>
    <context>
      <textarea></textarea>
    </context>
  </code>
  <error></error>
  <diff></diff>
`;

const defaultCodeDebounceTime = 1000; // milliseconds

export default io({
  '+': {code},
  '-': ['code', 'options']
})((element, state, {code, options}) => {
  state.debounceOn('code', code, defaultCodeDebounceTime);
  state.on('options', options);
})(template);

function code ({context, scene}, emitters, codeEditor, state) {
  state.context = context;
  state.scene = scene;

  codeEditor.getElementbyTagName('context').children[0].value = context;
  codeEditor.getElementbyTagName('scene').children[0].value = scene;
}


export default (element, data) => {
  establishInputsAndOutputs(element, data);
}