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
  /**
   * 创建场景对象Scene
   */
  const scene = new THREE.Scene()

  /**
   * 光源设置
   */
  const point = new THREE.PointLight(0xffffff)
  point.position.set(400, 200, 300) //点光源位置
  //环境光
  const ambient = new THREE.AmbientLight(0x444444)
  scene.add(ambient)
  /**
   * 相机设置
   */
  const width = window.innerWidth //窗口宽度
  const height = window.innerHeight //窗口高度

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000)

  camera.position.set(0, 0, 3000)

  const group = new THREE.Group()
  //const sphere = []
  //const vector = new THREE.Vector3();

  /**
   * 创建渲染器对象
   */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  })
  renderer.setSize(width, height) //设置渲染区域尺寸
  renderer.shadowMap.enabled = false
  //renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
  renderer.setPixelRatio(window.devicePixelRatio)

  function createS(_text) {
    // 将文字放在画布中间
    function makeTextCanvas(text, width, height) {
      var canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      var c = canvas.getContext('2d')

      // c.fillStyle = "#FF0000";
      // c.fillRect(0, 0, width, height);
      c.clearRect(0, 0, c.canvas.width, c.canvas.height)

      // 文字
      c.beginPath()
      c.translate(width / 2, height / 2)
      c.fillStyle = '#ffffff' //文本填充颜色
      c.font = '48px Arial' //字体样式设置
      c.textBaseline = 'middle' //文本与fillText定义的纵坐标
      c.textAlign = 'center' //文本居中(以fillText定义的横坐标)
      c.fillText(text, 0, 0)
      return c.canvas
    }
    var textCanvas = makeTextCanvas(_text, 160, 80)

    var texture = new THREE.CanvasTexture(textCanvas)
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    let pinMaterial = new THREE.SpriteMaterial({
      map: texture,
    })
    let mesh = new THREE.Sprite(pinMaterial)

    return mesh
  }

  useEffect(() => {
    const texts = ['小尹', '小范', '小轩', '小英杰', '哈哈', '嘿嘿', '奥里给']
    // const geometry = new THREE.IcosahedronGeometry(1, 15)
    const geometry = new THREE.SphereGeometry(30, 30, 30)
    // for (var i = 0, l = 70; i < l; i++) {
    //   var phi = Math.acos(-1 + (2 * i) / l)
    //   var theta = Math.sqrt(l * Math.PI) * phi

    //   var sprite = createS(texts[Math.floor(i / 10)])
    //   sprite.scale.set(80, 40, 1)
    //   sprite.position.setFromSphericalCoords(800, phi, theta)

    //   //sphere.push(sprite)
    //   group.add(sprite)
    // }
    let vector = new THREE.Vector3()
    for (let i = 0, l = 70; i < l; i++) {
      let color = new THREE.Color()
      color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05)

      let material = new THREE.MeshBasicMaterial({ color: color })
      let sphere = new THREE.Mesh(geometry, material)
      let phi = Math.acos(-1 + (2 * i) / l)
      let theta = Math.sqrt(l * Math.PI) * phi

      let object = new THREE.Object3D()
      object.position.setFromSphericalCoords(800, phi, theta)
      vector.copy(object.position).multiplyScalar(2)
      object.lookAt(vector)
      sphere.position.x = object.position.x
      sphere.position.y = object.position.y
      sphere.position.z = object.position.z
      sphere.scale.set(15, 15, 1)
      sphere.scale.setScalar(3)
      group.add(sphere)
    }

    scene.add(group)

    document.getElementById('App').appendChild(renderer.domElement) //body元素中插入canvas对象
    //执行渲染操作   指定场景、相机作为参数
    renderer.render(scene, camera)
    let controls = new OrbitControls(camera, renderer.domElement)
    function render() {
      renderer.render(scene, camera) //执行渲染操作
      group.rotateY(-0.001) //每次绕y轴旋转0.01弧度
      group.rotateX(0.001)
      controls.update()

      requestAnimationFrame(render) //请求再次执行渲染函数render
    }
    render()
    window.onresize = function () {
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      // bloomComposer.setSize(width, height)
      // finalComposer.setSize(width, height)
      render()
    }
  }, [])
  return <div className="App" id="App" style={{ height: '100vh', width: '100vw' }}></div>
  // return <div className="App" id="App"></div>
}

export default App
