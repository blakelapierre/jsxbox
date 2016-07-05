import {defineUI} from '../defineUI';

export function init(components) {
  window.addEventListener('load', event => {
    const uis = document.getElementsByTagName('ui');

    const {buildUI} = defineUI(components);

    for (let i = 0; i < uis.length; i++) buildUI(uis[i]);
  });
}