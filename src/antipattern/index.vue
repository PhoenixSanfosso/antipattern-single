<template>
  <div class="anti-pattern-container">
    <el-row :gutter="20">
      <div class="selection-area">
        <el-checkbox-group
          v-model="checkedWeights"
          @change="handleCheckedWeightsChange"
        >
          <el-checkbox
            v-for="weight in weights"
            :label="weight"
            :key="weight"
            >{{ weight }}</el-checkbox
          >
        </el-checkbox-group>
        <el-checkbox
          :indeterminate="isIndeterminate"
          v-model="checkAll"
          @change="handleCheckAllChange"
          >Check All</el-checkbox
        >
        <el-input-number
          v-model="zoom"
          @change="handleZoomChange"
          :min="graph.state.options.zoomMin"
          :max="graph.state.options.zoomMax"
          :step="graph.state.options.zoomStep"
          size="mini"
          class="zoom"
        ></el-input-number>
        <el-button @click="reset" size="mini" class="reset">Reset</el-button>
      </div>
    </el-row>
    <el-row :gutter="20" class="bottom">
      <el-col :span="18" class="full-height">
        <canvas ref="canvas" tabindex="0" class="canvas"></canvas>
      </el-col>
      <el-col :span="6" class="full-height">
        <div class="side-pannel full-height">
          <div class="dependencies-info full-height">
            <h5>Dependencies Panel</h5>
            <dot-panel
              v-if="dotIsSelected()"
              :selectedDot="selectedDot"
              :selectedDotDependsOn="selectedDotDependsOn"
              :selectedDotDependsBy="selectedDotDependsBy"
              :checkedWeights="checkedWeights"
            />
            <edge-panel
              v-else-if="edgeIsSelected()"
              :edge="edge"
              :checkedWeights="checkedWeights"
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import Graph from './graph/index.js'
import formatData from './helpers/format-data.js'
import DotPanel from './DotPanel'
import EdgePanel from './EdgePanel'

export default {
  name: 'AntiPattern',
  components: {
    DotPanel,
    EdgePanel,
  },
  data: function () {
    return {
      originalData: formatData(this.dependencies, this.clustering),
      graph: null,
      checkAll: true,
      checkedWeights: [],
      weights: [],
      selection: [],
      isIndeterminate: true,
      selectedDot: null,
      selectedDotDependsOn: [],
      selectedDotDependsBy: [],
      zoom: 100,
      edge: null,
    }
  },
  props: {
    // URLs to data files that must be provided
    dependencies: {
      type: Object,
      required: true,
    },
    clustering: {
      type: Object,
      required: true,
    },
  },
  created() {
    this.graph = new Graph(this.originalData, this)

    this.weights = this.originalData.weights
    this.checkedWeights = this.weights
  },
  mounted: function () {
    this.graph.start(this.$refs.canvas)
    this.focusCanvas()
  },
  methods: {
    handleCheckedWeightsChange(value) {
      let checkedCount = value.length
      this.checkAll = checkedCount === this.weights.length
      this.isIndeterminate =
        checkedCount > 0 && checkedCount < this.weights.length
      this.graph.updateEdges(this.checkedWeights)
      this.focusCanvas()
    },
    handleCheckAllChange(val) {
      this.checkedWeights = val ? this.weights : []
      this.isIndeterminate = false
      this.graph.updateEdges(this.checkedWeights)
      this.focusCanvas()
    },
    handleZoomChange() {
      this.focusCanvas()
    },
    handleTabClick() {
      // this.activeName = tab
    },
    reset() {
      this.graph.reset()
      this.focusCanvas()
    },
    focusCanvas() {
      this.$refs.canvas.focus({ preventScroll: true })
    },
    highlight(weight) {
      return this.checkedWeights.includes(weight)
    },
    dotIsSelected() {
      return this.selection.length === 1
    },
    edgeIsSelected() {
      return this.selection.length === 2
    },
  },
  watch: {
    selection () {
      if (this.dotIsSelected()) {
        this.selectedDot = this.selection[0]
        this.selectedDotDependsOn = this.graph.updatedselectedDotDependsOn()
        this.selectedDotDependsBy = this.graph.updatedselectedDotDependsBy()
      } else if (this.edgeIsSelected()) {
        this.edge = this.graph.selectedEdge()
      }
    },
    zoom() {
      this.graph.updateTransform(this.zoom)
    },
  },
}
</script>
<style scoped>
.anti-pattern-container {
  height: 100%;
  width: 100%;
  margin: 10px;
}

.zoom {
  margin-left: 100px;
}

.reset {
  margin-left: 12px;
}

.canvas {
  height: 100%;
  width: 100%;
  outline: none;
}

.selection-area {
  padding: 0 10px;
}

.bottom {
  overflow: hidden;
  height: 100%;
}

.full-height {
  height: 100%;
}

.side-pannel {
  padding: 0 10px;
  border-left: 1px solid rgb(204, 204, 204);
}
</style>
<style>
.dependencies-list-tab .el-tabs__content {
  height: 100%;
}
</style>
