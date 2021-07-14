import antipattern from './antipattern/index.vue'
import ElementPlus from 'element-plus'
import { createApp } from 'vue'

const app = createApp({
  data: function () {
    return {
      dep: dependencies,
      clu: clustering
    }
  },
  components: {
    antipattern
  }
})

app.use(ElementPlus)
app.mount('#app')