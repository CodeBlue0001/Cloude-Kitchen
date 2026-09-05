const Contact = require('../model/contact');

// Render About Us page
const getAbout = (req, res) => {
    res.render('about', {
        user: req.session.user || null,
        pageTitle: 'About Us - Cloud Kitchen'
    });
};

// Render Contact Us page
const getContact = (req, res) => {
    res.render('contact', {
        user: req.session.user || null,
        pageTitle: 'Contact Us - Cloud Kitchen'
    });
};

// Submit Contact Form
const postContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        const newContact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            subject: subject.trim(),
            message: message.trim()
        });

        await newContact.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Thank you for reaching out! We will get back to you shortly.' 
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
};

module.exports = {
    getAbout,
    getContact,
    postContact
};
