(() => {
  const briefing = document.getElementById('nightfall-briefing');
  const forest = document.querySelector('[data-course-forest]');
  const player = document.getElementById('nightfall-player');
  const play = document.getElementById('play-nightfall');
  const close = document.getElementById('close-nightfall');
  let game;
  let briefingScroll = 0;

  play.addEventListener('click', () => {
    if (game) return;
    briefingScroll = window.scrollY;
    game = document.createElement('iframe');
    game.title = 'Pip: Operation Nightfall';
    game.allow = 'autoplay; fullscreen; pointer-lock';
    game.allowFullscreen = true;
    game.src = './game/';
    briefing.hidden = true;
    forest.hidden = true;
    player.hidden = false;
    player.append(game);
    window.scrollTo(0, 0);
    game.focus({ preventScroll: true });
  });

  close.addEventListener('click', () => {
    if (!game) return;
    game.remove();
    game = null;
    player.hidden = true;
    briefing.hidden = false;
    forest.hidden = false;
    window.scrollTo(0, briefingScroll);
    play.focus({ preventScroll: true });
  });
})();
