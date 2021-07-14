<template>
  <div class="edge-panel">
    <div>
      <h5>Selected:</h5>
      <h5>A:</h5>
      <div class="active-dot-name">
        <i class="fa fa-file"></i><strong>{{ source() }}</strong>
      </div>
      <h5>B:</h5>
      <div class="active-dot-name">
        <i class="fa fa-file"></i><strong>{{ target() }}</strong>
      </div>
    </div>
    <div class="depends">
      <h5>Dependencies Table:</h5>
      <el-table class="depends-table" :data="dependsData()">
        <el-table-column prop="source" label="Source" width="80">
        </el-table-column>
        <el-table-column prop="target" label="Target" width="80">
        </el-table-column>
        <el-table-column prop="depend" label="Depend"> </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
export default {
  name: 'EdgePanel',
  props: {
    edge: {
      type: Object,
      required: true,
    },
    checkedWeights: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  methods: {
    source() {
      return this.edge.source.name
    },
    target() {
      return this.edge.target.name
    },
    hasReverseEdge() {
      if (this.edge.reverse) {
        const checkedReverseWeights = this.edge.reverse.weights.filter(
          (weight) => this.checkedWeights.includes(weight.name),
        )
        return checkedReverseWeights.length > 0
      }
      return false
    },
    dependsData() {
      let data = this.edge.weights
        .filter((weight) => this.checkedWeights.includes(weight.name))
        .map((weight) => {
          return {
            source: "A",
            target: "B",
            depend: `${weight.name}: ${
              weight.value
            }`,
          }
        })
      if (this.hasReverseEdge()) {
        const reverseData = this.edge.reverse.weights
          .filter((weight) => this.checkedWeights.includes(weight.name))
          .map((weight) => {
            return {
              source: "B",
              target: "A",
              depend: `${weight.name}: ${
                weight.value
              }`,
            }
          })
        data = [...data, ...reverseData]
      }
      return data
    },
  },
}
</script>
<style scoped>
.edge-panel {
  height: 100%;
}
.active-dot-name {
  margin: 12px 0;
  padding: 12px;
  background-color: #f5f5f5;
  word-break: break-word;
}

.fa {
  color: #999;
}

.depends {
  max-height: calc(100% - 200px);
  height: 100%;
}

.depends-table {
  overflow: auto !important;
  height: 100%;
  max-height: calc(100% - 200px);
}
</style>
