// Verbatim approved copy from docs/canon-miro.txt. Rewards remain separate UI notices.
export const STORY_LINES = {
  radio:['Кто-нибудь… слышит? Я за завалом. Воздуха почти не осталось…'],
  rescue:[
    'Живой… Я уж думал, никто не остался. Все ушли искать другие бункеры.',
    'Я задержался — хотел забрать инструмент. Тут начался обвал.',
    'Меня заперло, а лифт засыпало землёй. Держи карту от лифта — она откроет доступ на первый этаж.',
    'Спасибо, что вытащил. Теперь надо добраться до лифта — другого пути отсюда нет'
  ],
  porodnik:[
    {speaker:'Серёга Т',text:'Вон «Породник». Автомат приёма породы. Давай починим.'},
    {speaker:'Герой',text:'Зачем нам он?'},
    {speaker:'Серёга Т',text:'Сдаёшь землю — получаешь кредиты.'},
    {speaker:'Герой',text:'А земля ему зачем?'},
    {speaker:'Серёга Т',text:'На переработку. Бункер из этой породы и строили.'},
    {speaker:'Герой',text:'Как его запустить?'},
    {speaker:'Серёга Т',text:'Ты расчисти приёмник, я восстановлю питание.'},
    {speaker:'Герой',text:'Договорились.'}
  ]
};
export function storyPresentation(kind,page) {
  const entry=STORY_LINES[kind][page];
  const speaker=typeof entry==='string'?'Серёга Т':entry.speaker;
  return {text:typeof entry==='string'?entry:entry.text,speaker,
    portrait:kind==='rescue'&&page>=2?'serega-portrait.webp':'serega-neutral.webp'};
}
