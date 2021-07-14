export default function generateGraphData(dependencies, clustering) {
  // create a node named after each variable
  const nodes = new Map()
  const nodeArr = []
  for (let i = 0; i < dependencies.variables.length; ++i) {
    const variable = dependencies.variables[i]
    const node = {
      name: variable,
    }

    nodeArr.push(node)
    nodes.set(variable, node)
  }

  // convert cell data to graph edges, weights
  const edges = []
  const edgeMap = new Map()
  const weightNames = new Set()
  for (let i = 0; i < dependencies.cells.length; ++i) {
    const cell = dependencies.cells[i]
    const source = +cell.src
    const target = +cell.dest
    const thisKey = `${source}|${target}`
    const reverseKey = `${target}|${source}`

    const weights = Object.entries(cell.values).map(function (entry) {
      return {
        name: entry[0],
        value: entry[1],
      }
    })
    weights.forEach(function (weight) {
      weightNames.add(weight.name) // add this to the list of known weight names
    })

    const newEdge = {
      source: nodeArr[source],
      target: nodeArr[target],
      weights: weights,
      show: true,
      reverse: null,
    }
    if (edgeMap.has(reverseKey)) {
      const reverseEdge = edgeMap.get(reverseKey)
      reverseEdge.reverse = newEdge
      newEdge.reverse = reverseEdge
    }
    edges.push(newEdge)
    edgeMap.set(thisKey, newEdge)
  }

  const groups = []
  function addGroup(group) {
    // find next available ID
    const groupId = groups.length

    groups.push({
      id: groupId,
      name: group.name,
    })

    group.nested.forEach(function (child) {
      switch (child['@type']) {
        case 'group':
          addGroup(child)
          break
        case 'item':
          nodes.get(child.name).group = groupId
          break
      }
    })
  }
  clustering.structure
    .filter((item) => item['@type'] === 'group')
    .forEach(addGroup)

  return {
    nodes: nodeArr,
    edges: edges,
    groups: groups,
    weightNames: weightNames,
    weights: Array.from(weightNames.values()),
  }
}
