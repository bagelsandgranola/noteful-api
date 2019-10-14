const FoldersService = {

    getAllFolders(knex) {
        return knex.select('*').from('noteful_folders')
    },

    getFolderById(knex, id) {
        return knex('noteful_folders').select('*').where('id', id).first()
    },

    insertFolder(knex, newFolder) {
        return knex
            .into('noteful_folders')
            .insert(newFolder)
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    deleteFolder(knex, id) {
        return knex('noteful_folders').where('id', id).delete()
    },

    updateFolder(knex, id, newFolderData) {
        return knex('noteful_folders').where({id}).update(newFolderData)
    }
}

module.exports = FoldersService