import { forceSimulation } from 'd3-force'
import { timer } from 'd3-timer'
import render from './render.js'
import {
  forceCharge,
  forceCenter,
  forceCollide,
  forceLink,
  forceGravity,
} from './forces.js'
import { registerInput, updateInput } from './input.js'

function run(state) {
  state.simulation = forceSimulation(state.data.nodes)
    .stop()
    .alpha(state.options.alphaGenesis)
    .alphaTarget(state.options.alphaGenesis)
    .alphaDecay(state.options.alphaDecay)
    .force('center', forceCenter(state.options))
    .force('gravity', forceGravity(state.options))
    .force('link', forceLink(state.options, state.data.edges))
    .force('collide', forceCollide(state.options))
    .force('charge', forceCharge(state.options))

  state.selection = []
  state.pointer = {
    x: null, // in CSS pixels
    y: null,
    down: false,
    dragging: false,
    dx: null,
    dy: null,
    target: null,
  }

  state.dimens = {
    width: 0,
    height: 0,
    dpr: 1,
  }
  state.transform = {
    x: 0,
    y: 0,
    k: 1, // zoom ratio (don't set to zero!)
  }

  state.ticks = 0
  state.timer = timer(function (msElapsed) {
    /* Note: the simulation will continue running even when its alpha value is
    below the minimum. This is because we manually tick along the simulation
    rather than using d3's built-in timekeeping. */
    const tickDuration = 1000 / state.options.ticksPerSecond
    const expectedTicks = Math.ceil(msElapsed / tickDuration)

    const ticksBehind = expectedTicks - state.ticks
    if (ticksBehind > 0) {
      state.simulation.tick(ticksBehind) // iterations
      state.ticks = expectedTicks
    }

    updateInput(state)

    render(state)
  })

  state.simulation
    .tick(state.options.genesisTicks)
    .alphaTarget(state.options.alphaTarget)
    .alpha(state.options.alphaInitial)

  registerInput(state)
}

function initializeOptions(state, options) {
  function applyDefault(opt, defaultVal) {
    if (this[opt] === undefined) this[opt] = defaultVal
  }
  function applyDefaults(options, defs) {
    for (let i = 0; i < defs.length; ++i) {
      applyDefault.apply(options, defs[i])
    }
  }

  applyDefaults(options, [
    ['genesisTicks', 30],
    ['alphaGenesis', 1],
    ['alphaInitial', 0.7],
    ['alphaTarget', 0],
    ['alphaDecay', 0.01],
    ['alphaDrag', 0.15],
    ['ticksPerSecond', 60],
    ['colors', {}],
    ['forceCharge', {}],
    ['forceCenter', {}],
    ['forceCollide', {}],
    ['forceLink', {}],
    ['forceGravity', {}],
    ['nodeRadiusInner', 4],
    ['nodeRadiusOuter', 20],
    ['zoomFactor', 1.1],
    ['zoomMin', 25],
    ['zoomMax', 500],
    ['zoomStep', 10],
    ['zoomDefault', 100],
    ['lineDash', [5, 5]],
  ])
  applyDefaults(options.colors, [
    ['background', 'white'],
    ['nodeStrokeNormal', 'rgba(0, 0, 0, 0.24)'],
    ['nodeStrokeTarget', 'rgba(0, 0, 0, 0.42)'],
    ['nodeStrokeActive', 'rgba(0, 0, 0, 0.69)'],
    ['highlightStrokeTarget', 'rgba(0, 0, 0, 0.34)'],
    ['highlightFillTarget', 'rgba(0, 0, 0, 0.05)'],
    ['highlightStrokeActive', 'rgba(0, 0, 0, 0.69)'],
    ['highlightFillActive', 'rgba(0, 0, 0, 0.11)'],
    ['tipsFillColor', 'black'],
    ['tipsFont', '2.0em Muli'],
    ['edgeNormal', 'rgba(0, 0, 0, 1.0)'],
    ['edgeDark', 'rgba(0, 0, 0, 0.69)'],
    ['edgeLight', 'rgba(0, 0, 0, 0.08)'],
  ])
  applyDefaults(options.forceCharge, [['strength', -600]])
  applyDefaults(options.forceCenter, [['strength', 0.1]])
  applyDefaults(options.forceCollide, [
    ['strength', 0.8],
    ['iterations', 1],
  ])
  applyDefaults(options.forceLink, [
    ['likeStrength', 0.06],
    ['unlikeStrength', 0.006],
  ])
  applyDefaults(options.forceGravity, [['strength', 0.25]])

  state.options = options
}

export default class Graph {
  constructor(originalData, vm) {
    const state = {}
    initializeOptions(state, {})
    state.data = originalData
    state.vm = vm
    this.state = state
    this.selectedDotDependsOn = []
    this.selectedDotDependsBy = []
  }

  setResources(canvas) {
    this.state.canvas = {
      element: canvas,
      context: canvas.getContext('2d', {
        alpha: false,
      }),
    }
  }

  start(canvas) {
    this.setResources(canvas)
    run(this.state)
  }

  getEdge(state, source, target) {
    const edges = state.data.edges.filter((edge) => {
      return (
        edge.source.index === source.index &&
        edge.target.index === target.index &&
        edge.show
      )
    })
    return edges.pop()
  }

  selectedEdge() {
    if (!this.edgeIsSelected()) {
      return
    }
    return (
      this.getEdge(
        this.state,
        this.state.selection[0],
        this.state.selection[1],
      ) ||
      this.getEdge(this.state, this.state.selection[1], this.state.selection[0])
    )
  }

  updateSelection() {
    if (this.edgeIsSelected()) {
      if (
        !this.getEdge(
          this.state,
          this.state.selection[0],
          this.state.selection[1],
        ) &&
        !this.getEdge(
          this.state,
          this.state.selection[1],
          this.state.selection[0],
        )
      ) {
        this.state.selection = []
        this.state.vm.$data.selection = []
      }
    }
  }

  updateEdges(checkedWeights) {
    this.state.data.checkedWeights = checkedWeights

    this.state.data.edges = this.state.data.edges.map((edge) => {
      const weights = edge.weights.map((weight) => weight.name)
      edge.show = weights.some((weight) => checkedWeights.includes(weight))
      return edge
    })
    this.state.vm.$data.selectedDotDependsOn = this.updatedselectedDotDependsOn()
    this.state.vm.$data.selectedDotDependsBy = this.updatedselectedDotDependsBy()
    this.updateSelection()
  }

  noSelected() {
    return this.state.selection.length === 0
  }

  dotIsSelected() {
    return this.state.selection.length === 1
  }

  edgeIsSelected() {
    return this.state.selection.length === 2
  }

  updatedselectedDotDependsOn() {
    if (this.noSelected()) {
      this.selectedDotDependsOn = []
    } else if (this.dotIsSelected()) {
      this.selectedDotDependsOn = this.state.data.edges.filter((edge) => {
        return edge.source.index === this.state.selection[0].index && edge.show
      })
    } else if (this.edgeIsSelected()) {
      this.selectedDotDependsOn = this.state.data.edges.filter((edge) => {
        return (
          edge.source.index === this.state.selection[0].index &&
          edge.target.index === this.state.selection[1].index &&
          edge.show
        )
      })
    }
    return this.selectedDotDependsOn
  }

  updatedselectedDotDependsBy() {
    if (this.noSelected()) {
      this.selectedDotDependsBy = []
    } else if (this.dotIsSelected()) {
      this.selectedDotDependsBy = this.state.data.edges.filter((edge) => {
        return edge.target.index === this.state.selection[0].index && edge.show
      })
    } else if (this.edgeIsSelected()) {
      this.selectedDotDependsBy = this.state.data.edges.filter((edge) => {
        return (
          edge.target.index === this.state.selection[0].index &&
          edge.source.index === this.state.selection[1].index &&
          edge.show
        )
      })
    }
    return this.selectedDotDependsBy
  }

  updateTransform(zoom) {
    this.state.transform.k = zoom / 100
  }

  reset() {
    this.state.transform.x = this.state.transform.y = 0
    this.state.vm.$data.zoom = this.state.options.zoomDefault
  }
}
