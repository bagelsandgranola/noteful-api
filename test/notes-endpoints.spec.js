const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray} = require('../test/notes.fixtures')
const { makeFoldersArray } = require('../test/folders.fixtures')
const NotesService = require('../src/notes-service')

describe('Notes Endpoints', function() {
    let db
    const testFolders = makeFoldersArray()
    const testNotes = makeNotesArray()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())
    before(() => db('noteful_notes').truncate())
    before(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))
    afterEach(() => db('noteful_notes').truncate())
    afterEach(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))

    describe('GET /api/notes', () => {

        context('given there are notes and folders in the database', () => {

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

            it('responds with 200 and all the notes', () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, testNotes)
            })
        })
       

    })

    describe('GET /api/notes/:note_id', () => {

        context('Given that noteful_notes and noteful_folders table has data', () => {
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

            it('responds with 200 and the specified article', () => {
                const noteId = 2
                const expectedNote = testNotes[noteId -1]
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote)
            })
        })

    })

    describe('POST /api/notes', () => {

        //after('disconnect from db', () => db.destroy())

        context('Given that noteful_folders table has data', () => {
            before(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

        it('adds a new note to the database', () => {
            this.retries(3)
            const newNote = {
                    name: 'Adding a new Note',
                    modified: new Date().toLocaleString(),
                    folderid: 1,
                    content: 'Et aut voluptates. Pariatur enim sunt aut ratione nam quasi sed vel in. Modi tempore nam animi totam. Qui aut provident quis aut laboriosam voluptas minus ut. Et ipsam blanditiis iste. Neque vero laborum aspernatur inventore consequatur dolor consequatur. Expedita porro aut. Consequatur occaecati vitae et sit nihil. Sequi ut sapiente. Necessitatibus voluptatem sunt praesentium enim quae'
            }
            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .expect(201)
                .expect(res => {
                    const actualModified = new Date(res.body.modified).toLocaleString()
                    expect(res.body.name).to.eql(newNote.name)
                    expect(actualModified).to.eql(newNote.modified)
                    expect(res.body.folderid).to.eql(newNote.folderid)
                    expect(res.body.content).to.eql(newNote.content)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/api/notes/${postRes.body.id}`)
                        .expect(postRes.body))
                        
            })
        })
    })

    describe('DELETE /api/notes/:note_id', () => {

        context(`Given no notes in database`, () => {
            it('responds with 404', () => {
                const noteId = 123456
                return supertest(app)
                    .delete(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note does not exist`}})
            })
        })
        context('given there are notes & folders in noteful_notes & noteful_folders', () => {
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

            it('responds with 204 and removes note from the database', () => {

                const noteIdToDelete = 2;
                const expectedNotes = testNotes.filter(note => note.id !== noteIdToDelete)
                return supertest(app)
                    .delete(`/api/notes/${noteIdToDelete}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                        .get('/api/notes')
                        .expect(expectedNotes)
                )

            })

        })

        
    })

    describe('PATCH /api/notes/:note_id', () => {
        context('given there are NO notes & folders in the database', () => {
            it('returns a 404', () => {
                const noteId = 123456
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .expect(404)
            })
        })

        context('given there are notes & folders in the database', () => {
            beforeEach(() => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
        
            beforeEach(() => {
                return db
                    .into('noteful_notes')
                    .insert(testNotes)
            })
            
            it(`successfully updates the note and returns 204 with no content`, () => {
                const noteId = 1
                const updatedNoteFields = {
                    name: 'updatedName',
                    modified: new Date().toJSON(),
                    folderid: 2,
                    content:'updatedContent'
                }
               // const actualModified = new Date(updatedNoteFields.modified).toLocaleString()

                const expectedNote = {
                    ...testNotes[noteId -1],
                    ...updatedNoteFields,
                 //   modified: actualModified

                }

                //const { name, modified, folderid, content } = req.body
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .send(updatedNoteFields)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/notes/${noteId}`)
                            .expect(expectedNote)
                    )
            })

            it('returns 400 if the request body does not have any fields', () => {
                noteToUpdate = {
                    wrongField: "wrongData"
                }
                noteId = 2
                //const { name, modified, folderid, content } = req.body
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .send(noteToUpdate)
                    .expect(400, {
                        error: {
                            message: `Request body must contain at least one relevant field`
                        }
                    })
            })
        })
     
    })

    context(`Given an XSS note`, () => {
        //make folders
        before(() => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
        })

        const maliciousNote ={
            id: 911,
            name: 'malicious <script>alert("xss");</script>',
            modified: new Date(),
            folderid: 1,
            content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
        }

        beforeEach('insert malicious article', () => {
            return db
                .into('noteful_notes')
                .insert([maliciousNote])
        })

        it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/notes/${maliciousNote.id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).to.eql('malicious &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    expect(res.body.content).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
        })
    })


})