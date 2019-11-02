const FoldersService = require('../src/folders-service')
const knex = require('knex')
const { makeFoldersArray } = require('../test/folders.fixtures')
const { makeNotesArray} = require('../test/notes.fixtures')


describe(`folders-service object`, function () {
    let db
    const testFolders = makeFoldersArray()
    const testNotes = makeNotesArray()


    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
    })

    before(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))
    afterEach(() =>  db.raw('TRUNCATE TABLE noteful_folders RESTART IDENTITY CASCADE'))
    after(() => db.destroy())
  
    describe(`getAllFolders()`, () => {

        context(`given there is data in the database`, () => {

            before(() => {
                return db
                .into('noteful_folders')
                .insert(testFolders)
            })

            it(`returns all folders in the noteful_folders db`, () => {
                return FoldersService.getAllFolders(db)
                    .then(actual => {
                        expect(actual).to.eql(testFolders)
                    })
            }) 
        })
    })

    describe(`insertFolder()`, () => {
        it(`inserts a folder into noteful_folders and resolves folder with an id`, () => {
            const newFolder = {
                name: 'NewFolderTest'
            }
            const newFolderWithId = {
                id: 1,
                name: newFolder.name
            }
            return FoldersService.insertFolder(db, newFolder)
            .then(actual => {
                expect(actual).to.eql(newFolderWithId)
            })
        })
    })

    describe(`getFolderById`, () => {
        context(`Given noteful_folders & noteful_notes has data`, () => {
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

            it(`resolves a folder by id from noteful_notes table`, () => {
                const thirdId = 3
                const thirdTestFolder = testFolders[thirdId - 1]

                return FoldersService.getFolderById(db, thirdId)
                    .then(actual => {
                        expect(actual).to.eql({
                            id: thirdId,
                            name: thirdTestFolder.name,
                        })
                    })
            })
        })
    })

    describe(`deleteFolder()`, () => {
        context(`Given noteful_folders && noteful_notes has data`, () => {
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

        it('removes a rolder by id fron noteful_folders table', () => {
            const thirdId = 3
            return FoldersService.deleteFolder(db, thirdId)
                .then(() => FoldersService.getAllFolders(db))
                .then(allFolders => {
                    const expected = testFolders.filter(folder=> folder.id !== thirdId)
                    expect(allFolders).to.eql(expected)
                })
            })
        })

    })

    describe(`updateFolder()`,() => {
        context(`Given noteful_notes && noteful_folders has data`, () => {
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

        it('updates the folder', () => {
            const idOfFolderToUpdate = 3
            const newFolderData = {
                name: 'updated folder name',
            }
            return FoldersService.updateFolder(db, idOfFolderToUpdate, newFolderData)
                .then(() => FoldersService.getFolderById(db, idOfFolderToUpdate))
                .then(folder => {
                    expect(folder).to.eql({
                        id: idOfFolderToUpdate,
                        name: newFolderData.name,
                    })
                })
        })
        })
    })
})