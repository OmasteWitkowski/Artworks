(function(){
var pics=[].slice.call(document.querySelectorAll('[data-zoom], .story .post-img img, .story .slider img')).filter(function(im){return !im.closest('a');});
var lb=null,at=0;
function show(){var im=pics[at];lb.querySelector('img').src=im.currentSrc||im.src;lb.querySelector('img').alt=im.alt;
 lb.querySelector('p').textContent=(pics.length>1?(at+1)+' of '+pics.length+(im.alt?' · ':''):'')+(im.alt||'');}
function step(d){at=(at+d+pics.length)%pics.length;show();}
function close(){if(!lb)return;lb.remove();lb=null;document.body.style.overflow='';}
function open(i){at=i;lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Picture viewer');
 lb.innerHTML='<img alt=""><p></p><button type="button" class="lb-x" aria-label="Close">&times;</button>'+(pics.length>1?'<button type="button" class="lb-p" aria-label="Previous picture">&#8249;</button><button type="button" class="lb-n" aria-label="Next picture">&#8250;</button>':'');
 document.body.appendChild(lb);document.body.style.overflow='hidden';show();
 lb.onclick=function(ev){var t=ev.target;if(t.classList.contains('lb-p'))step(-1);else if(t.classList.contains('lb-n'))step(1);else if(t.tagName!=='IMG')close();};
 swipe(lb,function(d){step(d);});lb.querySelector('.lb-x').focus();}
pics.forEach(function(im,i){var t=im.closest('button')||im;t.style.cursor='zoom-in';if(t===im){im.tabIndex=0;im.setAttribute('role','button');}
 t.addEventListener('click',function(ev){if(ev.target.closest('a'))return;ev.preventDefault();open(i);});
 t.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&t===im){open(i);}});});
function swipe(el,fn){var x0=null,y0=0;el.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
 el.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
 if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)fn(dx<0?1:-1);},{passive:true});}
function go(rel){var a=document.querySelector('.pn a[rel='+rel+']');if(a)location.href=a.href;}
var vol=document.querySelector('.adv-case .vol.on');if(vol)vol.parentNode.scrollLeft=vol.offsetLeft-vol.parentNode.clientWidth/2+vol.clientWidth/2;
var art=document.querySelector('.piece-art');if(art)swipe(art,function(d){go(d>0?'next':'prev');});
document.addEventListener('keydown',function(ev){
 if(lb){if(ev.key==='Escape')close();else if(ev.key==='ArrowRight')step(1);else if(ev.key==='ArrowLeft')step(-1);return;}
 if(ev.defaultPrevented||ev.altKey||ev.ctrlKey||ev.metaKey)return;
 var el=document.activeElement;if(el&&(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)||el.isContentEditable||el.closest('.slides,.walk-wall,.fw,.faasc-wall,[role=dialog]')))return;
 if(document.querySelector('.walk-ov,.fw-ov'))return;
 if(ev.key==='ArrowRight')go('next');else if(ev.key==='ArrowLeft')go('prev');});
})();