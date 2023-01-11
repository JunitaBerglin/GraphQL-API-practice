const { GraphQLError } = require('graphql')
const path = require('path')

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
}
