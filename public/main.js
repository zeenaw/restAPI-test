const API = '/api/v1/todos';
const listEl = document.getElementById('list');
const inputEl = document.getElementById('newTodo');
const addBtn = document.getElementById('addBtn');

const debounceTimers = new Map();

async function fetchTodos() {
  const res = await fetch(API);
  if (!res.ok) throw new Error('Failed to load todos');
  return res.json();
}

function renderTodos(todos) {
    listEl.innerHTML = '';
    todos.forEach(todo => {
        const row = document.createElement('div');
        row.className = 'todo';
        row.dataset.id = todo.id;

        const left = document.createElement('div');
        left.className = 'left';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!todo.completed;
        cb.addEventListener('change', () => onCheckboxChange(todo.id, cb.checked));
        left.appendChild(cb);

        const title = document.createElement('div');
        title.textContent = "Title: " + todo.title;
        left.appendChild(title);

        const createdAt = document.createElement('div');
        createdAt.textContent = "Created at: " + todo.createdAt;
        left.appendChild(createdAt);

        const right = document.createElement('div');

        const del = document.createElement('button');
        del.textContent = 'Delete';
        del.addEventListener('click', () => deleteTodo(todo.id, row));
        right.appendChild(del);

        row.appendChild(left);
        row.appendChild(right);
        listEl.appendChild(row);
    });
}

async function loadAndRender() {
    try {
        const todos = await fetchTodos();
        renderTodos(todos);
    } catch (error) {
        console.error(error);
    }
}

addBtn.addEventListener('click', async () => {
  const title = inputEl.value.trim();
  if (!title) return;
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title })
    });
    if (res.ok) {
      inputEl.value = '';
      await loadAndRender();
    }
  } catch (err) { console.error(err); }
});

async function deleteTodo(id, rowEl) {
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      rowEl.remove();
    }
  } catch (err) { console.error(err); }
}

function onCheckboxChange(id, checked) {
    if (debounceTimers.has(id)) {
        clearTimeout(debounceTimers.get(id));
    }
    const timeOut = setTimeout(() => {
    debounceTimers.delete(id);
    fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ completed: checked })
    }).catch(err => console.error(err));
    }, 500);
    debounceTimers.set(id, timeOut);
}

(async function() {
    try {
        await loadAndRender();
    } catch (error) {
        console.warn('Initialization failed:', error);
    } finally {
        await loadAndRender();
    }
})();