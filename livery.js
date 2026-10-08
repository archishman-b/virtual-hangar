// Procedural liveries: one atlas with four projections (top, bottom, left side, right side), drawn in metres.
const SCHEMES={
 usaf:{base:'#77746D',radome:'#7F7C76',slime:'#C9C68C',code:'EG',serial:'0750',wing:'USAF'},
 usmc:{base:'#5F6871',radome:'#69727B',slime:'#BEBE8A',code:'SD',serial:'VX-23',wing:'MARINES'}};
export function applyUV(T,model,paintMats){
 model.updateMatrixWorld(true);
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3(),cl=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
 model.traverse(o=>{
  if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(!mats.some(m=>paintMats.has(m)))return;
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),p=g.attributes.position,uv=new Float32Array(p.count*2),M=o.matrixWorld,flip=M.determinant()<0?-1:1,V=[a,b,c];
  for(let i=0;i+2<p.count;i+=3){
   a.fromBufferAttribute(p,i).applyMatrix4(M);b.fromBufferAttribute(p,i+1).applyMatrix4(M);c.fromBufferAttribute(p,i+2).applyMatrix4(M);
   ab.subVectors(b,a);ac.subVectors(c,a);ab.cross(ac).multiplyScalar(flip);
   const nx=ab.x,nz=ab.y,view=Math.abs(nz)>=Math.abs(nx)*.9?(nz>=0?0:1):(nx<0?2:3);
   for(let k=0;k<3;k++){const x=V[k].x,y=-V[k].z,z=V[k].y;let px,py;
    if(view===0){px=cl(x+6,.02,11.98);py=cl(8.4-y,.02,16.78)}else if(view===1){px=12+cl(6-x,.02,11.98);py=cl(8.4-y,.02,16.78)}
    else if(view===2){px=cl(8.4-y,.02,16.78);py=16.8+cl(2.7-z,.02,3.98)}else{px=cl(y+8.4,.02,16.78);py=20.8+cl(2.7-z,.02,3.98)}
    uv[(i+k)*2]=px/24;uv[(i+k)*2+1]=1-py/24.8}}
  g.setAttribute('uv',new T.BufferAttribute(uv,2));o.geometry=g});
}
export async function liveryCanvas(scheme,S){
 try{await document.fonts.load('700 64px "Saira Condensed"')}catch{}
 const C=SCHEMES[scheme],cv=document.createElement('canvas');cv.width=24*S;cv.height=Math.round(24.8*S);const x=cv.getContext('2d');
 const mix=(h,t)=>{const n=parseInt(h.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(t>=0?v+(255-v)*t:v*(1+t)));return `rgb(${c})`};
 const TAPE=mix(C.base,.1),MARK=mix(C.base,.3),SEAM=mix(C.base,-.16);
 x.fillStyle=C.base;x.fillRect(0,0,cv.width,cv.height);
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 try{x.filter=`blur(${Math.round(S*.14)}px)`}catch{}
 for(let i=0;i<900;i++){x.fillStyle=i%2?'rgba(255,255,255,.03)':'rgba(0,0,0,.035)';x.beginPath();x.ellipse(rnd()*cv.width,rnd()*cv.height,S*(.15+rnd()*.5),S*(.1+rnd()*.3),rnd()*3,0,7);x.fill()}
 x.filter='none';
 const views=[[S,0,0,-S,6*S,8.4*S,[0,0,12,16.8],1],[-S,0,0,-S,18*S,8.4*S,[12,0,12,16.8],-1],[-S,0,0,-S,8.4*S,19.5*S,[0,16.8,16.8,4],-1],[S,0,0,-S,8.4*S,23.5*S,[0,20.8,16.8,4],1]];
 let sx=1;
 const up=(px,py,rot,fn)=>{x.save();x.translate(px,py);x.scale(sx,-1);x.rotate(rot);fn();x.restore()};
 const band=(pts,closed=false,w=.09,col=TAPE)=>{x.strokeStyle=col;x.lineWidth=w;x.lineJoin='miter';x.lineCap='butt';x.beginPath();pts.forEach((p,i)=>x[i?'lineTo':'moveTo'](p[0],p[1]));if(closed)x.closePath();x.stroke()};
 const seam=(pts)=>band(pts,false,.022,SEAM);
 const box=(xa,y0,xb,y1,c=.12)=>{const x0=Math.min(xa,xb),x1=Math.max(xa,xb);return [[x0+c,y0],[x1-c,y0],[x1,y0+c],[x1,y1-c],[x1-c,y1],[x0+c,y1],[x0,y1-c],[x0,y0+c]]};
 const arch=(xin,xout,ya,yb,c=.1)=>{const d=Math.sign(xout-xin)*c;return [[xout,ya],[xin+d,ya],[xin,ya-c],[xin,yb+c],[xin+d,yb],[xout,yb]]};
 const text=(s,px,py,h,rot=0)=>up(px,py,rot,()=>{x.scale(.01,.01);x.fillStyle=MARK;x.font=`700 ${h*140}px "Saira Condensed","Arial Narrow",sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(s,0,0)});
 const star=(px,py,r,rot=0)=>up(px,py,rot,()=>{x.strokeStyle=x.fillStyle=MARK;x.lineWidth=r*.09;x.beginPath();x.arc(0,0,r,0,7);x.stroke();x.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*4*Math.PI/5;x[i?'lineTo':'moveTo'](Math.cos(a)*r*.95,Math.sin(a)*r*.95)}x.closePath();x.fill();x.strokeRect(r,-r*.31,r,r*.5);x.strokeRect(-2*r,-r*.31,r,r*.5)});
 const planform=()=>{for(const s of[1,-1]){
   band([[s*1.8,-.14],[s*5.35,-2.18],[s*5.35,-3.76],[s*1.8,-4.6]],false,.2);
   seam([[s*1.8,-.8],[s*5.35,-2.41]]);seam([[s*1.8,-3.44],[s*5.35,-3.35]]);seam([[s*3.2,-1.6],[s*3.2,-3.4]]);seam([[s*4.3,-2.2],[s*4.3,-3.37]]);
   band([[s*1.9,-.95],[s*2.55,-1.3],[s*2.55,-2.0],[s*2.15,-2.4],[s*2.15,-3.2],[s*2.6,-3.3]]);
   band([[s*3.0,-2.0],[s*3.6,-2.3],[s*3.6,-2.9],[s*4.5,-2.95],[s*4.5,-3.3]],false,.07);
   band([[s*1.55,-5.02],[s*3.64,-6.27],[s*3.64,-7.18],[s*1.55,-7.67]],false,.18);seam([[s*1.55,-6.95],[s*3.64,-6.95]]);
   band([[s*1.8,-5.6],[s*2.4,-5.95],[s*2.4,-6.6],[s*3.1,-6.7]],false,.07)}};
 const radome=()=>{x.fillStyle=C.radome;x.fillRect(-1,6.2,2,2);seam([[-.6,6.2],[.6,6.2]])};
 views.forEach((v,vi)=>{
  x.save();x.setTransform(1,0,0,1,0,0);x.beginPath();x.rect(v[6][0]*S,v[6][1]*S,v[6][2]*S,v[6][3]*S);x.clip();x.setTransform(v[0],v[1],v[2],v[3],v[4],v[5]);sx=v[7];
  if(vi===0){radome();planform();
   band(box(-.78,.75,.78,2.5),true);band(box(-.5,-.22,.5,.44,.08),true,.07);seam([[0,-.22],[0,.44]]);
   for(const s of[1,-1]){
    for(let k=0;k<5;k++){const ya=-.62-k*.76;band(arch(s*.2,s*(.95-k*.04),ya,ya-.6))}
    band([[s*1.08,-.45],[s*1.08,-1.35],[s*1.3,-1.6],[s*1.3,-2.55],[s*1.52,-2.8],[s*1.52,-3.7],[s*1.35,-3.9],[s*1.35,-4.6]]);
    band([[s*.9,2.55],[s*1.42,2.55],[s*1.42,1.75],[s*1.18,1.5],[s*1.18,.95],[s*1.48,.65],[s*1.48,.15],[s*1.25,-.1]]);
    band([[s*.6,5.7],[s*.7,4.9],[s*.86,4.3],[s*.86,3.7]],false,.07)}
   star(-3.7,-2.5,.42)}
  else if(vi===1){radome();planform();
   for(const s of[1,-1]){band(box(s*.41,-3.25,s*.75,.15,.08),true,.07);band(box(s*.75,-3.25,s*1.09,.15,.08),true,.07);band(box(s*1.13,-2.17,s*1.62,-.39,.08),true,.07);band(box(0,.9,s*.73,2.36,.1),true,.07);
    band([[s*.8,2.9],[s*1.38,2.9],[s*1.38,1.4],[s*1.15,1.15],[s*1.15,.45]]);
    for(let k=0;k<3;k++){const ya=-3.6-k*.62;band(arch(s*.12,s*.6,ya,ya-.5,.08),false,.07)}
    for(const px of[2.8,3.75,4.75])band(box(s*(px-.12),-2.7,s*(px+.12),-1.9,.05),true,.035);band(box(s*2.2,-1.2,s*2.6,-.7,.06),true,.04);
    band([[s*.95,-3.5],[s*1.2,-4.2],[s*1.2,-5.0],[s*1.35,-5.5]],false,.07)}
   band(box(-.29,3.43,.29,5.07,.08),true,.07);seam([[0,3.43],[0,5.07]]);
   star(3.6,-2.6,.42);text(C.wing,-3.55,-2.75,.52)}
  else{x.fillStyle=C.radome;x.fillRect(6.2,-1.5,3,3);seam([[6.2,-.5],[6.2,.5]]);
   band([[2.85,.1],[1.6,.1],[1.35,-.12],[.75,-.12],[.75,-.55],[2.6,-.55],[2.85,-.35]]);
   band([[-.6,-.08],[-2.4,-.08],[-2.6,-.25],[-2.6,-.55]]);band(box(3.75,-.42,4.9,-.02,.08),true,.07);band([[3.12,-.72],[3.12,.3]],false,.12);
   band([[-3.8,.43],[-5.2,2.47],[-6.96,2.37],[-6.43,.16]],false,.16);seam([[-5.77,.23],[-6.52,2.4]]);band([[-4.5,.7],[-5.0,.7],[-5.2,.95],[-5.2,1.02]],false,.07);
   x.fillStyle=C.slime;x.fillRect(5.0,-.03,.6,.07);x.fillRect(-5.95,1.95,.6,.07);
   text(C.code,-5.25,1.42,.44);text(C.serial,-5.27,.95,.17);
   if(scheme==='usmc'){text('MARINES',-3.75,-.33,.2);text('VX-23',2.1,-.32,.13);star(5.25,-.2,.16)}else{star(1.75,-.33,.17)}}
  x.restore()});
 return cv;
}
