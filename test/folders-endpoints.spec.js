const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray} = require('../test/notes.fixtures')
const { makeFoldersArray } = require('../test/folders.fixtures')
const FoldersService = require('../src/folders-service')

describe('Folders Endpoints', function() {
    let db
    const testFolders = makeFoldersArray()
    const testNotes = makeNotesArray()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())
    before(() => db('noteful_notes').truncate())
    before(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))
    afterEach(() => db('noteful_notes').truncate())
    afterEach(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))

    describe('GET /api/folders', () => {

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

            it('responds with 200 and all the folders', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })
       

    })

    describe('GET /api/folders/:folder_id', () => {

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
                const folderId = 2
                const expectedFolder = testFolders[folderId -1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })

    })

    describe('POST /api/folders', () => {

        it('adds a new folder to the database', () => {
            this.retries(3)
            const newFolder = {
                    name: 'new folder name',
                   
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newFolder.name)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body))
                        
            })
    })

    describe('DELETE /api/folders/:folder_id', () => {

        context(`Given no folders in database`, () => {
            it('responds with 404', () => {
                const folderId = 123456
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder does not exist`}})
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

            it('responds with 204 and removes folder from the database', () => {

                const folderIdToDelete = 2;
                const expectedFolders = testFolders.filter(folder => folder.id !== folderIdToDelete)
                return supertest(app)
                    .delete(`/api/folders/${folderIdToDelete}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                        .get('/api/folders')
                        .expect(expectedFolders)
                )

            })

        })

        
    })

    describe('PATCH /api/folders/:folder_id', () => {
        context('given there are NO notes & folders in the database', () => {
            it('returns a 404', () => {
                const folderId = 123456
                return supertest(app)
                    .patch(`/api/folders/${folderId}`)
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
            
            it(`successfully updates the folder and returns 204 with no content`, () => {
                const folderId = 1
                const updatedFolderFields = {
                    name: 'updatedFolderName',
                }

                const expectedFolder = {
                    ...testFolders[folderId -1],
                    ...updatedFolderFields,
                }
                return supertest(app)
                    .patch(`/api/folders/${folderId}`)
                    .send(updatedFolderFields)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/folders/${folderId}`)
                            .expect(expectedFolder)
                    )
            })

            it('returns 400 if the request body does not have any fields', () => {
                folderToUpdate = {
                    wrongField: "wrongData"
                }
                folderId = 2
                return supertest(app)
                    .patch(`/api/folders/${folderId}`)
                    .send(folderToUpdate)
                    .expect(400, {
                        error: {
                            message: `Request body must contain at least one relevant field`
                        }
                    })
            })
        })
     
    })

    context(`Given an XSS folder`, () => {
        //make folders
        before(() => {
            return db
                .into('noteful_folders')
                .insert(testFolders)
        })

        const maliciousFolder ={
            id: 911,
            name: 'malicious <script>alert("xss");</script>',
        }

        beforeEach('insert malicious folder', () => {
            return db
                .into('noteful_folders')
                .insert([maliciousFolder])
        })

        it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/api/folders/${maliciousFolder.id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.name).to.eql('malicious &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                })
        })
    })

})