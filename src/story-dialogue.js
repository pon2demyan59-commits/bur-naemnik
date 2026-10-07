import { storyPresentation } from './story-content.js';
export function showStoryDialogue(scene,{kind,lines,page=0,onPage,onFinish}) {
  const previousFocus=document.activeElement;
  const dialog=document.createElement('dialog');dialog.className='story-dialogue';dialog.setAttribute('aria-labelledby','story-name');
  dialog.innerHTML=`<section class="story-layout"><img class="story-portrait" src="./public/assets/ui/serega-neutral.webp" alt="Серёга Т, строитель"><div class="story-speech"><header class="story-nameplate"><strong id="story-name">СЕРЁГА Т</strong><span>СТРОИТЕЛЬ</span></header><p class="story-line" aria-live="polite"></p><footer><span class="story-count"></span><button class="story-next" type="button">ДАЛЕЕ ▶</button></footer></div></section>`;
  document.querySelector('#ui').append(dialog);document.querySelector('#ui').classList.add('story-open');
  const line=dialog.querySelector('.story-line'),next=dialog.querySelector('.story-next'),count=dialog.querySelector('.story-count');
  let index=Math.max(0,Math.min(page,lines.length-1)),closed=false;
  const render=()=>{const presentation=storyPresentation(kind,index);line.textContent=presentation.text;dialog.querySelector('#story-name').textContent=presentation.speaker.toUpperCase();dialog.querySelector('.story-nameplate span').textContent=presentation.role;dialog.classList.toggle('player-turn',presentation.speaker==='Герой');dialog.querySelector('.story-portrait').alt=presentation.speaker;dialog.querySelector('.story-portrait').src='./public/assets/ui/'+presentation.portrait;count.textContent=`${index+1} / ${lines.length}`;};
  const cleanup=()=>{document.removeEventListener('keydown',keyboard,true);dialog.removeEventListener('cancel',cancel);dialog.remove();document.querySelector('#ui').classList.remove('story-open');};
  const finish=()=>{if(closed)return;closed=true;cleanup();scene.events.off('shutdown',abort);scene.input.enabled=true;scene.scene.resume();onFinish();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});};
  const advance=()=>{if(index<lines.length-1){index++;render();onPage(index);}else finish();};
  const keyboard=event=>{if(['Enter','Space','KeyE'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)advance();}else if(['Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();}};
  const cancel=event=>event.preventDefault();
  const abort=()=>{closed=true;cleanup();};
  next.addEventListener('click',advance);dialog.addEventListener('cancel',cancel);document.addEventListener('keydown',keyboard,true);scene.events.once('shutdown',abort);
  render();dialog.showModal();next.focus({preventScroll:true});scene.input.enabled=false;scene.scene.pause();
}

