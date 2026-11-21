import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createEffect, createSignal, onSettled, Show } from "solid-js";
import countriesData from "../data/world-countries.json";
import { linkProps } from "../router.js";
import { getRandomIntInclusive, moveElement } from "../utils/helpers.js";
import { flyToCoords, scorePercent, shuffleNames } from "../utils/quiz.js";
import styles from "./Map.module.css";

const SOURCE = "map-source";
const FILL = "map-fill";
const BORDER = "map-border";

export default function Quiz() {
  // Without a token Mapbox throws on startup. Say why in the console only: nothing
  // about our setup should be shown on a public page.
  if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
    console.error("Quiz map not started: no Mapbox token was set when the site was built.");
    return (
      <div style="padding: 10px;">
        <a class="btn btn-light btn-sm" {...linkProps("/")}>← Resume</a>
      </div>
    );
  }

  // Things Mapbox owns or that never drive the UI: plain variables, not signals.
  let mapContainer;
  let map;
  let answerPopup = null;
  let correctAnswerPopup = null;
  let clickEvent = null;
  let shuffledQuestions = [];
  let neighborhoodsData = null; // loaded on demand (4.4 MB)

  // Things the UI shows: signals.
  const [quizType, setQuizType] = createSignal(null); // "neighborhoods" | "countries" | null
  const [total, setTotal] = createSignal(null); // number of questions in this quiz, counted from the data
  const [currentQuestion, setCurrentQuestion] = createSignal(null);
  const [isCorrect, setIsCorrect] = createSignal(null);
  const [popupVisible, setPopupVisible] = createSignal(false);
  const [quizCompleted, setQuizCompleted] = createSignal(false);
  const [numberCorrect, setNumberCorrect] = createSignal(0);
  const [numberAsked, setNumberAsked] = createSignal(0);
  const [showStartButtons, setShowStartButtons] = createSignal(true);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = createSignal(false);

  // Finished when every question has been answered correctly.
  createEffect(
    () => numberCorrect(),
    (n) => {
      if (total() !== null && n === total()) {
        setPopupVisible(false);
        setQuizCompleted(true);
      }
    },
  );

  onSettled(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/chrismjones81/cm8i8mbfv014q01sob0sy9piw",
      pitchWithRotate: false,
      dragRotate: false,
      center: [getRandomIntInclusive(-180, 180), getRandomIntInclusive(-90, 90)],
      zoom: 1,
    });

    map.touchPitch.disable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.disableRotation();

    let hoveredFeatureId = null;

    map.on("load", () => {
      map.addSource(SOURCE, { type: "geojson", data: countriesData, generateId: true });

      // fill-opacity reads feature-state, which is how hover/click highlighting works.
      map.addLayer({
        id: FILL,
        type: "fill",
        source: SOURCE,
        layout: {},
        paint: {
          "fill-color": "#fae8a2",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "clicked"], false], 0.4,
            ["boolean", ["feature-state", "hover"], false], 0.4,
            0.9,
          ],
        },
      });

      map.addLayer({
        id: BORDER,
        type: "line",
        source: SOURCE,
        layout: {},
        paint: { "line-color": "#000000", "line-width": 0.9 },
      });

      map.on("mousemove", FILL, (e) => {
        if (e.features.length === 0) return;
        if (hoveredFeatureId !== null) {
          map.setFeatureState({ source: SOURCE, id: hoveredFeatureId }, { hover: false });
        }
        hoveredFeatureId = e.features[0].id;
        map.setFeatureState({ source: SOURCE, id: hoveredFeatureId }, { hover: true });
      });

      map.on("mouseleave", FILL, () => {
        if (hoveredFeatureId !== null) {
          map.setFeatureState({ source: SOURCE, id: hoveredFeatureId }, { hover: false });
        }
        hoveredFeatureId = null;
      });

      map.on("click", FILL, handleFeatureClick);
    });

    // Touching the map while the result banner is up moves on to the next question.
    const onInteract = () => {
      if (popupVisible()) handleNextQuestion();
    };
    map.on("mousedown", onInteract);
    map.on("touchstart", onInteract);

    // Without this, navigating away and back would leave overlapping maps.
    return () => map.remove();
  });

  function removePopups() {
    answerPopup?.remove();
    correctAnswerPopup?.remove();
  }

  function setFeatureStateForAll(state) {
    for (const feature of map.querySourceFeatures(SOURCE)) {
      map.setFeatureState({ source: SOURCE, id: feature.id }, state);
    }
  }

  const resetClickedFeatureFill = () => setFeatureStateForAll({ clicked: false });
  const resetAnswerHighlight = () => setFeatureStateForAll({ answerHighlight: false });

  function setQuestion() {
    setCurrentQuestion(shuffledQuestions[0]);
  }

  function handleFeatureClick(e) {
    removePopups();
    resetClickedFeatureFill();
    clickEvent = e;

    const clickedId = e.features[0].id;
    map.setFeatureState({ source: SOURCE, id: clickedId }, { clicked: true });
    submitAnswer(clickedId);
  }

  function handleNextQuestion() {
    resetClickedFeatureFill();
    resetAnswerHighlight();
    setIsCorrect(null);
    setPopupVisible(false);
    removePopups();
  }

  function highlightAnswer(correct) {
    const id = map.querySourceFeatures(SOURCE).find((f) => f.properties.name === currentQuestion())?.id;
    map.setFeatureState({ source: SOURCE, id }, { answerHighlight: correct ? "correct" : "wrong" });
    map.setPaintProperty(FILL, "fill-color", [
      "case",
      ["==", ["feature-state", "answerHighlight"], "correct"], "#10b526",
      ["==", ["feature-state", "answerHighlight"], "wrong"], "#ff0000",
      "#fae8a2",
    ]);
  }

  function submitAnswer(featureId) {
    const selected = map.querySourceFeatures(SOURCE).find((f) => f.id === featureId);
    if (!selected) {
      alert("Please select a feature to check the answer");
      return;
    }

    setNumberAsked((n) => n + 1);

    answerPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat(clickEvent.lngLat)
      .setHTML(selected.properties.name)
      .addTo(map);

    const question = currentQuestion();

    if (selected.properties.name === question) {
      setIsCorrect(true);
      setNumberCorrect((n) => n + 1);
      highlightAnswer(true);
      // Remove the answered question from the list.
      shuffledQuestions = shuffledQuestions.filter((name) => name !== question);
    } else {
      setIsCorrect(false);
      highlightAnswer(false);
      shuffledQuestions = moveElement(shuffledQuestions, 2);

      // Show where the right answer was. If there is somehow no position for it, skip this
      // rather than failing the whole answer.
      let coords;
      let zoom;
      if (quizType() === "countries") {
        coords = flyToCoords(question);
        zoom = 3;
      } else {
        const centroid = neighborhoodsData.features.find((f) => f.properties.name === question)?.properties.centroid;
        coords = centroid ? [centroid.longitude, centroid.latitude] : null;
        zoom = 11;
      }
      if (coords) {
        correctAnswerPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
          .setLngLat(coords)
          .setHTML(question)
          .addTo(map);
        map.flyTo({ center: coords, zoom });
      }
    }

    setPopupVisible(true);
    setQuestion();
  }

  function skipQuestion() {
    shuffledQuestions = moveElement(shuffledQuestions, shuffledQuestions.length - 1);
    setQuestion();
  }

  function startCountriesQuiz() {
    setQuizType("countries");
    setShowStartButtons(false);
    map.getSource(SOURCE)?.setData(countriesData);
    shuffledQuestions = shuffleNames(countriesData.features.map((f) => f.properties.name));
    setTotal(shuffledQuestions.length);
    setQuestion();
  }

  async function startNeighborhoodQuiz() {
    if (!neighborhoodsData) {
      setLoadingNeighborhoods(true);
      try {
        // Loaded on demand so the 4.4 MB file isn't part of the first page load.
        neighborhoodsData = (await import("../data/seattle_neighborhoods_with_centroid.json")).default;
      } catch {
        alert("Could not load the neighborhood data. Please try again.");
        return;
      } finally {
        setLoadingNeighborhoods(false);
      }
    }
    setQuizType("neighborhoods");
    setShowStartButtons(false);
    map.flyTo({ center: [-122.3328, 47.6061], zoom: 10 });
    map.getSource(SOURCE)?.setData(neighborhoodsData);
    shuffledQuestions = shuffleNames(neighborhoodsData.features.map((f) => f.properties.name));
    setTotal(shuffledQuestions.length);
    setQuestion();
  }

  function handleRestart() {
    const type = quizType();
    removePopups();
    resetAnswerHighlight();
    setQuizCompleted(false);
    setCurrentQuestion(null);
    setPopupVisible(false);
    setIsCorrect(null);
    shuffledQuestions = [];
    setNumberAsked(0);
    setNumberCorrect(0);
    setShowStartButtons(true);
    if (type === "neighborhoods") startNeighborhoodQuiz();
    else startCountriesQuiz();
  }

  return (
    <div class={styles.mapRoot}>
      <a class="btn btn-light btn-sm" style="position: absolute; top: 10px; right: 10px; z-index: 5;" {...linkProps("/")}>
        ← Resume
      </a>

      <Show when={showStartButtons()}>
        <div style="position: absolute; top: 10px; left: 15px; z-index: 1;">
          <button class={styles.startBtn} disabled={loadingNeighborhoods()} onClick={startNeighborhoodQuiz}>
            {loadingNeighborhoods() ? "Loading…" : "Start Seattle Neighborhood Quiz"}
          </button>
        </div>
        <div style="position: absolute; top: 70px; left: 15px; z-index: 3;">
          <button class={styles.countriesStartBtn} onClick={startCountriesQuiz}>
            Start Countries Quiz
          </button>
        </div>
      </Show>

      <Show when={currentQuestion()}>
        <div class={styles.questionScoreContainer}>
          <div class={styles.questionContainer}>
            <p class={styles.noMargin}>
              Question {numberAsked() + 1} of {total()} | Score: {scorePercent(numberCorrect(), numberAsked())}%
            </p>
            <p class={styles.noMargin}>Where is {currentQuestion()}?</p>
          </div>
          <div class={styles.buttonContainer}>
            <button class={styles.skipButton} onClick={skipQuestion}>
              Skip Question
            </button>
          </div>
        </div>
      </Show>

      <Show when={!showStartButtons()}>
        <div class={styles.restartButton}>
          <button class={styles.restartButtonInner} onClick={handleRestart}>
            Restart
          </button>
        </div>
      </Show>

      <Show when={popupVisible()}>
        <div
          class={{
            [styles.popupStyles]: true,
            [styles.correct]: isCorrect() === true,
            [styles.incorrect]: isCorrect() === false,
          }}
        >
          <div class={styles.messageStyles}>
            {isCorrect() === null
              ? "Select a feature to check the answer"
              : isCorrect()
                ? "Correct!"
                : "Incorrect :("}
          </div>
        </div>
      </Show>

      <Show when={quizCompleted()}>
        <div class={styles.popupStyles}>
          <div class={styles.messageStyles}>
            Quiz Completed! Congratulations! Score: {scorePercent(numberCorrect(), numberAsked())}%
          </div>
          <button onClick={handleRestart} class={styles.nextButton}>
            Restart
          </button>
        </div>
      </Show>

      <div ref={(el) => (mapContainer = el)} class={styles.mapContainer} />
    </div>
  );
}
