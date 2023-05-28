import React, { useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { labelRenderer as labelRenderer3D, tag3D, tag3DSprite } from './tag3D'
import { tag, labelRenderer } from './3dTag_earth'
import './app.css'

function App() {
  var animateDots = []
  var earthBallSize = 15
  // 轨迹线条颜色
  var metapLineColor = 'rgb(27, 180, 176)'
  var vIndex = 0
  var firstBool = true
  // 线上滑动的小球
  var aGroup = new THREE.Group()

  function animationLine() {
    aGroup.children.forEach(function (elem, index) {
      var _index = parseInt(index / 50)
      var index2 = index - 50 * _index
      var _vIndex = 0
      if (firstBool) {
        _vIndex = vIndex - (index2 % 50) >= 0 ? vIndex - (index2 % 50) : 0
      } else {
        _vIndex = vIndex - (index2 % 50) >= 0 ? vIndex - (index2 % 50) : 150 + vIndex - index2
      }
      var v = animateDots[_index][_vIndex]
      elem.position.set(v.x, v.y, v.z)
    })
    vIndex++
    if (vIndex > 150) {
      vIndex = 0
    }
    if (vIndex == 150 && firstBool) {
      firstBool = false
    }
    requestAnimationFrame(animationLine)
  }
  // 计算v1,v2 的中点
  function getVCenter(v1, v2) {
    let v = v1.add(v2)
    return v.divideScalar(2)
  }

  // 计算V1，V2向量固定长度的点
  function getLenVcetor(v1, v2, len) {
    let v1v2Len = v1.distanceTo(v2)
    return v1.lerp(v2, len / v1v2Len)
  }
  // 飞线，先生成起始点和终止点
  // 添加轨迹函数
  var addLine = function (v0, v3) {
    var angle = (v0.angleTo(v3) * 180) / Math.PI
    var aLen = angle * 0.5 * (1 - angle / (Math.PI * earthBallSize * parseInt(earthBallSize / 10)))
    var hLen = angle * angle * 1.2 * (1 - angle / (Math.PI * earthBallSize * parseInt(earthBallSize / 10)))
    var p0 = new THREE.Vector3(0, 0, 0)
    // 法线向量
    var rayLine = new THREE.Ray(p0, getVCenter(v0.clone(), v3.clone()))
    // 顶点坐标
    // debugger
    // var vtop = rayLine.at(hLen / rayLine.at(1).distanceTo(p0))
    // // ray的at方法现在必须要两个参数才能执行，所以需要加入临时变量temp
    var temp = new THREE.Vector3()
    let vtop = rayLine.at(hLen / rayLine.at(1, temp).distanceTo(p0), temp) // 几倍位置
    // 控制点坐标
    var v1 = getLenVcetor(v0.clone(), vtop, aLen)
    var v2 = getLenVcetor(v3.clone(), vtop, aLen)
    // 绘制贝塞尔曲线
    var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3)
    // var geometry = new THREE.BufferGeometry()
    // geometry.vertices = curve.getPoints(100)
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const geometry = new THREE.BufferGeometry().setFromPoints(100)
    var line = new MeshLine()
    line.setGeometry(geometry)
    var material = new MeshLineMaterial({
      color: metapLineColor,
      lineWidth: 0.1,
      transparent: true,
      opacity: 1,
    })
    return {
      curve: curve,
      lineMesh: new THREE.Mesh(line.geometry, material),
    }
  }

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
  const groupLines = new THREE.Group()
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

  //执行渲染操作   指定场景、相机作为参数
  renderer.render(scene, camera)
  let controls = new OrbitControls(camera, renderer.domElement)

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
  function render() {
    renderer.render(scene, camera) //执行渲染操作
    group.rotateY(-0.001) //每次绕y轴旋转0.01弧度
    group.rotateX(0.001)
    controls.update()
    labelRenderer.render(scene, camera) //渲染HTML标签对象
    requestAnimationFrame(render) //请求再次执行渲染函数render
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
    const points = []
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
      let { x, y, z } = sphere.position
      points.push(sphere.position)
      group.add(sphere)
      // 新建标签
      // var label = tag(objectNums[i]?.name) //把粮仓名称obj.name作为标签
      var label = tag(objectNums[Math.floor(Math.random() * objectNums.length)].name) //把粮仓名称obj.name作为标签
      label.position.copy({ x, y, z })
      group.add(label)

      if (Math.random() < 0.25) sphere.layers.enable(BLOOM_SCENE)
    }
    console.log('points', points)
    let line = addLine(points[0], points[2])
    groupLines.add(line.lineMesh)
    animateDots.push(line.curve.getPoints(150))
    for (var i = 0; i < animateDots.length; i++) {
      for (var j = 0; j < 50; j++) {
        var aGeo = new THREE.SphereGeometry(0.2, 10, 10)
        var aMaterial = new THREE.MeshBasicMaterial({
          // color: lineColors[index % 3], //"rgb(27, 180, 176)",
          color: 'rgb(27, 180, 176)', //"rgb(27, 180, 176)",
          transparent: true,
          opacity: 1 - j * 0.02,
        })
        var aMesh = new THREE.Mesh(aGeo, aMaterial)
        aGroup.add(aMesh)
      }
    }
    scene.add(group)
    document.getElementById('App').appendChild(renderer.domElement) //body元素中插入canvas对象
    scene.add(groupLines)
    scene.add(aGroup)
    animationLine()

    render()
    window.onresize = function () {
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      render()
    }
  }, [])
  return <div className="App" id="App" style={{ height: '100vh', width: '100vw' }}></div>
  // return <div className="App" id="App"></div>
}

export default App
