export function updateInput(state) {
  const pointer = state.pointer
  const centerX = state.dimens.width / 2
  const centerY = state.dimens.height / 2
  const tf = state.transform

  // recalculate pointer location on graph
  if (pointer.physicalX === null) {
    pointer.x = pointer.y = null
  } else {
    pointer.x = (pointer.physicalX - centerX) / tf.k - tf.x
    pointer.y = (pointer.physicalY - centerY) / tf.k - tf.y
  }

  if (pointer.down) {
    // make sure node/camera are in correct place during drag
    if (pointer.target !== null) {
      pointer.target.fx = pointer.x - pointer.dx
      pointer.target.fy = pointer.y - pointer.dy
    } else {
      // We must calculate the appropriate transformation
      tf.x = (pointer.physicalX - centerX) / tf.k - pointer.dx
      tf.y = (pointer.physicalY - centerY) / tf.k - pointer.dy
    }
  }
}

export function registerInput(state) {
  const canvasEl = state.vm.$refs.canvas
  const pointer = state.pointer

  function mouseMove(e) {
    pointer.physicalX = e.offsetX
    pointer.physicalY = e.offsetY
    if (pointer.down) {
      pointer.dragging = true
    } else {
      // find closest node on graph, update pointer target
      const nodes = state.data.nodes
      let node, r, closestNode, smallestR
      closestNode = null
      smallestR = state.options.nodeRadiusOuter
      for (let i = 0; i < nodes.length; ++i) {
        node = nodes[i]
        r = Math.hypot(pointer.x - node.x, pointer.y - node.y)
        if (r < smallestR) {
          smallestR = r
          closestNode = node
        }
      }
      pointer.target = closestNode
    }
  }

  function mouseOut() {
    if (!pointer.down) {
      pointer.physicalX = pointer.physicalY = null
      pointer.target = null
    }
  }

  function mouseDown(e) {
    pointer.down = true
    e.target.focus({ preventScroll: true })
    e.preventDefault()
    if (pointer.target !== null) {
      state.simulation.alphaTarget(state.options.alphaDrag)

      // fix node in place
      pointer.target.fx = pointer.target.x
      pointer.target.fy = pointer.target.y

      // dx is set to the vector from the node center to the pointer
      pointer.dx = pointer.x - pointer.target.x
      pointer.dy = pointer.y - pointer.target.y
    } else {
      pointer.dx = pointer.x
      pointer.dy = pointer.y
    }
  }

  function getEdge(state, source, target) {
    const edges = state.data.edges.filter((edge) => {
      return (
        edge.source.index === source.index &&
        edge.target.index === target.index &&
        edge.show
      )
    })
    return edges.pop()
  }

  function getClosestPointOnLine(line, x, y) {
    const lerp = function (a, b, x) {
      return a + x * (b - a)
    }
    var dx = line.x1 - line.x0
    var dy = line.y1 - line.y0
    var t = ((x - line.x0) * dx + (y - line.y0) * dy) / (dx * dx + dy * dy)
    t = Math.min(1, Math.max(0, t))
    var lineX = lerp(line.x0, line.x1, t)
    var lineY = lerp(line.y0, line.y1, t)
    return { x: lineX, y: lineY }
  }

  function mouseUp(e) {
    e.target.focus({ preventScroll: true })
    e.preventDefault()
    state.simulation.alphaTarget(state.options.alphaTarget)

    if (pointer.target === null) {
      if (!pointer.dragging) {
        state.selection = []
      }

      // find closest node on graph, update pointer target
      const edges = state.data.edges
      let edge, r, closestEdge, smallestR
      closestEdge = null
      smallestR = state.options.nodeRadiusOuter
      for (let i = 0; i < edges.length; ++i) {
        edge = edges[i]
        if (!edge.show) {
          continue
        }
        const line = getClosestPointOnLine(
          {
            x0: edge.source.x,
            y0: edge.source.y,
            x1: edge.target.x,
            y1: edge.target.y,
          },
          pointer.x,
          pointer.y,
        )
        r = Math.hypot(pointer.x - line.x, pointer.y - line.y)
        if (r < smallestR) {
          smallestR = r
          closestEdge = edge
        }
      }
      if (closestEdge) {
        state.selection = [
          state.data.nodes[closestEdge.source.index],
          state.data.nodes[closestEdge.target.index],
        ]
        state.vm.$data.selection = [
          state.data.nodes[closestEdge.source.index],
          state.data.nodes[closestEdge.target.index],
        ]
      }
    } else {
      if (!pointer.dragging) {
        const indexOfTarget = state.selection.indexOf(pointer.target)
        if (indexOfTarget === -1) {
          // not already selected
          state.selection.push(pointer.target)

          if (state.selection.length > 2) {
            const elemA = state.selection[0]
            const elemB = state.selection.pop()
            state.selection = [elemA, elemB]
          }

          if (state.selection.length > 1) {
            if (
              !getEdge(state, state.selection[0], state.selection[1]) &&
              !getEdge(state, state.selection[1], state.selection[0])
            ) {
              state.selection = [state.selection.pop()]
            }
          }
        } else {
          // this node is already selected, so unselect it
          state.selection.splice(indexOfTarget, 1) // remove from array
        }
      }

      // unfix node
      pointer.target.fx = pointer.target.fy = null
    }
    pointer.down = pointer.dragging = false

    pointer.dx = pointer.dy = null
    state.vm.$data.selection = state.selection
  }

  function keyDown(e) {
    if ('c0-+='.split('').includes(e.key)) {
      e.preventDefault()
    } else {
      return
    }
    if (e.ctrlKey || e.metaKey) {
      const tf = state.transform
      switch (e.key) {
        case 'c':
          tf.x = tf.y = 0
        // eslint-disable-next-line no-fallthrough
        case '0':
          state.vm.$data.zoom = state.options.zoomDefault
          break
        case '-':
          state.vm.$data.zoom = Math.max(
            state.vm.$data.zoom - state.options.zoomStep,
            state.options.zoomMin,
          )
          break
        case '+': // falls through
        case '=':
          state.vm.$data.zoom = Math.min(
            state.vm.$data.zoom + state.options.zoomStep,
            state.options.zoomMax,
          )
          break
      }
    }
  }

  canvasEl.addEventListener('mouseover', mouseMove)
  canvasEl.addEventListener('mousemove', mouseMove)
  canvasEl.addEventListener('mouseout', mouseOut)
  canvasEl.addEventListener('mousedown', mouseDown)
  canvasEl.addEventListener('mouseup', mouseUp)
  canvasEl.addEventListener('keydown', keyDown, false)
}
