// Photos come from ImageBB, which sometimes drops one of several simultaneous requests.
// Retry a failed photo once, after a short pause, before giving up.
export function retryOnce(event) {
  const img = event.currentTarget;
  if (img.dataset.retried) return;
  img.dataset.retried = "1";
  setTimeout(() => {
    img.src = img.src.split("?")[0] + "?retry=1";
  }, 800);
}
