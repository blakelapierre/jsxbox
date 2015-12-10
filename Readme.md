[NOTE: The code in this branch does not conform to the below specifications.]
##Stand-alone Embedded
Usage:


````html
<script src="jsxbox.js"></script>

<script type="mathbox/jsx">
  <root>
    <camera proxy={true} position={[0, 0, 3]} />
    <cartesian range={[[-2, 2], [-1, 1]]} scale={[2, 1]}>
      <axis axis={1} width={3} />
      <axis axis={2} width={3} />
      <grid width={2} divideX={20} divideY={10} />
    </cartesian>
  </root>
</script>
````

````
Features: application/es2015, text/less, mathbox/jsx

Combines: MathBox^2 0.4.0 (Three.js)
          LESS.js 2.5.3
          Babel 6.13.5

  branch: release/embedded
````