export default function diff(oldObj, newObj) {
  console.log('diffing', oldObj, newObj);

  const oo = prep(oldObj),
        no = prep(newObj),
        changedKeys = difference(oo, no);


  console.log({oo, no, changedKeys});



  // check for removals
  // check for adds
  // check adds to see if they contain a removed, if so, mark as moved
  return changedKeys;

  function prep(obj = {}) {
    return {keys: Object.keys(obj), obj};
  }

  function difference(oo, no) {
    const oldKeys = oo.keys.sort(),
          newKeys = no.keys.sort(),
          removedKeys = differenceSortedList1FromSortedList2(oldKeys, newKeys),
          addedKeys = differenceSortedList1FromSortedList2(newKeys, oldKeys),
          keysToCheck = differenceSortedList1FromSortedList2(differenceSortedList1FromSortedList2(newKeys, removedKeys), addedKeys),
          modifiedKeys = modifications(keysToCheck, oo.obj, no.obj);


    return {addedKeys, modifiedKeys, removedKeys};
  }

  function differenceSortedList1FromSortedList2(l1, l2) {
    const d = [];

    let j = 0,
        item2 = l2[j];
    for (let i = 0; i < l1.length; i++) {
      const item1 = l1[i];

      if (item1 !== item2) d.push(item1);
      else item2 = l2[++j];
    }

    // for (; j < l2.length; j++) d.push(l2[j]);

    return d;
  }

  function totalDifferenceOfSortedLists(l1, l2) {
    const d = [];

    let j = 0,
        item2 = l2[j];
    for (let i = 0; i < l1.length; i++) {
      const item1 = l1[i];

      if (item1 !== item2) d.push(item1);
      else item2 = l2[++j];
    }

    for (; j < l2.length; j++) d.push(l2[j]);

    return d;
  }

  function modifications(keysToCheck, oldObj, newObj) {
    const m = [];

    keysToCheck.forEach(key => (newObj[key] !== oldObj[key]) ? m.push(key) : undefined);

    return m;
  }
}

const obj1 = {
        // name: 'root',
        props: null,
        children: [{
          name: 'camera',
          props: {lookAt: [0, 0, 0]}
        }]
      },
      obj2 = {
        name: 'root',
        children: []
      };

diff(obj1, obj2);