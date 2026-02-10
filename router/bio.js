const express = require('express');
const sdk = require('node-appwrite');
const appwriteClient = require('../config/app');
const Router = express.Router();
const knex = require('../db/knex');

const databases = new sdk.Databases(appwriteClient);

Router.get('/fetch_bios', async (req, res) => {
    try{

    }catch(err){

    }
});

Router.get('/fetch_single_bio/:id', async (req, res) => {
    try{

    }catch(err){
        res.status(500).json({ error: 'Failed to fetch bio' });
    }
});

Router.post('/create_bio', async (req, res) => {
    const name = req.body.name;
    try{

    }catch(err){
        res.status(500).json({ error: 'Failed to create bio' });
    }
});


Router.patch('/update_bio/:id', async (req, res) => {
    const id = req.params.id;
    const name = req.body.name;
    try{    
    }catch(err){
        res.status(500).json({ error: 'Failed to update bio' });
    }       
});

Router.delete('/delete_bio/:id', async (req, res) => {
    const id = req.params.id;
    try{}catch(err){
        res.status(500).json({ error: 'Failed to delete bio' });
    }
});

module.exports = Router;