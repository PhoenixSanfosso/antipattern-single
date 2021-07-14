import { interpolateTurbo } from 'd3-scale-chromatic'

function getNodeColor(a, b) {
  return interpolateTurbo(a / b)
}

function drawLineWithArrows(
  ctx,
  x1,
  y1,
  x2,
  y2,
  strokeStyle,
  arrowStart,
  arrowEnd,
) {
  const drawArrowhead = (ctx, x, y, radians, strokeStyle) => {
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = strokeStyle
    ctx.fillStyle = strokeStyle
    ctx.translate(x, y)
    ctx.rotate(radians)
    ctx.moveTo(0, 0)
    ctx.lineTo(5, 20)
    ctx.lineTo(-5, 20)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // draw the starting arrowhead
  if (arrowStart) {
    var startRadians = Math.atan((y2 - y1) / (x2 - x1))
    startRadians += ((x2 > x1 ? -90 : 90) * Math.PI) / 180
    drawArrowhead(ctx, x1, y1, startRadians, strokeStyle)
  }

  // draw the ending arrowhead
  if (arrowEnd) {
    var endRadians = Math.atan((y2 - y1) / (x2 - x1))
    endRadians += ((x2 > x1 ? 90 : -90) * Math.PI) / 180
    drawArrowhead(ctx, x2, y2, endRadians, strokeStyle)
  }
}

function prepareEdgeArrays(state, tf, centerX, centerY, dpr) {
  // edge rendering
  const edgeArrays = {
    normal: [],
    dark: [],
    light: [],
  }

  state.data.edges.forEach(function (edge) {
    // for edges that are bidirectional, we don't show two duplicate lines
    // if (edge.reverse !== null && edge.source >= edge.target) return
    if (!edge.show) {
      return
    }

    const x1 = ((edge.source.x + tf.x) * tf.k + centerX) * dpr
    const y1 = ((edge.source.y + tf.y) * tf.k + centerY) * dpr
    const x2 = ((edge.target.x + tf.x) * tf.k + centerX) * dpr
    const y2 = ((edge.target.y + tf.y) * tf.k + centerY) * dpr
    const edgeCoords = [x1, y1, x2, y2]

    const edgeNodes = [edge.source, edge.target]
    let edgeState = 'normal'
    if (state.selection.length > 0) {
      edgeState = state.selection.every((sel) => edgeNodes.includes(sel))
        ? 'dark'
        : 'light'
    }

    edgeArrays[edgeState].push(edgeCoords)
  })
  return edgeArrays
}

function drawEdges(state, options, tf, centerX, centerY, dpr, context) {
  const edgeArrays = prepareEdgeArrays(state, tf, centerX, centerY, dpr)
  const edgeColors = {
    normal: options.colors.edgeNormal,
    dark: options.colors.edgeDark,
    light: options.colors.edgeLight,
  }

  const cochange = state.vm.$data.checkedWeights.includes('Cochange')

  const edgeArrNames = ['light', 'normal', 'dark']
  edgeArrNames.forEach(function (arrName) {
    const arr = edgeArrays[arrName]
    context.strokeStyle = edgeColors[arrName]
    if (arr.length > 0) {
      context.save()
      if (cochange) {
        context.setLineDash(options.lineDash)
      }
      arr.forEach(function (edgeCoords) {
        context.beginPath()
        context.moveTo(edgeCoords[0], edgeCoords[1])
        context.lineTo(edgeCoords[2], edgeCoords[3])
        context.stroke()

        if (!cochange) {
          drawLineWithArrows(
            context,
            edgeCoords[0],
            edgeCoords[1],
            edgeCoords[2],
            edgeCoords[3],
            edgeColors[arrName],
            false,
            true,
          )
          context.stroke()
        }
      })
      context.restore()
    }
  })
}

function nodePosition(node, centerX, centerY, tf, dpr) {
  const x = ((node.x + tf.x) * tf.k + centerX) * dpr
  const y = ((node.y + tf.y) * tf.k + centerY) * dpr
  return [x, y]
}

function drawNodes(state, options, tf, centerX, centerY, dpr, context) {
  function drawPoint(pos, radius) {
    context.beginPath()
    context.arc(pos[0], pos[1], radius, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
  }

  // draw normal nodes
  const nodeRadiusInner = options.nodeRadiusInner * tf.k * dpr
  state.data.nodes.forEach(function (node) {
    context.fillStyle = getNodeColor(node.group, state.data.groups.length)
    context.strokeStyle = options.colors.nodeStrokeNormal
    drawPoint(nodePosition(node, centerX, centerY, tf, dpr), nodeRadiusInner)
  })

  const nodeRadiusOuter = options.nodeRadiusOuter * tf.k * dpr

  // draw active nodes
  state.selection.forEach((node) => {
    context.strokeStyle = options.colors.highlightStrokeActive
    context.fillStyle = options.colors.highlightFillActive
    drawPoint(nodePosition(node, centerX, centerY, tf, dpr), nodeRadiusOuter)
  })

  // draw pointer target node
  if (state.pointer.target) {
    context.strokeStyle = options.colors.highlightStrokeTarget
    context.fillStyle = options.colors.highlightFillTarget
    drawPoint(
      nodePosition(state.pointer.target, centerX, centerY, tf, dpr),
      nodeRadiusOuter,
    )
  }
}

function drawTips(state, options, tf, centerX, centerY, dpr, context) {
  // draw active nodes
  context.save()
  context.font = options.colors.tipsFont
  context.fillStyle = options.colors.tipsFillColor
  const nodeRadiusInner = (options.nodeRadiusInner + 2) * tf.k * dpr

  state.selection.forEach((node) => {
    const nodePos = nodePosition(node, centerX, centerY, tf, dpr)
    const text = context.measureText(node.name)
    context.fillText(
      node.name,
      nodePos[0] - text.width / 2,
      nodePos[1] - nodeRadiusInner,
    )
  })

  // draw pointer target node
  if (state.pointer.target) {
    const nodePos = nodePosition(
      state.pointer.target,
      centerX,
      centerY,
      tf,
      dpr,
    )
    const text = context.measureText(state.pointer.target.name)
    context.fillText(
      state.pointer.target.name,
      nodePos[0] - text.width / 2,
      nodePos[1] - nodeRadiusInner,
    )
  }
  context.restore()
}

export default function render(state) {
  const options = state.options
  const canvasEl = state.canvas.element
  const context = state.canvas.context
  const boundingRect = canvasEl.getBoundingClientRect()

  const dpr = (state.dimens.dpr = window.devicePixelRatio)
  const physicalWidth = (state.dimens.width = boundingRect.width)
  const physicalHeight = (state.dimens.height = boundingRect.height)
  const renderWidth = Math.round(physicalWidth * dpr)
  const renderHeight = Math.round(physicalHeight * dpr)

  const centerX = physicalWidth / 2
  const centerY = physicalHeight / 2
  const tf = state.transform

  canvasEl.width = renderWidth
  canvasEl.height = renderHeight
  context.fillStyle = options.colors.background
  context.fillRect(0, 0, renderWidth, renderHeight)

  drawEdges(state, options, tf, centerX, centerY, dpr, context)
  drawNodes(state, options, tf, centerX, centerY, dpr, context)
  drawTips(state, options, tf, centerX, centerY, dpr, context)
}
