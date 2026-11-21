import { For, Show } from "solid-js";
import Nav from "../Nav.jsx";
import { contact, sections } from "../data/resume.js";
import { linkProps } from "../router.js";
import headshot from "../assets/headshot.jpg";
import styles from "./Resume.module.css";

function Bullets(props) {
  return (
    <ul class={styles.dashed}>
      <For each={props.items}>{(item) => <li>{item}</li>}</For>
    </ul>
  );
}

function Title(props) {
  return (
    <h2>
      <Show when={props.article.link} fallback={props.article.title}>
        <a {...linkProps(props.article.link.to)}>{props.article.title}</a>
      </Show>
    </h2>
  );
}

function Article(props) {
  return (
    <article>
      <Show
        when={props.article.blocks}
        fallback={
          <>
            <Show when={props.article.title}>
              <Title article={props.article} />
            </Show>
            <For each={props.article.sub ?? []}>{(line) => <p class={styles.subDetails}>{line}</p>}</For>
            <Show when={props.article.bullets}>
              <Bullets items={props.article.bullets} />
            </Show>
          </>
        }
      >
        <For each={props.article.blocks}>
          {(block) => (
            <>
              <h2>{block.title}</h2>
              <Bullets items={block.bullets} />
            </>
          )}
        </For>
      </Show>
    </article>
  );
}

export default function Resume() {
  return (
    <div class={styles.root}>
      <Nav />
      <div class={styles.cv}>
        <div class={styles.mainDetails}>
          <div class={styles.headshot}>
            <img src={headshot} alt="Chris Jones" />
          </div>

          <div class={styles.name}>
            <h1>Christopher M. Jones</h1>
            <h2>Software Engineer</h2>
          </div>

          <div class={`${styles.contactDetails} ${styles.quickFade} ${styles.delayFour}`}>
            <ul>
              <For each={contact}>
                {(c) => (
                  <li>
                    {c.label}:{" "}
                    <a href={c.href} target="_blank" rel="noopener noreferrer">
                      {c.text}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
          <div class={styles.clear} />
        </div>

        <div class={styles.mainArea}>
          <For each={sections}>
            {(section) => (
              <section>
                <div class={styles.sectionTitle}>
                  <h1>{section.title}</h1>
                </div>
                <For each={section.groups}>
                  {(articles) => (
                    <div class={styles.sectionContent}>
                      <For each={articles}>{(article) => <Article article={article} />}</For>
                    </div>
                  )}
                </For>
                <div class={styles.clear} />
              </section>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
