import {establishInputsAndOutputs} from '../fns';

const template =
`
<img />
<time />
<changes>
  <change></change>
</changes>
`;

export default (element, data) => {
  establishInputsAndOutputs(element, data);
}
