// routes/contact.routes.js
import { Router } from "express";
import { createContact, getContactById, getContacts, updateContact } from "../../services/helpAndSupport/contactServer.js";
import { createFAQCategory, deleteFAQCategory, getFAQCategories, getFAQCategoryById } from "../../services/helpAndSupport/faqCategoryServer.js";

const router = Router();

// POST /api/contacts
router.post("/contacts", createContact);

// GET /api/contacts
router.get("/contacts", getContacts);

// GET /api/contacts/:id
router.get("/contacts/:id", getContactById);

// PATCH /api/contacts/:id
router.patch("/contacts/:id", updateContact);

// DELETE /api/contacts/:id
// router.delete("/contacts/:id", deleteContact);



router.post("/faq-categories", createFAQCategory);
router.get("/faq-categories", getFAQCategories);
router.get("/faq-categories/:id", getFAQCategoryById);
// router.patch("/faq-categories/:id", updateFAQCategoryz);
router.delete("/faq-categories/:id", deleteFAQCategory);

export default router;
