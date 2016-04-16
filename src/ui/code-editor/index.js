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

// export default io({
//   '+': {code},
//   '-': ['code', 'options']
// })((element, state, emitters) => {
//   state.debounceOn('code', code => emitters.code(code));
// });

export default io({
  '+': {code},
  '-': ['code', 'options']
})((element, state, {code}) => {
  state.debounceOn('code', code);
});

function code ({context, scene}, emitters, codeEditor, state) {
  state.context = context;
  state.scene = scene;

  codeEditor.getElementbyTagName('context').children[0].value = context;
  codeEditor.getElementbyTagName('scene').children[0].value = scene;
}


export default (element, data) => {
  establishInputsAndOutputs(element, data);
}