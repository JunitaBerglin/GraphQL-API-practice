const { GraphQLError } = require('graphql')
const path = require('path')
const { fileExists, readJsonFile } = require('../utils/fileHandling')
const crypto = require('crypto')
const fsPromises = require('fs/promises')

exports.resolvers = {
	Query: {
		getTodosById: async (_, args) => {
			const todosId = args.todosId
			const todosFilePath = path.join(__dirname, `../data/todos/${todosId}.json`)

			const todosExists = await fileExists(todosFilePath)
			if (!todosExists) return new GraphQLError('That todo doesnt exist')

			const todoData = await fsPromises.readFile(todosFilePath, {
				encoding: 'utf-8',
			})
			const data = JSON.parse(todoData)
			return data
		},
		getAllTodos: async (_, args) => {
			const todosDirectory = path.join(__dirname, '../data/todos')

			const todos = await fsPromises.readdir(todosDirectory)

			const promises = []
			todos.forEach((todos) => {
				const filePath = path.join(todosDirectory, todos)
				promises.push(readJsonFile(filePath))
			})

			const todoData = await Promise.all(promises)
			return todoData
		},
	},
	Mutation: {
		createTodo: async (_, args) => {
			// Verify name
			if (args.name.length === 0) return new GraphQLError('Name must be at least 1 character long')

			// Skapa ett unikt id + data objekt
			const newTodo = {
				id: crypto.randomUUID(),
				name: args.name,
				description: args.description || '',
			}

			let filePath = path.join(__dirname, '..', 'data', 'todos', `${newTodo.id}.json`)

			//kollar så inte två likadana id:n finns:
			let idExists = true
			while (idExists) {
				const exists = await fileExists(filePath)
				console.log(exists, newTodo.id)
				if (exists) {
					newTodo.id = crypto.randomUUID()
					filePath = path.join(__dirname, '..', 'data', 'todos', `${newTodo.id}.json`)
				}
				idExists = exists
			}

			// Skapa en fil för projektet i /data/projects
			await fsPromises.writeFile(filePath, JSON.stringify(newTodo))

			// Skapa våran respons
			return newTodo
		},
		updateTodo: async (_, args) => {
			// hämta alla parametrar från args.

			// const todoId = args.id
			// const todoName = args.name
			// const todoDescription = args.description

			const { id, name, description } = args

			// skapa vår filePath
			const filePath = path.join(__dirname, '..', 'data', 'todos', `${id}.json`)

			//finns det projekt som de vill ändra?
			//IF (no) return not Found Error
			const todosExists = await fileExists(filePath)
			if (!todosExists) return new GraphQLError('That todo does not exist')

			//skapa updated projekt objekt/updatedTodo
			const updatedTodo = {
				id,
				name,
				description,
			}
			// skriv över den gamla filen med nya filen
			await fsPromises.writeFile(filePath, JSON.stringify(updatedTodo))

			//return updated todo
			return updatedTodo
		},

		deleteTodo: async (_, args) => {
			// get todo id
			const todoId = args.todoId

			const filePath = path.join(__dirname, '..', 'data', 'todos', `${todoId}.json`)

			// does this todo exist
			const todosExists = await fileExists(filePath)
			if (!todosExists) return new GraphQLError('That todo does not exist')

			//if no, return error

			//delete files
			await fsPromises.unlink(filePath)

			return {
				deletedId: todoId,
				success: true,
			}
		},
	},
}
