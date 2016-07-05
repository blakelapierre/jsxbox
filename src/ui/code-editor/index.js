import {io} from '../fns';

const defaultScene =
`<root>
  <camera proxy={true} />
  <grid />
</root>`;

const template =
`<options>
  <select>
    <option>replace</option>
    <option>diffpatch</option>
  </select>
</options>
<code>
  <scene>
    <textarea>${defaultScene}</textarea>
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
  console.log('code-editor');
})(template);

//message, element, state/data, outputEmitters
function code ({context, scene}, codeEditor, state, emitters) {
  state.context = context;
  state.scene = scene;

  codeEditor.getElementsbyTagName('context').children[0].value = context;
  codeEditor.getElementsbyTagName('scene').children[0].value = scene;
}