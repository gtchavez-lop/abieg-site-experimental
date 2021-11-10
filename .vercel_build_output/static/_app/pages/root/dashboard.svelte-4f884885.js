import{S as t,i as e,s as a,l as s,f as n,u as r,w as l,x as o,d as c,A as i,r as u,e as d,k as m,t as f,c as p,a as b,n as h,g,b as v,E as y,F as $,H as E,D as x,W as T,X as j,V as k,j as w,m as B,o as M,v as N,G as O,I}from"../../chunks/vendor-969998bb.js";import D from"./components/moderators.svelte-8c2be78a.js";import R from"./components/overview.svelte-de975660.js";import U from"./components/posts.svelte-40d6b45e.js";import q from"./components/registeredUsers.svelte-a6386542.js";import V from"./components/moderatorRequest.svelte-1a64909f.js";import{s as A}from"../../chunks/global-04cce44f.js";import{g as P}from"../../chunks/navigation-51f4a605.js";import"../../chunks/AdminPostCard-695d917a.js";import"../../chunks/singletons-12a22614.js";function L(t){let e,a,s,r,l,o,i,u;return{c(){e=d("main"),a=d("i"),s=m(),r=d("p"),l=f("You are not a root user to access this page"),this.h()},l(t){e=p(t,"MAIN",{class:!0,style:!0});var n=b(e);a=p(n,"I",{class:!0,style:!0}),b(a).forEach(c),s=h(n),r=p(n,"P",{class:!0});var o=b(r);l=g(o,"You are not a root user to access this page"),o.forEach(c),n.forEach(c),this.h()},h(){v(a,"class","bi bi-exclamation-diamond"),y(a,"font-size","10rem"),v(r,"class","lead"),v(e,"class","text-white d-flex flex-column align-items-center justify-content-center svelte-rplqxt"),y(e,"margin-top","0")},m(t,o){n(t,e,o),$(e,a),$(e,s),$(e,r),$(r,l),u=!0},p:E,i(t){u||(x((()=>{i&&i.end(1),o=T(e,j,{y:-40,duration:500,delay:500}),o.start()})),u=!0)},o(t){o&&o.invalidate(),i=k(e,j,{y:40,duration:500}),u=!1},d(t){t&&c(e),t&&i&&i.end()}}}function S(t){let e,a,s,r,l,o,i;return{c(){e=d("main"),a=d("div"),s=d("span"),r=f("Loading..."),this.h()},l(t){e=p(t,"MAIN",{class:!0,style:!0});var n=b(e);a=p(n,"DIV",{class:!0,role:!0});var l=b(a);s=p(l,"SPAN",{class:!0});var o=b(s);r=g(o,"Loading..."),o.forEach(c),l.forEach(c),n.forEach(c),this.h()},h(){v(s,"class","visually-hidden"),v(a,"class","spinner-border"),v(a,"role","status"),v(e,"class","text-white d-flex flex-column align-items-center justify-content-center svelte-rplqxt"),y(e,"margin-top","0")},m(t,l){n(t,e,l),$(e,a),$(a,s),$(s,r),i=!0},p:E,i(t){i||(x((()=>{o&&o.end(1),l=T(e,j,{y:-40,duration:500,delay:500}),l.start()})),i=!0)},o(t){l&&l.invalidate(),o=k(e,j,{y:40,duration:500}),i=!1},d(t){t&&c(e),t&&o&&o.end()}}}function Y(t){let e,a,s,i,y,E,w,B,M,N,D,R,U,q,V,A,P,L,S,Y,W,X,J,K,Q,Z,_,tt,et,at,st,nt,rt,lt,ot,ct,it,ut,dt,mt,ft,pt,bt,ht,gt,vt,yt,$t,Et,xt,Tt=1==t[0]&&z(),jt=2==t[0]&&C(),kt=3==t[0]&&F(),wt=4==t[0]&&G(),Bt=5==t[0]&&H();return{c(){e=d("main"),a=d("div"),s=d("p"),i=f("Root Dashboard"),y=m(),E=d("div"),w=d("div"),B=d("button"),M=f("Overview"),N=m(),D=d("button"),R=f("Posts"),U=m(),q=d("div"),V=d("button"),A=f("Moderators"),P=m(),L=d("button"),S=f("Moderator Request"),Y=m(),W=d("button"),X=f("Registered Members"),J=m(),K=d("div"),Q=d("button"),Z=f("Overview"),_=m(),tt=d("div"),et=d("button"),at=f("Moderators"),st=m(),nt=d("button"),rt=f("Registered Members"),lt=m(),ot=d("div"),ct=d("button"),it=f("Moderator Request"),ut=m(),dt=d("button"),mt=f("Posts"),ft=m(),Tt&&Tt.c(),pt=m(),jt&&jt.c(),bt=m(),kt&&kt.c(),ht=m(),wt&&wt.c(),gt=m(),Bt&&Bt.c(),this.h()},l(t){e=p(t,"MAIN",{class:!0});var n=b(e);a=p(n,"DIV",{class:!0});var r=b(a);s=p(r,"P",{class:!0});var l=b(s);i=g(l,"Root Dashboard"),l.forEach(c),y=h(r),E=p(r,"DIV",{class:!0});var o=b(E);w=p(o,"DIV",{class:!0,role:!0,"aria-label":!0});var u=b(w);B=p(u,"BUTTON",{type:!0,class:!0});var d=b(B);M=g(d,"Overview"),d.forEach(c),N=h(u),D=p(u,"BUTTON",{type:!0,class:!0});var m=b(D);R=g(m,"Posts"),m.forEach(c),u.forEach(c),U=h(o),q=p(o,"DIV",{class:!0,role:!0,"aria-label":!0});var f=b(q);V=p(f,"BUTTON",{type:!0,class:!0});var v=b(V);A=g(v,"Moderators"),v.forEach(c),P=h(f),L=p(f,"BUTTON",{type:!0,class:!0});var $=b(L);S=g($,"Moderator Request"),$.forEach(c),Y=h(f),W=p(f,"BUTTON",{type:!0,class:!0});var x=b(W);X=g(x,"Registered Members"),x.forEach(c),f.forEach(c),J=h(o),K=p(o,"DIV",{class:!0,role:!0,"aria-label":!0});var T=b(K);Q=p(T,"BUTTON",{type:!0,class:!0});var j=b(Q);Z=g(j,"Overview"),j.forEach(c),T.forEach(c),_=h(o),tt=p(o,"DIV",{class:!0,role:!0,"aria-label":!0});var k=b(tt);et=p(k,"BUTTON",{type:!0,class:!0});var O=b(et);at=g(O,"Moderators"),O.forEach(c),st=h(k),nt=p(k,"BUTTON",{type:!0,class:!0});var I=b(nt);rt=g(I,"Registered Members"),I.forEach(c),k.forEach(c),lt=h(o),ot=p(o,"DIV",{class:!0,role:!0,"aria-label":!0});var z=b(ot);ct=p(z,"BUTTON",{type:!0,class:!0});var C=b(ct);it=g(C,"Moderator Request"),C.forEach(c),ut=h(z),dt=p(z,"BUTTON",{type:!0,class:!0});var F=b(dt);mt=g(F,"Posts"),F.forEach(c),z.forEach(c),o.forEach(c),r.forEach(c),ft=h(n),Tt&&Tt.l(n),pt=h(n),jt&&jt.l(n),bt=h(n),kt&&kt.l(n),ht=h(n),wt&&wt.l(n),gt=h(n),Bt&&Bt.l(n),n.forEach(c),this.h()},h(){v(s,"class","display-3"),v(B,"type","button"),v(B,"class","btn btn-outline-light"),v(D,"type","button"),v(D,"class","btn btn-outline-light"),v(w,"class","btn-group d-none d-md-flex justify-content-center"),v(w,"role","group"),v(w,"aria-label","Basic outlined example"),v(V,"type","button"),v(V,"class","btn btn-outline-light"),v(L,"type","button"),v(L,"class","btn btn-outline-light"),v(W,"type","button"),v(W,"class","btn btn-outline-light"),v(q,"class","btn-group d-none d-md-flex justify-content-center"),v(q,"role","group"),v(q,"aria-label","Basic outlined example"),v(Q,"type","button"),v(Q,"class","btn btn-outline-light"),v(K,"class","btn-group d-flex d-md-none justify-content-center"),v(K,"role","group"),v(K,"aria-label","Basic outlined example"),v(et,"type","button"),v(et,"class","btn btn-outline-light"),v(nt,"type","button"),v(nt,"class","btn btn-outline-light"),v(tt,"class","btn-group d-flex d-md-none justify-content-center"),v(tt,"role","group"),v(tt,"aria-label","Basic outlined example"),v(ct,"type","button"),v(ct,"class","btn btn-outline-light"),v(dt,"type","button"),v(dt,"class","btn btn-outline-light"),v(ot,"class","btn-group d-flex d-md-none justify-content-center"),v(ot,"role","group"),v(ot,"aria-label","Basic outlined example"),v(E,"class","mt-2"),v(a,"class","container text-white"),v(e,"class","svelte-rplqxt")},m(r,l){n(r,e,l),$(e,a),$(a,s),$(s,i),$(a,y),$(a,E),$(E,w),$(w,B),$(B,M),$(w,N),$(w,D),$(D,R),$(E,U),$(E,q),$(q,V),$(V,A),$(q,P),$(q,L),$(L,S),$(q,Y),$(q,W),$(W,X),$(E,J),$(E,K),$(K,Q),$(Q,Z),$(E,_),$(E,tt),$(tt,et),$(et,at),$(tt,st),$(tt,nt),$(nt,rt),$(E,lt),$(E,ot),$(ot,ct),$(ct,it),$(ot,ut),$(ot,dt),$(dt,mt),$(e,ft),Tt&&Tt.m(e,null),$(e,pt),jt&&jt.m(e,null),$(e,bt),kt&&kt.m(e,null),$(e,ht),wt&&wt.m(e,null),$(e,gt),Bt&&Bt.m(e,null),$t=!0,Et||(xt=[O(B,"click",t[2]),O(D,"click",t[3]),O(V,"click",t[4]),O(L,"click",t[5]),O(W,"click",t[6]),O(Q,"click",t[7]),O(et,"click",t[8]),O(nt,"click",t[9]),O(ct,"click",t[10]),O(dt,"click",t[11])],Et=!0)},p(t,a){1==t[0]?Tt?1&a&&o(Tt,1):(Tt=z(),Tt.c(),o(Tt,1),Tt.m(e,pt)):Tt&&(u(),r(Tt,1,1,(()=>{Tt=null})),l()),2==t[0]?jt?1&a&&o(jt,1):(jt=C(),jt.c(),o(jt,1),jt.m(e,bt)):jt&&(u(),r(jt,1,1,(()=>{jt=null})),l()),3==t[0]?kt?1&a&&o(kt,1):(kt=F(),kt.c(),o(kt,1),kt.m(e,ht)):kt&&(u(),r(kt,1,1,(()=>{kt=null})),l()),4==t[0]?wt?1&a&&o(wt,1):(wt=G(),wt.c(),o(wt,1),wt.m(e,gt)):wt&&(u(),r(wt,1,1,(()=>{wt=null})),l()),5==t[0]?Bt?1&a&&o(Bt,1):(Bt=H(),Bt.c(),o(Bt,1),Bt.m(e,null)):Bt&&(u(),r(Bt,1,1,(()=>{Bt=null})),l())},i(t){$t||(o(Tt),o(jt),o(kt),o(wt),o(Bt),x((()=>{yt&&yt.end(1),vt=T(e,j,{y:-40,duration:500,delay:500}),vt.start()})),$t=!0)},o(t){r(Tt),r(jt),r(kt),r(wt),r(Bt),vt&&vt.invalidate(),yt=k(e,j,{y:40,duration:500}),$t=!1},d(t){t&&c(e),Tt&&Tt.d(),jt&&jt.d(),kt&&kt.d(),wt&&wt.d(),Bt&&Bt.d(),t&&yt&&yt.end(),Et=!1,I(xt)}}}function z(t){let e,a;return e=new R({}),{c(){w(e.$$.fragment)},l(t){B(e.$$.fragment,t)},m(t,s){M(e,t,s),a=!0},i(t){a||(o(e.$$.fragment,t),a=!0)},o(t){r(e.$$.fragment,t),a=!1},d(t){N(e,t)}}}function C(t){let e,a;return e=new q({}),{c(){w(e.$$.fragment)},l(t){B(e.$$.fragment,t)},m(t,s){M(e,t,s),a=!0},i(t){a||(o(e.$$.fragment,t),a=!0)},o(t){r(e.$$.fragment,t),a=!1},d(t){N(e,t)}}}function F(t){let e,a;return e=new D({}),{c(){w(e.$$.fragment)},l(t){B(e.$$.fragment,t)},m(t,s){M(e,t,s),a=!0},i(t){a||(o(e.$$.fragment,t),a=!0)},o(t){r(e.$$.fragment,t),a=!1},d(t){N(e,t)}}}function G(t){let e,a;return e=new V({}),{c(){w(e.$$.fragment)},l(t){B(e.$$.fragment,t)},m(t,s){M(e,t,s),a=!0},i(t){a||(o(e.$$.fragment,t),a=!0)},o(t){r(e.$$.fragment,t),a=!1},d(t){N(e,t)}}}function H(t){let e,a;return e=new U({}),{c(){w(e.$$.fragment)},l(t){B(e.$$.fragment,t)},m(t,s){M(e,t,s),a=!0},i(t){a||(o(e.$$.fragment,t),a=!0)},o(t){r(e.$$.fragment,t),a=!1},d(t){N(e,t)}}}function W(t){let e,a,i,d;const m=[Y,S,L],f=[];function p(t,e){return t[1]?0:null==t[1]?1:0==t[1]?2:-1}return~(e=p(t))&&(a=f[e]=m[e](t)),{c(){a&&a.c(),i=s()},l(t){a&&a.l(t),i=s()},m(t,a){~e&&f[e].m(t,a),n(t,i,a),d=!0},p(t,[s]){let n=e;e=p(t),e===n?~e&&f[e].p(t,s):(a&&(u(),r(f[n],1,1,(()=>{f[n]=null})),l()),~e?(a=f[e],a?a.p(t,s):(a=f[e]=m[e](t),a.c()),o(a,1),a.m(i.parentNode,i)):a=null)},i(t){d||(o(a),d=!0)},o(t){r(a),d=!1},d(t){~e&&f[e].d(t),t&&c(i)}}}function X(t,e,a){let s=1,n=null;i((async t=>{let e=await A.auth.user();if(e){let{data:t,error:s}=await A.from("users").select("isAdmin").eq("id",e.id);t[0].isAdmin?a(1,n=!0):(a(1,n=!1),setTimeout((()=>{P("/")}),2e3))}else a(1,n=!1),setTimeout((()=>{P("/")}),2e3)}));return[s,n,()=>{a(0,s=1)},()=>{a(0,s=5)},()=>{a(0,s=3)},()=>{a(0,s=4)},()=>{a(0,s=2)},()=>{a(0,s=1)},()=>{a(0,s=3)},()=>{a(0,s=2)},()=>{a(0,s=4)},()=>{a(0,s=5)}]}class J extends t{constructor(t){super(),e(this,t,X,W,a,{})}}export{J as default};
