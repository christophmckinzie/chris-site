import { createSignal, createMemo, isPending, Loading, Errored, Show } from "solid-js";
import Nav from "../Nav.jsx";
import styles from "./Resume.module.css";

// Local calendar date (not UTC), offset by N days.
function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function generateMap(req) {
  const res = await fetch("/api/generate-weather-map", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to generate map. Please check your inputs.");
  const { map_url } = await res.json();
  // The server rewrites the same file each time, so change the URL to make the iframe reload.
  return `${map_url}?t=${Date.now()}`;
}

export default function Weather() {
  const minDate = isoDate(1);
  const maxDate = isoDate(4);

  // The submitted form values. null until the first submit.
  const [request, setRequest] = createSignal(null);

  // Async derived value: re-runs whenever a new request is submitted.
  // The request is read synchronously, before the fetch starts, so it is tracked.
  const mapUrl = createMemo(() => {
    const req = request();
    return req ? generateMap(req) : null;
  });

  // True while a changed request is in flight (after the first map has shown).
  const busy = () => isPending(() => mapUrl());

  const onSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setRequest({ start: form.get("start"), end: form.get("end"), date: form.get("date") });
  };

  return (
    <div class={styles.root}>
      <Nav />
      <div class={styles.cv}>
        <div class={styles.mainDetails}>
          <h1 class={styles.weatherTitle}>Finding Weather Along A Driving Route</h1>
          <div class={styles.clear} />
        </div>

        <div class={styles.mainArea}>
          <form autocomplete="on" onSubmit={onSubmit}>
            <div class="form-group">
              <label for="start_address">Starting Address</label>
              <input class="form-control" type="text" id="start_address" name="start" autocomplete="address-line1" value="Seattle, WA" required />
            </div>
            <div class="form-group">
              <label for="end_address">Ending Address</label>
              <input class="form-control" type="text" id="end_address" name="end" value="Moses Lake, WA" required />
            </div>
            <div class="form-group">
              <label for="date">Travel Date</label>
              <input class="form-control" type="date" id="date" name="date" value={minDate} min={minDate} max={maxDate} required />
            </div>
            <br />
            <div>
              <button class="btn btn-primary" type="submit" disabled={busy()}>
                {busy() ? "Generating…" : "Generate Map"}
              </button>
            </div>
          </form>

          <div style="margin-top: 20px;">
            <Errored
              fallback={(err, reset) => (
                <p>
                  {err().message}{" "}
                  <button class="btn btn-link" type="button" onClick={reset}>
                    Retry
                  </button>
                </p>
              )}
            >
              <Loading fallback={<p>Generating map…</p>}>
                <Show when={mapUrl()}>{(url) => <iframe src={url()} title="Weather route map" style="width: 100%; height: 600px; border: 1px solid #ccc;" />}</Show>
              </Loading>
            </Errored>
          </div>
        </div>
      </div>
    </div>
  );
}
