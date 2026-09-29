// Called inside the game's engine scope so snapshots use the existing save format.
function installNativeLifecycle() {
  let paused = false;
  const pause = () => {
    paused = true;
    setAuto(false);
    setSkip(false);
    autoSave();
    saveP(true);
    AU.suspend();
  };
  const resume = () => {
    if (!paused) return;
    paused = false;
    if ($('#warn').classList.contains('off')) AU.resume();
  };
  const back = () => {
    const confirm = $('#confirm');
    if (confirm.classList.contains('on')) { confirm.classList.remove('on'); return true; }
    if ($('#cgview').classList.contains('on')) { $('#cgview').classList.remove('on'); return true; }
    if (isModal()) { closeModal(); return true; }
    if (hidden) { setHidden(false); return true; }
    if (inGame || cardOpen) { setAuto(false); setSkip(false); openModal('menu'); return true; }
    return false;
  };
  window.swlNative = Object.freeze({ pause, resume, back });
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
  window.addEventListener('pagehide', pause);
  window.addEventListener('beforeunload', pause);
  // Some mobile WebViews only allow audio to resume after a fresh gesture.
  document.addEventListener('pointerdown', () => { if (!document.hidden && $('#warn').classList.contains('off')) AU.resume(); }, { passive: true });
}
