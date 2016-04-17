import {io} from '../fns';

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

//message, element, state/data, outputEmitters
function code ({context, scene}, codeEditor, state, emitters) {
  state.context = context;
  state.scene = scene;

  codeEditor.getElementsbyTagName('context').children[0].value = context;
  codeEditor.getElementsbyTagName('scene').children[0].value = scene;
}