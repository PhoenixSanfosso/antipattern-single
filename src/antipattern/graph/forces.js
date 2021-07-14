import {
  forceLink as _forceLink,
  forceManyBody,
  forceCollide as _forceCollide,
} from 'd3-force'

/* Repulsive force that pulls nodes in the graph apart. */
export function forceCharge(options) {
  return forceManyBody().strength(options.forceCharge.strength)
}

/* Force that draws each node toward the center (0, 0) of the graph. */
export function forceCenter(options) {
  let nodes

  function force(alpha) {
    const k = 1 - alpha * options.forceCenter.strength
    const n = nodes.length
    for (let i = 0, node; i < n; ++i) {
      node = nodes[i]
      node.x *= k
      node.y *= k
    }
  }

  force.initialize = function (nodeArr) {
    nodes = nodeArr
  }

  return force
}

/* Tries to keep nodes from passing through each other, according to
their bounding circles. */
export function forceCollide(options) {
  return _forceCollide(options.nodeRadiusOuter)
    .strength(options.forceCollide.strength)
    .iterations(options.forceCollide.iterations)
}

/* Draws two nodes with an edge between them together. */
export function forceLink(options, edges) {
  return _forceLink(edges).strength(function (edge) {
    return edge.source.group === edge.target.group
      ? options.forceLink.likeStrength
      : options.forceLink.unlikeStrength
  })
}

/* Draws nodes of the same group together towards a common centroid. */
export function forceGravity(options) {
  let nodes
  const groups = []

  function force(alpha) {
    const k = alpha * options.forceGravity.strength

    groups.forEach(function (group) {
      let cx = 0,
        cy = 0

      const n = group.length
      group.forEach(function (node) {
        cx += node.x
        cy += node.y
      })

      cx /= n
      cy /= n

      group.forEach(function (node) {
        node.x += (cx - node.x) * k
        node.y += (cy - node.y) * k
      })
    })
  }

  force.initialize = function (nodeArr) {
    nodes = nodeArr
    for (let i = 0, node, group; i < nodes.length; ++i) {
      node = nodes[i]

      group = groups[node.group]
      if (group === undefined) {
        groups[node.group] = group = []
      }
      group.push(node)
    }
  }

  return force
}
