// routes/contact.routes.js
import { Router } from "express";
import { createContact, getContactById, getContacts, updateContact } from "../../services/helpAndSupport/contactServer.js";
import { createFAQCategory, deleteFAQCategory, getFAQCategories, getFAQCategoryById, updateFAQCategory } from "../../services/helpAndSupport/faqCategoryServer.js";
import { createFAQ, deleteFAQ, getFAQById, getFAQs, updateFAQ } from "../../services/helpAndSupport/faqsServers.js";
import { addComplaintCategory, getComplaintCategories, updateComplaintCategory } from "../../services/helpAndSupport/complaintCategoryService.js";
import { createSubCategory, getSubCategories, getSubCategoryById, updateSubCategory } from "../../services/helpAndSupport/complaintsubCategoryService.js";
import { createComplaint, getComplaintById, getComplaints, updateComplaint } from "../../services/helpAndSupport/complaintService.js";
import { createContactUs, getAllContactUs, getContactUsById, updateContactUs, upsertSingleContactUs } from "../../services/helpAndSupport/contactUsService.js";

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
router.put("/faq-categories/:id", updateFAQCategory);
router.delete("/faq-categories/:id", deleteFAQCategory);




router.post("/faqs", createFAQ);
router.get("/faqs", getFAQs);
router.get("/faqs/:id", getFAQById);
router.put("/faqs/:id", updateFAQ);
router.delete("/faqs/:id", deleteFAQ);



router.get("/complaintcategory/",getComplaintCategories)
router.post("/complaintcategory/",addComplaintCategory)
router.put("/complaintcategory/:id",updateComplaintCategory)

router.get('/complaintsubcategory/', getSubCategories);
router.get('/complaintsubcategory/:id', getSubCategoryById);
router.post('/complaintsubcategory/', createSubCategory);
router.put('/complaintsubcategory/:id', updateSubCategory);


// router.delete('/complaintsubcategory/:id', deleteSubCategory);


router.get("/complaint/", getComplaints);
router.get("/complaint/:id", getComplaintById);
router.post("/complaint/", createComplaint);
router.put("/complaint/:id", updateComplaint);
// router.delete("/complaint/:id", deleteComplaint);


router.get("/", getAllContactUs);

// Get by id
router.get("/:id", getContactUsById);

// Create
router.post("/", createContactUs);

// Update by id
router.put("/:id", updateContactUs);

// Delete by id
// router.delete("/:id", deleteContactUs);


router.post("/upsert/single", upsertSingleContactUs);

export default router;
