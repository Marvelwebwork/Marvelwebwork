const missionForm = document.querySelector("#missionForm");
const missionList = document.querySelector("#missionList");
const missionCount = document.querySelector("#missionCount");
const completedCount = document.querySelector("#completedCount");
const highPriorityCount = document.querySelector("#highPriorityCount");
const nextDueDate = document.querySelector("#nextDueDate");
const filterButtons = document.querySelectorAll(".chip");

const STORAGE_KEY = "marvel.missions";

const state = {
  missions: loadMissions(),
  filter: "all",
};

function loadMissions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [
      buildMission({
        title: "Review the weekly roadmap",
        priority: "High",
        due: nextDate(1),
      }),
      buildMission({
        title: "Publish progress update",
        priority: "Medium",
        due: nextDate(3),
      }),
    ];
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed.map((mission) => ({
      ...mission,
      due: mission.due || "",
      createdAt: mission.createdAt || Date.now(),
    }));
  } catch (error) {
    return [];
  }
}

function persistMissions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.missions));
}

function buildMission({ title, priority, due }) {
  return {
    id: crypto.randomUUID(),
    title,
    priority,
    due: due || "",
    completed: false,
    createdAt: Date.now(),
  };
}

function nextDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function render() {
  missionList.innerHTML = "";

  const missions = filteredMissions();

  if (missions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "mission";
    empty.innerHTML =
      "<div><p class=\"mission__title\">No missions here yet.</p><p class=\"mission__meta\">Add a mission to get moving.</p></div>";
    missionList.appendChild(empty);
  } else {
    missions.forEach((mission) => {
      missionList.appendChild(createMissionCard(mission));
    });
  }

  updateStats();
}

function filteredMissions() {
  if (state.filter === "active") {
    return state.missions.filter((mission) => !mission.completed);
  }

  if (state.filter === "completed") {
    return state.missions.filter((mission) => mission.completed);
  }

  return [...state.missions].sort((a, b) => b.createdAt - a.createdAt);
}

function createMissionCard(mission) {
  const card = document.createElement("article");
  card.className = "mission";
  if (mission.completed) {
    card.classList.add("mission--completed");
  }

  const badgeClass = `mission__badge--${mission.priority.toLowerCase()}`;

  const dueLabel = mission.due ? formatDueDate(mission.due) : "No due date";

  card.innerHTML = `
    <div>
      <p class="mission__title">${mission.title}</p>
      <div class="mission__meta">
        <span class="mission__badge ${badgeClass}">${mission.priority}</span>
        <span>Due: ${dueLabel}</span>
      </div>
    </div>
    <div class="mission__actions">
      <button class="mission__toggle" data-completed="${mission.completed}"></button>
      <button class="mission__delete">Remove</button>
    </div>
  `;

  const toggle = card.querySelector(".mission__toggle");
  const removeButton = card.querySelector(".mission__delete");

  toggle.addEventListener("click", () => {
    mission.completed = !mission.completed;
    persistMissions();
    render();
  });

  removeButton.addEventListener("click", () => {
    state.missions = state.missions.filter((item) => item.id !== mission.id);
    persistMissions();
    render();
  });

  return card;
}

function formatDueDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function updateStats() {
  const active = state.missions.filter((mission) => !mission.completed).length;
  const completed = state.missions.filter((mission) => mission.completed).length;
  const highPriority = state.missions.filter(
    (mission) => mission.priority === "High"
  ).length;

  missionCount.textContent = active;
  completedCount.textContent = completed;
  highPriorityCount.textContent = highPriority;

  const upcoming = state.missions
    .filter((mission) => mission.due)
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  nextDueDate.textContent = upcoming.length
    ? formatDueDate(upcoming[0].due)
    : "—";
}

missionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(missionForm);
  const title = formData.get("missionTitle").trim();
  const priority = formData.get("missionPriority");
  const due = formData.get("missionDue");

  if (!title) {
    return;
  }

  state.missions.unshift(buildMission({ title, priority, due }));
  persistMissions();
  missionForm.reset();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((chip) => chip.classList.remove("chip--active"));
    button.classList.add("chip--active");
    state.filter = button.dataset.filter;
    render();
  });
});

render();
