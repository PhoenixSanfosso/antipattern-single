<template>
  <div class="full-height">
    <div class="active-dot">
      <h5>Selected:</h5>
      <div class="active-dot-name">
        <i class="fa fa-file"></i><strong>{{ selectedDot.name }}</strong>
      </div>
    </div>
    <el-tabs
      class="dependencies-list-tab full-height"
      v-model="activeName"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        class="dependencies-list full-height"
        label="Depends On"
        name="dependon"
        v-if="selectedDotDependsOn.length"
      >
        <el-row class="dependencies-list full-height">
          <div class="depends-on">
            <ul class="node-children list-group">
              <li
                class="list-group-item"
                v-for="depend in selectedDotDependsOn"
                :key="`depend-${depend.target.index}`"
              >
                <span
                  ><i class="fa fa-file"></i
                  ><strong>{{ depend.target.name }}</strong></span
                >
                <ul>
                  <li
                    v-for="(weight, index) in depend.weights"
                    :key="`w-${index}`"
                  >
                    <span
                      :class="highlight(weight.name) ? 'highlight' : 'lowlight'"
                      >{{
                        `${weight.name}: ${weight.value}`
                      }}</span
                    >
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </el-row>
      </el-tab-pane>
      <el-tab-pane
        class="dependencies-list-tab full-height"
        label="Depends By"
        name="dependby"
        v-if="selectedDotDependsBy.length"
      >
        <el-row class="dependencies-list full-height">
          <div class="depends-on">
            <ul class="node-children list-group">
              <li
                class="list-group-item"
                v-for="depend in selectedDotDependsBy"
                :key="`dependby-${depend.source.index}`"
              >
                <span
                  ><i class="fa fa-file"></i
                  ><strong>{{ depend.source.name }}</strong></span
                >
                <ul>
                  <li
                    v-for="(weight, index) in depend.weights"
                    :key="`by-w-${index}`"
                  >
                    <span
                      :class="highlight(weight.name) ? 'highlight' : 'lowlight'"
                      >{{ `${weight.name}: ${weight.value}` }}</span
                    >
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
export default {
  name: 'DotPanel',
  props: {
    selectedDot: {
      type: Object,
      required: true,
    },
    selectedDotDependsOn: {
      type: Array,
      required: true,
      default: () => [],
    },
    selectedDotDependsBy: {
      type: Array,
      required: true,
      default: () => [],
    },
    checkedWeights: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data: function () {
    return {
      activeName:
        this.selectedDotDependsOn.length === 0 ? 'dependby' : 'dependon',
    }
  },
  methods: {
    handleTabClick() {
      // this.activeName = tab
    },
    highlight(weight) {
      return this.checkedWeights.includes(weight)
    },
  },
  watch: {
    selectedDotDependsOn() {
      this.activeName =
        this.selectedDotDependsOn.length === 0 ? 'dependby' : 'dependon'
    },
    selectedDotDependsBy() {
      this.activeName =
        this.selectedDotDependsBy.length === 0 ? 'dependon' : 'dependby'
    },
  },
}
</script>
<style scoped>
.full-height {
  height: 100%;
}

.active-dot-name {
  margin: 12px 0;
  padding: 12px;
  background-color: #f5f5f5;
  word-break: break-word;
}

.depends-on {
  word-break: break-word;
  overflow: auto;
  max-height: calc(100% - 260px);
}

.highlight {
  color: black;
}

.lowlight {
  color: gray;
}

.list-group {
  padding-left: 0;
  padding-bottom: 2px;
  margin-bottom: 0;
}

.node-children .list-group-item {
  background: #fff;
  border-color: #ddd;
}

.node-children li {
  overflow-wrap: break-word;
  word-wrap: break-word;
  -ms-word-break: break-all;
  word-break: break-all;
  word-break: break-word;
}

.list-group-item {
  position: relative;
  display: block;
  padding: 10px 15px;
  margin-bottom: -1px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
}

.fa {
  color: #999;
}
</style>
<style>
.dependencies-list-tab .el-tabs__content {
  height: 100%;
}
</style>
