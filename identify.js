const pool = require("./db");

const identifyContact = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "Email or phoneNumber required",
      });
    }

    // Fetch contacts matching email or phoneNumber
    const { rows: matched } = await pool.query(
      `
      SELECT * FROM contacts
      WHERE deletedAt IS NULL
      AND (email = $1 OR phoneNumber = $2)
      `,
      [email || null, phoneNumber || null]
    );

    // Create new primary if no match found
    if (matched.length === 0) {
      const { rows } = await pool.query(
        `
        INSERT INTO contacts (email, phoneNumber, linkPrecedence)
        VALUES ($1, $2, 'primary')
        RETURNING *
        `,
        [email || null, phoneNumber || null]
      );

      const newContact = rows[0];

      return res.json({
        contact: {
          primaryContactId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phonenumber
            ? [newContact.phonenumber]
            : [],
          secondaryContactIds: [],
        },
      });
    }

    // Determine the oldest primary contact
    let primary = matched
      .filter((c) => c.linkprecedence === "primary")
      .sort((a, b) => new Date(a.createdat) - new Date(b.createdat))[0];

    // If no primary found (edge case), use first contact
    if (!primary) {
      primary = matched[0];
    }

    // Convert newer primaries to secondary
    const otherPrimaries = matched.filter(
      (c) =>
        c.linkprecedence === "primary" &&
        c.id !== primary.id
    );

    for (const contact of otherPrimaries) {
      await pool.query(
        `
        UPDATE contacts
        SET linkPrecedence = 'secondary',
            linkedId = $1,
            updatedAt = NOW()
        WHERE id = $2
        `,
        [primary.id, contact.id]
      );
    }

    // Insert secondary contact if new information is introduced
    const existingEmails = matched.map((c) => c.email);
    const existingPhones = matched.map((c) => c.phonenumber);

    const isNewEmail = email && !existingEmails.includes(email);
    const isNewPhone = phoneNumber && !existingPhones.includes(phoneNumber);

    if (isNewEmail || isNewPhone) {
      await pool.query(
        `
        INSERT INTO contacts (email, phoneNumber, linkedId, linkPrecedence)
        VALUES ($1, $2, $3, 'secondary')
        `,
        [email || null, phoneNumber || null, primary.id]
      );
    }

    // Fetch all contacts linked to the primary contact
    const { rows: finalContacts } = await pool.query(
      `
      SELECT * FROM contacts
      WHERE id = $1 OR linkedId = $1
      ORDER BY createdAt ASC
      `,
      [primary.id]
    );

    const emails = [];
    const phoneNumbers = [];
    const secondaryContactIds = [];

    for (const contact of finalContacts) {
      if (contact.email && !emails.includes(contact.email)) {
        emails.push(contact.email);
      }

      if (contact.phonenumber && !phoneNumbers.includes(contact.phonenumber)) {
        phoneNumbers.push(contact.phonenumber);
      }

      if (contact.linkprecedence === "secondary") {
        secondaryContactIds.push(contact.id);
      }
    }

    return res.json({
      contact: {
        primaryContactId: primary.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = identifyContact;
