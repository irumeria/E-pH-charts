
import * as echarts from 'echarts';
import { useRef } from 'react';
import Box from '@mui/material/Box';
import React from 'react';
import Grid from '@mui/material/Grid';
import { Phfai } from "./dist/phfai.js";
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
const phfai = new Phfai();

// 设置一点常数
const RIGHT_BORDER = 16.5;
const LEFT_BORDER = 2;
const TOP_BORDER = 2;
const BOTTOM_BORDER = -2;
const DRAW_STEP = 0.2;

let vpChart;
let lines = undefined;
const App = () => {
  
  const vpRef = useRef(null);

  const [a_value, set_a_value] = React.useState(
    {
      "O2": 0,
      "H2": 0,
      "Zn2+": 0,
      "ZnO22-": 0,
      "H2O": 0,
      "Zn": 0,
      "ZnO": 0,
    }
  );

  // 硬编码 FOR TEST ======
  const react_names = [
    "Zn2+ - ZnO",
    "Zn - Zn2+",
    "Zn - ZnO",
    "ZnO - ZnO22-",
    "Zn - ZnO22-",
    "O2",
    "H2"
  ];
  // ===============
  const generateData = (line) => {
    let func = (dx, b, a, y0) => b / a * dx + y0;// 横线或者斜线
    // let func1 = (x,b) => 
    let data = [];
    // [线的id, 线type: {-1 保留负半段, 0 两端截取, 1 保留正半段, 2 直线},第一个点position , {第二个点position(type=0),b}, a]
    if (line[1] == 0) {
      data.push(line[2]);
      data.push(line[3]);
    } else if (line[1] == 1) {
      if (line[4] != 0) {
        for (let i = line[2][0]; i <= RIGHT_BORDER; i += DRAW_STEP) {
          data.push([i, func(i - line[2][0], line[3], line[4], line[2][1])]);
        }
      } else {
        for (let i = line[2][1]; i >= BOTTOM_BORDER; i -= DRAW_STEP) {
          data.push([line[2][0], i]);
        }
      }

    } else if (line[1] == -1) {
      if (line[4] != 0) {
        for (let i = line[2][0]; i >= LEFT_BORDER; i -= DRAW_STEP) {
          data.push([i, func(i - line[2][0], line[3], line[4], line[2][1])]);
        }
      } else {
        for (let i = line[2][1]; i <= TOP_BORDER; i += DRAW_STEP) {
          data.push([line[2][0], i]);
        }
      }
    }else if(line[1] == 2){ // 析氢线或析氧线
      // for (let i = LEFT_BORDER; i < line[2][0]; i += 0.1) {
      //   data.push([i, func(i - line[2][0], line[3], line[4], line[2][1])]);
      // }
      for (let i = line[2][0]; i <= RIGHT_BORDER; i += DRAW_STEP) {
        data.push([i, func(i - line[2][0], line[3], line[4], line[2][1])]);
      }
    }
    // console.log(line[0], data);
    return data;
  }

  let option = {
    title: {
      text: 'Zn-H2O系的电位-pH图',
      left:'10%'
    },
    animation: false,
    grid: {
      top: 40,
      left: 50,
      right: 40,
      bottom: 50
    },
    legend:{
      data:react_names,
      right:'0%'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer:{
        type:'cross'
      }
    },
    xAxis: {
      name: 'PH',
      type: 'value',
      min: LEFT_BORDER,
      max: RIGHT_BORDER,
      nameTextStyle:{
        fontSize :16,
      },
      minorTick: {
        show: true
      },
      minorSplitLine: {
        show: true
      }
    },
    yAxis: {
      name: '电位',
      type: 'value',
      nameTextStyle:{
        fontSize :16,
      },
      minorTick: {
        show: true
      },
      minorSplitLine: {
        show: true
      }
    },
    dataZoom: [
      {
        show: true,
        type: 'inside',
        filterMode: 'none',
        xAxisIndex: [0],
        startValue: -20,
        endValue: 20
      },
      {
        show: true,
        type: 'inside',
        filterMode: 'none',
        yAxisIndex: [0],
        startValue: -20,
        endValue: 20
      }
    ],
    series: [

    ]
  };

  const handle_slider_change = (e, key) => {
    let _a_value = JSON.parse(JSON.stringify(a_value));
    _a_value[key] = e.target.value;
    set_a_value({ ..._a_value } );
    console.log("a_value:",a_value,e.target.value);
    rePaint();
  };

  const rePaint = () => {
    let lg_a_value = JSON.parse(JSON.stringify(a_value));
    Object.keys(lg_a_value).map(key => lg_a_value[key] = Math.pow(10, lg_a_value[key]));
    lines = phfai.get_Zn_phase(lg_a_value);
    option.series = [];
    lines.map(
      line => {
        option.series.push(
          {
            name: react_names[line[0]],
            type: 'line',
            showSymbol: false,
            data: generateData(line),
            lineStyle:{
              type:(line[1] === 2?'dashed':"solid")
            }
          }
        )

      }
    );
    vpChart.setOption(option);
  };

  React.useEffect(() => {
    vpChart = echarts.init(vpRef.current)
    rePaint();
    return () => {
      vpChart.clear();
    }
  }, []);

  return (
    <Grid container spacing={2} sx={{ padding: "1rem" }}>
      <Grid item xs={9}>
        <Box id="canvas_vp" sx={{ width: "70vw", height: "100vh" }} ref={vpRef}></Box>
      </Grid>
      <Grid item xs={3} >
        <Box id="ret_app" sx={{
          borderRadius: 5,
          boxShadow: "0 0 1px 0.5px #d0d0d0",
          padding: "2rem",
          height: "90vh",
          m: "auto",
          backgroundColor: "#ffffffaf"
        }}
        >
          {
            Object.keys(a_value).map(
              key => {
                return (
                  <Box>
                    <Typography id="input-slider" gutterBottom>
                      {key} 活度: 10 的 {a_value[key]} 次方
                    </Typography>
                    <Slider defaultValue={a_value[key]} min={-10}
                      step={0.2}
                      onChange={(e) => handle_slider_change(e, key)}
                      max={10} valueLabelDisplay="auto" />
                  </Box>
                )
              }
            )
          }

        </Box>
      </Grid>
    </Grid>
  );
}

export default App;
