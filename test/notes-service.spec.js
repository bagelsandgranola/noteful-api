const NotesService = require('../src/notes-service')
const knex = require('knex')
const { makeNotesArray} = require('../test/notes.fixtures')
const { makeFoldersArray } = require('../test/folders.fixtures')

describe (`Notes service object`, function () {
    let db
    const testFolders = makeFoldersArray()
    const testNotes = makeNotesArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
    })
    before(() => db('noteful_notes').truncate())
    before(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))
    afterEach(() => db('noteful_notes').truncate())
    afterEach(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))
    after(() => db.destroy())
        
    describe(`getAllNotes()`, () => {

        context(`Given noteful_notes has data`, () => {
            before(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
        
            before(() => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })

            it(`resolves all notes from noteful_notes table`, () => {
                return NotesService.getAllNotes(db)
                    .then(actual => {
                        expect(actual).to.eql(testNotes.map(note => ({
                            ...note,
                            modified: new Date(note.modified)
                        })))
                    })
    
            })
        
        })

        context(`Given noteful_notes does not have data`, () => {

            it(`returns an empty array`, () => {
                const emptyArray = []
                return NotesService.getAllNotes(db)
                    .then(actual => {
                        expect(actual).to.eql(emptyArray)
                    })
            })
        })
        
    })

    describe(`getNoteById`, () => {
        context(`Given noteful_notes has data`, () => {
            before(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
        
            before(() => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })

            it(`resolves a note by id from noteful_notes table`, () => {
                const thirdId = 3
                const thirdTestNote = testNotes[thirdId - 1]

                return NotesService.getNoteById(db, thirdId)
                    .then(actual => {
                        expect(actual).to.eql({
                            id: thirdId,
                            name: thirdTestNote.name,
                            modified: new Date(thirdTestNote.modified),
                            folderid: thirdTestNote.folderid,
                            content: thirdTestNote.content,
                        })
                    })
            })
        })
    })

    describe(`insertNote()`, () => {

        context(`Given there is a folder with id = 1`, () => {

            before(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`inserts a new note and resolves new note w/ id`, () => {
                const newNote = {
                        name: 'newNoteTest',
                        modified: new Date('2019-01-03T00:00:00.000Z'),
                        folderid: 1,
                        content: 'Et aut voluptates. Pariatur enim sunt aut ratione nam quasi sed vel in. Modi tempore nam animi totam.'
                }
                const newNoteWithId = {
                    id: 1,
                    name: newNote.name,
                    modified: newNote.modified,
                    folderid: newNote.folderid,
                    content: newNote.content
                }
    
            return NotesService.insertNote(db, newNote)
                .then(actual => {
                    expect(actual).to.eql(newNoteWithId)
                })
            })

        })
        
    })

    describe(`deleteNote()`, () => {
        context(`Given noteful_notes has data`, () => {
            before(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
        
            before(() => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })

        it('removes an article by id fron noteful_notes table', () => {
            const thirdId = 3
            return NotesService.deleteNote(db, thirdId)
                .then(() => NotesService.getAllNotes(db))
                .then(allNotes => {
                    const expected = testNotes.filter(note => note.id !== thirdId)
                    expect(allNotes).to.eql(expected.map(note => ({
                        ...note,
                        modified: new Date(note.modified)
                   })))
                })

               })
        })

    })

    describe(`updateNote()`,() => {
        context(`Given noteful_notes has data`, () => {
            before(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
        
            before(() => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
        it('updates the note', () => {
            const idOfNoteToUpdate = 3
            const newNoteData = {
                name: 'updated name',
                modified: new Date(),
                folderid: 3,
                content: 'updated content',
            }
            return NotesService.updateNote(db, idOfNoteToUpdate, newNoteData)
                .then(() => NotesService.getNoteById(db, idOfNoteToUpdate))
                .then(note => {
                    expect(note).to.eql({
                        id: idOfNoteToUpdate,
                        name: newNoteData.name,
                        modified: new Date(newNoteData.modified),
                        folderid: newNoteData.folderid,
                        content: newNoteData.content
                    })
                })
        })
        })
    })
})