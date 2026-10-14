// ==========================================
// TO-DO LIST
// ==========================================

const STORAGE_KEY = "todoTasks";
const LEGACY_KEY = "jeriTodoTasks"; // tasks saved by the earlier portfolio version
const EXIT_TIME = 320;              // must match the item-out animation

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const greeting = document.getElementById("greeting");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const submitButton = document.getElementById("submit-btn");
const todoList = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const emptyText = document.getElementById("empty-text");
const taskCount = document.getElementById("task-count");
const clearCompletedButton = document.getElementById("clear-completed");
const filtersBox = document.querySelector(".filters");
const filterButtons = document.querySelectorAll(".filter-btn");
const progressText = document.getElementById("progress-text");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");

// ------------------------------------------
// STATE
// ------------------------------------------

let tasks = [];
let editingTaskId = null;
let currentFilter = "all";
let newTaskId = null; // the newest task plays the "enter" animation

// ------------------------------------------
// STORAGE
// ------------------------------------------

function loadTasks() {
    try {
        const saved =
            localStorage.getItem(STORAGE_KEY) ||
            localStorage.getItem(LEGACY_KEY);

        const parsed = saved ? JSON.parse(saved) : [];
        tasks = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Unable to load tasks:", error);
        tasks = [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
    }
}

// ------------------------------------------
// HELPERS
// ------------------------------------------

const createTaskId = () =>
    Date.now().toString() + Math.random().toString(16).slice(2);

const findTask = (id) => tasks.find((task) => task.id === id);

function matchesFilter(task) {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
}

function stopEditing() {
    editingTaskId = null;
    submitButton.textContent = "Add";
    todoInput.value = "";
}

function removeWithAnimation(listItem, done) {
    listItem.classList.add("removing");
    setTimeout(done, reduceMotion ? 0 : EXIT_TIME);
}

function setGreeting() {
    const hour = new Date().getHours();

    greeting.textContent =
        hour < 12 ? "Good morning" :
        hour < 18 ? "Good afternoon" :
        "Good evening";
}

// ------------------------------------------
// CONFETTI (fires when every task is done)
// ------------------------------------------

const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");
const confettiColors = ["#7c5cff", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#ffffff"];

let particles = [];
let confettiFrame = null;

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    confettiCanvas.width = window.innerWidth * ratio;
    confettiCanvas.height = window.innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchConfetti(count) {
    if (reduceMotion) return;

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.4;

    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = 6 + Math.random() * 10;

        particles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 6,
            rotation: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.35,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            alpha: 1
        });
    }

    if (!confettiFrame) confettiFrame = requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles = particles.filter((p) => p.alpha > 0 && p.y < window.innerHeight + 30);

    particles.forEach((p) => {
        p.vy += 0.3;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.alpha -= 0.007;

        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
    });

    if (particles.length > 0) {
        confettiFrame = requestAnimationFrame(drawConfetti);
    } else {
        confettiFrame = null;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ------------------------------------------
// ADD / UPDATE TASK
// ------------------------------------------

todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = todoInput.value.trim();
    if (!text) return;

    if (editingTaskId !== null) {
        const task = findTask(editingTaskId);
        if (task) task.text = text;
        stopEditing();
    } else {
        const task = { id: createTaskId(), text, completed: false };
        tasks.push(task);
        newTaskId = task.id;
        todoInput.value = "";
    }

    saveTasks();
    renderTasks();
    todoInput.focus();
});

// ------------------------------------------
// RENDER
// ------------------------------------------

function createTaskElement(task, index, stagger) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = task.id;

    if (task.completed) li.classList.add("completed");
    if (task.id === editingTaskId) li.classList.add("editing");

    if (stagger) {
        li.classList.add("enter");
        li.style.setProperty("--i", index);
    } else if (task.id === newTaskId) {
        li.classList.add("enter");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.text} as complete`);

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.dataset.action = "edit";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${task.text}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

    actions.append(editButton, deleteButton);
    li.append(checkbox, text, actions);

    return li;
}

// stagger = true plays a cascading entrance for every visible task
function renderTasks(stagger = false) {
    todoList.textContent = "";

    const visibleTasks = tasks.filter(matchesFilter);

    emptyMessage.classList.toggle("hidden", visibleTasks.length > 0);

    if (visibleTasks.length === 0) {
        emptyText.textContent =
            tasks.length === 0
                ? "No tasks yet. Add your first one above."
                : `No ${currentFilter} tasks.`;
    }

    visibleTasks.forEach((task, index) => {
        todoList.appendChild(createTaskElement(task, index, stagger));
    });

    newTaskId = null;
    updateStats();
}

function updateStats() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.completed).length;
    const active = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    progressText.textContent = `${done} of ${total} done`;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;

    const label = active === 1 ? "1 active task" : `${active} active tasks`;

    if (taskCount.textContent !== label) {
        taskCount.textContent = label;
        taskCount.classList.remove("bump");
        void taskCount.offsetWidth;
        taskCount.classList.add("bump");
    }
}

// ------------------------------------------
// COMPLETE / UNCOMPLETE
// ------------------------------------------

todoList.addEventListener("change", (event) => {
    if (!event.target.classList.contains("todo-checkbox")) return;

    const listItem = event.target.closest(".todo-item");
    const task = findTask(listItem.dataset.id);
    if (!task) return;

    task.completed = event.target.checked;
    saveTasks();

    // Update in place so the tick, ring and strike-through can animate
    listItem.classList.toggle("completed", task.completed);

    if (task.completed) {
        listItem.classList.add("pop");
        setTimeout(() => listItem.classList.remove("pop"), 650);
    }

    updateStats();

    // Everything finished — celebrate
    if (task.completed && tasks.every((item) => item.completed)) {
        launchConfetti(130);
    }

    // If the current filter no longer shows this task, slide it out
    if (!matchesFilter(task)) {
        setTimeout(() => {
            removeWithAnimation(listItem, () => renderTasks());
        }, 450);
    }
});

// ------------------------------------------
// EDIT / DELETE
// ------------------------------------------

todoList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const listItem = button.closest(".todo-item");
    if (!listItem) return;

    const taskId = listItem.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        const task = findTask(taskId);
        if (!task) return;

        editingTaskId = task.id;
        todoInput.value = task.text;
        submitButton.textContent = "Update";
        todoInput.focus();
        todoInput.select();

        document.querySelectorAll(".todo-item.editing")
            .forEach((item) => item.classList.remove("editing"));
        listItem.classList.add("editing");
    }

    if (action === "delete") {
        removeWithAnimation(listItem, () => {
            tasks = tasks.filter((task) => task.id !== taskId);

            if (editingTaskId === taskId) stopEditing();

            saveTasks();
            renderTasks();
        });
    }
});

// Esc cancels editing
todoInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && editingTaskId !== null) {
        stopEditing();
        renderTasks();
    }
});

// ------------------------------------------
// FILTERS
// ------------------------------------------

filterButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        // Slide the highlight pill under the selected filter
        filtersBox.style.setProperty("--pill-x", `${index * 100}%`);

        renderTasks(true);
    });
});

// ------------------------------------------
// CLEAR COMPLETED
// ------------------------------------------

clearCompletedButton.addEventListener("click", () => {
    const doneItems = [...todoList.querySelectorAll(".todo-item.completed")];

    const finish = () => {
        tasks = tasks.filter((task) => !task.completed);

        if (editingTaskId !== null && !findTask(editingTaskId)) stopEditing();

        saveTasks();
        renderTasks();
    };

    if (doneItems.length === 0) {
        finish();
        return;
    }

    doneItems.forEach((item, i) => {
        item.style.animationDelay = `${i * 50}ms`;
        item.classList.add("removing");
    });

    setTimeout(finish, (reduceMotion ? 0 : EXIT_TIME) + doneItems.length * 50);
});

// ------------------------------------------
// START
// ------------------------------------------

setGreeting();
loadTasks();
renderTasks(true);
