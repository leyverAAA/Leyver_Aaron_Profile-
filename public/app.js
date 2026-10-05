const terminalMessages = [
  {
    command: "building reliable cloud infrastructure",
    response: "[ system architecture initialized ]",
  },
  {
    command: "terraform plan && terraform apply",
    response: "[ infrastructure state: synchronized ]",
  },
  {
    command: "docker | kubernetes | ci/cd",
    response: "[ delivery pipeline: ready ]",
  },
  {
    command: "automating infrastructure with code",
    response: "[ manual operations: minimized ]",
  },
];

const commandElement = document.querySelector("#typed-command");
const responseElement = document.querySelector("#terminal-response");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactViewport = window.matchMedia("(max-width: 740px)").matches;
let messageIndex = 0;
let characterIndex = 0;
let deleting = false;

function typeTerminal() {
  if (!commandElement || !responseElement) return;

  const message = terminalMessages[messageIndex];
  const command = message.command;

  if (!deleting) {
    commandElement.textContent = command.slice(0, characterIndex + 1);
    characterIndex += 1;

    if (characterIndex === command.length) {
      responseElement.textContent = message.response;
      deleting = true;
      window.setTimeout(typeTerminal, 2400);
      return;
    }
  } else {
    commandElement.textContent = command.slice(0, characterIndex - 1);
    characterIndex -= 1;

    if (characterIndex === 0) {
      deleting = false;
      messageIndex = (messageIndex + 1) % terminalMessages.length;
    }
  }

  window.setTimeout(typeTerminal, deleting ? 24 : 40);
}

function rotateCompactTerminal() {
  if (!commandElement || !responseElement) return;
  const message = terminalMessages[messageIndex];
  commandElement.classList.add("is-switching");
  window.setTimeout(() => {
    commandElement.textContent = message.command;
    responseElement.textContent = message.response;
    commandElement.classList.remove("is-switching");
  }, 180);
  messageIndex = (messageIndex + 1) % terminalMessages.length;
  window.setTimeout(rotateCompactTerminal, 4200);
}

if (!reduceMotion && commandElement && compactViewport) {
  commandElement.textContent = terminalMessages[0].command;
  responseElement.textContent = terminalMessages[0].response;
  window.setTimeout(rotateCompactTerminal, 4200);
} else if (!reduceMotion && commandElement) {
  commandElement.textContent = "";
  window.setTimeout(typeTerminal, 700);
}

const revealTargets = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const railLinks = [...document.querySelectorAll(".rail-nav a")];
const sections = railLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && railLinks.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.style.color = active ? "var(--paper)" : "";
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
  );
  sections.forEach((section) => sectionObserver.observe(section));
}
