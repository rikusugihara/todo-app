const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const taskCount = document.getElementById("taskCount");

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");
const editModalTask = document.getElementById("editModalTask");

const toggleThemeBtn = document.getElementById("toggleThemeBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const deleteCompletedBtn = document.getElementById("deleteCompletedBtn");
const completedSectionHeader = document.getElementById("completedSectionHeader");

let tasks = [];

let currentModalTaskIndex = null;

let showCompletedTasks = true;

let isDarkMode = false;

let draggedTaskIndex = null;

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    tasks.sort((a, b) => a.completed - b.completed);

    const totalTasks = tasks.length;
    const incompleteTasks = tasks.filter(task => !task.completed).length;

    taskCount.innerHTML = `タスク ${totalTasks}件 | 未完了 <b>${incompleteTasks}</b>件`;

    taskList.innerHTML = "";
    completedTaskList.innerHTML = "";

    const MAX_LENGTH = 10;
    let completedCount = 0;

    tasks.forEach(function(task, index) {
        if(task.completed) {
            completedCount++;
        }

        if(task.completed && !showCompletedTasks) {
            return;
        }

        const li = document.createElement("li");

        li.draggable = !task.completed;

        li.addEventListener("dragstart", function() {
            draggedTaskIndex = index;
        });

        li.addEventListener("dragover", function(event) {
            event.preventDefault();
        });

        li.addEventListener("drop", function() {
            if(draggedTaskIndex === null || draggedTaskIndex === index) {
                return;
            }

            const draggedTask = tasks[draggedTaskIndex];

            tasks.splice(draggedTaskIndex, 1);
            tasks.splice(index, 0, draggedTask);

            draggedTaskIndex = null;

            saveTasks();
            renderTasks();
        });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        const span = document.createElement("span");

        if(task.text.length <= MAX_LENGTH) {
            span.textContent = task.text;

            span.addEventListener("click", function() {
                editTask(index);
            });
        } else {
            span.textContent = task.text.slice(0, MAX_LENGTH) + "...";
            span.classList.add("clickable-task");

            span.addEventListener("click", function() {
                modalText.textContent = task.text;
                currentModalTaskIndex = index;
                modal.classList.add("show");
            });
        }

        if(task.completed) {
            span.style.textDecoration = "line-through";
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "削除";
        deleteBtn.classList.add("delete-btn");

        checkbox.addEventListener("change", function() {
            tasks[index].completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        deleteBtn.addEventListener("click", function() {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        if(task.completed) {
            if(showCompletedTasks) {
                completedTaskList.appendChild(li);
            }
        } else {
            taskList.appendChild(li);
        }
    });

    if(completedCount > 0) {
        completedSectionHeader.style.display = "block";
        completedSectionHeader.textContent = showCompletedTasks
            ? `完了タスク ▼ (${completedCount})`
            : `完了タスク ▶ (${completedCount})`;
    } else {
        completedSectionHeader.style.display = "none";
    }
}

function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    tasks.push({
        text: taskText,
        completed: false
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";
}

function saveTheme() {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
}

function loadTheme() {
    const savedTheme = localStorage.getItem("darkMode");

    if(savedTheme) {
        isDarkMode = JSON.parse(savedTheme);
    }

    if(isDarkMode) {
        document.body.classList.add("dark");
    }
}

function editTask(index) {
    const currentText = tasks[index].text;

    const newText = prompt("タスクを編集してください", currentText);

    if(newText === null) {
        return;
    }

    const trimmedText = newText.trim();

    if(trimmedText === "") {
        return;
    }

    tasks[index].text = trimmedText;
    saveTasks();
    renderTasks();
}

function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");

    if(savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", function(event) {
    if(event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

closeModal.addEventListener("click", function() {
    modal.classList.remove("show");
});

editModalTask.addEventListener("click", function() {
    if(currentModalTaskIndex === null) {
        return;
    }

    editTask(currentModalTaskIndex);
    modal.classList.remove("show");
});

completedSectionHeader.addEventListener("click", function() {
    showCompletedTasks = !showCompletedTasks;
    renderTasks();
});

deleteCompletedBtn.addEventListener("click", function() {
    const confirmed = confirm("完了タスクをすべて削除しますか？");

    if(!confirmed) {
        return;
    }

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
});

deleteAllBtn.addEventListener("click", function() {
    const confirmed = confirm("すべてのタスクを削除しますか？");

    if(!confirmed) {
        return;
    }

    tasks = [];
    saveTasks();
    renderTasks();
});

toggleThemeBtn.addEventListener("click", function() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark");
    saveTheme();
});

loadTasks();
loadTheme();
renderTasks();