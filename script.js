const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");
const editModalTask = document.getElementById("editModalTask");

let tasks = [];

let currentModalTaskIndex = null;

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(function(task, index) {
        const li = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        const MAX_LENGTH = 10;

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
                modal.classList.add("show");
            });
        }

        span.addEventListener("click", function() {
            modalText.textContent = task.text;
            currentModalTaskIndex = index;
            modal.classList.add("show");
        });

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

        taskList.appendChild(li);
    });
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

editModalTask.addEventListener("click", function() {
    if(currentModalTaskIndex === null) {
        return;
    }

    editTask(currentModalTaskIndex);
    modal.classList.remove("show");
})

closeModal.addEventListener("click", function() {
    modal.classList.remove("show");
});

loadTasks();
renderTasks();