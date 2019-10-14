const NotesService = {

    getAllNotes(knex) {
        return knex.select('*').from('noteful_notes')
    },

    getNoteById(knex, id) {
        return knex('noteful_notes').select('*').where('id', id).first()
    },

    insertNote(knex, newNote) {
        return knex('noteful_notes').insert(newNote).returning('*')
        .then(rows => {
            return rows[0]
        })
    },

    deleteNote(knex, id) {
        return knex('noteful_notes').where('id', id).delete()
    },

    updateNote(knex, id, newNoteData) {
        return knex('noteful_notes').where({id}).update(newNoteData)
    }

}



module.exports = NotesService