'use strict';
/* Modelos educativos. Unidades explícitas; ninguna recomendación automática de diseño. */
const OyaMath = (() => {
  const area = d => Math.PI*d*d/4;
  function positive(values) { if (values.some(v => !Number.isFinite(v)||v<=0)) throw new Error('Introduce valores finitos mayores que cero.'); }
  function integer(values) { if (values.some(v => !Number.isInteger(v)||v<1)) throw new Error('Los recuentos deben ser enteros positivos.'); }
  function turns(v) {
    positive([v.n,v.v1,v.v2,v.f1,v.f2]); integer([v.n]);
    const exact=v.n*(v.v2/v.v1)*(v.f1/v.f2), rounded=Math.round(exact);
    if(rounded<1) throw new Error('El resultado redondeado es menor que una espira. Revisa los datos.');
    return [['Espiras teóricas',exact,''],['Espiras redondeadas',rounded,''],['Cambio de flujo por redondeo',100*(exact/rounded-1),'%']];
  }
  function parallel(v) { positive([v.d,v.a,v.b]); integer([v.a,v.b]); return [['Diámetro teórico por hilo',v.d*Math.sqrt(v.a/v.b),'mm'],['Sección total de cobre',v.a*area(v.d),'mm²'],['Sección por hilo nuevo',v.a*area(v.d)/v.b,'mm²']]; }
  function gauge(v) { if(!Number.isInteger(v.awg)||v.awg<0||v.awg>40) throw new Error('Introduce un calibre AWG entero entre 0 y 40.'); const d=.127*Math.pow(92,(36-v.awg)/39); return [['Diámetro desnudo',d,'mm'],['Sección de cobre',area(d),'mm²']]; }
  function speed(v) {
    positive([v.f,v.p]); integer([v.p]); if(v.p%2) throw new Error('El número de polos debe ser par.');
    const ns=120*v.f/v.p, rows=[['Velocidad síncrona',ns,'r/min']];
    if(v.rpm!==null) { if(!Number.isFinite(v.rpm)||v.rpm<0) throw new Error('La velocidad medida debe ser cero o positiva.'); rows.push(['Deslizamiento',100*(ns-v.rpm)/ns,'%']); }
    return rows;
  }
  function copper(v) {
    positive([v.n,v.coils,v.mlt,v.d,v.h]); integer([v.n,v.coils,v.h]);
    if(!Number.isFinite(v.extra)||v.extra<0||v.extra>100) throw new Error('El margen debe estar entre 0 y 100 %.');
    const length=v.n*v.coils*v.mlt/1000*v.h, mass=length*area(v.d)*.00896;
    return [['Longitud total de todos los hilos',length,'m'],['Masa neta de cobre',mass,'kg'],['Masa con margen de compra',mass*(1+v.extra/100),'kg']];
  }
  function resistance(v) {
    positive([v.r]); if(!Number.isFinite(v.t1)||!Number.isFinite(v.t2)||v.t1<0||v.t2<0||v.t1>200||v.t2>200) throw new Error('Este modelo admite temperaturas de 0 a 200 °C.');
    return [['Resistencia a la temperatura de referencia',v.r*(234.5+v.t2)/(234.5+v.t1),'Ω']];
  }
  function imbalance(v) { positive([v.ab,v.bc,v.ca]); const avg=(v.ab+v.bc+v.ca)/3, dev=Math.max(...[v.ab,v.bc,v.ca].map(x=>Math.abs(x-avg))); return [['Promedio entre líneas',avg,'V'],['Máxima desviación',dev,'V'],['Desequilibrio por magnitudes',100*dev/avg,'%']]; }
  return {area,turns,parallel,gauge,speed,copper,resistance,imbalance};
})();
if(typeof module!=='undefined') module.exports=OyaMath;
if(typeof document!=='undefined') {
  const format=new Intl.NumberFormat('es',{maximumFractionDigits:4});
  document.querySelectorAll('form[data-model]').forEach(form=>{
    const result=document.getElementById(form.dataset.result);
    const run=()=>{
      result.replaceChildren();
      try {
        const data={};
        for(const input of form.querySelectorAll('[name]')) { const raw=input.value.trim().replace(',','.'); data[input.name]=raw===''?null:Number(raw); }
        const rows=OyaMath[form.dataset.model](data);
        for(const [label,value,unit] of rows) { if(!Number.isFinite(value)) throw new Error('Resultado fuera de rango. Revisa los datos.'); const line=document.createElement('div'),name=document.createElement('span'),number=document.createElement('strong'); name.textContent=label; number.textContent=format.format(value)+(unit?' '+unit:''); line.append(name,number); result.append(line); }
        const note=document.createElement('p'); note.className='result-note'; note.textContent='Resultado orientativo. No es una autorización de conexión ni una validación del diseño.'; result.append(note);
      } catch(error) { result.replaceChildren(); const p=document.createElement('p'); p.className='error'; p.textContent=error.message; result.append(p); }
    };
    form.addEventListener('submit',event=>{event.preventDefault();run();});
    form.addEventListener('reset',()=>setTimeout(()=>result.replaceChildren(),0));
  });
  const menu=document.getElementById('nav-toggle');
  if(menu)menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));document.getElementById('nav-links').classList.toggle('open',!open);});
  const search=document.getElementById('guide-search');
  if(search)search.addEventListener('input',()=>{const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let count=0;document.querySelectorAll('[data-guide]').forEach(card=>{card.hidden=!norm(card.textContent).includes(norm(search.value));if(!card.hidden)count++;});document.getElementById('search-count').textContent=count+' guías disponibles';});
  document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
}
