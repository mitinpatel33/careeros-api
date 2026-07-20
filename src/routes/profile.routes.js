const express = require('express');
const { ROLES } = require('../constants/roles');
const { authorize, protect } = require('../middlewares/auth.middleware');
const { getCompletion, publishProfile, getSingleSection, saveSingleSection, deleteSingleSection, getCollection, getCollectionById, saveCollection, deleteCollection } = require('../controllers/candidateProfile.controller');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.CANDIDATE));

router.get('/completion', getCompletion);
router.post('/publish', publishProfile);

['personal', 'summary', 'contact', 'social', 'settings'].forEach((section) => {
    router.get(`/${section}`, getSingleSection(section));
    router.post(`/${section}`, saveSingleSection(section));
    router.delete(`${section}`, deleteSingleSection(section));
});

[
    "skills",
    "educations",
    "experience",
    "projects",
    "certificates",
    "achievemnets",
    "languages"
].forEach((section) => {
    router.get(`/${section}`, getCollection(section));
    router.get(`/${section}/:id`, getCollectionById(section));
    router.post(`/${section}`, saveCollection(section));
    router.put(`/${section}/:id`, saveCollection(section));
    router.delete(`/${section}/:id`, deleteCollection(section));
})

module.exports = router;