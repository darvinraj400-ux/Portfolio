const DIAG_SCRIPT = `(function(){
var query=window.location.search||"";
if(!/(?:^|[?&])diag=1(?:&|$)/.test(query))return;
if(window.__stage93DiagBooted)return;
window.__stage93DiagBooted=true;

var trace=[];
window.__stage93Trace=trace;
var errors=[];
var sent=0,failed=0,longTasks=0,maxLongTask=0;
var gl2=null,gl1=null,firstGLReported=false;

function note(event){
  trace.push({at:Math.round(performance.now()),event:String(event)});
  if(trace.length>200)trace.splice(0,trace.length-200);
}
function pushError(kind,message){
  errors.push({at:Math.round(performance.now()),kind:kind,message:String(message).slice(0,900)});
  if(errors.length>40)errors.shift();
}
window.addEventListener("error",function(event){
  var target=event.target;
  if(target&&target!==window&&target.tagName){
    if(target.tagName==="SCRIPT"||target.tagName==="LINK"){
      pushError("resource",target.tagName+" "+(target.src||target.href||""));
    }
    return;
  }
  pushError("error",(event.message||"unknown")+" @ "+(event.filename||"?")+":"+(event.lineno||0));
},true);
window.addEventListener("unhandledrejection",function(event){
  var reason=event.reason;
  pushError("rejection",(reason&&(reason.stack||reason.message))||reason||"unknown");
});
var originalConsoleError=console.error;
console.error=function(){
  var parts=[];
  for(var i=0;i<arguments.length;i+=1){
    var value=arguments[i];
    if(value&&value.stack)parts.push(value.stack);
    else if(typeof value==="string")parts.push(value);
    else{try{parts.push(JSON.stringify(value));}catch(e){parts.push(String(value));}}
  }
  pushError("console",parts.join(" "));
  return originalConsoleError.apply(console,arguments);
};
try{
  new PerformanceObserver(function(list){
    longTasks+=list.getEntries().length;
    var entries=list.getEntries();
    for(var i=0;i<entries.length;i+=1){
      if(entries[i].duration>maxLongTask)maxLongTask=Math.round(entries[i].duration);
    }
  }).observe({entryTypes:["longtask"]});
}catch(e){}

function media(name){
  try{return window.matchMedia(name).matches;}catch(e){return null;}
}
function readStorage(kind,key){
  try{return window[kind].getItem(key);}catch(e){return "ERR";}
}
function storageKeys(kind){
  var out={};
  try{
    var store=window[kind];
    for(var i=0;i<store.length&&i<30;i+=1){
      var key=store.key(i);
      if(key&&key.indexOf("darvin")===0)out[key]=String(store.getItem(key)).slice(0,80);
    }
  }catch(e){out.error=String(e);}
  return out;
}
function probeGL(kind){
  var out={kind:kind,ok:false,error:null,creationMessages:[]};
  try{
    var canvas=document.createElement("canvas");
    canvas.width=64;
    canvas.height=64;
    canvas.addEventListener("webglcontextcreationerror",function(event){
      out.creationMessages.push(event.statusMessage||"unknown");
    });
    var attrs={alpha:true,antialias:true,powerPreference:"high-performance",stencil:false};
    var gl=canvas.getContext(kind,attrs);
    if(!gl){out.error="getContext returned null";return out;}
    out.ok=true;
    out.lost=gl.isContextLost();
    out.version=gl.getParameter(gl.VERSION);
    out.vendor=gl.getParameter(gl.VENDOR);
    out.renderer=gl.getParameter(gl.RENDERER);
    var debugInfo=gl.getExtension("WEBGL_debug_renderer_info");
    if(debugInfo){
      out.unmaskedVendor=gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      out.unmaskedRenderer=gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    out.maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    out.maxRenderbufferSize=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    var dims=gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    out.maxViewport=dims?Array.prototype.slice.call(dims):null;
    out.contextAttributes=gl.getContextAttributes();
    gl.clearColor(0.2,0.8,0.2,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var pixel=new Uint8Array(4);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    out.pixel=Array.prototype.slice.call(pixel);
    var lose=gl.getExtension("WEBGL_lose_context");
    if(lose)lose.loseContext();
  }catch(error){
    out.error=String(error&&(error.message||error));
  }
  return out;
}
function boot(){
  var nav=null;
  try{
    var entries=performance.getEntriesByType("navigation");
    if(entries&&entries[0]){
      nav={
        type:entries[0].type,
        domContentLoaded:Math.round(entries[0].domContentLoadedEventEnd),
        load:Math.round(entries[0].loadEventEnd),
        transferSize:entries[0].transferSize
      };
    }
  }catch(e){}
  return {
    href:window.location.href,
    ua:navigator.userAgent,
    brands:navigator.userAgentData&&navigator.userAgentData.brands?navigator.userAgentData.brands.map(function(b){return b.brand+" "+b.version;}).join(", "):null,
    mobile:navigator.userAgentData?navigator.userAgentData.mobile:null,
    platform:navigator.platform,
    vendor:navigator.vendor,
    language:navigator.language,
    dpr:window.devicePixelRatio,
    viewport:window.innerWidth+"x"+window.innerHeight,
    screen:window.screen.width+"x"+window.screen.height+"@"+window.screen.colorDepth,
    orientation:(window.screen.orientation&&window.screen.orientation.type)||null,
    visualViewport:window.visualViewport?window.visualViewport.width+"x"+window.visualViewport.height+"@"+window.visualViewport.scale:null,
    reduced:media("(prefers-reduced-motion: reduce)"),
    dark:media("(prefers-color-scheme: dark)"),
    coarse:media("(pointer: coarse)"),
    hover:media("(hover: hover)"),
    touchPoints:navigator.maxTouchPoints,
    online:navigator.onLine,
    connection:navigator.connection?String(navigator.connection.effectiveType)+" down="+String(navigator.connection.downlink)+" rtt="+String(navigator.connection.rtt):null,
    memory:navigator.deviceMemory||null,
    cores:navigator.hardwareConcurrency||null,
    jsHeap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,
    theme:document.documentElement.getAttribute("data-theme"),
    motionAttr:document.documentElement.getAttribute("data-motion"),
    nav:nav,
    local:storageKeys("localStorage"),
    session:storageKeys("sessionStorage")
  };
}
function state(){
  var stage=document.querySelector("[data-render]");
  var intro=document.getElementById("calibration-intro");
  var counts={};
  var nodes=document.querySelectorAll("[data-scramble-state]");
  for(var i=0;i<nodes.length;i+=1){
    var key=nodes[i].getAttribute("data-scramble-state")||"null";
    counts[key]=(counts[key]||0)+1;
  }
  var canvas=document.querySelector("[data-render] canvas")||document.querySelector("canvas");
  var layer=canvas&&canvas.parentElement;
  return {
    render:stage?stage.getAttribute("data-render"):null,
    static:stage?stage.getAttribute("data-static"):null,
    reducedAttr:stage?stage.getAttribute("data-reduced"):null,
    profile:stage?stage.getAttribute("data-profile"):null,
    motion:document.documentElement.getAttribute("data-motion"),
    theme:document.documentElement.getAttribute("data-theme"),
    introAttr:document.documentElement.hasAttribute("data-intro"),
    introDismissed:intro?intro.getAttribute("data-dismissed"):null,
    introDisplay:intro?getComputedStyle(intro).display:null,
    canvases:document.querySelectorAll("canvas").length,
    canvas:canvas?{w:canvas.width,h:canvas.height,cw:canvas.clientWidth,ch:canvas.clientHeight}:null,
    canvasLayerOpacity:layer?getComputedStyle(layer).opacity:null,
    scramble:counts,
    scrollY:Math.round(window.scrollY),
    docHeight:document.documentElement.scrollHeight
  };
}
function payload(stage){
  return {
    v:1,
    stage:stage,
    sinceNav:Math.round(performance.now()),
    boot:boot(),
    gl:{webgl2:gl2,webgl1:gl1},
    state:state(),
    longTasks:longTasks,
    maxLongTask:maxLongTask,
    trace:trace.slice(-120),
    errors:errors.slice(-25)
  };
}
function send(stage){
  if(!gl1&&!gl2){
    gl2=probeGL("webgl2");
    gl1=probeGL("webgl");
    note("gl:probed");
  }
  var body;
  try{body=JSON.stringify(payload(stage));}catch(e){body=JSON.stringify({v:1,stage:stage,serializeError:String(e)});}
  function ok(){sent+=1;render();}
  function fail(){failed+=1;render();}
  try{
    if(window.fetch){
      fetch("/api/diag",{method:"POST",headers:{"content-type":"application/json"},body:body,keepalive:true}).then(function(response){response.ok?ok():fail();},fail);
      return;
    }
  }catch(e){}
  try{
    if(navigator.sendBeacon&&navigator.sendBeacon("/api/diag",new Blob([body],{type:"application/json"}))){ok();return;}
  }catch(e){}
  fail();
}
function glLine(gl){
  if(!gl)return "pending";
  if(!gl.ok)return "FAIL "+String(gl.error||"")+" "+gl.creationMessages.join(";");
  return "ok "+String(gl.unmaskedRenderer||gl.renderer||"")+" maxTex="+gl.maxTextureSize+" pixel="+JSON.stringify(gl.pixel)+" lost="+gl.lost;
}
function panel(){
  var el=document.getElementById("stage93-diag");
  if(!el){
    if(!document.body)return null;
    el=document.createElement("div");
    el.id="stage93-diag";
    el.setAttribute("role","status");
    el.style.cssText="position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;max-height:55vh;overflow:auto;background:rgba(0,0,0,0.93);color:#9f9;border:1px solid #3a3;padding:8px;font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word;pointer-events:auto;";
    document.body.appendChild(el);
  }
  return el;
}
function render(){
  var el=panel();
  if(!el)return;
  var info=boot();
  var current=state();
  var lines=[
    "STAGE 9.3 DIAG  sent="+sent+" failed="+failed,
    "UA: "+info.ua,
    "reduced="+info.reduced+"  motionAttr="+info.motionAttr+"  dpr="+info.dpr,
    "viewport="+info.viewport+" screen="+info.screen,
    "webgl2: "+glLine(gl2),
    "webgl1: "+glLine(gl1),
    "render="+current.render+" static="+current.static+" canvases="+current.canvases+" layerOpacity="+current.canvasLayerOpacity,
    "intro attr="+current.introAttr+" dismissed="+current.introDismissed+" display="+current.introDisplay,
    "storage: start="+readStorage("sessionStorage","darvin-intro-start-v1")+" complete="+readStorage("localStorage","darvin-intro-complete-v1"),
    "scramble="+JSON.stringify(current.scramble),
    "gl ready="+(firstGLReported?"yes":"no")+" longTasks="+longTasks+" max="+maxLongTask+"ms",
    "errors="+errors.length+(errors[0]?" first="+errors[0].kind+": "+errors[0].message:""),
    "trace: "+(trace.length?trace.map(function(t){return t.at+"ms "+t.event;}).join(" | "):"none")
  ];
  el.textContent=lines.join("\\n");
}
function watch(){
  var root=document.documentElement;
  try{
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i+=1){
        var target=records[i].target;
        if(target===root){
          note("attr:"+records[i].attributeName+"="+root.getAttribute(records[i].attributeName));
        }else if(target&&target.getAttribute){
          note("stage:"+records[i].attributeName+"="+target.getAttribute(records[i].attributeName));
        }
      }
    }).observe(root,{attributes:true,attributeFilter:["data-intro","data-motion","data-theme"]});
  }catch(e){}
  var stage=document.querySelector("[data-render]");
  if(stage){
    try{
      new MutationObserver(function(records){
        for(var i=0;i<records.length;i+=1){
          var name=records[i].attributeName;
          note("stage:"+name+"="+stage.getAttribute(name));
          if(name==="data-render"&&stage.getAttribute(name)==="webgl"&&!firstGLReported){
            firstGLReported=true;
          }
        }
      }).observe(stage,{attributes:true,attributeFilter:["data-render","data-static","data-reduced","data-profile"]});
    }catch(e){}
  }
  var sawRunning=false,sawDone=false;
  try{
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i+=1){
        var value=records[i].target.getAttribute&&records[i].target.getAttribute("data-scramble-state");
        if(value==="running"&&!sawRunning){sawRunning=true;note("scramble:first-running");}
        if(value==="done"&&!sawDone){sawDone=true;note("scramble:first-done");}
      }
    }).observe(document.body,{subtree:true,attributes:true,attributeFilter:["data-scramble-state"]});
  }catch(e){}
  render();
}
function start(){
  note("diag:start");
  watch();
  send("dom");
  window.setTimeout(function(){send("t2");render();},2000);
  window.setTimeout(function(){send("t6");render();},6000);
  window.setTimeout(function(){send("t12");render();},12000);
  window.setTimeout(function(){send("t20");render();},20000);
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="hidden"){send("hidden");}
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);
else start();
})();`;

export default function DeviceDiag() {
  return (
    <script
      id="stage93-diag-script"
      dangerouslySetInnerHTML={{ __html: DIAG_SCRIPT }}
    />
  );
}