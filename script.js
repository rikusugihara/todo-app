const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

function addTask() {
    const taskText = taskInput.value;

    if (taskText === "") {
        return;
    }

    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = taskText;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";

    deleteBtn.addEventListener("click", function() {
        li.remove();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
    taskInput.value = "";
}

addBtn.addEventListener("click", addTask);
