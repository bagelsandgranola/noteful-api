const express = require('express')
const NotesService = require('./notes-service')
const xss =require('xss')
const path = require('path')


const notesRouter = express.Router()
const jsonParser = express.json()

notesRouter
    .route('/')
    .get((req,res,next) => {
    const knexInstance = req.app.get('db')
    NotesService.getAllNotes(knexInstance)
        .then(notes => {
            res.json(notes)
        })
    .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { name, modified, folderid, content} = req.body
        const newNote = { name, modified, folderid, content}
        NotesService.insertNote(knexInstance, newNote)
        .then(note => {
            res
                .status(201)
                //.send('stuff')
                .location(path.posix.join(req.originalUrl, `/${res.id}`))
                .json(note)
        })
        .catch(next)
    })

notesRouter
    .route('/:note_id')
    .all((req, res, next) => {
        NotesService.getNoteById(
            req.app.get('db'),
            req.params.note_id
        )
        .then(note => {
            if (!note) {
                return res.status(404).json({
                    error: { message: `Note does not exist`}
                })
            }
            res.note = note
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getNoteById(knexInstance, req.params.note_id)
            .then(note => {
                res.json({
                    id: note.id,
                    name: xss(note.name),
                    modified: note.modified,
                    folderid: note.folderid,
                    content: xss(note.content)

                })
            })
    .catch(next)
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.deleteNote(knexInstance, req.params.note_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
       const { name, modified, folderid, content } = req.body
        const noteToUpdate = { name, modified, folderid, content}

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain at least one relevant field`
                }
            })
        }
        
        const knexInstance = req.app.get('db')
        NotesService.updateNote(knexInstance, req.params.note_id, req.body)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = notesRouter