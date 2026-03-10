const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const priorityInput = document.getElementById("priorityInput");
const addBtn = document.getElementById("addBtn");

const offlineBanner = document.getElementById("offlineBanner");

const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const taskCount = document.getElementById("taskCount");

const totalStat = document.getElementById("totalStat");
const completedStat = document.getElementById("completedStat");
const completionRateStat = document.getElementById("completionRateStat");

const emptyMessage = document.getElementById("emptyMessage");

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");
const editModalTask = document.getElementById("editModalTask");

const editModal = document.getElementById("editModal");
const editTaskInput = document.getElementById("editTaskInput");
const editDueDateInput = document.getElementById("editDueDateInput");
const editPriorityInput = document.getElementById("editPriorityInput");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

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

let editingTaskIndex = null;

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

        if(!a.dueDate && !b.dueDate) {
            return a.createdAt - b.createdAt;
        };

        if(!a.dueDate) return 1;
        if(!b.dueDate) return -1;

        const dateDiff = new Date(a.dueDate) - new Date(b.dueDate);

        if(dateDiff !== 0) {
            return dateDiff;
        }

        return a.createdAt - b.createdAt;
    });

    updateFilterButtons();

    const totalTasks = tasks.length;
    const incompleteTasks = tasks.filter(task => !task.completed).length;

    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    totalStat.textContent = totalTasks;
    completedStat.textContent = completedTasks;
    completionRateStat.textContent = `${completionRate}%`;

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

function scheduleNotification(task) {
    // 期限がないタスクは通知しない
    if(!task.dueDate) return;

    const dueTime = new Date(task.dueDate).getTime();
    const now = Date.now();

    // 1時間前に通知
    const notifyTime = dueTime - (60 * 60 * 1000);

    const delay = notifyTime - now;

    // すでに時間を過ぎていたら通知しない
    if(delay <= 0) return;

    setTimeout(() => {
        if(Notification.permission === "granted") {
            new Notification("タスクの期限が近いです", {
                body: task.text,
                icon: "./image/icon-192.png"
            });
        }
    }, delay);
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
        priority: priorityInput.value,
        createdAt: Date.now()
    });

    // 通知を予約
    scheduleNotification(task[task.length - 1]);

    saveTasks();
    renderTasks();

    taskInput.value = "";
    dueDateInput.value = "";
    priorityInput.value = "medium";
}

function saveTheme() {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
}

function saveViewState() {
    localStorage.setItem("currentFilter", currentFilter);
    localStorage.setItem("currentSearch", currentSearch);
    localStorage.setItem("showCompletedTasks", JSON.stringify(showCompletedTasks));
}

function loadViewState() {
    const savedFilter = localStorage.getItem("currentFilter");
    const savedSearch = localStorage.getItem("currentSearch");
    const savedShowCompletedTasks = localStorage.getItem("showCompletedTasks");

    if(savedFilter) {
        currentFilter = savedFilter;
    }

    if(savedSearch) {
        currentSearch = savedSearch;
        searchInput.value = savedSearch;
    }

    if(savedShowCompletedTasks !== null) {
        showCompletedTasks = JSON.parse(savedShowCompletedTasks)
    }
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

function updateOfflineBanner() {
    if(navigator.onLine) {
        offlineBanner.style.display = "none";
    } else {
        offlineBanner.style.display = "block";
    }
}

function editTask(index) {
    const currentTask = tasks[index];

    editingTaskIndex = index;

    editTaskInput.value = currentTask.text;
    editDueDateInput.value = currentTask.dueDate || "";
    editPriorityInput.value = currentTask.priority || "medium";

    editModal.classList.add("show");
    editTaskInput.focus();
}

function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");

    if(savedTasks) {
        tasks = JSON.parse(savedTasks).map((task, index) => ({
            ...task,
            priority: task.priority ?? "medium",
            createdAt: task.createdAt ?? (Date.now() + index)
        }));
    }
}

// 通知許可を取るための専用関数（非同期処理のためasyncつける）
async function requestNotificationPermission() {
    // そもそもブラウザで通知機能が使えるかを確認
    if(!("Notification" in window)) {
        console.log("このブラウザは通知に対応していません");
        return;
    }

    if(Notification.permission === "granted") {
        console.log("すでに通知は許可されています");
        return;
    }

    if(Notification.permission === "denied") {
        console.log("通知はブロックされています");
        return;
    }

    // ブラウザの通知許可ダイアログを表示
    const permission = await Notification.requestPermission();

    // 許可されたかどうかの確認
    if(permission === "granted") {
        console.log("通知が許可されました");
    } else {
        console.log("通知は許可されませんでした");
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

saveEditBtn.addEventListener("click", function() {
    if(editingTaskIndex === null) {
        return;
    }

    const newText = editTaskInput.value.trim();

    if(newText === "") {
        return;
    }

    tasks[editingTaskIndex].text = newText;
    tasks[editingTaskIndex].dueDate = editDueDateInput.value || null;
    tasks[editingTaskIndex].priority = editPriorityInput.value;

    saveTasks();
    renderTasks();

    editModal.classList.remove("show");
    editingTaskIndex = null;
});

cancelEditBtn.addEventListener("click", function() {
    editModal.classList.remove("show");
    editingTaskIndex = null;
});

editTaskInput.addEventListener("keypress", function(event) {
    if(event.key === "Enter") {
        event.preventDefault();
        saveEditBtn.click();
    }
});

completedSectionHeader.addEventListener("click", function() {
    showCompletedTasks = !showCompletedTasks;
    saveViewState();
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
    saveViewState();
    renderTasks();
});

filterActiveBtn.addEventListener("click", function() {
    currentFilter = "active";
    saveViewState();
    renderTasks();
});

filterCompletedBtn.addEventListener("click", function() {
    currentFilter = "completed";
    saveViewState();
    renderTasks();
});

searchInput.addEventListener("input", function() {
    currentSearch = searchInput.value.trim();
    saveViewState();
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
loadViewState();
renderTasks();
requestNotificationPermission();

window.addEventListener("online", updateOfflineBanner);
window.addEventListener("offline", updateOfflineBanner);

updateOfflineBanner();

if("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker.register("./sw.js")
            .then(function(registration) {
                console.log("Service Worker registered:", registration);
            })
            .catch(function(error) {
                console.log("Service Worker registration failed:", error);
            });
    });
}


// ======================================
// PWA インストールボタン
// ====================================== 
let deferredPrompt;
const installBtn = document.getElementById("installAppBtn");

// ブラウザで開いているかアプリで開いているかの判定
function isRunningAsPWA() {
    return window.matchMedia("(display-mode: standalone)").matches;
}

// アプリで開いていたらボタンを消す
if(isRunningAsPWA()) {
    installBtn.style.display = "none";
}

// インストール可能になったとき
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // ボタン表示
    installBtn.style.display = "block";
});

// ボタンを押した時
installBtn.addEventListener("click", async() => {
    if(!deferredPrompt) return;

    deferredPrompt.prompt();

    const {outcome} = await deferredPrompt.userChoice;

    if(outcome === "accepted") {
        console.log("PWA installed");
    }

    deferredPrompt = null;
    installBtn.style.display = "none";
});