// ==========================================
// TO-DO LIST
// ==========================================

const STORAGE_KEY = "todoTasks";
const LEGACY_KEY = "jeriTodoTasks"; // data saved by the earlier portfolio version
const EXIT_TIME = 300;              // must match the item-out animation

// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const submitButton = document.getElementById("submit-btn");
const todoList = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const taskCount = document.getElementById("task-count");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// ------------------------------------------
// STATE
// ------------------------------------------

let tasks = [];
let editingTaskId = null;
let currentFilter = "all";
let newTaskId = null; // only the newest task plays the "enter" animation

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

function createTaskId() {
    return Date.now().toString() + Math.random().toString(16).slice(2);
}

function findTask(id) {
    return tasks.find((task) => task.id === id);
}

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

// Plays the exit animation, then runs the callback
function removeWithAnimation(listItem, done) {
    listItem.classList.add("removing");
    setTimeout(done, EXIT_TIME);
}

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

function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = task.id;

    if (task.completed) li.classList.add("completed");
    if (task.id === newTaskId) li.classList.add("enter");
    if (task.id === editingTaskId) li.classList.add("editing");

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

function renderTasks() {
    todoList.textContent = "";

    const visibleTasks = tasks.filter(matchesFilter);

    emptyMessage.classList.toggle("hidden", visibleTasks.length > 0);

    if (visibleTasks.length === 0) {
        emptyMessage.textContent =
            tasks.length === 0
                ? "No tasks yet. Add your first one above."
                : `No ${currentFilter} tasks.`;
    }

    visibleTasks.forEach((task) => {
        todoList.appendChild(createTaskElement(task));
    });

    newTaskId = null;
    updateTaskCount();
}

function updateTaskCount() {
    const active = tasks.filter((task) => !task.completed).length;
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

    // Update in place so the check + strike-through can animate
    listItem.classList.toggle("completed", task.completed);
    updateTaskCount();

    // If the current filter no longer shows this task, slide it out
    if (!matchesFilter(task)) {
        setTimeout(() => {
            removeWithAnimation(listItem, renderTasks);
        }, 350);
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

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        renderTasks();
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

    doneItems.forEach((item) => item.classList.add("removing"));
    setTimeout(finish, EXIT_TIME);
});

// ------------------------------------------
// START
// ------------------------------------------

loadTasks();
renderTasks();
