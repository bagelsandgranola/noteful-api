const express = require('express')
const FoldersService = require('./folders-service')
const xss =require('xss')
const path = require('path')

const foldersRouter = express.Router()
const jsonParser = express.json()

foldersRouter
    .route('/')
    .get((req,res,next) => {
    console.error(err);
    const knexInstance = req.app.get('db')
    FoldersService.getAllFolders(knexInstance)
        .then(folders => {
            res.json(folders)
            console.error(err);

        })
    .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { name } = req.body
        const newFolder = { name }
        FoldersService.insertFolder(knexInstance, newFolder)
        .then(folder=> {
            res
                .status(201)
                //.send('stuff')
                .location(path.posix.join(req.originalUrl, `/${res.id}`))
                .json(folder)
        })
        .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getFolderById(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(folder => {
            if (!folder) {
                return res.status(404).json({
                    error: { message: `Folder does not exist`}
                })
            }
            res.folder = folder
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.getFolderById(knexInstance, req.params.folder_id)
            .then(folder => {
                res.json({
                    id: folder.id,
                    name: xss(folder.name),
                })
            })
    .catch(next)
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.deleteFolder(knexInstance, req.params.folder_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
       const { name } = req.body
        const folderToUpdate = { name }

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain at least one relevant field`
                }
            })
        }
        
        const knexInstance = req.app.get('db')
        FoldersService.updateFolder(knexInstance, req.params.folder_id, req.body)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter