/* =========================================
   JAVASCRIPT TO-DO LIST
   Task 3 - Thiranex Internship
   ========================================= */


/* =========================================
   ELEMENTS
   ========================================= */

const todoForm = document.getElementById("todo-form");

const todoInput = document.getElementById("todo-input");

const submitButton = document.getElementById("submit-btn");

const todoList = document.getElementById("todo-list");

const emptyMessage =
    document.getElementById("empty-message");

const taskCount =
    document.getElementById("task-count");

const clearCompletedButton =
    document.getElementById("clear-completed");

const filterButtons =
    document.querySelectorAll(".filter-btn");


/* =========================================
   APPLICATION STATE
   ========================================= */

let tasks = [];

let editingTaskId = null;

let currentFilter = "all";


/* =========================================
   LOAD TASKS
   ========================================= */

function loadTasks() {

    try {

        const savedTasks =
            localStorage.getItem("jeriTodoTasks");

        if (savedTasks) {

            tasks = JSON.parse(savedTasks);

        }

    } catch (error) {

        console.error(
            "Unable to load tasks:",
            error
        );

        tasks = [];
    }
}


/* =========================================
   SAVE TASKS
   ========================================= */

function saveTasks() {

    try {

        localStorage.setItem(
            "jeriTodoTasks",
            JSON.stringify(tasks)
        );

    } catch (error) {

        console.error(
            "Unable to save tasks:",
            error
        );
    }
}


/* =========================================
   CREATE TASK ID
   ========================================= */

function createTaskId() {

    return Date.now().toString() +
        Math.random().toString(16).slice(2);

}


/* =========================================
   FORM SUBMISSION
   ========================================= */

todoForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const taskText =
            todoInput.value.trim();


        if (!taskText) {

            return;
        }


        /* UPDATE EXISTING TASK */

        if (editingTaskId !== null) {

            const task =
                tasks.find(
                    item =>
                        item.id === editingTaskId
                );


            if (task) {

                task.text = taskText;

            }


            editingTaskId = null;

            submitButton.textContent =
                "Add Task";

        }


        /* CREATE NEW TASK */

        else {

            const newTask = {

                id: createTaskId(),

                text: taskText,

                completed: false

            };


            tasks.push(newTask);

        }


        saveTasks();

        todoInput.value = "";

        renderTasks();

        todoInput.focus();

    }
);


/* =========================================
   RENDER TASKS
   ========================================= */

function renderTasks() {

    todoList.textContent = "";


    let filteredTasks = tasks;


    /* FILTER TASKS */

    if (currentFilter === "active") {

        filteredTasks =
            tasks.filter(
                task => !task.completed
            );

    }


    if (currentFilter === "completed") {

        filteredTasks =
            tasks.filter(
                task => task.completed
            );

    }


    /* EMPTY STATE */

    if (filteredTasks.length === 0) {

        emptyMessage.classList.remove("hidden");

    } else {

        emptyMessage.classList.add("hidden");

    }


    /* CREATE TASK ELEMENTS */

    filteredTasks.forEach(
        task => {

            const listItem =
                document.createElement("li");

            listItem.className =
                "todo-item";

            listItem.dataset.id =
                task.id;


            if (task.completed) {

                listItem.classList.add(
                    "completed"
                );

            }


            /* CHECKBOX */

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";

            checkbox.className =
                "todo-checkbox";

            checkbox.checked =
                task.completed;

            checkbox.setAttribute(
                "aria-label",
                `Mark ${task.text} as complete`
            );


            /* TEXT */

            const text =
                document.createElement("span");

            text.className =
                "todo-text";

            text.textContent =
                task.text;


            /* ACTION CONTAINER */

            const actions =
                document.createElement("div");

            actions.className =
                "todo-actions";


            /* EDIT BUTTON */

            const editButton =
                document.createElement("button");

            editButton.type = "button";

            editButton.className =
                "edit-btn";

            editButton.dataset.action =
                "edit";

            editButton.textContent =
                "Edit";

            editButton.setAttribute(
                "aria-label",
                `Edit ${task.text}`
            );


            /* DELETE BUTTON */

            const deleteButton =
                document.createElement("button");

            deleteButton.type = "button";

            deleteButton.className =
                "delete-btn";

            deleteButton.dataset.action =
                "delete";

            deleteButton.textContent =
                "Delete";

            deleteButton.setAttribute(
                "aria-label",
                `Delete ${task.text}`
            );


            actions.append(
                editButton,
                deleteButton
            );


            listItem.append(
                checkbox,
                text,
                actions
            );


            todoList.appendChild(
                listItem
            );

        }
    );


    updateTaskCount();

}


/* =========================================
   CHECKBOX EVENT
   EVENT DELEGATION
   ========================================= */

todoList.addEventListener(
    "change",
    function (event) {

        if (
            !event.target.classList.contains(
                "todo-checkbox"
            )
        ) {

            return;
        }


        const listItem =
            event.target.closest(".todo-item");

        const taskId =
            listItem.dataset.id;


        const task =
            tasks.find(
                item =>
                    item.id === taskId
            );


        if (!task) {

            return;
        }


        task.completed =
            event.target.checked;


        saveTasks();

        renderTasks();

    }
);


/* =========================================
   EDIT / DELETE EVENTS
   EVENT DELEGATION
   ========================================= */

todoList.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest("button");


        if (!button) {

            return;
        }


        const listItem =
            button.closest(".todo-item");


        if (!listItem) {

            return;
        }


        const taskId =
            listItem.dataset.id;


        const action =
            button.dataset.action;


        /* EDIT */

        if (action === "edit") {

            const task =
                tasks.find(
                    item =>
                        item.id === taskId
                );


            if (!task) {

                return;
            }


            todoInput.value =
                task.text;


            editingTaskId =
                task.id;


            submitButton.textContent =
                "Update Task";


            todoInput.focus();

        }


        /* DELETE */

        if (action === "delete") {

            tasks =
                tasks.filter(
                    task =>
                        task.id !== taskId
                );


            if (
                editingTaskId === taskId
            ) {

                editingTaskId = null;

                submitButton.textContent =
                    "Add Task";

                todoInput.value = "";

            }


            saveTasks();

            renderTasks();

        }

    }
);


/* =========================================
   FILTER BUTTONS
   ========================================= */

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                currentFilter =
                    button.dataset.filter;


                filterButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                renderTasks();

            }
        );

    }
);


/* =========================================
   CLEAR COMPLETED
   ========================================= */

clearCompletedButton.addEventListener(
    "click",
    function () {

        tasks =
            tasks.filter(
                task => !task.completed
            );


        saveTasks();

        renderTasks();

    }
);


/* =========================================
   UPDATE TASK COUNT
   ========================================= */

function updateTaskCount() {

    const activeTasks =
        tasks.filter(
            task => !task.completed
        ).length;


    if (activeTasks === 1) {

        taskCount.textContent =
            "1 active task";

    } else {

        taskCount.textContent =
            `${activeTasks} active tasks`;

    }

}


/* =========================================
   INITIALIZE APPLICATION
   ========================================= */

loadTasks();

renderTasks();