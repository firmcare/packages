/**
 * Default SWR fetcher — throws on non-ok so SWR treats it as an error.
 */
export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
