import React, { useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { labelRenderer as labelRenderer3D, tag3D, tag3DSprite } from './tag3D'
import { tag, labelRenderer } from './3dTag'
import './app.css'

function App() {
  // // 飞线，先生成起始点和终止点
  // // 添加轨迹函数
  // var addLine = function (v0, v3) {
  //   var angle = (v0.angleTo(v3) * 180) / Math.PI
  //   var aLen = angle * 0.5 * (1 - angle / (Math.PI * earthBallSize * parseInt(earthBallSize / 10)))
  //   var hLen = angle * angle * 1.2 * (1 - angle / (Math.PI * earthBallSize * parseInt(earthBallSize / 10)))
  //   var p0 = new THREE.Vector3(0, 0, 0)
  //   // 法线向量
  //   var rayLine = new THREE.Ray(p0, getVCenter(v0.clone(), v3.clone()))
  //   // 顶点坐标
  //   var vtop = rayLine.at(hLen / rayLine.at(1).distanceTo(p0))
  //   // 控制点坐标
  //   var v1 = getLenVcetor(v0.clone(), vtop, aLen)
  //   var v2 = getLenVcetor(v3.clone(), vtop, aLen)
  //   // 绘制贝塞尔曲线
  //   var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3)
  //   var geometry = new THREE.Geometry()
  //   geometry.vertices = curve.getPoints(100)
  //   var line = new MeshLine()
  //   line.setGeometry(geometry)
  //   var material = new MeshLineMaterial({
  //     color: metapLineColor,
  //     lineWidth: 0.1,
  //     transparent: true,
  //     opacity: 1,
  //   })
  //   return {
  //     curve: curve,
  //     lineMesh: new THREE.Mesh(line.geometry, material),
  //   }
  // }
  // // 计算v1,v2 的中点
  // function getVCenter(v1, v2) {
  //   let v = v1.add(v2)
  //   return v.divideScalar(2)
  // }

  // // 计算V1，V2向量固定长度的点
  // function getLenVcetor(v1, v2, len) {
  //   let v1v2Len = v1.distanceTo(v2)
  //   return v1.lerp(v2, len / v1v2Len)
  // }

  const ENTIRE_SCENE = 0,
    BLOOM_SCENE = 1
  // const objectNums = 50;
  // const objectNums = 10;
  const objectNums = [
    {
      name: '11',
    },
    {
      name: '22',
    },
    {
      name: '33',
    },
    {
      name: '44',
    },
    {
      name: '55',
    },
    {
      name: '66',
    },
    {
      name: '77',
    },
    {
      name: '88',
    },
  ]

  const bloomLayer = new THREE.Layers()
  const params = {
    exposure: 1,
    bloomStrength: 5,
    bloomThreshold: 0,
    bloomRadius: 0,
    scene: 'Scene with Glow',
  }
  const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })
  const materials = {}
  let bloomComposer = null
  let finalComposer = null
  const mouse = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 200)
  camera.position.set(0, 0, 20)
  camera.lookAt(0, 0, 0)
  const scene = new THREE.Scene()

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ReinhardToneMapping

  function onPointerDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, false)
    if (intersects.length > 0) {
      const object = intersects[0].object
      object.layers.toggle(BLOOM_SCENE)
      render()
    }
  }

  function setupScene() {
    scene.traverse(disposeMaterial)
    scene.children.length = 0

    const geometry = new THREE.IcosahedronGeometry(1, 15)
    for (let i = 0; i < objectNums.length; i++) {
      const color = new THREE.Color()
      color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05)

      const material = new THREE.MeshBasicMaterial({ color: color })
      const sphere = new THREE.Mesh(geometry, material)
      // sphere.position.x = Math.random() * 10 - 5;
      // sphere.position.x = 400 * Math.sin(0.78*Math.random());
      // sphere.position.y = 400 * Math.sin(0.78*Math.random());
      sphere.position.x = Math.random() * 10 - 5
      sphere.position.y = Math.random() * 10 - 5
      sphere.position.z = Math.random() * 10 - 5
      // let positons = Array.from({length:objectNums.length},(v,i)=>i).map((item)=>{x:1,y:2})
      const { x, y, z } = sphere.position
      console.log(x, y, z)
      sphere.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0)
      // sphere.scale.setScalar(Math.random() * Math.random() + 0.5);
      sphere.scale.setScalar(1.5)
      scene.add(sphere)
      // 新建标签
      var label = tag(objectNums[i].name) //把粮仓名称obj.name作为标签
      label.position.copy({ x, y, z })
      scene.add(label)

      if (Math.random() < 0.25) sphere.layers.enable(BLOOM_SCENE)
    }
    render()
  }

  function disposeMaterial(obj) {
    if (obj.material) {
      obj.material.dispose()
    }
  }

  function render() {
    switch (params.scene) {
      case 'Scene only':
        renderer.render(scene, camera)
        break
      case 'Glow only':
        renderBloom(false)
        break
      case 'Scene with Glow':
      default:
        // render scene with bloom
        renderBloom(true)

        // render the entire scene, then render bloom scene on top
        finalComposer.render()
        labelRenderer.render(scene, camera) //渲染HTML标签对象
        break
    }
  }

  function renderBloom(mask) {
    if (mask === true) {
      scene.traverse(darkenNonBloomed)
      bloomComposer.render()
      scene.traverse(restoreMaterial)
    } else {
      camera.layers.set(BLOOM_SCENE)
      bloomComposer.render()
      camera.layers.set(ENTIRE_SCENE)
    }
  }

  function darkenNonBloomed(obj) {
    if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
      materials[obj.uuid] = obj.material
      obj.material = darkMaterial
    }
  }

  function restoreMaterial(obj) {
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid]
      delete materials[obj.uuid]
    }
  }

  useEffect(() => {
    bloomLayer.set(BLOOM_SCENE)

    document.getElementById('App').appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.maxPolarAngle = Math.PI * 0.5
    controls.minDistance = 1
    controls.maxDistance = 100
    controls.addEventListener('change', render)

    scene.add(new THREE.AmbientLight(0x404040))

    const renderScene = new RenderPass(scene, camera)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
    bloomPass.threshold = params.bloomThreshold
    bloomPass.strength = params.bloomStrength
    bloomPass.radius = params.bloomRadius

    bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,
        defines: {},
      }),
      'baseTexture',
    )
    finalPass.needsSwap = true

    finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)
    finalComposer.addPass(finalPass)

    window.addEventListener('pointerdown', onPointerDown)

    const gui = new GUI()

    gui.add(params, 'scene', ['Scene with Glow', 'Glow only', 'Scene only']).onChange(function (value) {
      switch (value) {
        case 'Scene with Glow':
          bloomComposer.renderToScreen = false
          break
        case 'Glow only':
          bloomComposer.renderToScreen = true
          break
        case 'Scene only':
          // nothing to do
          break
      }

      render()
    })

    const folder = gui.addFolder('Bloom Parameters')

    folder.add(params, 'exposure', 0.1, 2).onChange(function (value) {
      renderer.toneMappingExposure = Math.pow(value, 4.0)
      render()
    })

    folder.add(params, 'bloomThreshold', 0.0, 1.0).onChange(function (value) {
      bloomPass.threshold = Number(value)
      render()
    })

    folder.add(params, 'bloomStrength', 0.0, 10.0).onChange(function (value) {
      bloomPass.strength = Number(value)
      render()
    })

    folder
      .add(params, 'bloomRadius', 0.0, 1.0)
      .step(0.01)
      .onChange(function (value) {
        bloomPass.radius = Number(value)
        render()
      })

    setupScene()
    window.onresize = function () {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      bloomComposer.setSize(width, height)
      finalComposer.setSize(width, height)
      render()
    }
  }, [])
  return <div className="App" id="App" style={{ height: '100vh', width: '100vw' }}></div>
}

export default App
