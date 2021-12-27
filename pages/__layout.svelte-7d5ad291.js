import{D as q,S as P,i as O,s as x,e as h,c as g,a as D,d as p,f as k,E as F,F as N,G as E,x as _,u as M,k as K,l as z,H as R,n as W,b as o,I as b,w as C,J as I,A as G,K as J,r as T,_ as V,L,M as B}from"../chunks/vendor-d1a2451d.js";function A(i,r){const s=Object.keys(r);for(const a of s){const e=r[a];a in i?typeof e=="object"&&(i[a]=A(i[a],e)):i[a]=e}return i}const S="default";function Q(i,r){const s=i.get(S)||{};for(const[a,e]of i)a!==S&&r.update({[a]:A(e,s)})}var f={footer:"Copyright (c) 2020-2021 Damien Simonin Feugas",intuitive:"Intuitive","intuitive portable and open source":"It is intuitive, portable and open source!","install _":"Install v{version}","it stays tuned":"It stays tuned","js powered":"Powered by JS","for geeks":"For geeks",M\u00E9lodie:"M\xE9lodie","M\xE9lodie is a music player":"M\xE9lodie is a music player","no frills just the basics":"No frills, just the basics",organized:"Organized","organized so you do not have to":"Organized, so you don't have to","open source":"Open Source","photo by _":"Photo by {name}",reactive:"Reactive","works on your machine":"Works on your machine",alt:{home:"M\xE9lodie logo - link to the page top"},description:{basics:`<p>Plays Mp3, Ogg Vorbis and Flac files. Controls speak for themselves. </p> <p>What you don't see yet? Gap-less playback, ReplayGain, system notifications and media keys support.</p>
`,"open source":`<p>M\xE9lodie's source code is <a class="underlined" target="_blank" href="https://github.com/feugy/melodie">open <i class="material-icons">launch</i></a>.</p> <p>This application is free to use, and free or any adds.</p>
`,organized:`<p>M\xE9lodie reads tracks music metadata, and automatically creates your album and artist library.</p> <p>You don't need to change how you the actual files are organized on your hard drive.</p>
`,portable:`<p>May your favorite operating system be macOS, Windows or Linux, you will get the same user experience.</p>
`,technologies:`<p>With a lot of love and Electron, Svelte, RxJS, WindiCSS, SQLite, Music-Metadata, Svelte SPA router...<p>
`,tuned:`<p>Thanks to <a class="underlined" target="_blank" href="https://www.theaudiodb.com">AudioDB <i class="material-icons">launch</i></a> and <a class="underlined" target="_blank" href="https://www.discogs.com/en">Discogs <i class="material-icons">launch</i></a>, M\xE9lodie will enrich your libraries with covers, avatars and biographies (requires access keys).</p> <p>Add or remove files on your drive, change their metadata: your library will immediately update.</p> <p>A software update? It'll automatically apply next time you'll open it.</p>
`},download:{exe:"Setup","portable exe":"Portable version","portable zip":"Zip file","app image":"App Image","portable tar":"Tar.gz file",dmg:"Image Disk"}};f.footer;f.intuitive;f.organized;f.reactive;f.alt;f.description;f.download;var v={"intuitive portable and open source":"Intuitif, portable et open source!","install _":"Installer v{version}","it stays tuned":"Elle est toujours \xE0 la page","js powered":"Fait en JS","for geeks":"Pour les Geeks","M\xE9lodie is a music player":"M\xE9lodie est un lecteur de musique","no frills just the basics":"Pas de fioritures, juste les fondamentaux",organized:"Organis\xE9e","organized so you do not have to":"Organis\xE9e, pour que vous n'ayez pas \xE0 l'\xEAtre","photo by _":"Photo par {name}","works on your machine":"Pour tous",alt:{home:"Logo M\xE9lodie - lien vers le haut de la page"},description:{basics:`<p>Lit les fichiers Mp3, Ogg Vorbis et Flac. Les contr\xF4les parlent d'eux-m\xEAmes. </p> <p>Ce que vous ne voyez pas encore ? Lecture en continue, ReplayGain, notifications syst\xE8me et support des touches m\xE9dia.</p>
`,"open source":`<p>Le code source de M\xE9lodie est <a class="underlined" target="_blank" href="https://github.com/feugy/melodie">ouvert <i class="material-icons">launch</i></a>.</p> <p>L'application est gratuite, et sans aucunes publicit\xE9s.</p>
`,organized:`<p>M\xE9lodie lit les m\xE9ta-donn\xE9es de vos morceaux, et cr\xE9e automatiquement votre librairie d'albums et d'artistes.</p> <p>Vous n'avez pas besoin de changer la mani\xE8res dont vos fichiers sont organis\xE9s sur le disque dur.</p>
`,portable:`<p>Que votre syst\xE8me d'exploitation pr\xE9f\xE9r\xE9 soit macOS, Windows ou Linux, profitez de la m\xEAme exp\xE9rience utilisateur.</p>
`,technologies:`<p>Avec beaucoup d'amour et Electron, Svelte, RxJS, WindiCSS, SQLite, Music-Metadata, Svelte SPA router...<p>
`,tuned:`<p>Gr\xE2ce \xE0 <a class="underlined" target="_blank" href="https://www.theaudiodb.com">AudioDB <i class="material-icons">launch</i></a> et <a class="underlined" target="_blank" href="https://www.discogs.com/en">Discogs <i class="material-icons">launch</i></a>, M\xE9lodie enrichira votre librairie libraries avec des couvertures, avatars et biographies (n\xE9cessite des cl\xE9s d'acc\xE8s).</p> <p>Ajoutez ou supprimez des fichiers sur le disque, changez leurs m\xE9ta-donn\xE9es : votre librairie le d\xE9tectera imm\xE9diatement.</p> <p>Une nouvelle version ? Elle sera automatiquement install\xE9e lors du prochain red\xE9marrage.</p>
`},download:{exe:"Installeur","portable exe":"Version portable","portable zip":"Fichier zip","app image":"App Image","portable tar":"Fichier tar.gz",dmg:"Image disque"}};v.organized;v.alt;v.description;v.download;const w=new Map;w.set(S,f);w.set("en",f);w.set("fr",v);Q(w,q);function j(i){let r,s;const a=i[3].default,e=J(a,i,i[2],null);return{c(){r=h("main"),e&&e.c()},l(t){r=g(t,"MAIN",{});var n=D(r);e&&e.l(n),n.forEach(p)},m(t,n){k(t,r,n),e&&e.m(r,null),s=!0},p(t,n){e&&e.p&&(!s||n&4)&&F(e,a,t,t[2],s?E(a,t[2],n,null):N(t[2]),null)},i(t){s||(_(e,t),s=!0)},o(t){M(e,t),s=!1},d(t){t&&p(r),e&&e.d(t)}}}function $(i){let r,s,a,e,t,n,d,m,y;document.title=r=i[0]("M\xE9lodie");let l=i[1]&&j(i);return{c(){s=h("link"),a=h("link"),e=h("link"),t=h("link"),n=h("link"),d=K(),l&&l.c(),m=z(),this.h()},l(u){const c=R('[data-svelte="svelte-1keo8hu"]',document.head);s=g(c,"LINK",{rel:!0,href:!0,type:!0}),a=g(c,"LINK",{rel:!0,href:!0,as:!0,type:!0,crossorigin:!0}),e=g(c,"LINK",{rel:!0,href:!0,as:!0,type:!0,crossorigin:!0}),t=g(c,"LINK",{rel:!0,href:!0,as:!0,type:!0,crossorigin:!0}),n=g(c,"LINK",{rel:!0,href:!0,as:!0,type:!0,crossorigin:!0}),c.forEach(p),d=W(u),l&&l.l(u),m=z(),this.h()},h(){o(s,"rel","icon"),o(s,"href","favicon.png"),o(s,"type","image/png"),o(a,"rel","preload"),o(a,"href","fonts/MaterialIcons.woff2"),o(a,"as","font"),o(a,"type","font/woff2"),o(a,"crossorigin",""),o(e,"rel","preload"),o(e,"href","fonts/Raleway.woff2"),o(e,"as","font"),o(e,"type","font/woff2"),o(e,"crossorigin",""),o(t,"rel","preload"),o(t,"href","fonts/Raleway-SemiBold.woff2"),o(t,"as","font"),o(t,"type","font/woff2"),o(t,"crossorigin",""),o(n,"rel","preload"),o(n,"href","fonts/SourceSansPro-Light.woff2"),o(n,"as","font"),o(n,"type","font/woff2"),o(n,"crossorigin","")},m(u,c){b(document.head,s),b(document.head,a),b(document.head,e),b(document.head,t),b(document.head,n),k(u,d,c),l&&l.m(u,c),k(u,m,c),y=!0},p(u,[c]){(!y||c&1)&&r!==(r=u[0]("M\xE9lodie"))&&(document.title=r),u[1]?l?(l.p(u,c),c&2&&_(l,1)):(l=j(u),l.c(),_(l,1),l.m(m.parentNode,m)):l&&(T(),M(l,1,1,()=>{l=null}),C())},i(u){y||(_(l),y=!0)},o(u){M(l),y=!1},d(u){p(s),p(a),p(e),p(t),p(n),u&&p(d),l&&l.d(u),u&&p(m)}}}function H(i,r,s){let a,e;I(i,V,d=>s(0,a=d)),I(i,L,d=>s(1,e=d));let{$$slots:t={},$$scope:n}=r;return G(()=>L.set(B("en"))),i.$$set=d=>{"$$scope"in d&&s(2,n=d.$$scope)},[a,e,n,t]}class Y extends P{constructor(r){super();O(this,r,H,$,x,{})}}export{Y as default};
