Two versions of `jsxbox` are maintained:

[Stand-alone Embedded](#stand-alone-embedded)

[Full Featured Development Editor](#full-featured-development-editor)


This project is primarily a *proof-of-concept*. All of this functionality could be incorporated into the core MathBox project, but given my available tools, it is easiest to treat MathBox as an external dependency.

The *currently planned structure* is as follows:


The `Stand-alone Embedded` version is a drop-in solution to allow embedding [MathBox^2](https://gitgud.io/unconed/mathbox/) scenes into standard HTML markup.

The `Full Featured Development Editor` provides an interface for in-browser editing of scenes.



##Stand-alone Embedded
````
Features: application/es2015, text/less, mathbox/jsx

Combines: MathBox^2 0.4.0 (Three.js)
          LESS.js 2.5.3
          Babel 6.13.5

  branch: release/embedded
````
Usage:


````html
<script src="handler.js"></script>
<script src="mathbox-bundle.js"></script>

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


##Full Featured Development Editor
````
ES 2015, LESS.js

In-Browser, Live Editing Of Scenes
Real-time Syntax Error Reporting

branch: development/editor
````