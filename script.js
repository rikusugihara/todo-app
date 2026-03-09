const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const priorityInput = document.getElementById("priorityInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const taskCount = document.getElementById("taskCount");

const emptyMessage = document.getElementById("emptyMessage");

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");
const editModalTask = document.getElementById("editModalTask");

const toggleThemeBtn = document.getElementById("toggleThemeBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const deleteCompletedBtn = document.getElementById("deleteCompletedBtn");
const completedSectionHeader = document.getElementById("completedSectionHeader");

const filterAllBtn = document.getElementById("filterAll");
const filterActiveBtn = document.getElementById("filterActiveBtn");
const filterCompletedBtn = document.getElementById("filterCompletedBtn");

const searchInput = document.getElementById("searchInput");

let tasks = [];

let currentModalTaskIndex = null;

let showCompletedTasks = true;

let isDarkMode = false;

let currentFilter = "all";

let draggedTaskIndex = null;

let currentSearch = "";

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function createDueDateElement(task) {
    if(!task.dueDate) {
        return null;
    }

    const dueDateText = document.createElement("small");
    dueDateText.textContent = `期限: ${task.dueDate}`;
    dueDateText.classList.add("task-due-date");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.dueDate);
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if(diffDays < 0 && !task.completed) {
        dueDateText.classList.add("overdue");
    } else if(diffDays <= 2) {
        dueDateText.classList.add("soon");
    } else if(diffDays <= 7) {
        dueDateText.classList.add("upcoming");
    }

    return dueDateText;
}

function createPriorityElement(task) {
    const priorityText = document.createElement("small");
    priorityText.classList.add("task-priority");

    if(task.priority === "high") {
        priorityText.textContent = "🔴 高";
        priorityText.classList.add("high-priority");
    } else if(task.priority === "medium") {
        priorityText.textContent = "🟡 中";
        priorityText.classList.add("medium-priority");
    } else {
        priorityText.textContent = "○ 低";
        priorityText.classList.add("low-priority");
    }

    return priorityText;
}

function renderTasks() {
    tasks.sort((a, b) => {
        if(a.completed !== b.completed) {
            return a.completed - b.completed;
        }

        const priorityOrder = {
            high: 0,
            medium: 1,
            low: 2
        };

        const aPriority = priorityOrder[a.priority] ?? 1;
        const bPriority = priorityOrder[b.priority] ?? 1;

        if(aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        if(!a.dueDate && !b.dueDate) return 0;
        if(!a.dueDate) return 1;
        if(!b.dueDate) return -1;

        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    updateFilterButtons();

    const totalTasks = tasks.length;
    const incompleteTasks = tasks.filter(task => !task.completed).length;

    taskCount.innerHTML = `タスク ${totalTasks}件 | 未完了 <b>${incompleteTasks}</b>件`;
    taskCount.classList.remove("count-update");
    void taskCount.offsetWidth;
    taskCount.classList.add("count-update");

    taskList.innerHTML = "";
    completedTaskList.innerHTML = "";

    const MAX_LENGTH = 10;
    let completedCount = 0;

    tasks.forEach(function(task, index) {
        if(task.completed) {
            completedCount++;
        }

        if(task.completed && !showCompletedTasks && currentFilter !== "completed") {
            return;
        }

        if(currentFilter === "active" && task.completed) {
            return;
        }

        if(currentFilter === "completed" && !task.completed) {
            return;
        }

        if(
            currentSearch !== "" && 
            !task.text.toLowerCase().includes(currentSearch.toLowerCase())
        ) {
            return;
        }

        const li = document.createElement("li");
        li.classList.add("task-enter");

        if(task.dueDate && !task.completed) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dueDate = new Date(task.dueDate);
            today.setHours(0, 0, 0, 0);

            const diffTime = dueDate - today;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if(diffDays < 0) {
                li.classList.add("task-overdue");
            } else if(diffDays <= 2) {
                li.classList.add("task-soon");
            } else if(diffDays <= 7) {
                li.classList.add("task-upcoming");
            }
        }

        li.draggable = !task.completed;

        li.addEventListener("dragstart", function(event) {
            draggedTaskIndex = index;
            li.classList.add("dragging");
            event.dataTransfer.setData("text/plain", index);
            event.dataTransfer.effectAllowed = "move";
        });

        li.addEventListener("dragend", function() {
            draggedTaskIndex = null;
            li.classList.remove("dragging");
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

        const textWrap = document.createElement("div");
        textWrap.classList.add("task-text-wrap");

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
        textWrap.appendChild(span);

        const priorityElement = createPriorityElement(task);
        textWrap.appendChild(priorityElement);

        const dueDateElement = createDueDateElement(task);

        if(dueDateElement) {
            textWrap.appendChild(dueDateElement);
        }

        li.appendChild(textWrap);
        li.appendChild(deleteBtn);

        if(task.completed) {
            if(showCompletedTasks) {
                completedTaskList.appendChild(li);
            }
        } else {
            taskList.appendChild(li);
        }
    });

    if(completedCount > 0 && currentFilter !== "active") {
        completedSectionHeader.style.display = "block";

        if(currentFilter == "completed") {
            completedSectionHeader.textContent = `完了タスク (${completedCount})`;
        } else {
            completedSectionHeader.textContent = showCompletedTasks
            ? `完了タスク ▼ (${completedCount})`
            : `完了タスク ▶ (${completedCount})`;
        }
    } else {
        completedSectionHeader.style.display = "none";
    }

    if(tasks.length === 0) {
        emptyMessage.style.display = "block";
    } else {
        emptyMessage.style.display = "none";
    }
}

function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    tasks.push({
        text: taskText,
        completed: false,
        dueDate: dueDateInput.value,
        priority: priorityInput.value
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";
    dueDateInput.value = "";
    priorityInput.value = "medium";
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
    const currentTask = tasks[index];

    const newText = prompt("タスクを編集してください", currentTask.text);

    if(newText === null) {
        return;
    }

    const trimmedText = newText.trim();

    if(trimmedText === "") {
        return;
    }

    const newDueDate = prompt(
        "期限を編集してください (YYYY-MM-DD)",
        currentTask.dueDate || ""
    );

    if(newDueDate == null) {
        return;
    }

    tasks[index].text = trimmedText;
    tasks[index].dueDate = newDueDate.trim() === "" ? null : newDueDate;

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

filterAllBtn.addEventListener("click", function() {
    currentFilter = "all";
    renderTasks();
});

filterActiveBtn.addEventListener("click", function() {
    currentFilter = "active";
    renderTasks();
});

filterCompletedBtn.addEventListener("click", function() {
    currentFilter = "completed";
    renderTasks();
});

searchInput.addEventListener("input", function() {
    currentSearch = searchInput.value.trim();
    renderTasks();
});

searchInput.addEventListener("keypress", function(event) {
    if(event.key === "Enter") {
        event.preventDefault();
        taskInput.focus();
    }
});

function updateFilterButtons() {
    filterAllBtn.classList.remove("active-filter");
    filterActiveBtn.classList.remove("active-filter");
    filterCompletedBtn.classList.remove("active-filter");

    if(currentFilter === "all") {
        filterAllBtn.classList.add("active-filter");
    } else if(currentFilter === "active") {
        filterActiveBtn.classList.add("active-filter");
    } else if(currentFilter === "completed") {
        filterCompletedBtn.classList.add("active-filter");
    }
}

loadTasks();
loadTheme();
renderTasks();