import { BaseChart } from '@/views/chat/component/BaseChart.ts'
import { Chart } from '@antv/g2'

export abstract class BaseG2Chart extends BaseChart {
  chart: Chart

  constructor(id: string, name: string) {
    super(id, name)
    this.chart = new Chart({
      container: id,
      autoFit: true,
      padding: 'auto',
    })

    this.chart.theme({
      view: {
        viewFill: '#FFFFFF',
      },
    })
  }

  render() {
    this.chart?.render()
  }

  destroy() {
    this.chart?.destroy()
  }
}
