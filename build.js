!function t(i,s,e){function h(r,a){if(!s[r]){if(!i[r]){var o="function"==typeof require&&require;if(!a&&o)return o(r,!0);if(n)return n(r,!0);var c=new Error("Cannot find module '"+r+"'");throw c.code="MODULE_NOT_FOUND",c}var p=s[r]={exports:{}};i[r][0].call(p.exports,function(t){var s=i[r][1][t];return h(s?s:t)},p,p.exports,t,i,s,e)}return s[r].exports}for(var n="function"==typeof require&&require,r=0;r<e.length;r++)h(e[r]);return h}({1:[function(t){var i,s=t(10),e=t(8),h=t(2),n=t(14),r=t(11),a=t(13),o=function(){i=new n,i.create(),e.start(function(){s(i)})},c=function(){i.started(),setTimeout(p,r.beginDelay)},p=function(){if(!i.losing){i.createMario();var t=a(i.time);i.time+=t,setTimeout(p,t)}};window.addEventListener("keydown",function(t){88==t.which&&(i.losing||i.created)&&(h.play("heart"),o(),c())}),o()},{10:10,11:11,13:13,14:14,2:2,8:8}],2:[function(t,i){var s=t(5),e={pipe:[2,,.2,,.1753,.64,,-.5261,,,,,,.5522,-.564,,,,1,,,,,.5],water:[3,,.0138,,.2701,.4935,,-.6881,,,,,,,,,,,1,,,,,.5],score:[0,,.0678,.4484,.1648,.7592,,,,,,,,,,,,,1,,,,,.5],jump:[0,,.2317,,.1513,.3192,,.2043,,,,,,.1541,,,,,.9871,,,.0876,,.5],heart:[0,,.01,,.4384,.2,,.12,.28,1,.65,,,.0419,,,,,1,,,,,.5]};i.exports={play:function(t){e[t].play()}},Object.keys(e).forEach(function(t){var i=new Audio;i.src=s(e[t]),e[t]=i})},{5:5}],3:[function(t,i){i.exports=function(t,i){return s.getNaturalKs(i.x,i.y,i.k),s.evalSpline(t,i.x,i.y,i.k)};var s=function(){};s._gaussJ={},s._gaussJ.solve=function(t,i){for(var e=t.length,h=0;e>h;h++){for(var n=0,r=Number.NEGATIVE_INFINITY,a=h;e>a;a++)t[a][h]>r&&(n=a,r=t[a][h]);s._gaussJ.swapRows(t,h,n);for(var a=h+1;e>a;a++){for(var o=h+1;e+1>o;o++)t[a][o]=t[a][o]-t[h][o]*(t[a][h]/t[h][h]);t[a][h]=0}}for(var a=e-1;a>=0;a--){var c=t[a][e]/t[a][a];i[a]=c;for(var o=a-1;o>=0;o--)t[o][e]-=t[o][a]*c,t[o][a]=0}},s._gaussJ.zerosMat=function(t,i){for(var s=[],e=0;t>e;e++){s.push([]);for(var h=0;i>h;h++)s[e].push(0)}return s},s._gaussJ.printMat=function(t){for(var i=0;i<t.length;i++)console.log(t[i])},s._gaussJ.swapRows=function(t,i,s){var e=t[i];t[i]=t[s],t[s]=e},s.getNaturalKs=function(t,i,e){for(var h=t.length-1,n=s._gaussJ.zerosMat(h+1,h+2),r=1;h>r;r++)n[r][r-1]=1/(t[r]-t[r-1]),n[r][r]=2*(1/(t[r]-t[r-1])+1/(t[r+1]-t[r])),n[r][r+1]=1/(t[r+1]-t[r]),n[r][h+1]=3*((i[r]-i[r-1])/((t[r]-t[r-1])*(t[r]-t[r-1]))+(i[r+1]-i[r])/((t[r+1]-t[r])*(t[r+1]-t[r])));n[0][0]=2/(t[1]-t[0]),n[0][1]=1/(t[1]-t[0]),n[0][h+1]=3*(i[1]-i[0])/((t[1]-t[0])*(t[1]-t[0])),n[h][h-1]=1/(t[h]-t[h-1]),n[h][h]=2/(t[h]-t[h-1]),n[h][h+1]=3*(i[h]-i[h-1])/((t[h]-t[h-1])*(t[h]-t[h-1])),s._gaussJ.solve(n,e)},s.evalSpline=function(t,i,s,e){for(var h=1;i[h]<t;)h++;var n=(t-i[h-1])/(i[h]-i[h-1]),r=e[h-1]*(i[h]-i[h-1])-(s[h]-s[h-1]),a=-e[h]*(i[h]-i[h-1])+(s[h]-s[h-1]),o=(1-n)*s[h-1]+n*s[h]+n*(1-n)*(r*(1-n)+a*n);return o}},{}],4:[function(t,i){var s=t(9);i.exports=function(){this.x=10,this.y=125,this.o={x:0,y:0},this.width=15,this.height=13,this.name="heart",this.type="img",this.src="heart.png",this.shakesrc="",this.full=!0,this.shakenum=0,this.shakethres=10,this.shake=function(){this.x=this.o.x+s.number(5),this.y=this.o.y+s.number(5),this.shakenum++,this.shakenum<this.shakethres?setTimeout(this.shake.bind(this),20):(this.x=this.o.x,this.y=this.o.y,this.shakenum=0,this.src=this.shakesrc)},this.lose=function(){this.o.x=this.x,this.o.y=this.y,this.shakesrc="heart-empty.png",this.shake(),this.full=!1},this.gain=function(){this.full=!0,this.shakesrc="heart.png",this.shake()},this.onSpawn=function(t){this.x+=(this.width+2)*t}}},{9:9}],5:[function(t,i){function s(){this.setSettings=function(t){for(var i=0;24>i;i++)this[String.fromCharCode(97+i)]=t[i]||0;this.c<.01&&(this.c=.01);var s=this.b+this.c+this.e;if(.18>s){var e=.18/s;this.b*=e,this.c*=e,this.e*=e}}}function e(){this._params=new s;var t,i,e,h,n,r,a,o,c,p,u,f;this.reset=function(){var t=this._params;h=100/(t.f*t.f+.001),n=100/(t.g*t.g+.001),r=1-t.h*t.h*t.h*.01,a=-t.i*t.i*t.i*1e-6,t.a||(u=.5-t.n/2,f=5e-5*-t.o),o=1+t.l*t.l*(t.l>0?-.9:10),c=0,p=1==t.m?0:(1-t.m)*(1-t.m)*2e4+32},this.totalReset=function(){this.reset();var s=this._params;return t=s.b*s.b*1e5,i=s.c*s.c*1e5,e=s.e*s.e*1e5+12,3*((t+i+e)/3|0)},this.synthWave=function(s,l){var m=this._params,g=1!=m.s||m.v,d=m.v*m.v*.1,v=1+3e-4*m.w,y=m.s*m.s*m.s*.1,x=1+1e-4*m.t,w=1!=m.s,k=m.x*m.x,b=m.g,S=m.q||m.r,E=m.r*m.r*m.r*.2,F=m.q*m.q*(m.q<0?-1020:1020),M=m.p?((1-m.p)*(1-m.p)*2e4|0)+32:0,T=m.d,_=m.j/2,A=m.k*m.k*.01,I=m.a,C=t,z=1/t,O=1/i,q=1/e,D=5/(1+m.u*m.u*20)*(.01+y);D>.8&&(D=.8),D=1-D;for(var J,N,H,R,L,U,j=!1,B=0,G=0,W=0,K=0,P=0,Y=0,Q=0,V=0,X=0,Z=0,$=new Array(1024),ti=new Array(32),ii=$.length;ii--;)$[ii]=0;for(var ii=ti.length;ii--;)ti[ii]=2*Math.random()-1;for(var ii=0;l>ii;ii++){if(j)return ii;if(M&&++X>=M&&(X=0,this.reset()),p&&++c>=p&&(p=0,h*=o),r+=a,h*=r,h>n&&(h=n,b>0&&(j=!0)),N=h,_>0&&(Z+=A,N*=1+Math.sin(Z)*_),N|=0,8>N&&(N=8),I||(u+=f,0>u?u=0:u>.5&&(u=.5)),++G>C)switch(G=0,++B){case 1:C=i;break;case 2:C=e}switch(B){case 0:W=G*z;break;case 1:W=1+2*(1-G*O)*T;break;case 2:W=1-G*q;break;case 3:W=0,j=!0}S&&(F+=E,H=0|F,0>H?H=-H:H>1023&&(H=1023)),g&&v&&(d*=v,1e-5>d?d=1e-5:d>.1&&(d=.1)),U=0;for(var si=8;si--;){if(Q++,Q>=N&&(Q%=N,3==I))for(var ei=ti.length;ei--;)ti[ei]=2*Math.random()-1;switch(I){case 0:L=u>Q/N?.5:-.5;break;case 1:L=1-Q/N*2;break;case 2:R=Q/N,R=6.28318531*(R>.5?R-1:R),L=1.27323954*R+.405284735*R*R*(0>R?1:-1),L=.225*((0>L?-1:1)*L*L-L)+L;break;case 3:L=ti[Math.abs(32*Q/N|0)]}g&&(J=Y,y*=x,0>y?y=0:y>.1&&(y=.1),w?(P+=(L-Y)*y,P*=D):(Y=L,P=0),Y+=P,K+=Y-J,K*=1-d,L=K),S&&($[V%1024]=L,L+=$[(V-H+1024)%1024],V++),U+=L}U*=.125*W*k,s[ii]=U>=1?32767:-1>=U?-32768:32767*U|0}return l}}var h=new e;i.exports=function(t){h._params.setSettings(t);var i=h.totalReset(),s=new Uint8Array(4*((i+1)/2|0)+44),e=2*h.synthWave(new Uint16Array(s.buffer,44),i),n=new Uint32Array(s.buffer,0,44);n[0]=1179011410,n[1]=e+36,n[2]=1163280727,n[3]=544501094,n[4]=16,n[5]=65537,n[6]=44100,n[7]=88200,n[8]=1048578,n[9]=1635017060,n[10]=e,e+=44;for(var r=0,a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",o="data:audio/wav;base64,";e>r;r+=3){var c=s[r]<<16|s[r+1]<<8|s[r+2];o+=a[c>>18]+a[c>>12&63]+a[c>>6&63]+a[63&c]}return o}},{}],6:[function(t,i){var s=t(3),e=t(9),h=t(11),n=t(2);i.exports=function(){this.width=12,this.height=16,this.opacity=1,this.x=-15,this.y=34-this.height,this.type="img",this.name="mario",this.src="mario.png",this.remove=!1,this.killed=!1,this.fading=!1,this.reached=!1,this.destpipe=0,this.path={x:[-15,17,30],y:[34-this.height,34-this.height,10],k:[h.k,h.k,h.k]},this.generateCurve=function(){this.destpipe=e.repnumber(h.pipes.length,0);var t=h.k;this.path.k=this.path.k.concat([t,t,t]);var i=h.pipes[this.destpipe]+15,s=i-(e.number(20)+20);this.path.y.push(3),this.path.x.push(s/2),this.path.y.push(h.water/2),this.path.x.push(s),this.path.y.push(h.water),this.path.x.push(i)},this.tick=function(){this.x>this.path.x[1]&&(this.y=s(this.x,this.path)),this.x==this.path.x[1]+10&&n.play("jump"),this.x++,this.y<h.water?setTimeout(this.tick.bind(this),10):this.reached||(this.fading=!0,n.play("water"),this.fadeOut())},this.fadeOut=function(){this.opacity-=.1,this.opacity>.1?setTimeout(this.fadeOut.bind(this),50):this.remove=!0},this.begin=function(){this.generateCurve(),this.tick()},this.onSpawn=function(){1==e.repnumber(h.heartspawn,1)&&(this.name="heartp",this.src="heartp.png",this.width=10,this.height=9),this.begin()}}},{11:11,2:2,3:3,9:9}],7:[function(t,i){var s=t(11),e=t(2),h=document.getElementById("c");i.exports=function(){this.x=0,this.y=0,this.type="img",this.name="pipe",this.src="pipe.png",this.width=30,this.height=70,this.pipen=0,this.active=!1,this.animating=!1,this.down=!1,this.animate=function(){this.animating=!0,this.active=!0,e.play("pipe"),this.tick()},this.animationDone=function(){this.down=!1,this.animating=!1,this.active=!1},this.tick=function(){this.down?this.y++:this.y--,80==this.y&&(this.down=!0),this.y<130?setTimeout(this.tick.bind(this),s.pipedur/50):130==this.y&&this.animationDone()},this.rise=function(){this.y--,this.y>130?setTimeout(this.rise.bind(this),s.beginDelay/100):this.initEvent()},this.onSpawn=function(t){this.x=s.pipes[t],this.y=s.bottom-120,this.pipen=t,this.rise()},this.key=function(t){this.animating||t.which==s.controls[this.pipen]&&this.animate()},this.touch=function(t){{var i=(t.x-h.offsetLeft)/s.scale;(t.y-h.offsetTop)/s.scale}this.animating||i>=this.x&&i<=this.x+30&&this.animate()},this.initEvent=function(){var t=this;window.addEventListener("keydown",function(i){t.key(i)}),h.addEventListener("mousedown",function(i){t.touch(i)},!1)}}},{11:11,2:2}],8:[function(t,i){function s(t){return window.requestAnimationFrame(function(){var i=Date.now(),s=i-e;s>999?s=1/60:s/=1e3,e=i,t(s)})}var e=0;i.exports={start:function(t){return s(function i(e){t(e),s(i)})},stop:function(t){window.cancelAnimationFrame(t)}}},{}],9:[function(t,i){var s=[];i.exports={number:function(t){return Math.floor(Math.random()*t)},repnumber:function(t,i){var e=Math.floor(Math.random()*t);return e==s[i]&&(e>0?e-=1:e=1),s[i]=e,e}}},{}],10:[function(t,i){var s=document.getElementById("c"),e=s.getContext("2d");e.imageSmoothingEnabled=!1,e.mozImageSmoothingEnabled=!1,e.webkitImageSmoothlocingEnabled=!1,i.exports=function(t){e.clearRect(0,0,s.width,s.height),e.setTransform(1,0,0,1,0,0),e.scale(t.scale,t.scale);var i=t.pipes;t.sprites.forEach(function(s,h){if("mario"==s.name||"heartp"==s.name){var n=i[s.destpipe];s.remove?t.sprites.splice(h,1):s.fading&&!s.killed?("mario"==s.name&&t.lost(),s.killed=!0):n.active&&s.x>n.x&&s.x<n.x+30&&s.y>=n.y&&!s.fading&&!t.losing&&(s.reached=!0,t.sprites.splice(h,1),"mario"==s.name?t.gained():t.hearted())}else s.remove&&t.sprites.splice(h,1);switch(e.globalAlpha=s.opacity?s.opacity:1,s.type){case"rect":e.fillStyle=s.color,e.fillRect(s.x,s.y,s.width,s.height);break;case"img":var r=new Image;r.src="assets/"+s.src,e.drawImage(r,s.x,s.y,s.width,s.height);break;case"text":e.font=s.size+"px "+s.font,e.textAlign=s.align||"center",e.fillStyle=s.color||"#FFFFFF",e.fillText(s.text,s.x,s.y)}})}},{}],11:[function(t,i){i.exports={bottom:300,side:250,water:115,pipes:[90,145,200],controls:[81,87,69],k:.01,pipedur:250,scale:2,beginDelay:2e3,heartspawn:25,spawn:550}},{}],12:[function(t,i){var s=t(11);i.exports=function(){this.type="text",this.name="score",this.font="sans-serif",this.align="right",this.size=20,this.x=s.side-10,this.y=this.size,this.text="0",this.update=function(t){this.text=t}}},{11:11}],13:[function(t,i){var s=t(9),e=t(11);i.exports=function(t){return 350+(s.number(1800)-t/e.spawn)}},{11:11,9:9}],14:[function(t,i){var s=t(6),e=t(7),h=t(12),n=t(2),r=t(4),a=t(11);i.exports=function(){this.scale=a.scale,this.time=1,this.score=0,this.lives=3,this.losing=!1,this.created=!0,this.scoreboard={},this.hearts=[],this.pipes=[],this.hi=0,this.lostscreen={type:"text",name:"lost",size:"20",font:"sans-serif",color:"#FF0000",text:"YOU LOST!",x:120,y:65},this.greetscreen={type:"text",name:"greet",size:"20",font:"sans-serif",color:"#6BFF63",text:"MARIO CATCH",x:130,y:70},this.startscreen={type:"text",name:"lost",size:"10",font:"sans-serif",text:"press x to start. press keys to raise pipes.",x:130,y:85},this.instructionscreen={type:"text",name:"lost",size:"8",font:"sans-serif",text:"Q                   W                    E",x:155,y:110},this.sprites=[{type:"rect",name:"sky",color:"#5C94FC",width:250,height:150,x:0,y:0},{type:"img",name:"cloud",src:"cloud.png",x:80,y:12,opacity:.8,width:40,height:25},{type:"img",name:"cloud",src:"cloud.png",x:160,y:35,opacity:.8,width:24,height:15},{type:"img",name:"blocks",src:"blocks.png",x:0,y:34,width:34,height:17},{type:"rect",name:"water",color:"#15DCE2",opacity:.5,y:a.water,x:0,width:300,height:35}],this.createMario=function(){var t=new s;t.onSpawn(),this.sprites.splice(3,0,t)},this.createPipes=function(){for(var t=0;t<a.pipes.length;t++){var i=new e;i.onSpawn(t),this.pipes.push(i),this.sprites.splice(3,0,this.pipes[t])}},this.createHearts=function(){for(var t=0;3>t;t++){var i=new r;i.onSpawn(t),this.hearts.push(i),this.sprites.push(this.hearts[t])}},this.createScore=function(){this.scoreboard=new h,this.sprites.push(this.scoreboard)},this.lost=function(){this.lives>0&&(this.lives--,this.hearts[this.lives].lose()),0===this.lives&&this.lostGame()},this.hearted=function(){this.lives<3&&!this.losing&&(n.play("heart"),this.lives++,this.hearts[this.lives-1].gain())},this.gained=function(){n.play("score"),this.score++,this.scoreboard.update(this.score)},this.lostGame=function(){this.losing=!0,this.score>this.hi&&this.setHi(),this.scoreboard.update("last: "+this.score+" hi: "+this.hi),this.sprites.push(this.lostscreen),this.sprites.push(this.startscreen)},this.create=function(){this.created=!0,this.sprites.push(this.greetscreen),this.sprites.push(this.startscreen),this.sprites.push(this.instructionscreen)},this.started=function(){this.created=!1;var t=this.sprites.length-1;this.sprites.splice(t,1),this.sprites.splice(t-1,1),this.sprites.splice(t-2,1),this.createPipes(),this.createScore(),this.createHearts(),this.getHi()},this.setHi=function(){this.hi=this.score,localStorage.setItem("hi",this.score)},this.getHi=function(){this.hi=localStorage.getItem("hi")}}},{11:11,12:12,2:2,4:4,6:6,7:7}]},{},[1]);