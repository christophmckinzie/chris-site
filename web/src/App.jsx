import { Switch, Match, Loading, lazy } from "solid-js";
import Resume from "./pages/Resume.jsx";
import Weather from "./pages/Weather.jsx";
import { path, useBackButton } from "./router.js";

// Mapbox is large, so the quiz page is only downloaded when someone opens /quiz.
const Quiz = lazy(() => import("./pages/Quiz.jsx"));

export default function App() {
  useBackButton();
  return (
    <Loading fallback={<p style="padding: 20px;">Loading…</p>}>
      <Switch fallback={<Resume />}>
        <Match when={path() === "/weather-routing"}>
          <Weather />
        </Match>
        <Match when={path() === "/quiz"}>
          <Quiz />
        </Match>
      </Switch>
    </Loading>
  );
}
