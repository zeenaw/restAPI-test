const express = require('express')
const app = express()
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const port = 3000

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const todosFile = path.join(__dirname, 'todos.json');
let todos = [];
try {
    const data = fs.readFileSync(todosFile, 'utf8');
    if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) todos = parsed;
        else if (parsed && Array.isArray(parsed.todos)) todos = parsed.todos;
        else todos = [];
    }
} catch (error) {
    console.error('Could not read todos.json, starting with empty list.');
    todos = [];
}

app.get('/', function(req, res) {
    if (req.path.startsWith('/api/')) return res.status(404).send();
    try {
        res.sendFile(path.join(__dirname, 'index.html'));
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});


app.get('/api/v1/todos', (req, res) => {
    try {
    res.json(todos);
    }   catch (error) {
        console.error('Error creating todo:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

app.get('/api/v1/todos/:id', function(req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo;
    todos.forEach(function (todo) {
        if (todoId == todo.id) {
            matchedTodo = todo;
        }
    });
    if (matchedTodo) {
        res.json(matchedTodo);
    } else {
        res.status(404).send();
    }
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


let todoNextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;

function saveTodos() {
    try {
        fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2), 'utf8');
    } catch (err) {
        console.error('Failed to write todos:', err.message);
    }
}

app.use(bodyParser.json())

app.post('/api/v1/todos', function(req, res) {
try {
    var body = req.body;
    body.id = todoNextId++;
    body.completed = false;
    body.createdAt = moment().format("YYYY-MM-DD HH:mm:ss");
    todos.push(body);
    res.status(201).json(body);
    saveTodos();
}   catch (error) {
        console.error('Error creating todo:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

app.delete('/api/v1/todos/:id', function(req, res) {
try {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo;
    todos.forEach(function (todo) {
        if (todoId == todo.id) {
            matchedTodo = todo;
        }
    });
    if (matchedTodo) {
        todos = todos.filter(function (todo) {
            return todo.id !== matchedTodo.id;
        });
        res.status(200).json(matchedTodo);
    }
    else {
        res.status(404).send();
    }
    saveTodos();
}   catch (error) {
        console.error('Error creating todo:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

app.patch('/api/v1/todos/:id', function(req, res) {
try {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = todos.find(function(t) { return t.id === todoId; });

    if (!matchedTodo) {
        return res.status(404).send();
    }

    if (req.body.completed === undefined) {
        return res.status(400).json({ error: 'completed property is required' });
    }

    var completed = req.body.completed;

    if (typeof completed !== 'boolean') {
        if (typeof completed === 'string') {
            if (completed.toLowerCase() === 'true') completed = true;
            else if (completed.toLowerCase() === 'false') completed = false;
            else return res.status(400).json({ error: 'completed must be boolean' });
        } else if (typeof completed === 'number') {
            completed = Boolean(completed);
        } else {
            return res.status(400).json({ error: 'completed must be boolean' });
        }
    }

    matchedTodo.completed = completed;
    res.status(200).json(matchedTodo);
    saveTodos();
}   catch (error) {
        console.error('Error creating todo:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }

});


