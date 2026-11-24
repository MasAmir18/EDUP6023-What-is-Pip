(() => {
  const track = document.getElementById("detective-theme");
  track.volume = .55;
  const play = () => {
    if (track.paused && !track.error) track.play().catch(() => {});
  };
  for (const event of ["pointerdown", "click", "keydown"]) {
    window.addEventListener(event, play, {capture:true,passive:true});
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) play();
  });
  play();
})();
