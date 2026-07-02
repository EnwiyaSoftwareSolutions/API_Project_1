const express = require('express');
const sdk = require('node-appwrite');
const appwriteClient = require('../config/app');
const Router = express.Router();
const knex = require('../db/knex');

const databases = new sdk.Databases(appwriteClient);

Router.get('/fetch_testamonials', async (req, res) => {
    try{

    }catch(err){

    }
});

Router.get('/fetch_single_testamonial/:id', async (req, res) => {
    try{

    }catch(err){
        res.status(500).json({ error: 'Failed to fetch testamonial' });
    }
});

Router.post('/create_testamonial/:client_id', async (req, res) => {
    const name = req.body.name;
    try{

    }catch(err){
        res.status(500).json({ error: 'Failed to create testamonial' });
    }
});