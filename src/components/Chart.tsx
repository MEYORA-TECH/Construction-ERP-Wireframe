import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, GaugeChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ChartSpec } from '@/config/types';
import { CHART_RAMP, TONE_HEX } from '@/theme/status';

echarts.use([BarChart, LineChart, PieChart, FunnelChart, GaugeChart, HeatmapChart, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

const AXIS = { color: '#7B8594', fontSize: 11 };

/** Planned / budget / baseline series are light; actuals are navy — consistent across every chart. */
function seriesColor(name: string, i: number): string {
  if (/planned|budget|baseline|target|estimate/i.test(name)) return '#B5D4F4';
  if (/actual|deployed|achieved/i.test(name)) return '#0C3B6E';
  if (/trend|forecast/i.test(name)) return '#5B8FC9';
  return CHART_RAMP[i % CHART_RAMP.length];
}
const LINE = '#E3E7ED';
const FONT = "'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif";

function fmt(unit: string | undefined) {
  return (raw: number) => {
    const v = Math.round(raw * 100) / 100;
    if (unit === '%') return `${v}%`;
    if (unit === '₹Cr') return `₹${v} Cr`;
    if (unit === '₹L') return `₹${v} L`;
    return unit ? `${v} ${unit}` : String(v);
  };
}

export function buildOption(spec: ChartSpec): echarts.EChartsCoreOption {
  const f = fmt(spec.unit);
  const base = {
    color: CHART_RAMP,
    textStyle: { fontFamily: FONT },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#fff',
      borderColor: '#C9D1DB',
      borderWidth: 1,
      textStyle: { color: '#1B2430', fontSize: 12 },
      valueFormatter: (v: unknown) => f(Number(v)),
    },
    legend: spec.series.length > 1 ? { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#4A5563', fontSize: 11 } } : undefined,
    grid: { left: 8, right: 12, top: spec.series.length > 1 ? 30 : 12, bottom: 4, containLabel: true },
  };
  const many = (spec.categories?.length ?? 0) > 6;
  const cat = {
    type: 'category' as const,
    data: spec.categories,
    axisLine: { lineStyle: { color: LINE } },
    axisTick: { show: false },
    axisLabel: { ...AXIS, interval: 0, fontSize: many ? 10 : 11, hideOverlap: false, width: many ? 72 : 110, overflow: 'truncate' as const },
  };
  const val = { type: 'value' as const, axisLabel: { ...AXIS, formatter: f }, splitLine: { lineStyle: { color: LINE } } };

  switch (spec.kind) {
    case 'donut': {
      const s = spec.series[0];
      return {
        ...base,
        tooltip: { ...base.tooltip, trigger: 'item', valueFormatter: (v: unknown) => f(Number(v)) },
        legend: { orient: 'vertical', right: 0, top: 'middle', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#4A5563', fontSize: 11 } },
        series: [
          {
            type: 'pie',
            radius: ['56%', '80%'],
            center: ['32%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            data: (spec.categories ?? []).map((name, i) => ({
              name,
              value: s.data[i],
              itemStyle: spec.tones ? { color: TONE_HEX[spec.tones[i]] } : undefined,
            })),
          },
        ],
      };
    }
    case 'funnel': {
      const s = spec.series[0];
      return {
        ...base,
        tooltip: { ...base.tooltip, trigger: 'item' },
        legend: undefined,
        series: [
          {
            type: 'funnel',
            left: '8%',
            right: '8%',
            top: 6,
            bottom: 6,
            sort: 'descending',
            gap: 2,
            label: { show: true, position: 'inside', fontSize: 11, formatter: '{b}: {c}' },
            itemStyle: { borderWidth: 0 },
            data: (spec.categories ?? []).map((name, i) => {
              const color = ['#0C3B6E', '#185FA5', '#5B8FC9', '#8FB5DE', '#B5D4F4', '#D6E6F7'][Math.min(i, 5)];
              return { name, value: s.data[i], itemStyle: { color }, label: { color: i < 3 ? '#fff' : '#0C3B6E' } };
            }),
          },
        ],
      };
    }
    case 'gauge': {
      const v = spec.series[0].data[0];
      return {
        series: [
          {
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            progress: { show: true, width: 12, itemStyle: { color: '#0C3B6E' } },
            axisLine: { lineStyle: { width: 12, color: [[1, '#E6F1FB']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            detail: { valueAnimation: true, fontSize: 22, fontWeight: 600, color: '#1B2430', offsetCenter: [0, '10%'], formatter: '{value}%' },
            title: { show: true, offsetCenter: [0, '45%'], color: '#7B8594', fontSize: 11 },
            data: [{ value: v, name: spec.series[0].name }],
          },
        ],
      };
    }
    case 'heatmap': {
      const xs = spec.categories ?? [];
      const ys = spec.yCategories ?? [];
      const flat = spec.series[0].data;
      const data: [number, number, number][] = [];
      ys.forEach((_, y) => xs.forEach((__, x) => data.push([x, y, flat[y * xs.length + x] ?? 0])));
      return {
        tooltip: { position: 'top' },
        grid: { left: 8, right: 8, top: 8, bottom: 40, containLabel: true },
        xAxis: { ...cat, data: xs, splitArea: { show: true } },
        yAxis: { type: 'category', data: ys, axisLabel: AXIS, axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false } },
        visualMap: { min: 0, max: Math.max(...flat, 1), calculable: false, orient: 'horizontal', left: 'center', bottom: 0, itemHeight: 90, itemWidth: 10, inRange: { color: ['#E6F1FB', '#5B8FC9', '#0C3B6E'] }, textStyle: AXIS },
        series: [{ type: 'heatmap', data, label: { show: true, color: '#1B2430', fontSize: 11, fontWeight: 600, textBorderColor: '#fff', textBorderWidth: 3 }, itemStyle: { borderColor: '#fff', borderWidth: 2 } }],
      };
    }
    case 'hbar':
      return {
        ...base,
        tooltip: { ...base.tooltip, axisPointer: { type: 'shadow' } },
        xAxis: val,
        yAxis: { ...cat, inverse: true },
        series: spec.series.map((s) => ({ type: 'bar', name: s.name, data: s.data, barMaxWidth: 14, itemStyle: { borderRadius: [0, 2, 2, 0] } })),
      };
    case 'waterfall': {
      const d = spec.series[0].data;
      let run = 0;
      const helper: number[] = [];
      const bars: { value: number; label: number; color: string }[] = [];
      d.forEach((v, i) => {
        if (i === d.length - 1) {
          helper.push(0);
          bars.push({ value: run, label: run, color: '#0C3B6E' });
        } else if (v >= 0) {
          helper.push(run);
          bars.push({ value: v, label: v, color: i === 0 ? '#185FA5' : '#5B8FC9' });
          run += v;
        } else {
          run += v;
          helper.push(run);
          bars.push({ value: -v, label: v, color: '#C9D1DB' });
        }
      });
      return {
        ...base,
        legend: undefined,
        tooltip: { ...base.tooltip, axisPointer: { type: 'shadow' }, formatter: (ps: { dataIndex: number; seriesIndex: number }[]) => {
          const p = ps.find((x) => x.seriesIndex === 1) ?? ps[0];
          return `${spec.categories?.[p.dataIndex] ?? ''}: ${f(bars[p.dataIndex].label)}`;
        } },
        xAxis: cat,
        yAxis: val,
        series: [
          { type: 'bar', stack: 'w', data: helper, itemStyle: { color: 'transparent' }, emphasis: { disabled: true } },
          {
            type: 'bar',
            stack: 'w',
            name: spec.series[0].name,
            data: bars.map((b) => ({ value: b.value, itemStyle: { color: b.color } })),
            barMaxWidth: 34,
            label: { show: true, position: 'top', fontSize: 10, color: '#4A5563', formatter: (p: { dataIndex: number }) => f(bars[p.dataIndex].label) },
          },
        ],
      };
    }
    default: {
      const isStack = spec.kind === 'stacked';
      return {
        ...base,
        tooltip: { ...base.tooltip, axisPointer: { type: spec.kind === 'line' || spec.kind === 'area' ? 'line' : 'shadow' } },
        xAxis: cat,
        yAxis: val,
        series: spec.series.map((s, i) => {
          const type = spec.kind === 'barline' ? (s.type ?? (i === 0 ? 'bar' : 'line')) : spec.kind === 'line' || spec.kind === 'area' ? 'line' : 'bar';
          return type === 'line'
            ? {
                type: 'line',
                name: s.name,
                data: s.data,
                smooth: false,
                symbol: 'circle',
                symbolSize: 5,
                color: seriesColor(s.name, i),
                lineStyle: { width: 2 },
                areaStyle: spec.kind === 'area' ? { opacity: 0.12 } : undefined,
              }
            : {
                type: 'bar',
                name: s.name,
                data: s.data,
                stack: isStack ? 'total' : undefined,
                color: seriesColor(s.name, i),
                barMaxWidth: spec.series.length > 1 && !isStack ? 12 : 22,
                barGap: '20%',
                itemStyle: { borderRadius: isStack ? 0 : [2, 2, 0, 0] },
              };
        }),
      };
    }
  }
}

export function Chart({ spec, height }: { spec: ChartSpec; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || import.meta.env.MODE === 'test') return;
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chart.setOption(buildOption(spec));
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [spec]);
  return <div ref={ref} style={{ height: height ?? spec.height ?? 220, width: '100%' }} role="img" aria-label={spec.title} />;
}
