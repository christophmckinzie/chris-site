import { createSignal } from "solid-js";
import { path, linkProps } from "./router.js";

function NavLink(props) {
  return (
    <li class="nav-item">
      <a
        class={{ "nav-link": true, active: path() === props.to }}
        aria-current={path() === props.to ? "page" : undefined}
        {...linkProps(props.to)}
      >
        {props.children}
      </a>
    </li>
  );
}

export default function Nav() {
  // Replaces Bootstrap's collapse JavaScript: the menu is just a class toggle.
  const [open, setOpen] = createSignal(false);

  return (
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <a class="navbar-brand" style="padding-left: 10px; padding-bottom: 9px; padding-right: 15px;" {...linkProps("/")}>
        Welcome
      </a>
      <button
        class="navbar-toggler"
        type="button"
        aria-controls="navbarNavDropdown"
        aria-expanded={open()}
        aria-label="Toggle navigation"
        onClick={() => setOpen((o) => !o)}
      >
        <span class="navbar-toggler-icon" />
      </button>
      <div class={{ collapse: true, "navbar-collapse": true, show: open() }} id="navbarNavDropdown">
        <ul class="navbar-nav">
          <NavLink to="/">Resume</NavLink>
          <NavLink to="/quiz">Geography Quiz</NavLink>
          <NavLink to="/weather-routing">Weather On Route</NavLink>
        </ul>
      </div>
    </nav>
  );
}
