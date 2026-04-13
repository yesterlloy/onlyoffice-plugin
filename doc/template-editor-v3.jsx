import { useState, useRef, useCallback, useEffect } from "react";

/* ───────────────────── Data ───────────────────── */
const INDICATOR_CATEGORIES = [
  {
    name: "基础信息", icon: "📋",
    indicators: [
      { id:"year",code:"JK4816",field:"year",name:"年份",type:"text",preview:"2025",
        params:[{key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032","JK195981497926161033"],value:"JK195981497926161032"}]},
      { id:"month",code:"JK4816",field:"month",name:"季度",type:"text",preview:"第一",
        params:[{key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032"],value:"JK195981497926161032"}]},
      { id:"area",code:"JK4816",field:"area_name",name:"地区名称",type:"text",preview:"广州市",
        params:[{key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032"],value:"JK195981497926161032"}]},
      { id:"date",code:"SYS",field:"now",name:"当前日期",type:"date",preview:"2025年04月03日",
        params:[{key:"format",label:"日期格式",inputType:"select",options:["yyyy年MM月dd日","yyyy-MM-dd","yyyy/MM/dd"],value:"yyyy年MM月dd日"}]},
    ],
  },
  {
    name: "受理情况", icon: "📊",
    indicators: [
      { id:"work_count",code:"JK4816",field:"work_count",name:"受理总量",type:"number",unit:"万宗",preview:"35,821",
        params:[
          {key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032","JK195981497926161033"],value:"JK195981497926161032"},
          {key:"timeRange",label:"时间范围",inputType:"select",options:["本季度","上季度","本年度","自定义"],value:"本季度"},
          {key:"unit",label:"单位",inputType:"select",options:["宗","万宗","件"],value:"万宗"},
          {key:"decimal",label:"小数位",inputType:"number",value:0,min:0,max:4},
          {key:"thousandSep",label:"千分位",inputType:"switch",value:true},
        ]},
      { id:"zx_ratio",code:"JK4816",field:"zx_ratio",name:"咨询类占比",type:"percent",preview:"62.3",
        params:[
          {key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032"],value:"JK195981497926161032"},
          {key:"decimal",label:"小数位",inputType:"number",value:1,min:0,max:4},
          {key:"suffix",label:"后缀",inputType:"text",value:"%"},
        ]},
      { id:"bjmy_ratio",code:"JK4816",field:"bjmy_ratio",name:"办结满意率",type:"percent",preview:"95.2",
        params:[
          {key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032"],value:"JK195981497926161032"},
          {key:"decimal",label:"小数位",inputType:"number",value:1,min:0,max:4},
          {key:"suffix",label:"后缀",inputType:"text",value:"%"},
        ]},
    ],
  },
  {
    name: "诉求热点", icon: "🔥",
    indicators: [
      { id:"hot_bar",code:"JK3008",field:"chart",name:"热点诉求柱状图",type:"chart",chartType:"bar",
        params:[
          {key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032","JK195981496013558792"],value:"JK195981497926161032"},
          {key:"chartTitle",label:"图表标题",inputType:"text",value:"诉求热点分布"},
          {key:"maxItems",label:"显示条数",inputType:"number",value:6,min:1,max:20},
          {key:"chartColor",label:"主题色",inputType:"color",value:"#4F7CFF"},
          {key:"sortBy",label:"排序方式",inputType:"select",options:["数量降序","数量升序","名称排序"],value:"数量降序"},
          {key:"showValue",label:"显示数值",inputType:"switch",value:true},
        ]},
      { id:"hot_pie",code:"JK3008",field:"chart",name:"热点诉求饼图",type:"chart",chartType:"pie",
        params:[
          {key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032"],value:"JK195981497926161032"},
          {key:"chartTitle",label:"图表标题",inputType:"text",value:"诉求类型分布"},
          {key:"maxItems",label:"显示条数",inputType:"number",value:6,min:1,max:12},
          {key:"showPercent",label:"显示占比",inputType:"switch",value:true},
          {key:"innerRadius",label:"环形图",inputType:"switch",value:false},
        ]},
      { id:"hot_line",code:"JK3008",field:"chart",name:"趋势折线图",type:"chart",chartType:"line",
        params:[
          {key:"dataSource",label:"数据接口",inputType:"select",options:["JK195981497926161032"],value:"JK195981497926161032"},
          {key:"chartTitle",label:"图表标题",inputType:"text",value:"诉求趋势"},
          {key:"chartColor",label:"主题色",inputType:"color",value:"#36D399"},
          {key:"showDot",label:"显示数据点",inputType:"switch",value:true},
          {key:"smooth",label:"平滑曲线",inputType:"switch",value:false},
          {key:"showArea",label:"面积填充",inputType:"switch",value:false},
        ]},
    ],
  },
  {
    name: "AI 智能生成", icon: "🤖",
    indicators: [
      { id:"ai_overview",code:"AI_GEN",field:"overview",name:"总体概况分析",type:"ai_generate",
        params:[
          {key:"promptTemplate",label:"提示词模板",inputType:"textarea",value:"请根据以下{period}{area}的数据，撰写一段简洁的总体概况分析（200字内）：\n\n受理总量：{data.JK4816.work_count}\n同比变化：{data.JK4816.mom_ratio_desc}\n咨询类占比：{data.JK4816.zx_ratio}%\n投诉举报占比：{data.JK4816.tsjb_ratio}%\n办结满意率：{data.JK4816.bjmy_ratio}%\n\n要求：客观描述数据变化，指出显著趋势，语言简练正式。"},
          {key:"dataSources",label:"关联数据接口",inputType:"multiselect",options:["JK4816 - 总体概况","JK3008 - 诉求热点","JK0816 - 投诉举报"],value:["JK4816 - 总体概况"]},
          {key:"modelProvider",label:"模型服务",inputType:"select",options:["Claude","GPT-4","本地模型"],value:"Claude"},
          {key:"temperature",label:"创意度",inputType:"number",value:0.3,min:0,max:1},
          {key:"maxLength",label:"最大字数",inputType:"number",value:300,min:50,max:2000},
          {key:"outputFormat",label:"输出格式",inputType:"select",options:["纯文本","带标题分段","带序号列表"],value:"纯文本"},
          {key:"reviewRequired",label:"需人工审核",inputType:"switch",value:true},
        ]},
      { id:"ai_hotspot",code:"AI_GEN",field:"hotspot",name:"诉求热点研判",type:"ai_generate",
        params:[
          {key:"promptTemplate",label:"提示词模板",inputType:"textarea",value:"请根据以下{period}{area}的诉求热点数据，分析排名前5的诉求类型及其变化趋势：\n\n本期热点：{data.JK3008}\n上期热点：{prevData.JK3008}\n\n要求：1.指出排名变化 2.分析可能原因 3.给出处置建议。300字内。"},
          {key:"dataSources",label:"关联数据接口",inputType:"multiselect",options:["JK3008 - 诉求热点","JK4816 - 总体概况","JK0816 - 投诉举报"],value:["JK3008 - 诉求热点"]},
          {key:"modelProvider",label:"模型服务",inputType:"select",options:["Claude","GPT-4","本地模型"],value:"Claude"},
          {key:"temperature",label:"创意度",inputType:"number",value:0.3,min:0,max:1},
          {key:"maxLength",label:"最大字数",inputType:"number",value:500,min:50,max:2000},
          {key:"outputFormat",label:"输出格式",inputType:"select",options:["纯文本","带标题分段","带序号列表"],value:"带序号列表"},
          {key:"reviewRequired",label:"需人工审核",inputType:"switch",value:true},
        ]},
      { id:"ai_suggestion",code:"AI_GEN",field:"suggestion",name:"工作建议生成",type:"ai_generate",
        params:[
          {key:"promptTemplate",label:"提示词模板",inputType:"textarea",value:"基于{period}{area}的数据研判分析结果，针对以下问题给出3-5条工作建议：\n\n{data}\n\n要求：建议应具体可操作，结合数据趋势，每条建议50字内。"},
          {key:"dataSources",label:"关联数据接口",inputType:"multiselect",options:["JK4816 - 总体概况","JK3008 - 诉求热点","JK0816 - 投诉举报"],value:["JK4816 - 总体概况","JK3008 - 诉求热点"]},
          {key:"modelProvider",label:"模型服务",inputType:"select",options:["Claude","GPT-4","本地模型"],value:"Claude"},
          {key:"temperature",label:"创意度",inputType:"number",value:0.4,min:0,max:1},
          {key:"maxLength",label:"最大字数",inputType:"number",value:400,min:50,max:2000},
          {key:"outputFormat",label:"输出格式",inputType:"select",options:["纯文本","带标题分段","带序号列表"],value:"带序号列表"},
          {key:"reviewRequired",label:"需人工审核",inputType:"switch",value:true},
        ]},
    ],
  },
  {
    name: "条件控件", icon: "⚙️",
    indicators: [
      { id:"cond_has",code:"COND",field:"hasData",name:"有数据时显示",type:"condition",condType:"hasData",
        params:[
          {key:"bindIndicator",label:"关联指标",inputType:"select",options:["JK4816 - 总体概况","JK3008 - 诉求热点","JK0816 - 投诉举报"],value:""},
          {key:"fallbackText",label:"无数据提示",inputType:"text",value:"本季度暂无数据"},
        ]},
    ],
  },
];

const CHART_DATA=[
  {name:"社保统筹服务",value:35200,ratio:28.5},{name:"劳动权益",value:8600,ratio:15.2},
  {name:"住房公积金",value:4200,ratio:8.1},{name:"户政管理",value:3800,ratio:7.3},
  {name:"城市设施管理",value:3500,ratio:6.7},{name:"道路管理",value:3200,ratio:6.1},
];
const PALETTE=["#4F7CFF","#36D399","#F87272","#FBBD23","#A78BFA","#38BDF8","#FB923C","#E879A8","#22D3EE","#84CC16","#1E293B","#64748B"];

const AI_PREVIEW_TEXTS = {
  "ai_overview": "本季度广州市共受理民众诉求35,821万宗，同比增长12.5%。其中，咨询类诉求占比62.3%，仍为主要诉求类型；投诉举报类占比23.5%，较上季度略有上升。办结满意率达95.2%，保持较高水平。总体来看，诉求总量持续增长，但办理质量稳中有升，群众满意度保持良好态势。",
  "ai_hotspot": "1. 社保统筹服务（35,200宗）：连续三个季度排名第一，较上期增长8.2%，主要受退休高峰期影响。\n\n2. 劳动权益（8,600宗）：本期上升至第二位，环比增长15.3%，与季节性用工纠纷增多有关。\n\n3. 住房公积金（4,200宗）：排名稳定，但投诉类占比提升。\n\n建议：加强社保窗口服务力量，开展劳动权益专项督查，优化公积金线上办理流程。",
  "ai_suggestion": "1. 针对社保统筹服务诉求量高的情况，建议增设临时服务窗口并延长服务时间，缓解退休办理高峰压力。\n\n2. 劳动权益类诉求上升趋势明显，建议联合劳动监察部门开展用工规范专项检查。\n\n3. 住房公积金投诉类占比提升，建议优化线上提取流程并加强政策宣传。\n\n4. 办结满意率虽保持高位，建议关注重复诉求件，建立回访机制提升一次性解决率。",
};

/* ──────────── Mini Charts ──────────── */
function BarChart({data,w=300,h=150,color="#4F7CFF",showVal}){
  const max=Math.max(...data.map(d=>d.value));const bw=Math.floor((w-44)/data.length)-6;const ch=h-32;
  return(<svg width={w} height={h} style={{display:"block"}}>
    {[0,.5,1].map((r,i)=>(<g key={i}><line x1={36} x2={w-4} y1={ch-r*(ch-12)} y2={ch-r*(ch-12)} stroke="#EDF0F7" strokeWidth={.5}/><text x={32} y={ch-r*(ch-12)+3} textAnchor="end" fontSize={7} fill="#A0AAB8">{Math.round(max*r)}</text></g>))}
    {data.map((d,i)=>{const bh=(d.value/max)*(ch-12);const x=40+i*(bw+6);return(<g key={i}><rect x={x} y={ch-bh} width={bw} height={bh} rx={3} fill={color} opacity={.82}/>{showVal&&<text x={x+bw/2} y={ch-bh-4} textAnchor="middle" fontSize={7} fill="#64748B">{(d.value/1000).toFixed(1)}k</text>}<text x={x+bw/2} y={h-4} textAnchor="middle" fontSize={7.5} fill="#8894AA">{d.name.length>4?d.name.slice(0,4):d.name}</text></g>);})}
  </svg>);
}
function PieChart({data,size=150,showPct,ring}){
  const total=data.reduce((s,d)=>s+d.value,0);let cum=0;const cx=size/2,cy=size/2,r=size/2-20,ir=ring?r*0.55:0;
  return(<svg width={size} height={size} style={{display:"block"}}>
    {data.map((d,i)=>{const s=cum/total;cum+=d.value;const e=cum/total;const a1=2*Math.PI*s-Math.PI/2,a2=2*Math.PI*e-Math.PI/2;const lg=e-s>.5?1:0;const outer=`M${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} A${r},${r} 0 ${lg} 1 ${cx+r*Math.cos(a2)},${cy+r*Math.sin(a2)}`;const inner=ring?`L${cx+ir*Math.cos(a2)},${cy+ir*Math.sin(a2)} A${ir},${ir} 0 ${lg} 0 ${cx+ir*Math.cos(a1)},${cy+ir*Math.sin(a1)} Z`:`L${cx},${cy} Z`;const mid=(a1+a2)/2,lr=r*0.65;return(<g key={i}><path d={outer+inner} fill={PALETTE[i%PALETTE.length]} opacity={.82}/>{showPct&&<text x={cx+lr*Math.cos(mid)} y={cy+lr*Math.sin(mid)+3} textAnchor="middle" fontSize={7} fill="#fff" fontWeight="600">{((d.value/total)*100).toFixed(1)}%</text>}</g>);})}
  </svg>);
}
function LineChart({data,w=300,h=140,color="#36D399",showDot,smooth,showArea}){
  const max=Math.max(...data.map(d=>d.value))*1.1;const ch=h-32;const pts=data.map((d,i)=>({x:40+(i/(data.length-1))*(w-56),y:ch-(d.value/max)*(ch-12)}));let pathD="";if(smooth&&pts.length>2){pathD=`M${pts[0].x},${pts[0].y}`;for(let i=0;i<pts.length-1;i++){const cp1x=pts[i].x+(pts[i+1].x-pts[i].x)/3,cp2x=pts[i].x+2*(pts[i+1].x-pts[i].x)/3;pathD+=` C${cp1x},${pts[i].y} ${cp2x},${pts[i+1].y} ${pts[i+1].x},${pts[i+1].y}`;}}else{pathD=pts.map((p,i)=>(i===0?"M":"L")+p.x+","+p.y).join(" ");}const areaD=pathD+` L${pts[pts.length-1].x},${ch} L${pts[0].x},${ch} Z`;
  return(<svg width={w} height={h} style={{display:"block"}}>
    {[0,.5,1].map((r,i)=>(<g key={i}><line x1={36} x2={w-4} y1={ch-r*(ch-12)} y2={ch-r*(ch-12)} stroke="#EDF0F7" strokeWidth={.5}/></g>))}
    {showArea&&<path d={areaD} fill={color} opacity={.1}/>}<path d={pathD} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round"/>
    {pts.map((p,i)=>(<g key={i}>{showDot&&<circle cx={p.x} cy={p.y} r={3} fill="#fff" stroke={color} strokeWidth={2}/>}<text x={p.x} y={h-4} textAnchor="middle" fontSize={7.5} fill="#8894AA">{data[i].name.length>3?data[i].name.slice(0,3):data[i].name}</text></g>))}
  </svg>);
}

/* ──────────── Helpers ──────────── */
let uid=200; const gid=()=>`u${uid++}`;
const gp=(item,key)=>(item.params||[]).find(x=>x.key===key)?.value;

/* ──────────── Doc Tag ──────────── */
function DocTag({item,selected,onSelect,onRemove,onConfig}){
  const base={cursor:"pointer",transition:"all .15s"};

  // AI Generate type
  if(item.type==="ai_generate"){
    const prompt=gp(item,"promptTemplate")||"";
    const model=gp(item,"modelProvider")||"Claude";
    const review=gp(item,"reviewRequired");
    const previewText=AI_PREVIEW_TEXTS[item.id]||"AI 将在报告生成时根据提示词和接口数据自动生成此段内容...";
    const [showPreview,setShowPreview]=useState(false);
    const [generating,setGenerating]=useState(false);

    const handleGenPreview=e=>{e.stopPropagation();setGenerating(true);setTimeout(()=>{setGenerating(false);setShowPreview(true);},1500);};

    return(
      <div onClick={()=>onSelect(item.uid)} style={{...base,margin:"12px 0",border:selected?"2px solid #8B5CF6":"1.5px dashed #C4B5FD",borderLeft:"4px solid #8B5CF6",borderRadius:10,padding:0,background:selected?"#FAF5FF":"#FDFBFF",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"12px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",background:"linear-gradient(135deg,#FAF5FF,#F3E8FF)"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{fontSize:15}}>🤖</span>
              <span style={{fontSize:13,fontWeight:700,color:"#5B21B6"}}>{item.name}</span>
              {review&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#FEF3C7",color:"#92400E",fontWeight:600}}>需审核</span>}
            </div>
            <div style={{fontSize:11,color:"#7C3AED",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#EDE9FE",borderRadius:4,padding:"2px 6px"}}><span style={{fontSize:9}}>🧠</span>{model}</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#EDE9FE",borderRadius:4,padding:"2px 6px"}}><span style={{fontSize:9}}>📝</span>{gp(item,"maxLength")||300}字</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#EDE9FE",borderRadius:4,padding:"2px 6px"}}><span style={{fontSize:9}}>🌡</span>{gp(item,"temperature")||0.3}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:5,flexShrink:0}}>
            <Btn c="#7C3AED" bg="#EDE9FE" onClick={e=>{e.stopPropagation();onConfig(item.uid);}}>⚙ 配置</Btn>
            <Btn c="#E54D4D" bg="#FEF2F2" onClick={e=>{e.stopPropagation();onRemove(item.uid);}}>✕</Btn>
          </div>
        </div>
        {/* Prompt preview */}
        <div style={{padding:"10px 16px",borderTop:"1px solid #EDE9FE"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#6D28D9",marginBottom:4}}>提示词模板</div>
          <div style={{fontSize:11.5,color:"#4C1D95",background:"#F5F3FF",borderRadius:6,padding:"8px 10px",lineHeight:1.7,maxHeight:72,overflow:"hidden",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"pre-wrap",border:"1px solid #EDE9FE"}}>
            {prompt.length>120?prompt.slice(0,120)+"...":prompt}
          </div>
        </div>
        {/* Data sources */}
        <div style={{padding:"6px 16px 10px"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#6D28D9",marginBottom:4}}>关联数据接口</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {(gp(item,"dataSources")||[]).map((ds,i)=>(
              <span key={i} style={{fontSize:10,color:"#5B21B6",background:"#EDE9FE",borderRadius:4,padding:"2px 8px",border:"1px solid #DDD6FE"}}>📊 {ds}</span>
            ))}
          </div>
        </div>
        {/* AI Preview area */}
        <div style={{padding:"0 16px 14px"}}>
          {!showPreview?(
            <button onClick={handleGenPreview} disabled={generating} style={{width:"100%",padding:"10px",border:"1.5px dashed #C4B5FD",borderRadius:8,background:generating?"#F5F3FF":"#FDFBFF",cursor:generating?"wait":"pointer",fontSize:12,color:"#7C3AED",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
              {generating?(<><span style={{display:"inline-block",width:14,height:14,border:"2px solid #C4B5FD",borderTopColor:"#7C3AED",borderRadius:"50%",animation:"aispin .8s linear infinite"}}/>AI 正在生成预览...</>):(<>✨ 点击预览 AI 生成内容</>)}
            </button>
          ):(
            <div style={{border:"1.5px solid #C4B5FD",borderRadius:8,overflow:"hidden"}}>
              <div style={{padding:"8px 12px",background:"linear-gradient(135deg,#7C3AED,#6D28D9)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#fff",fontWeight:600}}>✨ AI 生成预览</span>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={e=>{e.stopPropagation();setShowPreview(false);setGenerating(true);setTimeout(()=>{setGenerating(false);setShowPreview(true);},1500);}} style={{fontSize:10,color:"#E9D5FF",background:"rgba(255,255,255,.15)",border:"none",borderRadius:4,padding:"3px 8px",cursor:"pointer"}}>🔄 重新生成</button>
                  <button onClick={e=>{e.stopPropagation();setShowPreview(false);}} style={{fontSize:10,color:"#E9D5FF",background:"rgba(255,255,255,.15)",border:"none",borderRadius:4,padding:"3px 8px",cursor:"pointer"}}>收起</button>
                </div>
              </div>
              <div style={{padding:"12px",fontSize:12.5,color:"#1E1B4B",lineHeight:1.9,background:"#FDFBFF",whiteSpace:"pre-wrap"}}>
                {previewText}
              </div>
              {review&&(
                <div style={{padding:"8px 12px",borderTop:"1px solid #EDE9FE",background:"#FFF7ED",display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#92400E"}}>
                  <span>⚠️</span> 此内容需人工审核确认后才会填入正式报告
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chart type
  if(item.type==="chart"){
    const title=gp(item,"chartTitle")||item.name;const color=gp(item,"chartColor")||"#4F7CFF";const maxItems=gp(item,"maxItems")||6;
    const showVal=gp(item,"showValue")!==false;const showPct=gp(item,"showPercent")!==false;const ring=gp(item,"innerRadius")===true;
    const showDot=gp(item,"showDot")!==false;const smooth=gp(item,"smooth")===true;const showArea=gp(item,"showArea")===true;
    const cData=CHART_DATA.slice(0,maxItems);
    return(
      <div onClick={()=>onSelect(item.uid)} style={{...base,margin:"12px 0",border:selected?"2px solid #4F7CFF":"1.5px dashed #C5CEE0",borderRadius:10,padding:"14px 16px",background:selected?"#F5F8FF":"#FAFBFD"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:700,color:"#3D5176"}}>📈 {title}</span>
          <div style={{display:"flex",gap:5}}>
            <Btn c="#4F7CFF" bg="#EEF2FF" onClick={e=>{e.stopPropagation();onConfig(item.uid);}}>⚙ 配置</Btn>
            <Btn c="#E54D4D" bg="#FEF2F2" onClick={e=>{e.stopPropagation();onRemove(item.uid);}}>✕</Btn>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",background:"#fff",borderRadius:8,padding:"8px 4px",border:"1px solid #EEF1F6"}}>
          {item.chartType==="bar"&&<BarChart data={cData} color={color} showVal={showVal}/>}
          {item.chartType==="pie"&&<PieChart data={cData} showPct={showPct} ring={ring}/>}
          {item.chartType==="line"&&<LineChart data={cData} color={color} showDot={showDot} smooth={smooth} showArea={showArea}/>}
        </div>
        <ParamBadges item={item}/>
      </div>
    );
  }

  // Condition type
  if(item.type==="condition"){
    return(
      <div onClick={()=>onSelect(item.uid)} style={{...base,margin:"10px 0",border:selected?"2px solid #F59E0B":"1.5px dashed #E5D5A0",borderLeft:"4px solid #F59E0B",borderRadius:8,padding:"12px 14px",background:selected?"#FFFBEB":"#FFFEF5"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:12,fontWeight:700,color:"#92710C"}}>⚙️ 条件：{item.name}</span>
          <div style={{display:"flex",gap:5}}>
            <Btn c="#D97706" bg="#FEF3C7" onClick={e=>{e.stopPropagation();onConfig(item.uid);}}>⚙ 配置</Btn>
            <Btn c="#E54D4D" bg="#FEF2F2" onClick={e=>{e.stopPropagation();onRemove(item.uid);}}>✕</Btn>
          </div>
        </div>
        <div style={{fontSize:11.5,color:"#8B7A3A"}}>关联指标：{gp(item,"bindIndicator")||"未配置"}</div>
      </div>
    );
  }

  // Inline tag (text/number/percent/date)
  return(
    <span onClick={()=>onSelect(item.uid)} style={{...base,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px 2px 7px",margin:"0 3px",background:selected?"#4F7CFF":"#EEF2FF",color:selected?"#fff":"#3D5176",borderRadius:5,fontSize:13,fontWeight:600,border:selected?"1.5px solid #4F7CFF":"1.5px solid #D0D9EF",verticalAlign:"middle",lineHeight:"22px",whiteSpace:"nowrap"}}>
      <span style={{fontSize:10,opacity:.65}}>{item.type==="number"?"🔢":item.type==="percent"?"📊":item.type==="date"?"📅":"📝"}</span>
      {item.name}{item.unit&&<span style={{fontSize:10,opacity:.55,marginLeft:2}}>({item.unit})</span>}
      <span onClick={e=>{e.stopPropagation();onConfig(item.uid);}} style={{marginLeft:4,fontSize:9,opacity:selected?.9:.4,cursor:"pointer"}}>⚙</span>
      <span onClick={e=>{e.stopPropagation();onRemove(item.uid);}} style={{marginLeft:2,fontSize:9,opacity:selected?.8:.35,cursor:"pointer"}}>✕</span>
    </span>
  );
}

const Btn=({c,bg,onClick,children})=>(<button onClick={onClick} style={{background:bg,border:"none",borderRadius:5,padding:"3px 9px",fontSize:11,color:c,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>{children}</button>);
function ParamBadges({item}){
  const ds=gp(item,"dataSource");if(!ds&&!item.params?.length)return null;
  return(<div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>
    {(item.params||[]).filter(p=>p.value!==""&&p.value!==undefined&&p.value!==null&&p.key!=="promptTemplate").slice(0,4).map(p=>(
      <span key={p.key} style={{fontSize:10,color:"#64748B",background:"#F1F5F9",borderRadius:4,padding:"2px 6px",display:"inline-flex",alignItems:"center",gap:3}}>
        <span style={{color:"#94A3B8"}}>{p.label}:</span>
        <span style={{fontWeight:500,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{typeof p.value==="boolean"?(p.value?"是":"否"):Array.isArray(p.value)?p.value.length+"项":String(p.value)}</span>
      </span>
    ))}
  </div>);
}

/* ──────────── Config Panel ──────────── */
function ConfigPanel({item,onUpdate,onClose}){
  const [params,setParams]=useState(()=>(item.params||[]).map(p=>({...p})));
  const [activeTab,setActiveTab]=useState("params");
  const set=(key,val)=>setParams(ps=>ps.map(p=>p.key===key?{...p,value:val}:p));
  const get=key=>params.find(p=>p.key===key)?.value;
  const handleSave=()=>{onUpdate(item.uid,{params});onClose();};

  const isAI=item.type==="ai_generate";

  return(
    <div style={{position:"absolute",right:0,top:0,bottom:0,width:360,background:"#fff",borderLeft:"1px solid #E5E9F0",zIndex:20,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,.07)"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #EEF1F6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#1E293B",display:"flex",alignItems:"center",gap:6}}>
            {isAI&&<span style={{fontSize:14}}>🤖</span>}指标参数配置
          </div>
          <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{item.name} ({item.code})</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#94A3B8",padding:4}}>✕</button>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #EEF1F6"}}>
        {[{k:"params",l:isAI?"提示词与模型":"接口参数"},{k:"display",l:"显示设置"},{k:"advanced",l:"高级"}].map(t=>(
          <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{flex:1,padding:"10px 0",border:"none",borderBottom:activeTab===t.k?`2px solid ${isAI?"#7C3AED":"#4F7CFF"}`:"2px solid transparent",background:"none",cursor:"pointer",fontSize:12,fontWeight:activeTab===t.k?700:400,color:activeTab===t.k?(isAI?"#7C3AED":"#4F7CFF"):"#64748B"}}>{t.l}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
        <div style={{background:isAI?"#F5F3FF":"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:16,border:`1px solid ${isAI?"#EDE9FE":"#EEF1F6"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:600,color:"#334155"}}>{item.name}</span>
            <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:isAI?"#EDE9FE":item.type==="chart"?"#EEF2FF":"#ECFDF5",color:isAI?"#7C3AED":item.type==="chart"?"#4F7CFF":"#059669",fontWeight:600}}>
              {isAI?"AI 生成":item.type==="chart"?"图表":item.type==="condition"?"条件":"文本"}
            </span>
          </div>
        </div>

        {activeTab==="params"&&(<>
          {params.map(p=>(
            <div key={p.key} style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                {p.label}
                {p.key==="promptTemplate"&&<span style={{fontSize:9,color:"#7C3AED",fontWeight:400}}>核心配置</span>}
              </div>

              {p.inputType==="select"&&(
                <select value={get(p.key)||""} onChange={e=>set(p.key,e.target.value)} style={inputS}><option value="">请选择...</option>{(p.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>
              )}
              {p.inputType==="text"&&(
                <input value={get(p.key)||""} onChange={e=>set(p.key,e.target.value)} placeholder={`请输入${p.label}`} style={inputS}/>
              )}
              {p.inputType==="textarea"&&(
                <div>
                  <textarea value={get(p.key)||""} onChange={e=>set(p.key,e.target.value)} placeholder="输入提示词模板..." rows={8} style={{...inputS,resize:"vertical",minHeight:140,lineHeight:1.7,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
                  <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                    {["{data}","{data.JK4816}","{data.JK3008}","{period}","{area}","{prevData}"].map(v=>(
                      <button key={v} onClick={()=>{const cur=get(p.key)||"";set(p.key,cur+v);}} style={{fontSize:10,color:"#7C3AED",background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontFamily:"monospace"}}>{v}</button>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"#94A3B8",marginTop:4}}>点击上方变量快速插入到提示词中</div>
                </div>
              )}
              {p.inputType==="number"&&(
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" value={get(p.key)??""} onChange={e=>set(p.key,Number(e.target.value))} min={p.min} max={p.max} step={p.max<=1?0.1:1} style={{...inputS,width:80,marginBottom:0}}/>
                  {p.min!==undefined&&<span style={{fontSize:10,color:"#94A3B8"}}>{p.min}-{p.max}</span>}
                </div>
              )}
              {p.inputType==="switch"&&(
                <div onClick={()=>set(p.key,!get(p.key))} style={{width:44,height:24,borderRadius:12,background:get(p.key)?"#7C3AED":"#CBD5E1",cursor:"pointer",padding:2,transition:"all .2s",position:"relative"}}>
                  <div style={{width:20,height:20,borderRadius:10,background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.15)",transition:"all .2s",transform:get(p.key)?"translateX(20px)":"translateX(0)"}}/>
                </div>
              )}
              {p.inputType==="color"&&(
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PALETTE.map(c=>(<div key={c} onClick={()=>set(p.key,c)} style={{width:26,height:26,borderRadius:7,background:c,cursor:"pointer",border:get(p.key)===c?"3px solid #1E293B":"2px solid transparent"}}/>))}</div>
              )}
              {p.inputType==="multiselect"&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{(p.options||[]).map(o=>{const sel=(get(p.key)||[]).includes(o);return<button key={o} onClick={()=>{const cur=get(p.key)||[];set(p.key,sel?cur.filter(x=>x!==o):[...cur,o]);}} style={{padding:"5px 10px",borderRadius:6,border:sel?"1.5px solid #7C3AED":"1.5px solid #E2E8F0",background:sel?"#EDE9FE":"#fff",color:sel?"#7C3AED":"#64748B",cursor:"pointer",fontSize:11.5,fontWeight:sel?600:400}}>{o}</button>;})}</div>
              )}
            </div>
          ))}
        </>)}

        {activeTab==="display"&&(<>
          <Lbl>显示名称</Lbl><input defaultValue={item.name} style={inputS}/>
          {isAI&&<><Lbl>占位符样式</Lbl><select defaultValue="purple" style={inputS}><option value="purple">紫色 AI 区块</option><option value="ghost">虚线占位框</option><option value="text">纯文本占位</option></select></>}
          <Lbl>字体大小</Lbl><select defaultValue="14" style={inputS}><option value="12">12px</option><option value="14">14px</option><option value="16">16px</option></select>
        </>)}

        {activeTab==="advanced"&&(<>
          <Lbl>模板表达式</Lbl>
          <div style={{background:"#1E293B",borderRadius:8,padding:"12px 14px",fontFamily:"monospace",fontSize:11.5,color:"#A5F3FC",lineHeight:1.7,wordBreak:"break-all",marginBottom:14}}>
            {isAI?`{{ai_generate("${item.field}",prompt="${(gp(item,"promptTemplate")||"").slice(0,40)}...",model="${gp(item,"modelProvider")||"claude"}")}}`
            :item.type==="chart"?`{{put("${item.code}",data("${gp(item,"dataSource")||"..."}"))}}`
            :`{{${item.code}.get("${item.field}")}}`}
          </div>
          {isAI&&<><Lbl>系统提示词（可选）</Lbl><textarea defaultValue="你是一位政府数据分析师，擅长撰写简洁、客观、正式的数据研判报告。" rows={3} style={{...inputS,resize:"vertical",fontSize:12,lineHeight:1.6}}/></>}
          <Lbl>缓存策略</Lbl><select defaultValue="none" style={inputS}><option value="none">不缓存（每次重新生成）</option><option value="1h">缓存1小时</option><option value="24h">缓存24小时</option></select>
          <Lbl>空值处理</Lbl><select defaultValue="placeholder" style={inputS}><option value="placeholder">显示占位提示</option><option value="hide">隐藏该段</option><option value="custom">自定义文本</option></select>
        </>)}
      </div>

      <div style={{padding:"14px 18px",borderTop:"1px solid #EEF1F6",display:"flex",gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:"10px 0",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:13,color:"#64748B"}}>取消</button>
        <button onClick={handleSave} style={{flex:2,padding:"10px 0",border:"none",borderRadius:8,background:isAI?"linear-gradient(135deg,#7C3AED,#6D28D9)":"linear-gradient(135deg,#4F7CFF,#6C63FF)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:`0 2px 8px ${isAI?"rgba(124,58,237,.3)":"rgba(79,124,255,.3)"}`}}>保存配置</button>
      </div>
    </div>
  );
}

const Lbl=({children})=><div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:6,marginTop:12}}>{children}</div>;
const inputS={width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",borderRadius:7,fontSize:12.5,color:"#1E293B",marginBottom:0,outline:"none",boxSizing:"border-box",background:"#FAFBFD"};

/* ──────────── Initial Doc ──────────── */
const INIT_DOC=[
  {uid:"p1",type:"heading",level:1,content:"数据研判季报",items:[]},
  {uid:"p2",type:"paragraph",content:"",items:[]},
  {uid:"p5",type:"heading",level:2,content:"本期导读",items:[]},
  {uid:"p6",type:"heading",level:3,content:"★ 总体概况",items:[]},
  {uid:"p7",type:"paragraph",content:"拖拽左侧指标到此处插入，点击 ⚙ 可配置接口参数...",items:[]},
  {uid:"p8",type:"heading",level:3,content:"★ 诉求热点",items:[]},
  {uid:"p9",type:"paragraph",content:"拖拽图表或 AI 生成类指标到此处。",items:[]},
  {uid:"pA",type:"heading",level:3,content:"★ 研判分析与建议",items:[]},
  {uid:"pB",type:"paragraph",content:"拖拽 🤖 AI 智能生成类指标到此处，配置提示词后可预览 AI 生成的分析内容。",items:[]},
];

/* ──────────── Main App ──────────── */
export default function App(){
  const [doc,setDoc]=useState(INIT_DOC);
  const [search,setSearch]=useState("");
  const [expanded,setExpanded]=useState(INDICATOR_CATEGORIES.map(c=>c.name));
  const [selected,setSelected]=useState(null);
  const [configUid,setConfigUid]=useState(null);
  const [dragItem,setDragItem]=useState(null);
  const [dropUid,setDropUid]=useState(null);
  const [toast,setToast]=useState(null);

  const flash=m=>{setToast(m);setTimeout(()=>setToast(null),2200);};
  const toggle=n=>setExpanded(p=>p.includes(n)?p.filter(x=>x!==n):[...p,n]);
  const filtered=INDICATOR_CATEGORIES.map(c=>({...c,indicators:c.indicators.filter(i=>i.name.includes(search)||i.code.includes(search))})).filter(c=>c.indicators.length);

  const addItem=(parUid,indicator)=>{
    const it={...indicator,uid:gid(),params:(indicator.params||[]).map(p=>({...p,value:Array.isArray(p.value)?[...p.value]:p.value}))};
    if(parUid==="__bottom__"){setDoc(p=>[...p,{uid:gid(),type:"paragraph",content:"",items:[it]}]);}
    else{setDoc(p=>p.map(b=>b.uid===parUid?{...b,items:[...b.items,it]}:b));}
    flash(`已插入「${indicator.name}」`);
  };
  const removeItem=uid=>{setDoc(p=>p.map(b=>({...b,items:b.items.filter(i=>i.uid!==uid)})));if(selected===uid)setSelected(null);if(configUid===uid)setConfigUid(null);};
  const updateItem=(uid,updates)=>{setDoc(p=>p.map(b=>({...b,items:b.items.map(i=>i.uid===uid?{...i,...updates}:i)})));flash("配置已保存");};

  let cfgItem=null;
  if(configUid)for(const b of doc){const f=b.items.find(i=>i.uid===configUid);if(f){cfgItem=f;break;}}

  const typeColor={text:"#36D399",number:"#36D399",percent:"#36D399",date:"#36D399",chart:"#4F7CFF",table:"#8B5CF6",condition:"#F59E0B",ai_generate:"#7C3AED"};
  const typeLabel={text:"文本",number:"数值",percent:"百分比",date:"日期",chart:"图表",table:"表格",condition:"条件",ai_generate:"AI"};

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Noto Sans SC','PingFang SC',-apple-system,sans-serif",background:"#F0F2F5",overflow:"hidden"}}>

      {/* Left Panel */}
      <div style={{width:280,background:"#fff",borderRight:"1px solid #E5E9F0",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"16px 14px 12px"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1E293B",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#4F7CFF,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff"}}>📊</span>
            指标库
          </div>
          <div style={{display:"flex",alignItems:"center",background:"#F5F7FA",borderRadius:8,padding:"0 10px",border:"1.5px solid #E5E9F0"}}>
            <span style={{fontSize:14,color:"#94A3B8"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索指标..." style={{flex:1,border:"none",background:"none",padding:"8px",fontSize:12,outline:"none",color:"#334155"}}/>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
          {filtered.map(cat=>(
            <div key={cat.name}>
              <div onClick={()=>toggle(cat.name)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",cursor:"pointer",fontSize:12.5,fontWeight:600,color:cat.name==="AI 智能生成"?"#5B21B6":"#475569",userSelect:"none",background:cat.name==="AI 智能生成"?"#FAF5FF":"transparent"}}>
                <span style={{fontSize:9,transition:"transform .2s",transform:expanded.includes(cat.name)?"rotate(90deg)":"rotate(0)"}}>▶</span>
                <span>{cat.icon}</span><span>{cat.name}</span>
                <span style={{marginLeft:"auto",fontSize:10,color:cat.name==="AI 智能生成"?"#7C3AED":"#94A3B8",background:cat.name==="AI 智能生成"?"#EDE9FE":"#F1F5F9",borderRadius:10,padding:"1px 7px"}}>{cat.indicators.length}</span>
              </div>
              {expanded.includes(cat.name)&&cat.indicators.map(ind=>(
                <div key={ind.id} draggable onDragStart={e=>{setDragItem(ind);e.dataTransfer.effectAllowed="copy";}}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px 7px 34px",cursor:"grab",fontSize:12,color:ind.type==="ai_generate"?"#4C1D95":"#334155",borderLeft:"3px solid transparent",transition:"background .1s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=ind.type==="ai_generate"?"#F5F3FF":"#F5F8FF";e.currentTarget.style.borderLeftColor=typeColor[ind.type];}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderLeftColor="transparent";}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:typeColor[ind.type],flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500}}>{ind.name}</div>
                    <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>{ind.code} · {(ind.params||[]).length}个参数</div>
                  </div>
                  <span style={{fontSize:10,color:typeColor[ind.type],padding:"1px 6px",background:ind.type==="ai_generate"?"#EDE9FE":"#F8FAFC",borderRadius:4,flexShrink:0,fontWeight:ind.type==="ai_generate"?600:400}}>
                    {typeLabel[ind.type]}
                  </span>
                  <span style={{fontSize:13,color:"#CBD5E1",cursor:"grab"}}>⠿</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{padding:"10px 14px",borderTop:"1px solid #EEF1F6",background:"#F8FAFC",fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
          💡 拖拽指标到文档中 → 点击 ⚙ 配置参数<br/>
          🤖 AI 指标支持在线预览生成内容
        </div>
      </div>

      {/* Center: Document */}
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 20px",background:"#fff",borderBottom:"1px solid #E5E9F0"}}>
          <div style={{display:"flex",gap:2}}>
            {["B","I","U"].map(b=>(<button key={b} style={{width:30,height:30,border:"1px solid #E2E8F0",borderRadius:6,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:b==="B"?700:400,fontStyle:b==="I"?"italic":"normal",textDecoration:b==="U"?"underline":"none",color:"#475569",display:"flex",alignItems:"center",justifyContent:"center"}}>{b}</button>))}
          </div>
          <div style={{width:1,height:20,background:"#E5E9F0"}}/>
          <select style={selS}><option>正文</option><option>标题 1</option><option>标题 2</option></select>
          <select style={selS}><option>微软雅黑</option><option>宋体</option></select>
          <div style={{flex:1}}/>
          <button style={{padding:"7px 14px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:12,color:"#475569"}}>👁 预览</button>
          <button style={{padding:"7px 16px",border:"none",borderRadius:8,background:"linear-gradient(135deg,#4F7CFF,#6C63FF)",cursor:"pointer",fontSize:12,color:"#fff",fontWeight:600,boxShadow:"0 2px 8px rgba(79,124,255,.3)"}}>💾 保存模板</button>
        </div>

        {/* Doc */}
        <div style={{flex:1,overflow:"auto",padding:"24px",display:"flex",justifyContent:"center"}}>
          <div style={{width:720,minHeight:950,background:"#fff",borderRadius:2,boxShadow:"0 1px 8px rgba(0,0,0,.08),0 0 0 1px rgba(0,0,0,.04)",padding:"56px 64px"}}>
            {doc.map(block=>{
              const isDrop=dropUid===block.uid;
              const wrap={padding:"4px 6px",borderRadius:6,transition:"all .15s",border:isDrop?"2px dashed #4F7CFF":"2px solid transparent",background:isDrop?"#F5F8FF":"transparent",marginBottom:2};
              const dh={onDragOver:e=>{e.preventDefault();e.dataTransfer.dropEffect="copy";setDropUid(block.uid);},onDragLeave:()=>setDropUid(null),onDrop:e=>{e.preventDefault();setDropUid(null);if(dragItem){addItem(block.uid,dragItem);setDragItem(null);}}};
              const items=block.items.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:2,marginTop:4}}>
                  {block.items.map(it=>(<DocTag key={it.uid} item={it} selected={selected===it.uid} onSelect={u=>setSelected(u===selected?null:u)} onRemove={removeItem} onConfig={setConfigUid}/>))}
                </div>
              );
              if(block.type==="heading"){
                const sz={1:22,2:17,3:15}[block.level]||16;
                return(<div key={block.uid} style={wrap} {...dh}>
                  <div style={{fontSize:sz,fontWeight:700,color:"#1E293B",lineHeight:1.6,borderBottom:block.level<=2?"1.5px solid #E54D4D":"none",paddingBottom:block.level<=2?6:0,marginTop:block.level===1?0:16,marginBottom:6,textAlign:block.level===1?"center":"left"}}>{block.content}</div>
                  {items}
                </div>);
              }
              return(<div key={block.uid} style={wrap} {...dh}>
                <div style={{fontSize:14,color:block.content&&!block.items.length?"#94A3B8":"#334155",lineHeight:2,minHeight:28}}>
                  {block.items.length?<span>{block.items.map(it=>(<DocTag key={it.uid} item={it} selected={selected===it.uid} onSelect={u=>setSelected(u===selected?null:u)} onRemove={removeItem} onConfig={setConfigUid}/>))}</span>:(block.content||"\u00A0")}
                </div>
              </div>);
            })}
            <div style={{minHeight:180,borderRadius:8,border:dropUid==="__bottom__"?"2px dashed #4F7CFF":"2px dashed transparent",background:dropUid==="__bottom__"?"#F5F8FF":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
              onDragOver={e=>{e.preventDefault();setDropUid("__bottom__");}}
              onDragLeave={()=>setDropUid(null)}
              onDrop={e=>{e.preventDefault();setDropUid(null);if(dragItem){addItem("__bottom__",dragItem);setDragItem(null);}}}>
              {dragItem&&<span style={{fontSize:12,color:"#94A3B8"}}>释放到此处添加新段落</span>}
            </div>
          </div>
        </div>

        {cfgItem&&<ConfigPanel item={cfgItem} onUpdate={updateItem} onClose={()=>setConfigUid(null)}/>}

        {toast&&(<div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1E293B",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",zIndex:30,animation:"fadeIn .2s ease"}}>✅ {toast}</div>)}
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes aispin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#D0D5DD;border-radius:3px}::-webkit-scrollbar-track{background:transparent}
        input:focus,select:focus,textarea:focus{border-color:#7C3AED!important}
      `}</style>
    </div>
  );
}

const selS={border:"1px solid #E2E8F0",borderRadius:6,padding:"5px 8px",fontSize:12,color:"#475569",background:"#fff"};
